const { GoogleGenerativeAI } = require("@google/generative-ai");
const screenshot = require("screenshot-desktop");
const { mouse, keyboard, Button, Point, Key, straightTo } = require("@computer-use/nut-js");
const { screen } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const storageManager = require("../storage-manager");
const electronBrowserManager = require("../electron-browser-manager");
const promptManager = require("../prompt-manager");
const searchManager = require("../search-manager");
const supabaseService = require("../supabase-service");
const toolExecutor = require("../tool-executor");

function parseTerminalCommandTarget(command) {
  const trimmed = command.trim();
  if (/^explorer\s+/i.test(trimmed)) {
    return trimmed.replace(/^explorer\s+/i, '').trim();
  }
  if (/^start\s+/i.test(trimmed)) {
    const rest = trimmed.replace(/^start\s+/i, '').trim();
    const quoted = [...rest.matchAll(/"([^"]*)"/g)].map(m => m[1]);
    if (quoted.length >= 2) {
      return quoted[1];
    }
    if (quoted.length === 1) {
      return quoted[0];
    }
    return rest;
  }
  return null;
}

async function executeTerminalCommand(command) {
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  const normalizePath = (value) => value.replace(/^['"]|['"]$/g, '');
  const escapeForPowerShell = (value) => value.replace(/'/g, "''");

  const runCommand = async (cmd) => {
    console.log(`[ACT JS] Running terminal command: ${cmd}`);
    return await execAsync(cmd, { timeout: 30000, windowsHide: true });
  };

  try {
    return await runCommand(command);
  } catch (primaryError) {
    if (process.platform === 'win32') {
      const target = normalizePath(parseTerminalCommandTarget(command) || '');
      if (target) {
        const escapeTarget = escapeForPowerShell(target);
        const fallback = `powershell -NoProfile -Command "Start-Process -FilePath '${escapeTarget}'"`;
        console.warn('[ACT JS] Primary terminal command failed, retrying with PowerShell fallback:', fallback);
        try {
          return await runCommand(fallback);
        } catch (fallbackError) {
          fallbackError.originalError = primaryError;
          fallbackError.fallbackCommand = fallback;
          throw fallbackError;
        }
      }
    }
    throw primaryError;
  }
}

const SYSTEM_PROMPT = promptManager.getPrompt('act-system-prompt');
const GENERAL_SYSTEM_PROMPT = promptManager.getPrompt('act-general-system-prompt');

class ActBackend {
  constructor(options = {}) {
    this.screenshotDir = path.join(os.tmpdir(), "control_screenshots");
    if (!fs.existsSync(this.screenshotDir)) fs.mkdirSync(this.screenshotDir);

    this.maxActionRetries = 3;
this.verificationWait = 1000;
    this.model = null;
    this.currentApiKey = null;
    // Don't call setupGeminiAPI here - it will be called from BackendManager with correct model

this.stopRequested = false;
    // Default to expected, will be updated by screenshot
    this.screenSize = { width: 1280, height: 720, x: 0, y: 0 };
    this.imageSize = { width: 1280, height: 720 };

this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.currentBlueprint = [];
    this.currentProvider = 'gemini';
    this.currentSystemPrompt = null;
    this.stepHistory = [];
    this.taskContext = {};
    this.actionRetryCount = 0;
    this.maxActionRetries = 3;
  }

  getToolDescription() {
    const schemas = toolExecutor.getAllSchemas();
    let description = '\n\nAVAILABLE TOOLS:\n';
    description += '================\n\n';
    
    for (const [name, tool] of Object.entries(schemas)) {
      description += `${tool.name}:\n`;
      description += `  Description: ${tool.description}\n`;
      
      if (tool.parameters && tool.parameters.properties) {
        description += '  Parameters:\n';
        for (const [paramName, paramSchema] of Object.entries(tool.parameters.properties)) {
          const required = tool.parameters.required?.includes(paramName) ? ' (required)' : '';
          const enumStr = paramSchema.enum ? ` [${paramSchema.enum.join(', ')}]` : '';
          const defaultStr = paramSchema.default !== undefined ? ` (default: ${paramSchema.default})` : '';
          const rangeStr = (paramSchema.minimum !== undefined || paramSchema.maximum !== undefined) 
            ? ` [${paramSchema.minimum || 0}-${paramSchema.maximum || 'unlimited'}]` 
            : '';
          description += `    - ${paramName}${required}${enumStr}: ${paramSchema.description || paramSchema.type}${defaultStr}${rangeStr}\n`;
        }
      }
      description += '\n';
    }
    
    return description;
  }

  appendToolsToSystemPrompt(systemPrompt) {
    if (!systemPrompt) return systemPrompt;
    const toolDesc = this.getToolDescription();
    return systemPrompt + toolDesc;
  }

  setTaskPlan(steps, context = {}) {
    this.currentTaskSteps = Array.isArray(steps) ? steps : [];
    this.currentStepIndex = 0;
    this.stepHistory = [];
    this.taskContext = { ...context, startTime: Date.now() };
    this.actionRetryCount = 0;
    console.log(`[ACT JS] Task plan set: ${this.currentTaskSteps.length} steps`);
  }

  getCurrentStep() {
    if (this.currentStepIndex >= this.currentTaskSteps.length) {
      return null;
    }
    return {
      step: this.currentTaskSteps[this.currentStepIndex],
      stepNumber: this.currentStepIndex + 1,
      totalSteps: this.currentTaskSteps.length,
      progress: `${this.currentStepIndex + 1}/${this.currentTaskSteps.length}`,
      percentComplete: Math.round((this.currentStepIndex / this.currentTaskSteps.length) * 100)
    };
  }

  advanceStep(completedAction, result) {
    this.stepHistory.push({
      step: this.currentStepIndex,
      action: completedAction,
      result: result,
      time: Date.now()
    });
    this.currentStepIndex++;
    console.log(`[ACT JS] Step ${this.currentStepIndex} completed, now at step ${this.currentStepIndex + 1}/${this.currentTaskSteps.length}`);
  }

  getTaskProgress() {
    const elapsed = Date.now() - (this.taskContext.startTime || Date.now());
    return {
      currentStep: this.currentStepIndex + 1,
      totalSteps: this.currentTaskSteps.length,
      percentComplete: Math.round((this.currentStepIndex / Math.max(1, this.currentTaskSteps.length)) * 100),
      elapsedMs: elapsed,
      estimatedRemaining: this.estimateRemainingTime(elapsed),
      history: this.stepHistory
    };
  }

  estimateRemainingTime(elapsed) {
    if (this.currentStepIndex === 0) return null;
    const avgTimePerStep = elapsed / this.currentStepIndex;
    const remainingSteps = this.currentTaskSteps.length - this.currentStepIndex;
    return Math.round(avgTimePerStep * remainingSteps);
  }

  isOnTrack() {
    if (this.stepHistory.length < 3) return true;
    
    const recent = this.stepHistory.slice(-4);
    const now = Date.now();
    
    let repeatCount = 0;
    let lastSameAction = null;
    
    for (let i = recent.length - 1; i >= 0; i--) {
      const h = recent[i];
      const timeDiff = now - h.time;
      
      // Allow repeats if > 5 seconds apart (probably intentional)
      if (timeDiff > 5000) {
        lastSameAction = null;
        continue;
      }
      
      // Same action within 5 seconds = potential loop
      if (h.action === lastSameAction) {
        repeatCount++;
        if (repeatCount >= 2) {
          console.log(`[ACT JS] ALERT: Repeating action "${h.action}" ${repeatCount + 1} times`);
          return false;
        }
      } else {
        repeatCount = 0;
      }
      lastSameAction = h.action;
    }
    return true;
  }

  shouldLogAction(action) {
    // Actions that are OK to repeat (legitimate use cases)
    const repeatableOnce = ['refresh', 'clear', 'reset', 'back'];
    const actionLower = action.toLowerCase();
    
    // If contains refresh/clear/reset/back, allow max 2
    for (const ok of repeatableOnce) {
      if (actionLower.includes(ok)) {
        return this.stepHistory.filter(h => h.action.toLowerCase().includes(ok)).length < 2;
      }
    }
    return true;
  }

  resetTaskState() {
    this.currentTaskSteps = [];
    this.currentStepIndex = 0;
    this.stepHistory = [];
    this.taskContext = {};
    this.actionRetryCount = 0;
  }

  async verifyCoordinates(inputX, inputY, attempts = 3) {
    const results = [];
    const tolerance = 15;
    
    for (let i = 0; i < attempts; i++) {
      const shot = await this.takeScreenshot();
      if (!shot) {
        results.push({ attempt: i + 1, error: 'Screenshot failed' });
        continue;
      }
      
      const img = await sharp(shot.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const imgW = img.info.width;
      const imgH = img.info.height;
      
      const searchRadius = 25;
      const checkX = Math.min(Math.max(Math.round(inputX * imgW / this.screenSize.width), searchRadius), imgW - searchRadius - 1);
      const checkY = Math.min(Math.max(Math.round(inputY * imgH / this.screenSize.height), searchRadius), imgH - searchRadius - 1);
      
      const pixelColors = [];
      const imgData = await sharp(shot.buffer).raw().ensureAlpha().toBuffer();
      for (let dy = -searchRadius; dy <= searchRadius; dy += 5) {
        for (let dx = -searchRadius; dx <= searchRadius; dx += 5) {
          try {
            const idx = ((checkY + dy) * imgW + (checkX + dx)) * 3;
            pixelColors.push({ r: imgData[idx], g: imgData[idx + 1], b: imgData[idx + 2] });
          } catch (e) {}
        }
      }
      
      if (pixelColors.length > 0) {
        const avgR = Math.round(pixelColors.reduce((s, c) => s + c.r, 0) / pixelColors.length);
        const avgG = Math.round(pixelColors.reduce((s, c) => s + c.g, 0) / pixelColors.length);
        const avgB = Math.round(pixelColors.reduce((s, c) => s + c.b, 0) / pixelColors.length);
        
        results.push({
          attempt: i + 1,
          inputX: inputX,
          inputY: inputY,
          checkX: checkX,
          checkY: checkY,
          avgColor: { r: avgR, g: avgG, b: avgB },
          matched: true
        });
      } else {
        results.push({ attempt: i + 1, error: 'No pixels sampled' });
      }
      
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, 150));
      }
    }
    
    const validResults = results.filter(r => r.matched && !r.error);
    
    if (validResults.length < 2) {
      return {
        verified: false,
        finalX: inputX,
        finalY: inputY,
        source: 'original',
        confidence: 'low',
        error: 'Insufficient verification data',
        attempts: attempts
      };
    }
    
    const colorArrays = validResults.map(r => r.avgColor);
    const avgR = colorArrays.reduce((s, c) => s + c.r, 0) / colorArrays.length;
    const avgG = colorArrays.reduce((s, c) => s + c.g, 0) / colorArrays.length;
    const avgB = colorArrays.reduce((s, c) => s + c.b, 0) / colorArrays.length;
    
    const colorVariance = colorArrays.reduce((s, c) => {
      const dr = c.r - avgR;
      const dg = c.g - avgG;
      const db = c.b - avgB;
      return s + Math.sqrt(dr * dr + dg * dg + db * db);
    }, 0) / colorArrays.length;
    
    const converged = colorVariance < tolerance;
    
    const xCoords = validResults.map(r => r.checkX);
    const yCoords = validResults.map(r => r.checkY);
    const meanX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
    const meanY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
    
    const xDev = Math.sqrt(xCoords.reduce((s, x) => s + Math.pow(x - meanX, 2), 0) / xCoords.length);
    const yDev = Math.sqrt(yCoords.reduce((s, y) => s + Math.pow(y - meanY, 2), 0) / yCoords.length);
    
    const positionConverged = xDev < 5 && yDev < 5;
    
    const finalX = Math.round(meanX * this.screenSize.width / imgW);
    const finalY = Math.round(meanY * this.screenSize.height / imgH);
    
    let confidence = 'low';
    let message = '';
    
    if (converged && positionConverged) {
      confidence = 'high';
      message = 'Coordinates verified - color and position converged';
    } else if (colorVariance < tolerance * 1.5) {
      confidence = 'medium';
      message = 'Coordinates partially verified - color converged';
    } else {
      message = 'Coordinates verification inconsistent - using average';
    }
    
    return {
      verified: converged || colorVariance < tolerance * 2,
      finalX: finalX,
      finalY: finalY,
      source: converged ? 'verified_average' : 'input',
      confidence: confidence,
      colorVariance: Math.round(colorVariance),
      attempts: attempts,
      validAttempts: validResults.length,
      positionDeviation: { x: Math.round(xDev), y: Math.round(yDev) },
      message: message,
      details: results
    };
  }

  async verifyCoordinatesViaAI(pixelX, pixelY, label = 'target') {
    const shot = await this.takeScreenshot();
    if (!shot) return { verified: false, error: 'Screenshot failed' };
    
    const shotData = fs.readFileSync(shot.filepath).toString('base64');
    
    const prompt = `verify click location. Target: (${pixelX}, ${pixelY}) for "${label}". 
Is there a clickable element (button, link, icon, input field) at/near this pixel location?
Look for visual indicators of interactiveness (hover effects, borders, icon shapes, text fields).
Respond ONLY with JSON: {"verified": true/false, "reason": "...", "element_type": "button|input|link|icon|none"}`;
    
    try {
      const result = await this.model.generateContent([
        { inlineData: { mimeType: 'image/png', data: shotData } },
        prompt
      ]);
      const text = (await result.response).text();
      const jsonMatch = /\{[\s\S]*\}/.exec(text);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { verified: false, error: 'Parse failed' };
    } catch (e) {
      return { verified: false, error: e.message };
    }
  }

  async aiVerifyClick(pixelX, pixelY, label = 'target') {
    const shot = await this.takeScreenshot();
    if (!shot) return { verified: false, message: 'Screenshot failed' };
    
    const shotData = fs.readFileSync(shot.filepath).toString('base64');
    
    const prompt = `VERIFICATION: Check if click location is correct.
Target coordinates: (${pixelX}, ${pixelY}) for element "${label}"
Look at the screenshot and answer: Is there a clickable element at these coordinates?
Look for: buttons, links, icons, input fields, menu items, checkboxes.
If wrong location, note what IS at that location.
Respond ONLY with JSON: {"correct": true/false, "what_element": "...", "suggestion": "..."}`;
    
    try {
      const content = [
        { inlineData: { mimeType: 'image/png', data: shotData } },
        prompt
      ];
      const result = await this.model.generateContent(content);
      const text = (await result.response).text();
      const jsonMatch = /\{[\s\S]*\}/.exec(text);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { correct: false, message: 'Could not parse AI response - using original coordinates' };
    } catch (e) {
      return { correct: false, message: 'AI verification failed: ' + e.message };
    }
  }

  verifyBox2dCoordinates(box2d) {
    if (!box2d || !Array.isArray(box2d) || box2d.length !== 4) {
      return { valid: false, error: 'Invalid box2d format' };
    }
    
    let [a, b, c, d] = box2d;
    const isGEMINIFormat = (a >= 0 && a <= 1000 && c >= 0 && c <= 1000);
    
    let xmin, ymin, xmax, ymax;
    if (isGEMINIFormat || this.currentProvider === 'gemini') {
      [ymin, xmin, ymax, xmax] = box2d;
    } else {
      [xmin, ymin, xmax, ymax] = box2d;
    }
    
    if (xmin < 0 || ymin < 0 || xmax > 1000 || ymax > 1000 || xmax <= xmin || ymax <= ymin) {
      return { valid: false, error: 'Invalid coordinate values', box: box2d, parsed: { xmin, ymin, xmax, ymax } };
    }
    
    const centerX = Math.round((xmin + (xmax - xmin) / 2) * this.screenSize.width / 1000) + this.screenSize.x;
    const centerY = Math.round((ymin + (ymax - ymin) / 2) * this.screenSize.height / 1000) + this.screenSize.y;
    
    return {
      valid: true,
      original: box2d,
      provider: this.currentProvider,
      formatDetected: isGEMINIFormat ? 'gemini' : 'standard',
      calculated: { xmin, ymin, xmax, ymax },
      pixelCenter: { x: centerX, y: centerY },
      normalizedCenter: {
        x: Math.round(((centerX - this.screenSize.x) / this.screenSize.width) * 1000),
        y: Math.round(((centerY - this.screenSize.y) / this.screenSize.height) * 1000)
      }
    };
  }

  async checkLibraryInstalled(library, packageManager) {
    try {
      const checkCmd = packageManager === 'pip' 
        ? `pip show ${library} 2>/dev/null | head -1`
        : packageManager === 'npm'
        ? `npm list ${library} --depth=0 2>/dev/null`
        : `which ${library}`;
      
      const output = await new Promise(resolve => {
        exec(checkCmd, (err, stdout) => {
          resolve(stdout || '');
        });
      });
      return output.includes(library) || output.length > 0;
    } catch (e) {
      return false;
    }
  }

  async installLibrary(library, packageManager) {
    const startTime = Date.now();
    try {
      const installCmd = packageManager === 'pip'
        ? `pip install ${library} --quiet`
        : packageManager === 'npm'
        ? `npm install --no-save ${library}`
        : `pip install ${library}`;
      
      const output = await new Promise((resolve, reject) => {
        exec(installCmd, { timeout: 60000 }, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve(stdout || 'Success');
          }
        });
      });
      
      const installTime = Date.now() - startTime;
      console.log(`[ACT JS] Installed ${library} in ${installTime}ms`);
      return { success: true, message: `Installed ${library} in ${installTime}ms`, installTime };
    } catch (e) {
      return { success: false, message: `Install failed: ${e.message}` };
    }
  }

  async runScript(script, language, args = []) {
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const ext = language === 'python' ? 'py' : 'js';
    const tempFile = path.join(tempDir, `act_script_${timestamp}.${ext}`);
    
    let fullScript = script;
    if (language === 'python' && args.length > 0) {
      fullScript = script.replace(/sys\.argv\s*=\s*\[[^\]]*\]/, `sys.argv = ${JSON.stringify(['script', ...args])}`);
    }
    
    fs.writeFileSync(tempFile, fullScript);
    
    const runCmd = language === 'python'
      ? `python "${tempFile}"`
      : `node "${tempFile}"`;
    
    try {
      const output = await new Promise((resolve, reject) => {
        exec(runCmd, { timeout: 60000 }, (err, stdout, stderr) => {
          fs.unlinkSync(tempFile);
          if (err) {
            reject(err);
          } else {
            resolve(stdout || stderr || 'Success (no output)');
          }
        });
      });
      return { success: true, output: output.substring(0, 5000) };
    } catch (e) {
      try { fs.unlinkSync(tempFile); } catch {}
      return { success: false, output: `Error: ${e.message}` };
    }
  }

  setupGeminiAPI(apiKey, modelName, systemPrompt = null) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GEMINI_FREE_KEY || "test_api_key";
    const finalModelName = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const targetSystemPrompt = systemPrompt || SYSTEM_PROMPT;

    if (key === this.currentApiKey && this.model && this.currentModelName === finalModelName && this.currentSystemPrompt === targetSystemPrompt) return;

    this.currentApiKey = key;
    this.currentModelName = finalModelName;
    this.currentSystemPrompt = targetSystemPrompt;
    const genAI = new GoogleGenerativeAI(key);
    
    const toolDescription = this.getToolDescription();
    const enhancedSystemPrompt = targetSystemPrompt + toolDescription;
    
    const modelOptions = {
      model: finalModelName,
      systemInstruction: enhancedSystemPrompt,
      generationConfig: {}
    };

    if (!process.env.DISABLE_SEARCH_TOOL) {
      modelOptions.tools = [{ googleSearch: {} }];
    }

    this.model = genAI.getGenerativeModel(modelOptions);
    console.log(`[ACT JS] Model initialized with: ${finalModelName}`);
  }

  async takeScreenshot(markCursor = true) {
    try {
      const timestamp = Date.now();
      const filename = `screenshot_${timestamp}.webp`;
      const filepath = path.join(this.screenshotDir, filename);

      // Auto-hide windows before taking screenshot to avoid capturing the overlay
      let windowsHidden = false;
      const hiddenWindows = [];
      try {
        if (global.windowManager) {
          const chatWin = global.windowManager.getWindow('chat');
          const settingsWin = global.windowManager.getWindow('settings');
          const liteWin = global.windowManager.getWindow('lite');
          for (const win of [chatWin, settingsWin, liteWin]) {
            if (win && !win.isDestroyed() && win.isVisible()) {
              win.hide();
              hiddenWindows.push(win);
              windowsHidden = true;
            }
          }
          // Wait for windows to fully hide before capturing
          if (windowsHidden) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (e) {
        console.log('[ACT JS] Could not hide windows:', e.message);
      }

      let imgBuffer;
      try {
        const displays = await screenshot.listDisplays();
        const primary = displays.find(d => d.id === 0) || displays[0];
        imgBuffer = await screenshot({ format: "png", screen: primary.id });
      } catch (e) {
        imgBuffer = await screenshot({ format: "png" });
      }

      // Restore hidden windows after screenshot
      if (windowsHidden && hiddenWindows.length > 0) {
        for (const win of hiddenWindows) {
          if (!win.isDestroyed()) {
            win.show();
          }
        }
      }

      // Read image and resize to thumbnail using sharp, then save as WEBP
      const thumbWidth = 540;
      const thumbHeight = 640;
      const thumbBuffer = await sharp(imgBuffer)
        .resize(thumbWidth, thumbHeight)
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(filepath, thumbBuffer);

      const primaryDisplay = screen.getPrimaryDisplay();
      const actualScreen = {
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y
      };

      this.imageSize = {
        width: thumbWidth,
        height: thumbHeight
      };
      this.screenSize = actualScreen;
      this.actualScreen = actualScreen;

      let cursorX = 0, cursorY = 0;
      try {
        const pos = await mouse.getPosition();
        cursorX = pos.x;
        cursorY = pos.y;
      } catch (e) { }

      // Optionally mark cursor on thumbnail (optional, can be skipped for token savings)
      // If you want to mark, you can draw a circle here

      return {
        filepath: filepath,
        buffer: thumbBuffer,
        metadata: {
          screen_width: this.screenSize.width,
          screen_height: this.screenSize.height,
          cursor_x: cursorX,
          cursor_y: cursorY,
          timestamp
        }
      };
    } catch (err) {
      console.error("[ACT JS] Screenshot error:", err);
      return null;
    }
  }

  async executeAction(action, onEvent) {
    const actionType = action.action.toLowerCase();
    const params = action.parameters || {};
    const result = { success: false, message: "", action: actionType };

if (params.confidence !== undefined) {
      console.log(`[ACT JS] Action: ${actionType}, Confidence: ${params.confidence}%`);
    }

    try {
      switch (actionType) {
        case "screenshot":
          const shot = await this.takeScreenshot();
          result.success = !!shot;
          result.screenshot = shot.filepath;
          break;

case "click":
        case "right_click":
        case "double_click":
        case "mouse_move":
          let targetX, targetY;
          let coordSource = 'direct';
          let coordConfidence = 'low';
          
          if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
            let xmin, ymin, xmax, ymax;
            const box = params.box2d;
            
            // AI provides coordinates - could be 0-1000 normalized OR screenshot pixels
            // Detect which format by checking magnitude
            if (this.currentProvider === 'gemini') {
              [ymin, xmin, ymax, xmax] = box;
            } else {
              [xmin, ymin, xmax, ymax] = box;
            }
            
            // Check if already in pixel coordinates (imageSize range) or normalized (0-1000)
            const maxCoord = Math.max(xmin, xmax, ymin, ymax);
            let centerNormX, centerNormY;
            
            if (maxCoord > 1000) {
              // Already in screenshot pixels - use directly
              centerNormX = xmin;
              centerNormY = ymin;
              console.log(`[ACT JS] Coords from AI in PIXEL FORMAT: ${box}`);
            } else {
              // Calculate center in normalized coordinates (0-1000)
              centerNormX = (xmin + xmax) / 2;
              centerNormY = (ymin + ymax) / 2;
            }
            
            // CONVERT: normalized (0-1000) -> screenshot pixels using imageSize
            // If AI gave pixels, skip this
            let clickX, clickY;
            if (maxCoord > 1000) {
              clickX = centerNormX;
              clickY = centerNormY;
            } else {
              const scaleX = this.imageSize.width / 1000;
              const scaleY = this.imageSize.height / 1000;
              clickX = Math.round(centerNormX * scaleX);
              clickY = Math.round(centerNormY * scaleY);
            }
            
            // Then SCALE to native screen coordinates for the click
            if (this.imageSize.width !== this.screenSize.width || this.imageSize.height !== this.screenSize.height) {
              const nativeScaleX = this.screenSize.width / this.imageSize.width;
              const nativeScaleY = this.screenSize.height / this.imageSize.height;
              clickX = Math.round(clickX * nativeScaleX);
              clickY = Math.round(clickY * nativeScaleY);
            }
            
            // Add monitor offset
            targetX = clickX + this.screenSize.x;
            targetY = clickY + this.screenSize.y;
            
            console.log(`[ACT JS] Coords: box=[${box}] centerNorm=(${centerNormX},${centerNormY}) imgScale=${(this.imageSize.width/1000)}x${(this.imageSize.height/1000)} imgPx=(${clickX},${clickY}) final=(${targetX},${targetY})`);
          } else if (params.x !== undefined && params.y !== undefined) {
            // Direct coordinates - could be 0-1000 or pixels
            const isPixelFormat = params.x > 1000 || params.y > 1000;
            let clickX, clickY;
            
            if (isPixelFormat) {
              clickX = params.x;
              clickY = params.y;
            } else {
              // Convert from normalized 0-1000
              const scaleX = this.imageSize.width / 1000;
              const scaleY = this.imageSize.height / 1000;
              clickX = Math.round(params.x * scaleX);
              clickY = Math.round(params.y * scaleY);
            }
            
            // Scale to native if needed
            if (this.imageSize.width !== this.screenSize.width || this.imageSize.height !== this.screenSize.height) {
              clickX = Math.round(clickX * (this.screenSize.width / this.imageSize.width));
              clickY = Math.round(clickY * (this.screenSize.height / this.imageSize.height));
            }
            
            targetX = clickX + this.screenSize.x;
            targetY = clickY + this.screenSize.y;
            console.log(`[ACT JS] DEBUG coords: params.xy=(${params.x},${params.y}) format=${isPixelFormat?'PIXEL':'NORM'} final=(${targetX},${targetY})`);
          }
          
          if (targetX !== undefined && targetY !== undefined) {
            console.log(`[ACT JS] Action: ${actionType}, Target: (${targetX}, ${targetY}) [${params.label || 'unlabeled'}]`);
            
            if (params.confidence < 95 && this.model && !params.skip_ai_verify) {
              for (let attempt = 0; attempt < 3; attempt++) {
                const preCheck = await this.aiVerifyClick(targetX, targetY, params.label || 'target');
                console.log(`[ACT JS] AI verify attempt ${attempt + 1}: correct=${preCheck.correct}`);
                
                if (preCheck.correct === true || attempt >= 2) {
                  if (preCheck.correct === false) {
                    console.log(`[ACT JS] AI says wrong but max retries, proceeding anyway`);
                  }
                  result.ai_precheck = preCheck;
                  break;
                }
                
                if (preCheck.suggestion && (preCheck.suggestion.includes('left') || preCheck.suggestion.includes('right') || 
                    preCheck.suggestion.includes('above') || preCheck.suggestion.includes('below') ||
                    preCheck.suggestion.includes('move') || preCheck.suggestion.includes('shift'))) {
                  let newX = targetX, newY = targetY;
                  if (preCheck.suggestion.includes('left')) newX = targetX - 30;
                  if (preCheck.suggestion.includes('right')) newX = targetX + 30;
                  if (preCheck.suggestion.includes('above')) newY = targetY - 30;
                  if (preCheck.suggestion.includes('below')) newY = targetY + 30;
                  console.log(`[ACT JS] Auto-correcting from (${targetX},${targetY}) to (${newX},${newY})`);
                  targetX = Math.max(0, newX);
                  targetY = Math.max(0, newY);
                  result.ai_precheck = preCheck;
                } else {
                  break;
                }
              }
            }
            
            await mouse.setPosition(new Point(targetX, targetY));
            if (actionType === "click") await mouse.leftClick();
            if (actionType === "right_click") await mouse.rightClick();
            if (actionType === "double_click") await mouse.doubleClick(Button.LEFT);
            
            result.success = true;
            result.message = `${actionType} at (${targetX}, ${targetY}) [${params.label || 'unlabeled'}] confidence ${params.confidence}%`;
          }
          break;
        
        case "verify_coordinates":
          if ((params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) || (params.x !== undefined && params.y !== undefined)) {
            let checkX, checkY;
            if (params.box2d) {
              let xmin, ymin, xmax, ymax;
              if (this.currentProvider === 'gemini') {
                [ymin, xmin, ymax, xmax] = params.box2d;
              } else {
                [xmin, ymin, xmax, ymax] = params.box2d;
              }
              checkX = Math.round((xmin + (xmax - xmin) / 2) * this.screenSize.width / 1000) + this.screenSize.x;
              checkY = Math.round((ymin + (ymax - ymin) / 2) * this.screenSize.height / 1000) + this.screenSize.y;
            } else {
              checkX = Math.round((params.x / 1000) * this.screenSize.width) + this.screenSize.x;
              checkY = Math.round((params.y / 1000) * this.screenSize.height) + this.screenSize.y;
            }
            
            const verified = await this.aiVerifyClick(checkX, checkY, params.label || 'target');
            result.success = true;
            result.message = verified.message || (verified.correct ? "Coordinates verified by AI" : "AI suggests coordinates may be incorrect");
            result.coordinates = { x: checkX, y: checkY };
            result.ai_verification = verified;
            result.suggestion = verified.suggestion || null;
          } else {
            result.message = "No box2d or x/y coordinates provided";
          }
          break;

case "type":
          if (params.text) {
            let typeTargetX, typeTargetY, coordSource = 'direct';
            
            if (params.box2d && Array.isArray(params.box2d) && params.box2d.length === 4) {
              let xmin, ymin, xmax, ymax;
              const box = params.box2d;
              
              if (this.currentProvider === 'gemini') {
                [ymin, xmin, ymax, xmax] = box;
              } else {
                [xmin, ymin, xmax, ymax] = box;
              }
              
              const centerNormX = xmin + (xmax - xmin) / 2;
              const centerNormY = ymin + (ymax - ymin) / 2;

              typeTargetX = Math.round((centerNormX / 1000) * this.screenSize.width) + this.screenSize.x;
              typeTargetY = Math.round((centerNormY / 1000) * this.screenSize.height) + this.screenSize.y;

              await mouse.setPosition(new Point(typeTargetX, typeTargetY));
              await mouse.leftClick();
              await new Promise(r => setTimeout(r, 200));
            } else if (params.x !== undefined && params.y !== undefined) {
              const x = Math.round((params.x / 1000) * this.screenSize.width) + this.screenSize.x;
              const y = Math.round((params.y / 1000) * this.screenSize.height) + this.screenSize.y;

              await mouse.setPosition(new Point(x, y));
              await mouse.leftClick();
              await new Promise(r => setTimeout(r, 200));
            }
            if (params.clear_first) {
              const modifier = process.platform === 'darwin' ? Key.LeftCmd : Key.LeftControl;
              await keyboard.pressKey(modifier, Key.A);
              await keyboard.releaseKey(modifier, Key.A);
              await keyboard.pressKey(Key.Backspace);
              await keyboard.releaseKey(Key.Backspace);
            }
            await keyboard.type(params.text);
            result.success = true;
            result.message = `Typed text with ${params.confidence || 100}% confidence`;
          }
          break;

        case "key_press":
          if (params.keys) {
            const keyMap = {
              "control": Key.LeftControl, "ctrl": Key.LeftControl,
              "shift": Key.LeftShift, "alt": Key.LeftAlt,
              "win": Key.LeftWin, "command": Key.LeftCmd, "cmd": Key.LeftCmd,
              "enter": Key.Enter, "return": Key.Enter,
              "tab": Key.Tab, "escape": Key.Escape, "esc": Key.Escape,
              "backspace": Key.Backspace, "delete": Key.Delete,
              "space": Key.Space, "up": Key.Up, "down": Key.Down,
              "left": Key.Left, "right": Key.Right
            };
            const keys = params.keys.map(k => {
              const lowK = k.toLowerCase();
              if (keyMap[lowK]) return keyMap[lowK];
              if (/^[a-z]$/.test(lowK)) return Key[lowK.toUpperCase()];
              if (/^[0-9]$/.test(lowK)) return Key[`Num${lowK}`];
              return k;
            });
            if (params.combo) {
              await keyboard.pressKey(...keys);
              await keyboard.releaseKey(...keys);
            } else {
              for (const k of keys) await keyboard.type(k);
            }
            result.success = true;
            result.message = `Keys pressed: ${params.keys.join("+")}`;
          }
          break;

        case "drag":
          if (params.box2d && params.end_box2d) {
            let x1_n, y1_n, x1_m, y1_m, x2_n, y2_n, x2_m, y2_m;
            if (this.currentProvider === 'gemini') {
              [y1_n, x1_n, y1_m, x1_m] = params.box2d;
              [y2_n, x2_n, y2_m, x2_m] = params.end_box2d;
            } else {
              [x1_n, y1_n, x1_m, y1_m] = params.box2d;
              [x2_n, y2_n, x2_m, y2_m] = params.end_box2d;
            }

            const x1 = Math.round(((x1_n + (x1_m - x1_n) / 2) / 1000) * this.screenSize.width) + this.screenSize.x;
            const y1 = Math.round(((y1_n + (y1_m - y1_n) / 2) / 1000) * this.screenSize.height) + this.screenSize.y;
            const x2 = Math.round(((x2_n + (x2_m - x2_n) / 2) / 1000) * this.screenSize.width) + this.screenSize.x;
            const y2 = Math.round(((y2_n + (y2_m - y2_n) / 2) / 1000) * this.screenSize.height) + this.screenSize.y;

            await mouse.setPosition(new Point(x1, y1));
            await mouse.drag(straightTo(new Point(x2, y2)));
            result.success = true;
            result.message = `Dragged from (${x1}, ${y1}) to (${x2}, ${y2})`;
          } else if (params.x !== undefined && params.y !== undefined && params.end_x !== undefined && params.end_y !== undefined) {
            const x1 = Math.round((params.x / 1000) * this.screenSize.width) + this.screenSize.x;
            const y1 = Math.round((params.y / 1000) * this.screenSize.height) + this.screenSize.y;
            const x2 = Math.round((params.end_x / 1000) * this.screenSize.width) + this.screenSize.x;
            const y2 = Math.round((params.end_y / 1000) * this.screenSize.height) + this.screenSize.y;

            await mouse.setPosition(new Point(x1, y1));
            await mouse.drag(straightTo(new Point(x2, y2)));
            result.success = true;
            result.message = `Dragged from (${x1}, ${y1}) to (${x2}, ${y2})`;
          }
          break;

        case "scroll":
          if (params.direction) {
            if (params.box2d) {
              let xmin, ymin, xmax, ymax;
              if (this.currentProvider === 'gemini') {
                [ymin, xmin, ymax, xmax] = params.box2d;
              } else {
                [xmin, ymin, xmax, ymax] = params.box2d;
              }
              const x = Math.round(((xmin + (xmax - xmin) / 2) / 1000) * this.screenSize.width) + this.screenSize.x;
              const y = Math.round(((ymin + (ymax - ymin) / 2) / 1000) * this.screenSize.height) + this.screenSize.y;
              await mouse.setPosition(new Point(x, y));
            } else if (params.x !== undefined && params.y !== undefined) {
              const x = Math.round((params.x / 1000) * this.screenSize.width) + this.screenSize.x;
              const y = Math.round((params.y / 1000) * this.screenSize.height) + this.screenSize.y;
              await mouse.setPosition(new Point(x, y));
            }
            const amount = params.amount || 3;
            if (params.direction === "up") await mouse.scrollUp(amount * 100);
            else await mouse.scrollDown(amount * 100);
            result.success = true;
            result.message = `Scrolled ${params.direction}`;
          }
          break;

        case "focus_window":
          if (params.app_name) {
            let command = "";
            if (process.platform === "win32") command = `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate('${params.app_name}')"`;
            else if (process.platform === "darwin") command = `osascript -e 'tell application "${params.app_name}" to activate'`;
            else command = `wmctrl -a "${params.app_name}"`;
            await new Promise(resolve => exec(command, resolve));
            result.success = true;
            result.message = `Focused ${params.app_name}`;
          }
          break;

        case "terminal":
          if (params.command) {
            try {
              const output = await executeTerminalCommand(params.command);
              result.success = true;
              result.code = 0;
              result.message = (output.stdout || output.stderr || 'Command executed').substring(0, 500);
              result.stdout = output.stdout;
              result.stderr = output.stderr;
            } catch (err) {
              result.success = false;
              result.code = err.code !== undefined ? err.code : 1;
              result.stdout = err.stdout || '';
              result.stderr = err.stderr || '';
              result.message = ((err.stderr && err.stderr.toString()) || err.message || 'Command failed').substring(0, 500);
              result.error = err.message;
              console.error('[ACT JS] Terminal command failed:', {
                command: params.command,
                code: result.code,
                message: result.message,
                stdout: result.stdout,
                stderr: result.stderr,
                fallbackCommand: err.fallbackCommand
              });
            }
          }
          break;

        case "list_applications":
          const { exec: exec2 } = require('child_process');
          const startMenuPaths = [
            path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
            'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
          ];
          const apps = [];
          const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            try {
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                  scanDir(fullPath);
                } else if (item.endsWith('.lnk')) {
                  apps.push(item.replace('.lnk', ''));
                }
              }
            } catch (e) {}
          };
          for (const p of startMenuPaths) scanDir(p);
          const filteredApps = params.filter 
            ? apps.filter(a => a.toLowerCase().includes(params.filter.toLowerCase()))
            : apps;
          result.success = true;
          result.applications = [...new Set(filteredApps)].sort();
          result.hint = 'Use exact name with: terminal { command: "start \\"<name>\\"" }';
          break;

        case "install_library":
          if (params.library && params.package_manager) {
            const lib = params.library;
            const pm = params.package_manager;
            const hasLib = await this.checkLibraryInstalled(lib, pm);
            if (hasLib) {
              result.success = true;
              result.message = `Library ${lib} already installed - using existing`;
            } else if (params.user_confirmed) {
              const installResult = await this.installLibrary(lib, pm);
              result.success = installResult.success;
              result.message = installResult.message;
              result.library = lib;
            } else {
              result.success = false;
              result.message = `Library ${lib} not installed. Add "user_confirmed": true to install.`;
              result.requires_confirmation = true;
              result.confirmation_prompt = `Install lightweight ${lib} via ${pm}? Required for task.`;
            }
          } else {
            result.message = "Missing library or package_manager (pip/npm)";
          }
          break;

        case "run_script":
          if (params.script && params.language) {
            let missingDeps = [];
            if (params.dependencies) {
              for (const dep of params.dependencies) {
                const hasDep = await this.checkLibraryInstalled(dep, params.language === 'python' ? 'pip' : 'npm');
                if (!hasDep) {
                  if (params.user_confirmed) {
                    await this.installLibrary(dep, params.language === 'python' ? 'pip' : 'npm');
                    console.log(`[ACT JS] Installed dependency: ${dep}`);
                  } else {
                    missingDeps.push(dep);
                  }
                }
              }
            }
            if (missingDeps.length > 0) {
              result.success = false;
              result.message = `Missing dependencies: ${missingDeps.join(', ')}. Add "user_confirmed": true to install.`;
              result.requires_confirmation = true;
              result.confirmation_prompt = `Install ${missingDeps.join(', ')}? Required for script.`;
              break;
            }
            const runResult = await this.runScript(params.script, params.language, params.args);
            result.success = runResult.success;
            result.message = runResult.output;
            result.script_output = runResult.output;
          } else {
            result.message = "Missing script or language (python/javascript)";
          }
          break;

        case "run_extendscript":
          // Run ExtendScript on Adobe After Effects via CLI
          if (params.script) {
            try {
              const { exec: execCmd, execSync } = require('child_process');
              const fs = require('fs');
              const path = require('path');
              const os = require('os');
              const tmpDir = os.tmpdir();
              
              // Check if AE is running first
              let isRunning = false;
              try {
                const runningOutput = execSync('tasklist /FI "IMAGENAME eq AfterFX.exe"', { windowsHide: true, encoding: 'utf8' });
                isRunning = runningOutput.includes('AfterFX.exe');
              } catch (err) {
                isRunning = false;
              }
              
              if (!isRunning) {
                result.success = false;
                result.message = "Adobe After Effects is not running. Please open AE first.";
                break;
              }
              
              // Don't wrap if already has try-catch or is wrapped in IIFE
              let scriptToRun = params.script;
              const hasErrorHandling = params.script.includes('try {') || params.script.includes('catch(') || params.script.includes('function()') || params.script.trim().startsWith('(function');
              
              if (!hasErrorHandling) {
                scriptToRun = `
try {
${params.script}
} catch(e) {
  var logFile = new File('${tmpDir.replace(/\\/g, '/')}/ae_control_error.log');
  logFile.open('w');
  logFile.write('Error: ' + e.message + ' | Line: ' + e.line);
  logFile.close();
}
`;
              }
              
              const jsxFile = path.join(tmpDir, `ae_extendscript_${Date.now()}.jsx`);
              
              // Write JSX script to temp file (UTF-8 No BOM)
              fs.writeFileSync(jsxFile, scriptToRun, 'utf8');
              
              // Find After Effects path
              const aePaths = [
                'C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\AfterFX.exe',
                'C:\\Program Files\\Adobe\\Adobe After Effects 2023\\Support Files\\AfterFX.exe',
                'C:\\Program Files\\Adobe\\Adobe After Effects 2022\\Support Files\\AfterFX.exe'
              ];
              let aePath = params.app_path;
              for (const p of aePaths) {
                if (fs.existsSync(p)) {
                  aePath = p;
                  break;
                }
              }
              
              if (!aePath) {
                fs.unlinkSync(jsxFile);
                result.success = false;
                result.message = "Adobe After Effects not found. Install AE or provide path.";
                break;
              }
              
              // Run via AE CLI -r flag using PowerShell Start-Process (Node exec fails with AE)
              const psCmd = `powershell -Command "Start-Process -FilePath '${aePath}' -ArgumentList '-r','${jsxFile}' -Wait -NoNewWindow"`;
              console.log(`[ACT JS] Running ExtendScript on AE via PowerShell`);

              await new Promise((resolve) => {
                execCmd(psCmd, { windowsHide: true, timeout: 60000 }, (err, stdout, stderr) => {
                  // Check for error log
                  let errorLog = null;
                  const errorLogPath = path.join(tmpDir, 'ae_control_error.log');
                  if (fs.existsSync(errorLogPath)) {
                    try {
                      errorLog = fs.readFileSync(errorLogPath, 'utf8');
                      fs.unlinkSync(errorLogPath); // Clean up
                    } catch (e) {}
                  }

                  try { fs.unlinkSync(jsxFile); } catch (e) {}

                  // AE returns exit code 1 even on success - check error log instead
                  if (errorLog) {
                    result.success = false;
                    result.message = errorLog;
                    result.error = errorLog;
                  } else {
                    result.success = true;
                    result.message = "ExtendScript executed on After Effects";
                    result.output = stdout;
                  }
                  resolve();
                });
              });
            } catch (err) {
              result.success = false;
              result.message = `ExtendScript error: ${err.message}`;
            }
          } else {
            result.message = "Missing script for run_extendscript";
          }
          break;

        case "enable_scripting":
          // Enable scripting permissions for creative software
          const appName = params.app || 'all';
          const mode = params.mode || 'check';
          const fs2 = require('fs');
          const pathModule = require('path');
          
          // Try JS version first, fallback to Python
          let scriptPath = pathModule.join(__dirname, '..', '..', 'scripts', 'enable_scripting.js');
          if (!fs2.existsSync(scriptPath)) {
            scriptPath = pathModule.join(__dirname, '..', '..', 'scripts', 'enable_scripting.py');
          }
          
          if (!fs2.existsSync(scriptPath)) {
            result.success = false;
            result.message = "enable_scripting script not found";
            break;
          }
          
          let args = [];
          if (mode === 'status') {
            args = ['--status'];
          } else if (mode === 'check') {
            args = ['--check'];
          } else if (mode === 'all') {
            args = ['--all'];
          } else {
            args = ['--app', appName];
          }
          
          const isJs = scriptPath.endsWith('.js');
          const cmd = isJs 
            ? `node "${scriptPath}" ${args.join(' ')}`
            : `python "${scriptPath}" ${args.join(' ')}`;
          
          await new Promise((resolve) => {
            execCmd(cmd, { windowsHide: true, timeout: 60000 }, (err, stdout, stderr) => {
              result.success = !err;
              result.message = stdout || stderr;
              resolve();
            });
          });
          break;

        case "run_script_on_file":
          if (params.script && params.file && params.language) {
            const fsExists = fs.existsSync(params.file);
            if (!fsExists) {
              result.success = false;
              result.message = `File not found: ${params.file}`;
              break;
            }
            let missingDeps = [];
            if (params.dependencies) {
              for (const dep of params.dependencies) {
                const hasDep = await this.checkLibraryInstalled(dep, params.language === 'python' ? 'pip' : 'npm');
                if (!hasDep) {
                  if (params.user_confirmed) {
                    await this.installLibrary(dep, params.language === 'python' ? 'pip' : 'npm');
                    console.log(`[ACT JS] Installed dependency: ${dep} for file script`);
                  } else {
                    missingDeps.push(dep);
                  }
                }
              }
            }
            if (missingDeps.length > 0) {
              result.success = false;
              result.message = `Missing: ${missingDeps.join(', ')}. Add "user_confirmed": true.`;
              result.requires_confirmation = true;
              break;
            }
            const runResult = await this.runScript(params.script, params.language, [params.file]);
            result.success = runResult.success;
            result.message = runResult.output;
            result.script_output = runResult.output;
          } else {
            result.message = "Missing script, file, or language";
          }
          break;

        case "execute_task":
          if (params.task_type && params.target) {
            if (params.task_type === 'image_resize') {
              const script = `from PIL import Image; img = Image.open('${params.target}'); img.resize(${params.size || (800, 600)}).save('${params.output || params.target}')`;
              const result1 = await this.runScript(script, 'python', []);
              result.success = result1.success;
              result.message = result1.output;
            } else if (params.task_type === 'pdf_extract') {
              const script = `import PyPDF2; reader = PyPDF2.PdfReader('${params.target}'); text = ''.join([p.extract_text() for p in reader.pages]); print(text[:1000])`;
              const result1 = await this.runScript(script, 'python', []);
              result.success = result1.success;
              result.message = result1.output;
            } else if (params.task_type === 'video_thumbnail') {
              const script = `import cv2; cap = cv2.VideoCapture('${params.target}'); cap.set(1, ${params.frame || 0}); ret, frame = cap.read(); cv2.imwrite('${params.output || 'thumb.jpg'}', frame)`;
              const result1 = await this.runScript(script, 'python', []);
              result.success = result1.success;
              result.message = result1.output;
            }
            result.task_completed = true;
          } else {
            result.message = "Missing task_type or target";
          }
          break;

        case "research_package":
          // Use web search to research the library
          const packageQuery = `Python library ${params.name} how to use install`;
          const searchResults = await searchManager.search(packageQuery);
          if (searchResults && searchResults.length > 0) {
            result.success = true;
            result.message = `Research for ${params.name}:\n\n` + 
              searchResults.slice(0, 3).map((r, i) => `${i + 1}. ${r.title}\n${r.link}\n${r.snippet}\n`).join('\n');
          } else {
            result.success = true;
            result.message = `Package ${params.name} - use web_search for more info on how to install and use this library.`;
          }
          break;

        case "read_preferences":
          result.success = true;
          result.message = JSON.stringify(storageManager.readPreferences());
          break;

        case "write_preferences":
          storageManager.writePreferences(params.preferences);
          result.success = true;
          result.message = "Preferences updated";
          break;

        case "read_libraries":
          result.success = true;
          result.message = JSON.stringify(storageManager.readLibraries());
          break;

        case "write_libraries":
          storageManager.addLibrary(params.type, params.name, params.version);
          result.success = true;
          result.message = `Library ${params.name} added`;
          break;

        case "read_behaviors":
          result.success = true;
          result.message = JSON.stringify(storageManager.readBehaviors());
          break;

        case "write_behaviors":
          storageManager.addBehavior(params.behavior);
          result.success = true;
          result.message = "Behavior learned and saved";
          break;

        case "wait":
          await new Promise(r => setTimeout(r, (params.duration || 1) * 1000));
          result.success = true;
          break;

        case "web_search":
          if (params.query) {
            const encodedQuery = encodeURIComponent(params.query);
            const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

            const searchResults = await searchManager.search(params.query);
            if (searchResults && searchResults.length > 0) {
              result.success = true;
              result.message = `Search results for "${params.query}":\n` +
                searchResults.map((r, i) => `${i + 1}. ${r.title} (${r.link})\n${r.snippet}`).join('\n\n');
              return result;
            }

            if (this.currentProvider !== 'gemini') {
              console.log(`[ACT JS] Web search fallback to agentic browser for: ${params.query}`);
              await electronBrowserManager.open(searchUrl);
              result.success = true;
              result.message = `Web search for "${params.query}" performed using agentic browser (native tool fallback).`;
              return result;
            }

            console.log(`[ACT JS] Web search requested for: ${params.query}`);
            let command = "";
            if (process.platform === "win32") {
              command = `start ${searchUrl}`;
            } else if (process.platform === "darwin") {
              command = `open "${searchUrl}"`;
            } else {
              command = `xdg-open "${searchUrl}"`;
            }

            await new Promise(resolve => exec(command, resolve));
            await new Promise(r => setTimeout(r, 2000)); // Wait for browser to open

            result.success = true;
            result.message = `Web search for "${params.query}" performed via system browser. Results are now visible on screen.`;
          } else {
            result.message = "No query provided for web search";
          }
          break;

case "browser_open":
          if (params.url) {
            try {
              await electronBrowserManager.navigateViaJs(params.url);
              const status = await electronBrowserManager.getStatus();
              result.success = true;
              result.message = `Agentic browser opened to ${status.url} via script injection`;
              result.url = status.url;
            } catch (e) {
              console.log("[ACT JS] Script injection navigate failed, falling back to standard open:", e.message);
              await electronBrowserManager.open(params.url);
              const status = await electronBrowserManager.getStatus();
              result.success = true;
              result.message = `Agentic browser opened to ${params.url} (fallback)`;
              result.url = status.url;
            }
          } else {
            result.message = "No URL provided for browser_open";
          }
          break;

        case "browser_execute_js":
          if (params.script) {
            try {
              const jsResult = await electronBrowserManager.executeJs(params.script);

              await new Promise(r => setTimeout(r, 800));

              const status = await electronBrowserManager.getStatus();

              result.success = true;
              result.message = `JS executed. Result: ${JSON.stringify(jsResult) || "Success (no return value)"}. Current URL: ${status.url}, Title: ${status.title}`;
              result.result = jsResult;
              result.url = status.url;
            } catch (e) {
              result.message = `JS error: ${e.message}`;
            }
          } else {
            result.message = "No script provided for browser_execute_js";
          }
          break;

        case "browser_screenshot":
          try {
            const buffer = await electronBrowserManager.takeScreenshot();
            const timestamp = Date.now();
            const filename = `browser_shot_${timestamp}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            fs.writeFileSync(filepath, buffer);
            result.success = true;
            result.screenshot = filepath;
            result.message = "Browser content captured via Electron capturePage.";
          } catch (e) {
            result.message = `Browser screenshot error: ${e.message}`;
          }
          break;

case "browser_close":
          await electronBrowserManager.close();
          result.success = true;
          result.message = "Agentic browser closed";
          break;

        case "browser_scrape_data":
          if (params.selector) {
            try {
              const scraped = await electronBrowserManager.scrapePage(params.selector);
              result.success = true;
              result.message = `Scraped ${scraped.length} elements matching selector "${params.selector}"`;
              result.data = scraped;
            } catch (e) {
              result.message = `Scrape error: ${e.message}`;
            }
          } else {
            try {
              const scraped = await electronBrowserManager.scrapeAllText();
              result.success = true;
              result.message = "Scraped all page text content via script injection";
              result.data = scraped;
            } catch (e) {
              result.message = `Scrape error: ${e.message}`;
            }
          }
          break;

        case "browser_scrape_text":
          if (params.selector) {
            try {
              const texts = await electronBrowserManager.scrapeText(params.selector);
              result.success = true;
              result.message = `Scraped ${texts.length} text elements via script injection`;
              result.texts = texts;
            } catch (e) {
              result.message = `Scrape error: ${e.message}`;
            }
          } else {
            result.message = "No selector provided for browser_scrape_text";
          }
          break;

        case "browser_scrape_links":
          try {
            const links = await electronBrowserManager.scrapeLinks();
            result.success = true;
            result.message = `Scraped ${links.length} links via script injection`;
            result.links = links;
          } catch (e) {
            result.message = `Scrape links error: ${e.message}`;
          }
          break;

        case "browser_navigate_via_js":
          if (params.url) {
            try {
              await electronBrowserManager.navigateViaJs(params.url);
              const status = await electronBrowserManager.getStatus();
              result.success = true;
              result.message = `Navigated via JS to ${status.url}`;
              result.url = status.url;
              result.title = status.title;
            } catch (e) {
              result.message = `Navigate error: ${e.message}`;
            }
          } else {
            result.message = "No URL provided for browser_navigate_via_js";
          }
          break;

        case "browser_click_element":
          if (params.selector) {
            try {
              const clickResult = await electronBrowserManager.clickElement(params.selector);
              result.success = clickResult.success;
              result.message = clickResult.message;
            } catch (e) {
              result.message = `Click error: ${e.message}`;
            }
          } else {
            result.message = "No selector provided for browser_click_element";
          }
          break;

        case "browser_type_into":
          if (params.selector && params.text) {
            try {
              const typeResult = await electronBrowserManager.typeInto(params.selector, params.text);
              result.success = typeResult.success;
              result.message = typeResult.message;
            } catch (e) {
              result.message = `Type error: ${e.message}`;
            }
          } else {
            result.message = "Missing selector or text for browser_type_into";
          }
          break;

        case "browser_scroll":
          if (params.selector) {
            try {
              await electronBrowserManager.scrollTo(params.selector);
              result.success = true;
              result.message = `Scrolled to ${params.selector}`;
            } catch (e) {
              result.message = `Scroll error: ${e.message}`;
            }
          } else if (params.position) {
            try {
              await electronBrowserManager.scrollTo(params.position);
              result.success = true;
              result.message = `Scrolled to position ${params.position}`;
            } catch (e) {
              result.message = `Scroll error: ${e.message}`;
            }
          } else {
            result.message = "No selector or position provided for browser_scroll";
          }
          break;

        case "browser_get_clickable":
          try {
            const elements = await electronBrowserManager.getClickableElements();
            result.success = true;
            result.message = `Found ${elements.length} clickable elements via script injection`;
            result.elements = elements;
          } catch (e) {
            result.message = `Get clickable error: ${e.message}`;
          }
          break;

case "browser_get_element":
          if (params.selector) {
            try {
              const element = await electronBrowserManager.querySelector(params.selector);
              result.success = !!element;
              result.message = element ? `Found: ${element.tag}` : 'No element found';
              result.element = element;
            } catch (e) {
              result.message = `Get element error: ${e.message}`;
            }
          } else if (params.x !== undefined && params.y !== undefined) {
            try {
              const element = await electronBrowserManager.getElementAtPosition(params.x, params.y);
              result.success = true;
              result.message = `Element at (${params.x}, ${params.y}): ${element ? element.tag : 'none'}`;
              result.element = element;
            } catch (e) {
              result.message = `Get element error: ${e.message}`;
            }
          } else {
            result.message = "Provide selector or x,y coordinates";
          }
          break;

        case "browser_wait_for_selector":
          if (params.selector) {
            try {
              const waitResult = await electronBrowserManager.waitForSelector(params.selector, params.timeout || 10000);
              result.success = waitResult.found;
              result.message = waitResult.found ? `Selector ${params.selector} found` : waitResult.message;
            } catch (e) {
              result.message = `Wait error: ${e.message}`;
            }
          } else {
            result.message = "No selector provided for browser_wait_for_selector";
          }
          break;

        case "browser_extract_forms":
          try {
            const forms = await electronBrowserManager.extractFormFields();
            result.success = true;
            result.message = `Extracted ${forms.length} forms via script injection`;
            result.forms = forms;
          } catch (e) {
            result.message = `Extract forms error: ${e.message}`;
          }
          break;

        case "browser_scrape_screenshot":
          if (params.selector) {
            try {
              const scraped = await electronBrowserManager.scrapePage(params.selector);
              if (scraped.length > 0) {
                result.success = true;
                result.message = `Scrape succeeded (fallback from screenshot to script injection)`;
                result.data = scraped;
              } else {
                throw new Error("No elements found, falling back to screenshot");
              }
            } catch (e) {
              console.log("[ACT JS] Script scrape failed, falling back to screenshot:", e.message);
              const buffer = await electronBrowserManager.takeScreenshot();
              const timestamp = Date.now();
              const filename = `browser_shot_${timestamp}.png`;
              const filepath = path.join(this.screenshotDir, filename);
              fs.writeFileSync(filepath, buffer);
              result.success = true;
              result.screenshot = filepath;
              result.message = "Fallback: screenshot captured since script scrape failed";
            }
          } else {
            const buffer = await electronBrowserManager.takeScreenshot();
            const timestamp = Date.now();
            const filename = `browser_shot_${timestamp}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            fs.writeFileSync(filepath, buffer);
            result.success = true;
            result.screenshot = filepath;
            result.message = "Browser screenshot captured";
          }
          break;

        case "display_code":
          result.success = true;
          result.code = params.code;
          result.language = params.language;
          result.message = "Code displayed";
          break;

        case "browser_submit":
          if (params.selector) {
            try {
              const submitResult = await electronBrowserManager.submitForm(params.selector);
              result.success = submitResult.success;
              result.message = submitResult.message;
            } catch (e) {
              result.message = `Submit error: ${e.message}`;
            }
          } else {
            result.success = false;
            result.message = "No selector provided for browser_submit";
          }
          break;

        case "browser_get_state":
          try {
            const state = await electronBrowserManager.getBrowserState();
            result.success = state.success !== false;
            result.message = `URL: ${state.url || ''}, Title: ${state.title || ''}, Focus: ${state.activeElement || ''}`;
            result.state = state;
          } catch (e) {
            result.message = `Get state error: ${e.message}`;
          }
          break;

        case "browser_press_enter":
          try {
            const pressResult = await electronBrowserManager.pressEnter();
            result.success = pressResult.success;
            result.message = pressResult.message;
          } catch (e) {
            result.message = `Press Enter error: ${e.message}`;
          }
          break;

        case "browser_search":
          if (params.query) {
            try {
              const url = `https://www.google.com/search?q=${encodeURIComponent(params.query)}`;
              await electronBrowserManager.navigateViaJs(url);
              result.success = true;
              result.message = `Navigated to search: ${params.query}`;
            } catch (e) {
              result.message = `Search error: ${e.message}`;
            }
          } else {
            result.message = "No query provided for browser_search";
          }
          break;

        default:
          result.message = `Unknown action: ${actionType}`;
      }
    } catch (err) {
      result.message = err.message;
    }

    return result;
  }

  async verifyAction(action, executionResult, existingShot = null) {
    const verificationInfo = action.verification || {};
    
    // For terminal commands - verify by exit code only
    if (action.action === 'terminal' || action.action === 'run_script') {
      const exitCode = executionResult.code;
      // If code is undefined (didn't run), check success flag
      // If code is 0, success. If code > 0, failure
      const success = executionResult.success && (exitCode === undefined || exitCode === 0);
      return { 
        verified: success, 
        message: success 
          ? `Terminal command executed successfully (exit code: ${exitCode || 0})` 
          : `Terminal failed with exit code: ${exitCode || 'unknown'}` 
      };
    }
    
    // Wait for app to respond
    if (!verificationInfo.verification_method || verificationInfo.verification_method === "visual") {
      await new Promise(r => setTimeout(r, 500));
    } else {
      await new Promise(r => setTimeout(r, this.verificationWait));
    }

    const method = verificationInfo.verification_method || "visual";
    let terminalContext = "";

    if (method === "terminal_output" && verificationInfo.verification_command) {
      try {
        const output = await new Promise(resolve => {
          exec(verificationInfo.verification_command, (err, stdout, stderr) => {
            resolve({ success: !err, out: stdout || stderr });
          });
        });
        terminalContext = `Terminal verification output: ${output.out}`;
      } catch (e) {
        terminalContext = `Terminal verification failed to run: ${e.message}`;
      }
    }

    const isBrowserAction = action.action.startsWith('browser_');
    let shotData;
    let mimeType = "image/png";
    let scrapeData = null;

    if (isBrowserAction && method === "visual") {
      try {
        scrapeData = await electronBrowserManager.scrapeAllText();
        console.log("[ACT JS] Verified via script injection:", scrapeData ? "Got data" : "empty");
      } catch (e) {
        console.log("[ACT JS] Script scrape for verification failed:", e.message);
      }
      if (!scrapeData || !scrapeData.title) {
        try {
          const buffer = await electronBrowserManager.takeScreenshot();
          shotData = buffer.toString("base64");
          console.log("[ACT JS] Verification fell back to browser screenshot");
        } catch (e) {
          console.error("[ACT JS] Browser screenshot for verification failed, falling back to desktop:", e);
          const shot = await this.takeScreenshot();
          shotData = fs.readFileSync(shot.filepath).toString("base64");
        }
      }
    } else {
      const shot = await this.takeScreenshot();
      shotData = fs.readFileSync(shot.filepath).toString("base64");
    }

let scrapeInfo = "";
    if (scrapeData && scrapeData.title) {
      scrapeInfo = `\nPAGE CONTENT (via script injection):\n- Title: ${scrapeData.title}\n- URL: ${scrapeData.url}\n`;
      if (scrapeData.headings && scrapeData.headings.length > 0) {
        scrapeInfo += `- Headings: ${scrapeData.headings.slice(0, 5).join(", ")}\n`;
      }
      if (scrapeData.paragraphs && scrapeData.paragraphs.length > 0) {
        scrapeInfo += `- Content preview: ${scrapeData.paragraphs.slice(0, 3).join(" | ").substring(0, 300)}\n`;
      }
      if (scrapeData.links && scrapeData.links.length > 0) {
        scrapeInfo += `- Links: ${scrapeData.links.slice(0, 10).map(l => l.text || l.href).join(", ")}\n`;
      }
    }

    const prompt = `VERIFICATION TASK:
Action executed: ${action.action}
Description: ${action.description}
Expected outcome: ${verificationInfo.expected_outcome}
Execution result: ${executionResult.message}
Verification method: ${method}
${scrapeInfo ? scrapeInfo : (isBrowserAction ? "NOTE: This is a screenshot of the Control Agentic Browser." : "")}
${terminalContext ? terminalContext : ""}

Analyze the state and determine if the action was successful. Respond ONLY with JSON: {"verification_status": "success|failure", "observations": "..."}`;

    const content = [
      { inlineData: { mimeType, data: shotData } },
      prompt
    ];
try {
      const result = await this.model.generateContent(content);
      const text = (await result.response).text();
      const jsonMatch = /\{[\s\S]*\}/.exec(text);
      const executionWasClean = executionResult.success === true && executionResult.error === undefined && (executionResult.code === undefined || executionResult.code === 0);

      if (!jsonMatch) {
        console.warn('[ACT JS] Verification response missing JSON:', text);
        return {
          verified: executionWasClean,
          message: executionWasClean
            ? 'Verification response missing JSON; defaulting to clean execution success.'
            : `Verification response missing JSON; action did not report clean success.`
        };
      }
      let data;
      try {
        data = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('[ACT JS] Verification JSON parse failed:', e.message, 'raw:', text);
        return {
          verified: executionWasClean,
          message: executionWasClean
            ? 'Verification parse error; defaulting to clean execution success.'
            : `Verification parse error; action did not report clean success.`
        };
      }
      return { verified: data.verification_status === "success", message: data.observations };
    } catch (err) {
      console.warn('[ACT JS] Verification exception:', err.message);
      const executionWasClean = executionResult.success === true && executionResult.error === undefined && (executionResult.code === undefined || executionResult.code === 0);
      return {
        verified: executionWasClean,
        message: executionWasClean
          ? `Verification error: ${err.message}; defaulting to clean execution success.`
          : `Verification error: ${err.message}`
      };
    }
  }

  formatCitations(response) {
    try {

      return response.text();
    } catch (e) {
      console.error("[ACT JS] Error getting text from response:", e);
      return "";
    }
  }

  async ollamaGenerate(prompt, systemPrompt, settings, images = [], onChunk) {
    const url = `${settings.ollamaUrl || 'http://localhost:11434'}/api/generate`;
    const body = {
      model: settings.ollamaModel || 'llama3',
      prompt: prompt,
      system: systemPrompt,
      stream: !!onChunk,
      format: 'json'
    };
    if (images.length > 0) {
      body.images = images;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

    if (onChunk) {
      const reader = response.body.getReader();
      let fullResponse = "";
      let decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response);
            }
          } catch (e) { }
        }
      }
      return fullResponse;
    } else {
      const data = await response.json();
      return data.response;
    }
  }

  async universalGenerate(prompt, systemPrompt, settings, images = [], onChunk) {
    const provider = settings.modelProvider;
    let apiKey = settings[`${provider}ApiKey`] || settings.universalApiKey;
    let model = settings[`${provider}Model`] || settings.universalModel;
    let baseUrl = settings.universalBaseUrl;

    const endpoints = {
      'openai': 'https://api.openai.com/v1/chat/completions',
      'deepseek': 'https://api.deepseek.com/chat/completions',
      'xai': 'https://api.x.ai/v1/chat/completions',
      'moonshot': 'https://api.moonshot.cn/v1/chat/completions',
      'zai': 'https://api.zhipuai.cn/paas/v4/chat/completions',
      'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
      'lmstudio': 'http://localhost:1234/v1/chat/completions',
      'litellm': settings.universalBaseUrl || 'http://localhost:4000/chat/completions',
      'minimax': 'https://api.minimax.chat/v1/text/chat-completion-v2'
    };

    let url = baseUrl ? (baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`) : endpoints[provider];

    if (provider === 'azure') {
      apiKey = settings.cloudCredentials;
      model = settings.cloudModel;
      const endpoint = settings.cloudRegion; // Base URL
      if (!endpoint || !apiKey || !model) throw new Error("Azure requires Endpoint URL, API Key, and Deployment Name (Model ID).");
      url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`;
    } else if (provider === 'aws' || provider === 'vertex') {
      throw new Error(`${provider.toUpperCase()} is not yet natively supported. Please use LiteLLM or OpenRouter as a gateway for this provider.`);
    }

    if (!url) throw new Error(`Endpoint for provider ${provider} not found.`);

    if (provider === 'openrouter') {
      apiKey = settings.openrouterApiKey || (require("../supabase-service").getKeys()?.openrouter);
      model = settings.openrouterModel === "custom" ? settings.openrouterCustomModel : settings.openrouterModel;
    }

    if (!apiKey && provider !== 'lmstudio') throw new Error(`API Key for ${provider} is missing.`);

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user", content: [
          { type: "text", text: prompt },
          ...images.map(img => ({ type: "image_url", image_url: { url: `data:image/png;base64,${img}` } }))
        ]
      }
    ];

    const headers = {
      "Content-Type": "application/json"
    };

    if (provider === 'azure') {
      headers["api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    if (provider === 'openrouter') {
      headers["HTTP-Referer"] = "https://controlrebuild-website.vercel.app";
      headers["X-Title"] = "Control AI";
    }

    const body = { model, messages, stream: !!onChunk };
    if (provider !== 'anthropic') body.response_format = { type: "json_object" };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${provider} error: ${errorData.error?.message || response.statusText}`);
    }

    if (onChunk) {
      const reader = response.body.getReader();
      let fullText = "";
      let decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) { }
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  async anthropicGenerate(prompt, systemPrompt, settings, images = [], onChunk) {
    const apiKey = settings.anthropicApiKey || settings.universalApiKey;
    const model = settings.anthropicModel || settings.universalModel || "claude-3-5-sonnet-20240620";

    if (!apiKey) throw new Error("Anthropic API key is missing.");

    const messages = [
      {
        role: "user", content: [
          ...images.map(img => ({
            type: "image",
            source: { type: "base64", media_type: "image/png", data: img }
          })),
          { type: "text", text: prompt }
        ]
      }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages,
        max_tokens: 4096,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic error: ${errorData.error?.message || response.statusText}`);
    }

    if (onChunk) {
      const reader = response.body.getReader();
      let fullText = "";
      let decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'content_block_delta' && data.delta?.text) {
                fullText += data.delta.text;
                onChunk(data.delta.text);
              }
            } catch (e) { }
          }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.content[0].text;
    }
  }

  async processRequest(userRequest, attachments = [], onEvent, onError, apiKey, settings = {}) {
    this.stopRequested = false;

    const provider = settings.modelProvider || 'gemini';
    let effectiveProvider = provider;
    if (provider === 'openrouter' && (settings.openrouterModel === 'google/gemini-flash-1.5-sdk' || settings.openrouterModel === 'gemini-native')) {
      effectiveProvider = 'gemini';
}
    this.currentProvider = effectiveProvider;

    const cachedKeys = supabaseService.getKeys();
    const modelSettings = supabaseService.getModelSettings();
    const defaultGeminiModel = modelSettings?.selectedModel || modelSettings?.gemini_model || cachedKeys?.gemini_model || "gemini-2.5-flash";
    const geminiModel = settings.selectedModel || defaultGeminiModel;

    if (effectiveProvider === 'gemini') {
      const geminiSysPrompt = this.appendToolsToSystemPrompt(GENERAL_SYSTEM_PROMPT);
      this.setupGeminiAPI(apiKey, geminiModel, geminiSysPrompt);
    }
    const cachedUser = supabaseService.checkCachedUser();

    onEvent("task_start", { task: userRequest, show_effects: true });

    const requestLower = userRequest.toLowerCase();
    let steps = [];
    
    if (requestLower.includes('open') && requestLower.includes(' ')) {
      const appMatch = userRequest.match(/open\s+(\w+)/i);
      if (appMatch) steps.push(`Open ${appMatch[1]}`);
    }
    
    steps.push('Analyze what is needed');
    steps.push('Execute actions to complete the request');
    steps.push('Verify completion');
    
    this.setTaskPlan(steps, { originalRequest: userRequest });

    try {
      let loopCount = 0;
      const maxLoops = 15;
      let lastResultContext = "";
      let taskFinished = false;

      while (loopCount < maxLoops && !this.stopRequested) {
        loopCount++;
        await new Promise(r => setTimeout(r, 150));
        const shot = await this.takeScreenshot();
        if (!shot) throw new Error("Screenshot failed");
        const screenshotData = shot.buffer || fs.readFileSync(shot.filepath);

        const prefs = storageManager.readPreferences();
        const libs = storageManager.readLibraries();
        const behaviors = storageManager.readBehaviors();

        let browserStatus = "";
        try {
          const status = await electronBrowserManager.getStatus();
          if (status.success && status.isVisible) {
            browserStatus = `\nAgentic Browser Status: URL=${status.url}, Title=${status.title}`;
          }
        } catch (e) { }

const prompt = `User Request: ${userRequest}
User Preferences: ${JSON.stringify(prefs)}
Installed Libraries: ${JSON.stringify(libs)}
Learned Behaviors: ${JSON.stringify(behaviors)}
Last Action Result: ${lastResultContext}${browserStatus}
OS: ${process.platform}, Native Screen: ${this.actualScreen.width}x${this.actualScreen.height}, Image Size: ${this.imageSize.width}x${this.imageSize.height}

=== INSTALLED APPLICATIONS WITH PATHS ===
${(global.cachedApplicationsWithPaths || []).slice(0, 80).join('\n')}

=== CRITICAL APP LAUNCHING RULES ===
- NEVER use "start <appname>" - it opens wrong app or command prompt  
- When need to open app from list, use the shortcut path above with: explorer "<shortcut_path>"
- Or just click on the actual Start Menu item in the screenshot

=== WORKFLOW TRACKING ===
You are on step ${this.currentStepIndex + 1} of ${this.currentTaskSteps.length}. ${this.currentTaskSteps[this.currentStepIndex] ? 'Current step: ' + this.currentTaskSteps[this.currentStepIndex] : ''}
COMPLETED STEPS: ${this.stepHistory.map(h => h.action).join(', ') || 'None'}
DO NOT repeat actions from completed steps. Move forward to the next step.

${effectiveProvider !== 'gemini' ? 'NOTE: Native web search tool (googleSearch) is NOT available for this provider. Use browser_open, browser_execute_js, and standard spatial actions to perform web searches manually via a search engine.' : ''}

Analyze screen and provide IMMEDIATE ACTIONS. Respond with JSON.`;

        let imgBuffer = screenshotData;
        try {
          const img = sharp(screenshotData);
          const meta = await img.metadata();
          const maxDim = 1024;
          if (meta.width > maxDim || meta.height > maxDim) {
            if (meta.width > meta.height) {
              imgBuffer = await img.resize(maxDim, null).png().toBuffer();
            } else {
              imgBuffer = await img.resize(null, maxDim).png().toBuffer();
            }
          } else {
            imgBuffer = await sharp(screenshotData).png().toBuffer();
          }
        } catch (e) {
          console.log('[ACT JS] Image resize skipped:', e.message);
        }

        const content = [
          { inlineData: { mimeType: "image/webp", data: imgBuffer.toString("base64") } }
        ];

        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            if (att.path && fs.existsSync(att.path)) {
              const ext = path.extname(att.path).toLowerCase();
              const mimeMap = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf'
              };
              if (mimeMap[ext]) {
                content.push({ inlineData: { mimeType: mimeMap[ext], data: fs.readFileSync(att.path).toString("base64") } });
              }
            }
          }
        }

        content.push(prompt);

        let fullText = "";

        const sysPrompt = this.appendToolsToSystemPrompt(GENERAL_SYSTEM_PROMPT);
        const baseImage = fs.readFileSync(shot.filepath).toString("base64");
        const allImages = [baseImage];
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            if (att.path && fs.existsSync(att.path)) {
              const ext = path.extname(att.path).toLowerCase();
              if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
                allImages.push(fs.readFileSync(att.path).toString("base64"));
              }
            }
          }
        }

        let isFirstChunk = true;
        let skipStreaming = false;

        const onChunkCallback = (chunk) => {
          if (isFirstChunk) {
            isFirstChunk = false;

            if (chunk.trim().startsWith('{')) {
              skipStreaming = true;
            }
          }

          if (!skipStreaming && onEvent && typeof onEvent === 'function') {

            if (chunk.includes('{')) {

              skipStreaming = true;
              return;
            }
            onEvent('ai_stream', { chunk });
          }
        };

        if (effectiveProvider === 'ollama') {
          const ollamaSysPrompt = this.appendToolsToSystemPrompt(GENERAL_SYSTEM_PROMPT);
          fullText = await this.ollamaGenerate(prompt, ollamaSysPrompt, settings, allImages, onChunkCallback);
        } else if (effectiveProvider === 'anthropic') {
          const anthropicSysPrompt = this.appendToolsToSystemPrompt(GENERAL_SYSTEM_PROMPT);
          fullText = await this.anthropicGenerate(prompt, anthropicSysPrompt, settings, allImages, onChunkCallback);
        } else if (['openai', 'deepseek', 'xai', 'moonshot', 'zai', 'openrouter', 'lmstudio', 'litellm', 'minimax', 'azure', 'aws', 'vertex'].includes(effectiveProvider)) {
          const universalSysPrompt = this.appendToolsToSystemPrompt(GENERAL_SYSTEM_PROMPT);
          fullText = await this.universalGenerate(prompt, universalSysPrompt, settings, allImages, onChunkCallback);
} else if (effectiveProvider === 'gemini') {
          let geminiRetry = 0;
          const maxRetries = 2;
          
          while (geminiRetry <= maxRetries) {
            try {
              const result = await this.model.generateContentStream(content);
              for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                  fullText += chunkText;
                  onChunkCallback(chunkText);
                }
              }
              const response = await result.response;
              if (response.usageMetadata && cachedUser) supabaseService.updateTokenUsage(cachedUser.id, 'act', response.usageMetadata);
              break;
            } catch (streamErr) {
              geminiRetry++;
              console.error(`[ACT JS] Stream error (attempt ${geminiRetry}):`, streamErr.message);
              
              if (geminiRetry > maxRetries || !streamErr.message.includes('500')) {
                if (fullText) {
                  console.log('[ACT JS] Using partial response after retries');
                  break;
                }
                throw new Error(`AI stream failed after ${maxRetries} retries: ${streamErr.message}`);
              }
              
              await new Promise(r => setTimeout(r, 1000 * geminiRetry));
            }
          }
        } else {
          throw new Error(`Provider ${effectiveProvider} is not yet fully integrated in this mode. Please use LiteLLM or OpenRouter as a gateway.`);
        }
        const jsonMatch = /\{[\s\S]*\}/.exec(fullText);

        // If NO json found at all - treat as text
        if (!jsonMatch) {
          console.log('[ACT JS] No JSON found in response, treating as text');
          const cleanText = fullText.trim();
          if (cleanText && cleanText.length > 5) {
            onEvent("ai_response", { text: cleanText, is_action: false });
            onEvent("task_complete", { task: userRequest, success: true });
          }
          break;
        }

        let plan;
        let parseFailed = false;
        try {
          // Check if response starts with valid JSON opening
          const jsonText = jsonMatch[0].trim();
          if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
            // Not a valid JSON block - treat as text
            console.log('[ACT JS] JSON block not valid, treating as text response');
            const cleanText = fullText.trim();
            if (cleanText && cleanText.length > 5) {
              onEvent("ai_response", { text: cleanText, is_action: false });
              onEvent("task_complete", { task: userRequest, success: true });
              break;
            }
          }
          plan = JSON.parse(jsonText);
        } catch (jsonErr) {
          console.error('[ACT JS] JSON parse error:', jsonErr.message, 'Attempting recovery...');
          console.log('[ACT JS] Raw fullText:', fullText);
          parseFailed = true;
          
          try {
            const jsonStart = fullText.indexOf('{');
            const jsonEnd = fullText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              let fixedJson = fullText.substring(jsonStart, jsonEnd + 1);
              fixedJson = fixedJson
                .replace(/([,{\[]\s*)'([^']+)'\s*:/g, '$1"$2":')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
                .replace(/,\s*([}\]])/g, '$1');
              plan = JSON.parse(fixedJson);
              parseFailed = false;
            }
          } catch (fixErr) {
            console.error('[ACT JS] JSON recovery failed:', fixErr.message);
          }
        }
        
        if (parseFailed) {
          const cleanMarkdown = fullText.replace(/\{[\s\S]*\}/, "").trim();
          if (cleanMarkdown && cleanMarkdown.length > 10) {
            onEvent("ai_response", { text: cleanMarkdown, is_action: false });
            onEvent("task_complete", { task: userRequest, success: true });
            break;
          } else {
            onEvent("ai_response", { text: "I couldn't parse the response. Trying again.", is_action: false });
            loopCount++;
            if (loopCount >= maxLoops) break;
            continue;
          }
        }

        const cleanMarkdown = fullText.replace(/\{[\s\S]*\}/, "").trim();

        const thoughtToDisplay = plan.thought || cleanMarkdown;
        if (thoughtToDisplay) onEvent("ai_response", { text: thoughtToDisplay, is_action: false });

        const actions = plan.actions || [];
        if (actions.length === 0) {
          onEvent("task_complete", { task: userRequest, success: true });
          taskFinished = true;

          const finalMessage = plan.after_message || (plan.thought ? "" : cleanMarkdown);
          if (finalMessage) onEvent("after_message", { text: finalMessage });
          break;
        }

        for (const action of actions) {
          if (this.stopRequested) break;

          const isHighRisk = ["terminal", "write_preferences", "write_libraries"].includes(action.action.toLowerCase());
          const proceedWithoutConfirmation = settings.proceedWithoutConfirmation || prefs.proceedWithoutConfirmation;

          if (!proceedWithoutConfirmation && isHighRisk) {
            onEvent("request_confirmation", {
              description: action.description,
              action: action.action,
              parameters: action.parameters
            });

            const confirmed = await new Promise((resolve) => {
              this.confirmationResolver = resolve;
              setTimeout(() => {
                if (this.confirmationResolver === resolve) {
                  this.confirmationResolver = null;
                  resolve(false);
                }
              }, 60000);
            });

            if (!confirmed) {
              onEvent("ai_response", { text: "Task paused. High-risk action was not confirmed by user.", is_action: false });
              this.stopRequested = true;
              break;
            }
          }

          onEvent("action_start", { description: action.description });
          const execResult = await this.executeAction(action, onEvent);
          
          if (!this.isOnTrack()) {
            onEvent("ai_response", { text: "Detected repeated actions. Stopping task to prevent infinite loop.", is_action: false });
            this.stopRequested = true;
            break;
          }
          
          const confidence = action.parameters?.confidence;
          const skipVerif = action.parameters?.skip_ai_verify || action.parameters?.skip_verify;
          const isRoutine = ['click', 'type', 'scroll', 'mouse_move'].includes(action.action.toLowerCase());
          const isTerminal = ['terminal', 'run_script'].includes(action.action.toLowerCase());
          const isHighConf = confidence !== undefined && confidence >= 95;
          
          let verification;
          // For terminal commands - verify by exit code, not AI assessment
          if (isTerminal && execResult.success) {
            verification = { verified: true, message: `Terminal command executed successfully (code: ${execResult.code || 0})` };
          } 
          // For high confidence - verify locally, assume success unless obvious failure
          else if (skipVerif || (isRoutine && isHighConf)) {
            verification = { verified: execResult.success, message: `Verified locally (confidence: ${confidence}%)` };
          } else {
            verification = await this.verifyAction(action, execResult);
          }
          
          lastResultContext = `Action: ${action.action}, Success: ${verification.verified}, Notes: ${verification.message}`;
          onEvent("action_complete", {
            description: action.description,
            success: verification.verified,
            details: verification.message,
            confidence: action.parameters?.confidence,
            code: execResult.code,
            language: execResult.language
          });
          
          // Only retry if there's a REAL failure, not just "verification unclear"
          const realFailure = !verification.verified || !execResult.success;
          // Don't retry terminal commands that succeeded, or high-confidence clicks
          const shouldRetry = realFailure && !(isTerminal && execResult.success) && !isHighConf;
          
          if (shouldRetry) {
            this.actionRetryCount++;
            console.log(`[ACT JS] Action failed, retry count: ${this.actionRetryCount}/${this.maxActionRetries}`);
            
            if (this.actionRetryCount >= this.maxActionRetries) {
              onEvent("ai_response", { text: `Action failed after ${this.maxActionRetries} attempts: ${verification.message}. Moving to next step.`, is_action: false });
              this.actionRetryCount = 0;
              this.advanceStep(action.action + '_FAILED', execResult);
            } else {
              onEvent("ai_response", { text: `Action failed: ${verification.message}. Will retry (${this.actionRetryCount}/${this.maxActionRetries}).`, is_action: false });
            }
            continue;
          }
          
          this.actionRetryCount = 0;
          this.advanceStep(action.action, execResult);
        }
      }
      if (!taskFinished) onEvent("task_complete", { task: userRequest, success: !this.stopRequested });
    } catch (err) {
      console.error("[ACT JS] Task error:", err);
      const errorStr = err.message.toLowerCase();
      let userMessage = err.message;

      const provider = settings.modelProvider || 'gemini';
      if (errorStr.includes("quota") || errorStr.includes("exceeded") || errorStr.includes("429")) {
        userMessage = "AI Quota exceeded. Rotating API key for next request. Please try again in a moment.";
        if (provider === 'openrouter') supabaseService.rotateOpenRouterKey();
        else supabaseService.rotateGeminiKey();
      } else if (errorStr.includes("google_search_retrieval")) {
        userMessage = "Search tool configuration error. Rotating key and updating tool settings. Please retry.";
        if (provider === 'openrouter') supabaseService.rotateOpenRouterKey();
        else supabaseService.rotateGeminiKey();
      }

      onError({ message: userMessage });
    }
  }

  handleConfirmation(confirmed) {
    if (this.confirmationResolver) {
      this.confirmationResolver(confirmed);
      this.confirmationResolver = null;
    }
  }

  stopTask() {
    this.stopRequested = true;
  }
}

module.exports = ActBackend;
