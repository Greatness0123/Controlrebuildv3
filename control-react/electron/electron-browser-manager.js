const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class ElectronBrowserManager {
    constructor() {
        this.browserWindow = null;
        this.isVisible = false;
        this.defaultUrl = 'https://www.google.com';
    }

    logActivity(message) {
        if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            try {
                this.browserWindow.webContents.executeJavaScript(
                    `if (window.__controlUpdateActivity) window.__controlUpdateActivity('${message.replace(/'/g, "\\'")}')`
                );
            } catch (e) {}
        }
    }

    async ensureBrowser() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            console.log('[ElectronBrowserManager] Launching browser window...');
            this.browserWindow = new BrowserWindow({
                width: 1280,
                height: 800,
                show: false,
                title: 'Control Agentic Browser',
                backgroundColor: '#1a1a2e',
                center: true,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: false,
                    webviewTag: true,
                    allowRunningInsecureContent: true,
                    enableRemoteModule: false,
                    spellcheck: true,
                    defaultFontFamily: 'Arial'
                }
            });

            // Wait for page to finish loading before showing
            this.browserWindow.webContents.once('did-finish-load', () => {
                console.log('[ElectronBrowserManager] Page loaded, showing window');
                this.browserWindow.show();
                this.injectBanner();
            });

            this.isVisible = true;

            // Load default URL
            await this.browserWindow.loadURL(this.defaultUrl);

            this.browserWindow.on('closed', () => {
                console.log('[ElectronBrowserManager] Browser window closed');
                this.browserWindow = null;
                this.isVisible = false;
            });
        }
        return this.browserWindow;
    }

    async open(url) {
        const win = await this.ensureBrowser();
        console.log(`[ElectronBrowserManager] Navigating to: ${url}`);
        this.logActivity('Navigating to: ' + url.substring(0, 40));

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        await win.loadURL(url);
        await this.injectBanner();
        this.logActivity('Page loaded');
        return { success: true, url: win.webContents.getURL() };
    }

