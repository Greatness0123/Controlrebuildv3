const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

class ElectronBrowserManager {
    constructor() {
        this.browserWindow = null;
        this.isVisible = false;
        this.defaultUrl = 'https://www.google.com';
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

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        await win.loadURL(url);
        await this.injectBanner();
        return { success: true, url: win.webContents.getURL() };
    }

async executeJs(script) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        console.log('[ElectronBrowserManager] Executing JS');
        const result = await this.browserWindow.webContents.executeJavaScript(script);
        return result;
    }

    async scrapePage(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        console.log('[ElectronBrowserManager] Scraping page with selector:', selector);
        const scrapeScript = `
            (function() {
                const results = [];
                const elements = document.querySelectorAll('${selector}');
                elements.forEach(function(el) {
                    results.push({
                        tag: el.tagName.toLowerCase(),
                        text: el.textContent ? el.textContent.trim() : '',
                        html: el.innerHTML ? el.innerHTML.trim().substring(0, 500) : '',
                        href: el.href || el.getAttribute('href') || '',
                        src: el.src || el.getAttribute('src') || '',
                        id: el.id || '',
                        className: el.className || '',
                        rect: el.getBoundingClientRect ? {
                            x: el.getBoundingClientRect().x,
                            y: el.getBoundingClientRect().y,
                            width: el.getBoundingClientRect().width,
                            height: el.getBoundingClientRect().height
                        } : null
                    });
                });
                return results;
            })();
        `;
        const result = await this.browserWindow.webContents.executeJavaScript(scrapeScript);
        return result;
    }

    async scrapeText(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const scrapeScript = `
            (function() {
                const elements = document.querySelectorAll('${selector}');
                const texts = [];
                elements.forEach(function(el) {
                    texts.push(el.textContent.trim());
                });
                return texts;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(scrapeScript);
    }

    async scrapeLinks() {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const scrapeScript = `
            (function() {
                const links = [];
                document.querySelectorAll('a').forEach(function(link) {
                    if (link.href && link.href.startsWith('http')) {
                        links.push({
                            text: link.textContent.trim(),
                            href: link.href,
                            title: link.title || ''
                        });
                    }
                });
                return links;
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(scrapeScript);
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
        const clickScript = `
            (function() {
                const el = document.querySelector('${selector}');
                if (el) {
                    el.click();
                    return {success: true, message: 'Clicked ' + selector};
                }
                return {success: false, message: 'Element not found: ' + selector};
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(clickScript);
    }

    async typeInto(selector, text) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const typeScript = `
            (function() {
                const el = document.querySelector('${selector}');
                if (el) {
                    el.value = '${text}';
                    el.dispatchEvent(new Event('input', {bubbles: true}));
                    el.dispatchEvent(new Event('change', {bubbles: true}));
                    return {success: true, message: 'Typed into ' + selector};
                }
                return {success: false, message: 'Element not found: ' + selector};
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(typeScript);
    }

    async scrollTo(selector) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const scrollScript = `
            (function() {
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
            })();
        `;
        return await this.browserWindow.webContents.executeJavaScript(scrollScript);
    }

    async getElementAtPosition(x, y) {
        if (!this.browserWindow || this.browserWindow.isDestroyed()) {
            throw new Error('Browser not open');
        }
        const script = `
            (function() {
                const el = document.elementFromPoint(${x}, ${y});
                if (el) {
                    return {
                        tag: el.tagName.toLowerCase(),
                        text: el.textContent.trim().substring(0, 100),
                        id: el.id,
                        className: el.className,
                        href: el.href || '',
                        rect: el.getBoundingClientRect ? {
                            x: el.getBoundingClientRect().x,
                            y: el.getBoundingClientRect().y,
                            width: el.getBoundingClientRect().width,
                            height: el.getBoundingClientRect().height
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
        const nativeImage = await this.browserWindow.webContents.capturePage();
        return nativeImage.toPNG();
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
        return {
            success: true,
            url: this.browserWindow.webContents.getURL(),
            title: this.browserWindow.getTitle(),
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

        const bannerJS = `
            (function() {
                if (document.getElementById('control-agent-banner')) return;

                const style = document.createElement('style');
                style.textContent = \`
                    @keyframes banner-pulse {
                        0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4); }
                        50% { transform: translateX(-50%) scale(1.02); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6); }
                    }
                \`;
                document.head.appendChild(style);

                const banner = document.createElement('div');
                banner.id = 'control-agent-banner';
                banner.style.cssText = 'position: fixed; top: 15px; left: 50%; transform: translateX(-50%); background: rgba(124, 58, 237, 0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: white; padding: 6px 16px; font-size: 11px; font-weight: 800; border-radius: 30px; border: 1px solid rgba(255,255,255,0.3); z-index: 2147483647; pointer-events: none; letter-spacing: 1.2px; text-transform: uppercase; animation: banner-pulse 2s ease-in-out infinite; font-family: sans-serif;';
                banner.textContent = 'Control is using this browser';
                document.body.appendChild(banner);
            })();
        `;

        try {
            await this.browserWindow.webContents.executeJavaScript(bannerJS);
        } catch (e) {
            console.error('Failed to inject banner:', e);
        }
    }

    /**
     * Close and cleanup the browser window
     */
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
