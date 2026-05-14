const { GoogleGenerativeAI } = require("@google/generative-ai");
const screenshot = require("screenshot-desktop");
const { screen } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const storageManager = require("../storage-manager");
const promptManager = require("../prompt-manager");
const supabaseService = require("../supabase-service");

const SYSTEM_PROMPT = `You are a Click Mode assistant. Your role is to guide users through tasks step-by-step by providing clear, atomic instructions.

CRITICAL: You must respond with ONLY valid JSON in the following schema. No additional text, no markdown, no explanations.

OUTPUT SCHEMA:
{
  "steps": [
    {
      "step": 1,
      "instruction": "Clear, specific instruction for the user (e.g., 'Click the Settings button in the top-right corner')",
      "target": "CSS selector for the target element (e.g., '#settings-btn', '.menu-item', 'button.primary') OR null if no specific DOM target can be identified"
    }
  ]
}

GUIDELINES:
1. Break down the task into the smallest possible atomic steps
2. Each step should describe exactly ONE action the user needs to take
3. The "target" field should be a valid CSS selector when possible - this helps the system detect when the user completes the step
4. If no specific DOM element can be identified for a step, use null for target and the instruction should include a manual "Done" confirmation option
5. Steps should be ordered sequentially - the user cannot do step 2 before step 1
6. Be specific in instructions - instead of "Click the button", say "Click the blue 'Submit' button in the form"

Example output:
{
  "steps": [
    {"step": 1, "instruction": "Click the 'New Document' button in the top toolbar", "target": "button.new-doc"},
    {"step": 2, "instruction": "Type 'Quarterly Report' in the document title field", "target": "#doc-title"},
    {"step": 3, "instruction": "Click the 'Save' button to save your document", "target": "#save-btn"}
  ]
}

IMPORTANT: Always respond with valid JSON only. No markdown code blocks, no explanations.`;

const GENERAL_SYSTEM_PROMPT = `You are a Click Mode assistant that guides users through tasks step-by-step.

When asked to help with a task, break it down into clear, atomic steps and respond with ONLY JSON in this schema:
{
  "steps": [
    {"step": 1, "instruction": "...", "target": "CSS selector or null"},
    {"step": 2, "instruction": "...", "target": "CSS selector or null"}
  ]
}

- Each step must be ONE action the user can perform
- "target" is a CSS selector to identify the element, or null if no specific element
- If no specific element can be identified, use null and include a manual "Done" option in the instruction
- Always respond with valid JSON only - no markdown, no explanations`;

class ClickBackend {
  constructor(options = {}) {
    this.screenshotDir = path.join(os.tmpdir(), "control_screenshots");
    if (!fs.existsSync(this.screenshotDir)) fs.mkdirSync(this.screenshotDir);

    this.model = null;
    this.currentApiKey = null;
    this.stopRequested = false;
    this.currentTask = null;
    this.currentSteps = [];
    this.currentStepIndex = 0;
    this.conversationHistory = [];
    this.maxHistoryLength = 20;
    this.currentProvider = 'gemini';
    this.currentSystemPrompt = null;
    this.taskContext = {};
    this.isWaitingForStepCompletion = false;
  }

  setupGeminiAPI(apiKey, model = 'gemini-2.0-flash') {
    try {
      if (!apiKey) {
        console.log('[ClickBackend] No API key provided');
        return;
      }
      this.currentApiKey = apiKey;
      this.currentModel = model;
      this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      });
      console.log('[ClickBackend] Gemini API initialized with model:', model);
    } catch (err) {
      console.error('[ClickBackend] Failed to setup Gemini API:', err);
    }
  }

  async getSystemPrompt() {
    const basePrompt = this.taskContext?.workflowName 
      ? GENERAL_SYSTEM_PROMPT 
      : SYSTEM_PROMPT;
    return basePrompt;
  }

  stopTask() {
    this.stopRequested = true;
    this.currentTask = null;
    this.currentSteps = [];
    this.currentStepIndex = 0;
    this.isWaitingForStepCompletion = false;
    console.log('[ClickBackend] Task stopped');
  }

  async executeTask(taskText, onResponse, onError, onEvent) {
    this.stopRequested = false;
    this.currentTask = taskText;
    this.currentSteps = [];
    this.currentStepIndex = 0;
    this.conversationHistory = [];
    this.isWaitingForStepCompletion = false;

    try {
      if (!this.model) {
        throw new Error('ClickBackend: Model not initialized');
      }

      const systemPrompt = await this.getSystemPrompt();
      
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: `Task: ${taskText}\n\nProvide step-by-step guidance for this task. Respond with only valid JSON.` }]
      });

      const chat = this.model.startChat({
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        history: [],
      });

      const result = await chat.sendMessage(taskText);
      const responseText = result.response.text();

      if (this.stopRequested) {
        onError('Task cancelled');
        return;
      }

      let parsedSteps = this.parseStepsResponse(responseText);
      
      if (!parsedSteps || parsedSteps.length === 0) {
        throw new Error('Failed to parse steps from AI response');
      }

      this.currentSteps = parsedSteps;
      
      onEvent('task_start', { totalSteps: parsedSteps.length, task: taskText });
      
      for (let i = 0; i < parsedSteps.length; i++) {
        if (this.stopRequested) break;
        
        this.currentStepIndex = i;
        const step = parsedSteps[i];
        
        onEvent('step_start', {
          step: step.step,
          instruction: step.instruction,
          target: step.target,
          progress: `${i + 1}/${parsedSteps.length}`
        });

        this.isWaitingForStepCompletion = true;
        
        while (this.isWaitingForStepCompletion && !this.stopRequested) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (this.stopRequested) break;

        onEvent('step_complete', { step: step.step });
      }

      if (!this.stopRequested) {
        onEvent('task_complete', { task: taskText, totalSteps: parsedSteps.length });
      }

    } catch (err) {
      console.error('[ClickBackend] executeTask error:', err);
      onError(err.message || 'Click mode execution failed');
    }
  }

  parseStepsResponse(responseText) {
    try {
      let jsonStr = responseText.trim();
      
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      jsonStr = jsonStr.trim();
      
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.steps && Array.isArray(parsed.steps)) {
        return parsed.steps;
      }
      
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      return null;
    } catch (err) {
      console.error('[ClickBackend] Failed to parse steps:', err);
      console.log('[ClickBackend] Raw response:', responseText);
      return null;
    }
  }

  completeCurrentStep() {
    this.isWaitingForStepCompletion = false;
  }

  getCurrentStep() {
    if (this.currentStepIndex >= this.currentSteps.length) {
      return null;
    }
    return {
      step: this.currentSteps[this.currentStepIndex],
      stepNumber: this.currentStepIndex + 1,
      totalSteps: this.currentSteps.length,
      progress: `${this.currentStepIndex + 1}/${this.currentSteps.length}`,
      percentComplete: Math.round((this.currentStepIndex / this.currentSteps.length) * 100)
    };
  }

  setTaskContext(context = {}) {
    this.taskContext = context;
  }
}

module.exports = ClickBackend;