async executeJs(script) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        console.log('[ElectronBrowserManager] Executing JS');
        this.logActivity('Executing JavaScript');
        try {
            const result = await this.browserWindow.webContents.executeJavaScript(script);
            this.logActivity('JS executed successfully');
            return result;
        } catch (e) {
            this.logActivity('JS error: ' + e.message.substring(0, 50));
            throw e;
        }
    }

    async scrapePage(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        console.log('[ElectronBrowserManager] Scraping page with selector:', selector);
        this.logActivity('Scraping: ' + selector);
        const scrapeScript = `
            (function() {
                try {
                    const results = [];
                    const elements = document.querySelectorAll('${selector}');
                    elements.forEach(function(el) {
                        const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                        results.push({
                            tag: el.tagName ? el.tagName.toLowerCase() : 'unknown',
                            text: el.textContent ? el.textContent.trim().substring(0, 200) : '',
                            html: el.innerHTML ? el.innerHTML.trim().substring(0, 500) : '',
                            href: el.href || el.getAttribute('href') || '',
                            src: el.src || el.getAttribute('src') || '',
                            id: el.id || '',
                            className: el.className || '',
                            rect: rect ? {
                                x: Math.round(rect.x),
                                y: Math.round(rect.y),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                centerX: Math.round(rect.x + rect.width / 2),
                                centerY: Math.round(rect.y + rect.height / 2)
                            } : null
                        });
                    });
                    return { success: true, results: results, count: results.length };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            })();
        `;
        const result = await this.browserWindow.webContents.executeJavaScript(scrapeScript);
        if (result.success) {
            this.logActivity('Found ' + result.count + ' elements');
        }
        return result;
    }

    async scrapeText(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Extracting text from: ' + selector);
        const scrapeScript = `
            (function() {
                try {
                    const elements = document.querySelectorAll('${selector}');
                    const texts = [];
                    elements.forEach(function(el) {
                        const text = el.textContent ? el.textContent.trim() : '';
                        if (text) texts.push(text);
                    });
                    return { success: true, texts: texts, count: texts.length };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            })();
        `;
        const result = await this.browserWindow.webContents.executeJavaScript(scrapeScript);
        if (result.success) {
            this.logActivity('Extracted ' + result.count + ' text items');
        }
        return result;
    }

    async scrapeLinks() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Scraping all links');
        const scrapeScript = `
            (function() {
                try {
                    const links = [];
                    document.querySelectorAll('a').forEach(function(link) {
                        if (link.href && link.href.startsWith('http')) {
                            const rect = link.getBoundingClientRect ? link.getBoundingClientRect() : null;
                            links.push({
                                text: link.textContent.trim().substring(0, 100),
                                href: link.href,
                                title: link.title || '',
                                rect: rect ? {
                                    x: Math.round(rect.x),
                                    y: Math.round(rect.y),
                                    width: Math.round(rect.width),
                                    height: Math.round(rect.height),
                                    centerX: Math.round(rect.x + rect.width / 2),
                                    centerY: Math.round(rect.y + rect.height / 2)
                                } : null
                            });
                        }
                    });
                    return { success: true, links: links, count: links.length };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            })();
        `;
        const result = await this.browserWindow.webContents.executeJavaScript(scrapeScript);
        if (result.success) {
            this.logActivity('Found ' + result.count + ' links');
        }
        return result;
    }

    async scrapeAllText() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const scrapeScript = `
            (function() {
                const result = {
                    title: document.title,
                    url: window.location.href,
                    headings: [],
                    paragraphs: [],
                    links: [],
                    images: [],
                    meta: []
                };
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(h) {
                    result.headings.push(h.textContent.trim());
                });
                document.querySelectorAll('p').forEach(function(p) {
                    if (p.textContent.trim().length > 0) {
                        result.paragraphs.push(p.textContent.trim());
                    }
                });
                document.querySelectorAll('a').forEach(function(link) {
                    if (link.href) result.links.push({text: link.textContent.trim(), href: link.href});
                });
                document.querySelectorAll('img').forEach(function(img) {
                    if (img.src) result.images.push({alt: img.alt, src: img.src});
                });
                document.querySelectorAll('meta').forEach(function(m) {
                    if (m.name || m.property) result.meta.push({name: m.name, property: m.property, content: m.content});
                });
                return result;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(scrapeScript);
    }

    async getClickableElements() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const script = `
            (function() {
                const elements = [];
                const selectors = ['button', 'a', 'input[type="submit"]', 'input[type="button"]', '[role="button"]', '.btn', '.button', '[onclick]'];
                selectors.forEach(function(sel) {
                    document.querySelectorAll(sel).forEach(function(el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            elements.push({
                                tag: el.tagName.toLowerCase(),
                                text: el.textContent.trim(),
                                selector: el.id ? '#' + el.id : (el.className ? '.' + el.className.split(' ').join('.') : el.tagName.toLowerCase()),
                                href: el.href || '',
                                type: el.type || '',
                                rect: {x: rect.x + rect.width/2, y: rect.y + rect.height/2, width: rect.width, height: rect.height}
                            });
                        }
                    });
                });
                return elements;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async clickElement(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Clicking: ' + selector);
        const clickScript = `
            (function() {
                try {
                    const el = document.querySelector('${selector}');
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        el.click();
                        return {
                            success: true,
                            message: 'Clicked ' + el.tagName + ' at (' + Math.round(rect.x + rect.width/2) + ', ' + Math.round(rect.y + rect.height/2) + ')'
                        };
                    }
                    return {success: false, message: 'Element not found: ' + selector};
                } catch (e) {
                    return {success: false, error: e.message};
                }
            })();
        `;
        const result = await this.browserWindow.webContents.executeJavaScript(clickScript);
        if (result.success) {
            this.logActivity('Click successful');
        } else {
            this.logActivity('Click failed: ' + result.message);
        }
        return result;
    }

async typeInto(selector, text) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Typing: ' + text.substring(0, 30) + (text.length > 30 ? '...' : ''));

        const safeText = text.replace(/'/g, "\\'").replace(/\\/g, "\\\\");
        const typeScript = `
            (function() {
                try {
                    const el = document.querySelector('${selector}');
                    if (!el) return {success: false, message: 'Element not found: ' + selector};

                    el.focus();
                    el.value = '${safeText}';
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                    el.dispatchEvent(new Event('change', {bubbles:true}));

                    return {success: true, message: 'Typed: ' + el.value.substring(0, 50)};
                } catch (e) {
                    return {success: false, error: e.message};
                }
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(typeScript);
    }

    async pressEnter() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Pressing Enter');
        const script = `
            (function() {
                try {
                    const active = document.activeElement;
                    if (active) {
                        const evt = new KeyboardEvent('keydown', {key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true});
                        active.dispatchEvent(evt);
                        const evt2 = new KeyboardEvent('keypress', {key:'Enter', keyCode:13, which:13, bubbles:true});
                        active.dispatchEvent(evt2);
                        active.dispatchEvent(new KeyboardEvent('keyup', {key:'Enter', keyCode:13, which:13, bubbles:true}));
                        return {success: true, message: 'Enter pressed'};
                    }
                    return {success: false, message: 'No active element'};
                } catch (e) {
                    return {success: false, error: e.message};
                }
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async submitForm(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Submitting form');
        const script = `
            (function() {
                try {
                    const form = document.querySelector('${selector}');
                    if (form) {
                        form.submit();
                        return {success: true, message: 'Form submitted'};
                    }
                    const input = document.querySelector('[name="q"]') || document.querySelector('input[type="search"]') || document.querySelector('textarea[name="q"]');
                    if (input && input.form) {
                        input.form.submit();
                        return {success: true, message: 'Form submitted via input'};
                    }
                    const evt = new KeyboardEvent('keydown', {key:'Enter', code:'Enter', keyCode:13, bubbles:true});
                    document.activeElement.dispatchEvent(evt);
                    return {success: true, message: 'Enter key sent'};
                } catch (e) {
                    return {success: false, error: e.message};
                }
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async getBrowserState() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            return {success: false, error: 'Browser not open'};
        }
        const script = `
            (function() {
                const el = document.activeElement;
                let activeInfo = 'none';
                if (el) {
                    activeInfo = el.tagName + (el.name ? '[name='+el.name+']' : '') + (el.id ? '#'+el.id : '');
                }
                return {
                    url: window.location.href,
                    title: document.title,
                    activeElement: activeInfo,
                    readyState: document.readyState
                };
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async scrollTo(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Scrolling to: ' + selector);
        const scrollScript = `
            (function() {
                try {
                    const el = document.querySelector('${selector}');
                    if (el) {
                        el.scrollIntoView({behavior: 'smooth', block: 'center'});
                        return {success: true};
                    }
                    const match = '${selector}'.match(/\\d+/);
                    if (match) {
                        window.scrollTo(0, parseInt(match[0]));
                        return {success: true};
                    }
                    return {success: false, message: 'Element not found: ' + selector};
                } catch (e) {
                    return {success: false, error: e.message};
                }
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(scrollScript);
    }

    async getElementAtPosition(x, y) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Getting element at: (' + x + ', ' + y + ')');
        const script = `
            (function() {
                const el = document.elementFromPoint(${x}, ${y});
                if (el) {
                    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                    return {
                        tag: el.tagName ? el.tagName.toLowerCase() : 'unknown',
                        text: el.textContent ? el.textContent.trim().substring(0, 100) : '',
                        id: el.id || '',
                        className: el.className || '',
                        href: el.href || '',
                        rect: rect ? {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            centerX: Math.round(rect.x + rect.width / 2),
                            centerY: Math.round(rect.y + rect.height / 2)
                        } : null
                    };
                }
                return null;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async querySelector(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        this.logActivity('Querying: ' + selector);
        const script = `
            (function() {
                const el = document.querySelector('${selector}');
                if (el) {
                    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                    return {
                        tag: el.tagName ? el.tagName.toLowerCase() : 'unknown',
                        text: el.textContent ? el.textContent.trim().substring(0, 100) : '',
                        id: el.id || '',
                        className: el.className || '',
                        href: el.href || '',
                        src: el.src || '',
                        value: el.value || '',
                        rect: rect ? {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            centerX: Math.round(rect.x + rect.width / 2),
                            centerY: Math.round(rect.y + rect.height / 2)
                        } : null
                    };
                }
                return null;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async takeScreenshot() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        console.log('[ElectronBrowserManager] Taking screenshot via capturePage');
        this.logActivity('Capturing screenshot');
        try {
            const nativeImage = await this.browserWindow.webContents.capturePage();
            this.logActivity('Screenshot captured');
            return nativeImage.toPNG();
        } catch (e) {
            this.logActivity('Screenshot failed');
            throw e;
        }
    }

    async close() {
        if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            console.log('[ElectronBrowserManager] Closing browser');
            this.browserWindow.close();
            this.browserWindow = null;
            this.isVisible = false;
        }
    }

async getStatus() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            return { success: false, message: 'Browser not open' };
        }
        const url = this.browserWindow.webContents.getURL();
        const title = this.browserWindow.getTitle();
        return {
            success: true,
            url: url,
            title: title,
            isVisible: this.isVisible
        };
    }

    async verifyElementPosition(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const verifyScript = `
            (function() {
                const results = [];
                const run = ${3};
                for (let i = 0; i < run; i++) {
                    const el = document.querySelector('${selector}');
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        results.push({
                            run: i + 1,
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            centerX: rect.x + rect.width / 2,
                            centerY: rect.y + rect.height / 2,
                            effectiveArea: rect.width * rect.height,
                            visible: rect.width > 0 && rect.height > 0
                        });
                    } else {
                        results.push({ run: i + 1, error: 'Element not found' });
                    }
                }
                return results;
            })();
        `;
        const results = await this.browserWindow.webContents.executeJavaScript(verifyScript);

        const validResults = results.filter(r => !r.error && r.visible);
        if (validResults.length === 0) {
            return { verified: false, message: 'Element not found after 3 attempts', raw: results };
        }

        const xCoords = validResults.map(r => r.centerX);
        const yCoords = validResults.map(r => r.centerY);

        const avgX = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
        const avgY = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;

        const tolerance = 10;
        const xMatches = xCoords.every(x => Math.abs(x - avgX) <= tolerance);
        const yMatches = yCoords.every(y => Math.abs(y - avgY) <= tolerance);

        if (xMatches && yMatches) {
            return {
                verified: true,
                converged: true,
                centerX: Math.round(avgX),
                centerY: Math.round(avgY),
                confidence: 'high',
                runs: results.length,
                raw: results
            };
        }

        const medianX = xCoords.slice().sort((a, b) => a - b)[Math.floor(xCoords.length / 2)];
        const medianY = yCoords.slice().sort((a, b) => a - b)[Math.floor(yCoords.length / 2)];

        return {
            verified: true,
            converged: false,
            centerX: Math.round(medianX),
            centerY: Math.round(medianY),
            confidence: 'medium',
            runs: results.length,
            note: 'Used median due to coordinate variance',
            raw: results
        };
    }

    async verifyCoordinates(selector, requiredAttempts = 3) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const verifyScript = `
            (function() {
                const results = [];
                const el = document.querySelector('${selector}');
                if (!el) {
                    return [{run: 1, error: 'Element not found', x: null, y: null}];
                }
                const rect = el.getBoundingClientRect();
                return [{
                    run: 1,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    centerX: rect.x + rect.width / 2,
                    centerY: rect.y + rect.height / 2,
                    viewTop: window.scrollY,
                    viewLeft: window.scrollX,
                    clientWidth: document.documentElement.clientWidth,
                    clientHeight: document.documentElement.clientHeight
                }];
            })();
        `;

        let allResults = [];
        const attempts = Math.max(1, Math.min(5, requiredAttempts));

        for (let i = 0; i < attempts; i++) {
            try {
                const result = await this.browserWindow.webContents.executeJavaScript(verifyScript);
                allResults.push(...result);
                await new Promise(r => setTimeout(r, 100));
            } catch (e) {
                allResults.push({ run: i + 1, error: e.message });
            }
        }

        const valid = allResults.filter(r => r.error === undefined && r.x !== null);
        if (valid.length === 0) {
            return { success: false, error: 'Element not found', attempts: attempts, results: allResults };
        }

        const xVals = valid.map(r => r.centerX);
        const yVals = valid.map(r => r.centerY);

        const meanX = xVals.reduce((a, b) => a + b, 0) / xVals.length;
        const meanY = yVals.reduce((a, b) => a + b, 0) / yVals.length;

        const varianceX = xVals.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0) / xVals.length;
        const varianceY = yVals.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0) / yVals.length;

        const stdDevX = Math.sqrt(varianceX);
        const stdDevY = Math.sqrt(varianceY);

        const converged = stdDevX < 5 && stdDevY < 5;

        return {
            success: true,
            converged: converged,
            centerX: Math.round(meanX),
            centerY: Math.round(meanY),
            stdDevX: Math.round(stdDevX * 100) / 100,
            stdDevY: Math.round(stdDevY * 100) / 100,
            attempts: attempts,
            validRuns: valid.length,
            matches: converged,
            confidence: converged ? 'high' : (stdDevX < 15 && stdDevY < 15 ? 'medium' : 'low'),
            meta: valid[0],
            results: allResults
        };
    }

    async getVerifiedElement(selector) {
        const result = await this.verifyCoordinates(selector, 3);
        if (!result.success) {
            return result;
        }

        const clickableScript = `
            (function() {
                const el = document.querySelector('${selector}');
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    className: el.className,
                    text: el.textContent.trim().substring(0, 100),
                    centerX: rect.x + rect.width / 2,
                    centerY: rect.y + rect.height / 2,
                    clickable: (rect.width > 5 && rect.height > 5)
                };
            })();
        `;

        const elementInfo = await this.browserWindow.webContents.executeJavaScript(clickableScript);

        return {
            ...result,
            element: elementInfo
        };
    }

    async navigateViaJs(url) {
        const win = await this.ensureBrowser();
        console.log('[ElectronBrowserManager] Navigating via JS to:', url);

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        const navScript = `window.location.href = '${url}';`;
        await win.webContents.executeJavaScript(navScript);

        await new Promise(r => setTimeout(r, 1500));

        await this.injectBanner();
        return { success: true, url: win.webContents.getURL() };
    }

    async waitForSelector(selector, timeout = 10000) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const waitScript = `
            (function() {
                const startTime = Date.now();
                const timeout = ${timeout};
                return new Promise(function(resolve) {
                    function check() {
                        const el = document.querySelector('${selector}');
                        if (el) {
                            resolve({found: true, tag: el.tagName.toLowerCase()});
                        } else if (Date.now() - startTime > timeout) {
                            resolve({found: false, message: 'Timeout waiting for ' + '${selector}'});
                        } else {
                            setTimeout(check, 100);
                        }
                    }
                    check();
                });
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(waitScript);
    }

    async extractFormFields() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const script = `
            (function() {
                const forms = [];
                document.querySelectorAll('form').forEach(function(form) {
                    const fields = [];
                    form.querySelectorAll('input, textarea, select').forEach(function(field) {
                        fields.push({
                            name: field.name || '',
                            id: field.id || '',
                            type: field.type || 'text',
                            tag: field.tagName.toLowerCase(),
                            value: field.value || '',
                            placeholder: field.placeholder || '',
                            required: field.required || false
                        });
                    });
                    if (fields.length > 0) {
                        forms.push({
                            action: form.action,
                            method: form.method,
                            id: form.id,
                            fields: fields
                        });
                    }
                });
                return forms;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

    async evaluateXPath(xpath) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const script = `
            (function() {
                const result = [];
                const xpathResult = document.evaluate('${xpath}', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                for (let i = 0; i < xpathResult.snapshotLength; i++) {
                    const node = xpathResult.snapshotItem(i);
                    result.push({
                        tag: node.tagName ? node.tagName.toLowerCase() : node.nodeName,
                        text: node.textContent ? node.textContent.trim().substring(0, 200) : '',
                        href: node.href || '',
                        src: node.src || ''
                    });
                }
                return result;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(script);
    }

async injectBanner() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) return;
        try {
            const bannerCode = `
                (function() {
                    if (document.getElementById('control-agent-banner')) return;
                    var banner = document.createElement('div');
                    banner.id = 'control-agent-banner';
                    banner.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;gap:6px;';
                    var pill = document.createElement('div');
                    pill.id = 'control-status-pill';
                    pill.textContent = 'Control Active';
                    pill.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);backdrop-filter:blur(12px);border:1px solid rgba(99,102,241,0.4);border-radius:24px;padding:8px 20px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 4px 20px rgba(99,102,241,0.3);';
                    var log = document.createElement('div');
                    log.id = 'control-activity-log';
                    log.style.cssText = 'background:rgba(0,0,0,0.7);border-radius:8px;padding:6px 12px;font-size:11px;color:rgba(255,255,255,0.8);max-width:400px;';
                    banner.appendChild(pill);
                    banner.appendChild(log);
                    document.body.appendChild(banner);
                    window.__controlUpdateActivity = function(msg) { log.textContent = msg; };
                })();
            `;
            await this.browserWindow.webContents.executeJavaScript(bannerCode);
        } catch (e) {
            console.log('[ElectronBrowserManager] Banner inject failed:', e.message);
        }
    }

    close() {
        if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            console.log('[ElectronBrowserManager] Closing browser window');
            this.browserWindow.close();
            this.browserWindow = null;
            this.isVisible = false;
        }
    }
}

module.exports = new ElectronBrowserManager();
