class SettingsModal {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.settings = {
            theme: 'light',
            layout: 'classic',
            modelProvider: 'gemini',
            voiceActivation: false,
            voiceResponse: false,
            autoSendAfterWakeWord: false,
            windowVisibility: true,
            openAtLogin: false,
            floatingButtonVisible: true,
            pinEnabled: false,
            borderStreakEnabled: true,
            edgeGlowEnabled: true,
            ttsVoice: 'en-US-AriaNeural',
            ttsRate: 1.0,
            ttsVolume: 1.0,
            hotkeys: {
                toggleChat: 'Ctrl+Space',
                stopAction: 'Alt+Z'
            }
        };

        this.init();
    }

    async init() {
        this.setupTabs();
        this.setupProviderCards();
        this.setupLayoutCards();
        this.setupEventListeners();
        this.setupIPCListeners();

        await this.loadUserStatus();
        await this.loadSettings();
        await this.loadTTSVoices();

        this.updateUI();
        this.initializeLucideIcons();
        this.startRemoteStatusPolling();
    }

    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupTabs() {
        const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        const tabTitle = document.getElementById('tabTitle');

        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                if (!tabId) return;

                // Update sidebar
                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Update content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });

                // Update title
                if (tabTitle) {
                    tabTitle.textContent = item.querySelector('.sidebar-label').textContent;
                }
            });
        });
    }

    setupProviderCards() {
        const cards = document.querySelectorAll('.provider-card[data-provider]');
        const configs = document.querySelectorAll('.provider-config');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                const provider = card.getAttribute('data-provider');
                this.settings.modelProvider = provider;

                // Update UI
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                configs.forEach(conf => {
                    conf.classList.remove('active');
                    if (conf.id === `${provider}Config`) {
                        conf.classList.add('active');
                    }
                });

                this.saveSettings();
            });
        });

        // Remote Access Toggles
        document.getElementById('remoteAccessToggle')?.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            document.getElementById('remotePairingSection').style.display = enabled ? 'block' : 'none';
            if (window.settingsAPI && window.settingsAPI.toggleRemoteAccess) {
                await window.settingsAPI.toggleRemoteAccess(enabled);
                this.startRemoteStatusPolling();
            }
        });

        document.getElementById('generatePairingBtn')?.addEventListener('click', async () => {
            const btn = document.getElementById('generatePairingBtn');
            const text = document.getElementById('generateBtnText');
            const loader = document.getElementById('generateBtnLoader');
            const copyBtn = document.getElementById('copyPairingBtn');

            if (window.settingsAPI && window.settingsAPI.getRemotePairingCode) {
                // Set loading state
                btn.disabled = true;
                text.style.display = 'none';
                loader.style.display = 'block';

                try {
                    // Note: We don't try to use require('os') or process here as they crash the renderer
                    const code = await window.settingsAPI.getRemotePairingCode();
                    if (code) {
                        document.getElementById('pairingCodeDisplay').textContent = code;
                        this.showToast('New pairing code generated', 'success');
                        if (copyBtn) copyBtn.style.display = 'block';
                    } else {
                        this.showToast('Failed to generate code', 'error');
                    }
                } catch (err) {
                    console.error('Pairing error:', err);
                    this.showToast('Error generating code', 'error');
                } finally {
                    // Restore state
                    btn.disabled = false;
                    text.style.display = 'block';
                    loader.style.display = 'none';
                }
            }
        });

        document.getElementById('copyPairingBtn')?.addEventListener('click', () => {
            const code = document.getElementById('pairingCodeDisplay').textContent.trim();
            if (code && code !== '---- ----') {
                navigator.clipboard.writeText(code);
                this.showToast('Code copied to clipboard', 'info');
            }
        });
    }

    startRemoteStatusPolling() {
        if (this.remoteStatusInterval) clearInterval(this.remoteStatusInterval);
        this.remoteStatusInterval = setInterval(async () => {
            if (window.settingsAPI && window.settingsAPI.getRemoteStatus) {
                const status = await window.settingsAPI.getRemoteStatus();
                this.updateRemoteUI(status);
            }
        }, 5000);
    }

    updateRemoteUI(status) {
        const indicator = document.getElementById('remoteStatusIndicator');
        const text = document.getElementById('remoteStatusText');
        const pairingCodeDisplay = document.getElementById('pairingCodeDisplay');
        const copyBtn = document.getElementById('copyPairingBtn');

        if (pairingCodeDisplay && status.pairing?.pairing_code && pairingCodeDisplay.textContent === '---- ----') {
            pairingCodeDisplay.textContent = status.pairing.pairing_code;
            if (copyBtn) copyBtn.style.display = 'block';
        }

        if (indicator && text) {
            if (status.streaming) {
                // Actively streaming frames to the web
                indicator.className = 'status-dot online';
                text.textContent = 'Streaming live';
            } else if (status.paired) {
                // Paired and channel is active, ready for control
                indicator.className = 'status-dot online';
                text.textContent = 'Online — Ready for control';
            } else if (status.enabled) {
                // Channel is active, waiting for web to connect/pair
                indicator.className = 'status-dot connecting';
                text.textContent = status.pairing?.pairing_code 
                    ? 'Online — Awaiting pairing' 
                    : 'Connecting...';
            } else {
                indicator.className = 'status-dot offline';
                text.textContent = 'Disconnected';
            }
        }
    }

    setupLayoutCards() {
        const cards = document.querySelectorAll('.layout-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const layout = card.getAttribute('data-layout');
                this.settings.layout = layout;

                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                this.saveSettings();
                this.showToast(`Layout changed to ${layout}`, 'success');
            });
        });
    }

    setupEventListeners() {
        // Theme Select
        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.updateTheme();
            this.saveSettings();
        });

        // Toggles mapping
        const toggleMap = {
            'borderStreakToggle': 'borderStreakEnabled',
            'voiceResponseToggle': 'voiceResponse',
            'voiceToggle': 'voiceActivation',
            'autoSendToggle': 'autoSendAfterWakeWord',
            'pinToggle': 'pinEnabled',
            'proceedWithoutConfirmationToggle': 'proceedWithoutConfirmation',
            'windowVisibilityToggle': 'windowVisibility',
            'autoStartToggle': 'openAtLogin',
            'floatingButtonToggle': 'floatingButtonVisible'
        };

        Object.keys(toggleMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    const key = toggleMap[id];
                    this.settings[key] = e.target.checked;

                    if (id === 'autoStartToggle' && window.settingsAPI) {
                        window.settingsAPI.setAutoStart(e.target.checked);
                    }

                    if (id === 'floatingButtonToggle' && window.settingsAPI) {
                        window.settingsAPI.updateFloatingButton(e.target.checked);
                    }

                    if (id === 'pinToggle' && window.settingsAPI) {
                        window.settingsAPI.enableSecurityPin(e.target.checked);
                    }

                    this.saveSettings();
                });
            }
        });

        // Provider Inputs
        const providerInputs = [
            'geminiApiKey', 'geminiModel', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl',
            'anthropicApiKey', 'anthropicModel', 'openrouterApiKey', 'openrouterModel',
            'ollamaUrl', 'ollamaModel', 'xaiApiKey', 'xaiModel'
        ];

        providerInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                this.settings[id] = e.target.value;
                this.saveSettings();
            });
        });

        // Voice Settings
        document.getElementById('ttsVoiceSelect')?.addEventListener('change', (e) => {
            this.settings.ttsVoice = e.target.value;
            this.saveSettings();
        });

        document.getElementById('ttsRateSlider')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.settings.ttsRate = val;
            document.getElementById('ttsRateValue').textContent = val.toFixed(1);
        });

        document.getElementById('ttsRateSlider')?.addEventListener('change', () => {
            this.saveSettings();
        });

        document.getElementById('testVoiceBtn')?.addEventListener('click', async () => {
            if (window.settingsAPI) {
                await window.settingsAPI.testVoice(this.settings.ttsVoice, this.settings.ttsRate, this.settings.ttsVolume);
            }
        });

        // Action Buttons
        document.getElementById('logoutButton')?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to log out?')) {
                if (window.settingsAPI) await window.settingsAPI.logout();
            }
        });

        document.getElementById('deleteAllDataBtn')?.addEventListener('click', async () => {
            if (confirm('DANGER: This will delete ALL your data, settings, and workflows. This cannot be undone. Proceed?')) {
                if (window.settingsAPI) {
                    const res = await window.settingsAPI.deleteAllData();
                    if (res.success) {
                        this.showToast('All data wiped successfully', 'success');
                        setTimeout(() => window.settingsAPI.restartApp(), 1500);
                    }
                }
            }
        });

        document.getElementById('quitButton')?.addEventListener('click', () => {
            if (window.settingsAPI) window.settingsAPI.quitApp();
        });

        document.getElementById('changePinButton')?.addEventListener('click', () => {
            this.showPinModal('change');
        });

        // Hotkeys
        document.getElementById('editToggleChatBtn')?.addEventListener('click', () => this.recordHotkey('toggleChat'));
        document.getElementById('editStopActionBtn')?.addEventListener('click', () => this.recordHotkey('stopAction'));
        document.getElementById('resetHotkeysBtn')?.addEventListener('click', () => {
            this.settings.hotkeys = { toggleChat: 'Ctrl+Space', stopAction: 'Alt+Z' };
            this.updateHotkeysUI();
            this.saveSettings();
        });

        // PIN Modal
        document.getElementById('pinCancelButton')?.addEventListener('click', () => {
            document.getElementById('pinModal').style.display = 'none';
        });

        document.getElementById('pinConfirmButton')?.addEventListener('click', () => {
            this.handlePinConfirm();
        });

        // Close on blur (click outside)
        window.addEventListener('mousedown', (e) => {
            const win = document.querySelector('.settings-window');
            if (win && !win.contains(e.target)) {
                 if (window.settingsAPI) window.settingsAPI.closeSettings();
            }
        });
    }

    setupIPCListeners() {
        if (window.settingsAPI) {
            window.settingsAPI.onSettingsUpdated((event, settings) => {
                console.log('Settings updated from main:', settings);
                this.settings = { ...this.settings, ...settings };
                this.updateUI();
            });

            window.settingsAPI.onUserChanged((event, user) => {
                console.log('User changed from main:', user);
                this.currentUser = user;
                this.updateUserInfo();
            });
        }
    }

    async loadSettings() {
        if (window.settingsAPI) {
            const saved = await window.settingsAPI.getSettings();
            this.settings = { ...this.settings, ...saved };
        }
        this.updateUI();
    }

    async saveSettings() {
        if (window.settingsAPI) {
            await window.settingsAPI.saveSettings(this.settings);
            this.showToast('Settings saved successfully', 'success');
        }
    }

    async loadUserStatus() {
        if (window.settingsAPI) {
            const res = await window.settingsAPI.getCurrentUser();
            if (res && res.success) {
                this.currentUser = res;
                this.isAuthenticated = true;
            }
        }
    }

    async loadTTSVoices() {
        if (window.settingsAPI) {
            const res = await window.settingsAPI.getTTSVoices();
            if (res.success && res.voices) {
                const select = document.getElementById('ttsVoiceSelect');
                if (select) {
                    select.innerHTML = res.voices.map(v => {
                        const id = typeof v === 'string' ? v : v.id;
                        const name = typeof v === 'string' ? v : v.name;
                        return `<option value="${id}" ${id === this.settings.ttsVoice ? 'selected' : ''}>${name}</option>`;
                    }).join('');
                }
            }
        }
    }

    updateUI() {
        // Update Toggles
        const toggleMap = {
            'borderStreakToggle': 'borderStreakEnabled',
            'voiceResponseToggle': 'voiceResponse',
            'voiceToggle': 'voiceActivation',
            'autoSendToggle': 'autoSendAfterWakeWord',
            'pinToggle': 'pinEnabled',
            'proceedWithoutConfirmationToggle': 'proceedWithoutConfirmation',
            'windowVisibilityToggle': 'windowVisibility',
            'autoStartToggle': 'openAtLogin',
            'floatingButtonToggle': 'floatingButtonVisible'
        };

        Object.keys(toggleMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.checked = !!this.settings[toggleMap[id]];
            }
        });

        // Update Provider Inputs
        const providerInputs = [
            'geminiApiKey', 'geminiModel', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl',
            'anthropicApiKey', 'anthropicModel', 'openrouterApiKey', 'openrouterModel',
            'ollamaUrl', 'ollamaModel', 'xaiApiKey', 'xaiModel'
        ];

        providerInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = this.settings[id] || '';
        });

        // Update Provider Cards
        const provider = this.settings.modelProvider || 'gemini';
        document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('active'));
        const card = document.querySelector(`.provider-card[data-provider="${provider}"]`);
        if (card) {
            card.classList.add('active');
            document.querySelectorAll('.provider-config').forEach(conf => conf.classList.remove('active'));
            const config = document.getElementById(`${provider}Config`);
            if (config) config.classList.add('active');
        }

        // Update Layout Cards
        const layout = this.settings.layout || 'classic';
        const layoutCard = document.querySelector(`.layout-card[data-layout="${layout}"]`);
        if (layoutCard) {
            document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('active'));
            layoutCard.classList.add('active');
        }

        // Voice Slider
        if (document.getElementById('ttsRateSlider')) {
            document.getElementById('ttsRateSlider').value = this.settings.ttsRate || 1.0;
            document.getElementById('ttsRateValue').textContent = (this.settings.ttsRate || 1.0).toFixed(1);
        }

        this.updateTheme();
        this.updateUserInfo();
        this.updateHotkeysUI();

        // Restore Remote Access toggle
        const remoteToggle = document.getElementById('remoteAccessToggle');
        const pairingSection = document.getElementById('remotePairingSection');
        if (remoteToggle && this.settings.remoteAccessEnabled) {
            remoteToggle.checked = true;
            if (pairingSection) pairingSection.style.display = 'block';
        }
    }

    updateTheme() {
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = this.settings.theme;
    }

    updateUserInfo() {
        if (this.currentUser) {
            const nameEl = document.getElementById('userName');
            const emailEl = document.getElementById('userEmail');
            const avatarEl = document.getElementById('userAvatar');

            if (nameEl) nameEl.textContent = this.currentUser.name || 'Control User';
            if (emailEl) emailEl.textContent = this.currentUser.email || 'user@control.ai';
            if (avatarEl) avatarEl.textContent = (this.currentUser.name || 'C').charAt(0).toUpperCase();

            const planBadge = document.querySelector('.plan-badge');
            if (planBadge) planBadge.textContent = (this.currentUser.plan || 'Free Plan').toUpperCase();

            // Usage Limits
            const actUsed = this.currentUser.actUsed || 0;
            const actLimit = this.currentUser.actLimit || 0;
            const askUsed = this.currentUser.askUsed || 0;
            const askLimit = this.currentUser.askLimit || 0;

            if (document.getElementById('actLimitText')) {
                document.getElementById('actLimitText').textContent = `${actUsed} / ${actLimit}`;
            }
            if (document.getElementById('askLimitText')) {
                document.getElementById('askLimitText').textContent = `${askUsed} / ${askLimit}`;
            }

            // Stats
            if (document.getElementById('statTasks')) document.getElementById('statTasks').textContent = actUsed + askUsed;
            if (document.getElementById('statHours')) document.getElementById('statHours').textContent = Math.floor((actUsed + askUsed) * 0.1);
        }
    }

    updateHotkeysUI() {
        if (document.getElementById('toggleChatHotkeyDisplay')) {
            document.getElementById('toggleChatHotkeyDisplay').textContent = this.settings.hotkeys.toggleChat;
        }
        if (document.getElementById('stopActionHotkeyDisplay')) {
            document.getElementById('stopActionHotkeyDisplay').textContent = this.settings.hotkeys.stopAction;
        }
    }

    recordHotkey(type) {
        const modal = document.getElementById('hotkeyModal');
        const display = document.getElementById('hotkeyDisplay');
        const saveBtn = document.getElementById('saveHotkeyBtn');
        const cancelBtn = document.getElementById('cancelHotkeyBtn');
        
        display.textContent = 'Press keys...';
        saveBtn.disabled = true;
        modal.style.display = 'flex';
        
        let currentCombo = '';

        const onKeyDown = (e) => {
            e.preventDefault();
            if (e.key === 'Escape') {
                cleanup();
                return;
            }

            const combo = [];
            if (e.ctrlKey) combo.push('Ctrl');
            if (e.altKey) combo.push('Alt');
            if (e.shiftKey) combo.push('Shift');
            if (e.metaKey) combo.push('Command');

            if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                combo.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
                currentCombo = combo.join('+');
                display.textContent = currentCombo;
                saveBtn.disabled = false;
            }
        };

        const cleanup = () => {
            window.removeEventListener('keydown', onKeyDown);
            modal.style.display = 'none';
        };

        saveBtn.onclick = () => {
            this.settings.hotkeys[type] = currentCombo;
            this.updateHotkeysUI();
            this.saveSettings();
            cleanup();
        };

        cancelBtn.onclick = cleanup;
        window.addEventListener('keydown', onKeyDown);
    }

    showPinModal(mode) {
        const modal = document.getElementById('pinModal');
        const title = document.getElementById('pinTitle');
        const desc = document.getElementById('pinDescription');
        const input = document.getElementById('pinInput');

        this.pinMode = mode;
        input.value = '';
        modal.style.display = 'flex';
        input.focus();

        if (mode === 'change') {
            title.textContent = 'Change Security PIN';
            desc.textContent = 'Enter your current 4-digit PIN first';
            this.pinStep = 1;
        } else {
            title.textContent = 'Set Security PIN';
            desc.textContent = 'Enter a 4-digit code';
            this.pinStep = 1;
        }
    }

    async handlePinConfirm() {
        const input = document.getElementById('pinInput');
        const pin = input.value;
        if (pin.length !== 4) return;

        if (this.pinMode === 'change') {
            if (this.pinStep === 1) {
                this.currentPin = pin;
                this.pinStep = 2;
                input.value = '';
                document.getElementById('pinTitle').textContent = 'New PIN';
                document.getElementById('pinDescription').textContent = 'Enter your new 4-digit PIN';
            } else {
                const res = await window.settingsAPI.changePin(this.currentPin, pin);
                if (res.success) {
                    this.showToast('PIN changed successfully', 'success');
                    document.getElementById('pinModal').style.display = 'none';
                } else {
                    this.showToast(res.message || 'Failed to change PIN', 'error');
                    this.showPinModal('change');
                }
            }
        } else {
            const res = await window.settingsAPI.setSecurityPin(pin);
            if (res.success) {
                this.showToast('PIN set successfully', 'success');
                document.getElementById('pinModal').style.display = 'none';
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsModalInstance = new SettingsModal();
});
