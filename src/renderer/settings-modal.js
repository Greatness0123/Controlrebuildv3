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

        this.editingSkillOriginalName = null;

        this.init();
    }

    isInPageModalOpen() {
        return ['skillEditModal', 'pinModal', 'hotkeyModal'].some((id) => {
            const el = document.getElementById(id);
            return el && el.style.display === 'flex';
        });
    }

    setupSkillEditor() {
        const modal = document.getElementById('skillEditModal');
        document.getElementById('skillEditCancelBtn')?.addEventListener('click', () => this.closeSkillEditor());
        document.getElementById('skillEditSaveBtn')?.addEventListener('click', () => this.saveSkillFromModal());
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.closeSkillEditor();
        });
        modal?.querySelector('.modal-content')?.addEventListener('click', (e) => e.stopPropagation());
    }

    openSkillEditor(skill) {
        this.editingSkillOriginalName = skill.name;
        const nameEl = document.getElementById('skillNameInput');
        const descEl = document.getElementById('skillDescInput');
        const patEl = document.getElementById('skillPatternInput');
        const modal = document.getElementById('skillEditModal');
        if (!nameEl || !descEl || !patEl || !modal) return;
        nameEl.value = skill.name || '';
        descEl.value = skill.description || '';
        patEl.value = skill.pattern || '';
        modal.style.display = 'flex';
        if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(true);
        nameEl.focus();
    }

    closeSkillEditor() {
        this.editingSkillOriginalName = null;
        const modal = document.getElementById('skillEditModal');
        if (modal) modal.style.display = 'none';
        if (!this.isInPageModalOpen() && window.settingsAPI?.setModalActive) {
            window.settingsAPI.setModalActive(false);
        }
    }

    async saveSkillFromModal() {
        const name = document.getElementById('skillNameInput')?.value.trim() || '';
        const description = document.getElementById('skillDescInput')?.value.trim() || '';
        const pattern = document.getElementById('skillPatternInput')?.value ?? '';
        if (!this.editingSkillOriginalName) return;
        if (!name) {
            this.showToast('Skill name is required', 'error');
            return;
        }
        if (!window.settingsAPI?.updateSkill) return;
        const res = await window.settingsAPI.updateSkill({
            originalName: this.editingSkillOriginalName,
            name,
            description,
            pattern
        });
        if (res?.success) {
            this.showToast('Skill saved', 'success');
            this.closeSkillEditor();
            await this.loadSkillsList();
        } else {
            this.showToast(res?.error || 'Could not save skill', 'error');
        }
    }

    async init() {
        this.setupTabs();
        this.setupProviderCards();
        this.setupLayoutCards();
        this.setupEventListeners();
        this.setupSkillEditor();
        this.setupIPCListeners();

        await this.loadUserStatus();
        await this.loadSettings();
        await this.loadTTSVoices();
        if (this.loadSkillsList) await this.loadSkillsList();

        this.updateUI();
        this.initializeLucideIcons();
        this.startRemoteStatusPolling();
    }

    initializeLucideIcons() {

    }

    setupTabs() {
        const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');
        const tabTitle = document.getElementById('tabTitle');

        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                if (!tabId) return;

                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });

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
            const textEl = document.getElementById('generateBtnText');
            const loader = document.getElementById('generateBtnLoader');
            const codeDisplay = document.getElementById('pairingCodeDisplay');
            const currentCode = codeDisplay.textContent.trim();
            const hasCode = currentCode && currentCode !== '---- ----';

            if (hasCode) {
                const confirm = await window.settingsAPI?.showConfirmModal({
                    title: 'Regenerate Pairing Code?',
                    message: 'Proceeding will permanently invalidate all existing pairings and disconnect any active remote sessions. This action cannot be undone.',
                    confirmText: 'Invalidate & Regenerate',
                    cancelText: 'Keep Current',
                    type: 'warning'
                }) || (hasCode ? false : true); // If modal fails, only proceed if we don't have a code

                if (confirm === false) return;
            }

            if (window.settingsAPI && window.settingsAPI.getRemotePairingCode) {
                btn.disabled = true;
                textEl.style.display = 'none';
                loader.style.display = 'block';

                try {

                    const code = await window.settingsAPI.getRemotePairingCode(null, hasCode);
                    if (code) {
                        codeDisplay.textContent = code;
                        textEl.textContent = 'Regenerate';
                        this.showToast(hasCode ? 'Old pairings revoked. New code generated.' : 'Pairing code generated', 'success');
                        const copyBtn = document.getElementById('copyPairingBtn');
                        if (copyBtn) copyBtn.style.display = 'block';
                    }
                } catch (err) {
                    console.error('Pairing error:', err);
                    this.showToast('Error managing pairing', 'error');
                } finally {
                    btn.disabled = false;
                    textEl.style.display = 'block';
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
        }, 2000);
    }

    updateRemoteUI(status) {
        const indicator = document.getElementById('remoteStatusIndicator');
        const headerIndicator = document.getElementById('remoteHeaderIndicator');
        const badgeText = document.getElementById('remoteBadgeText');
        const text = document.getElementById('remoteStatusText');
        const pairingCodeDisplay = document.getElementById('pairingCodeDisplay');
        const copyBtn = document.getElementById('copyPairingBtn');

        if (pairingCodeDisplay && status.pairing?.pairing_code) {
            const currentCode = pairingCodeDisplay.textContent.trim();
            if (currentCode !== status.pairing.pairing_code) {
                pairingCodeDisplay.textContent = status.pairing.pairing_code;
                if (copyBtn) copyBtn.style.display = 'block';

                const generateBtnText = document.getElementById('generateBtnText');
                if (generateBtnText) generateBtnText.textContent = 'Regenerate';
            }
        }

        const updateStatus = (dotClass, statusText, badgeLabel, badgeStyle = {}) => {
            if (indicator) indicator.className = `status-dot ${dotClass}`;
            if (headerIndicator) headerIndicator.className = `status-dot ${dotClass}`;
            if (text) text.textContent = statusText;
            if (badgeText) {
                badgeText.textContent = badgeLabel;
                badgeText.style.background = badgeStyle.bg || 'var(--bg-tertiary)';
                badgeText.style.color = badgeStyle.color || 'var(--text-secondary)';
            }
        };

        if (status.streaming) {
            updateStatus('online', 'Streaming live', 'Live', { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' });
        } else if (status.paired) {
            updateStatus('online', 'Online — Ready for control', 'Ready', { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' });
        } else if (status.enabled) {
            const label = status.pairing?.pairing_code ? 'Linking' : 'Standby';
            const text = status.pairing?.pairing_code ? 'Online — Awaiting pairing' : 'Active — Ready for pairing';
            updateStatus('connecting', text, label, { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' });
        } else if (status.toggleOn) {
            updateStatus('connecting', 'Searching for network...', 'Searching', { bg: 'rgba(245, 158, 11, 0.1)', color: '#94a3b8' });
        } else {
            updateStatus('offline', 'Remote Access Disabled', 'Off');
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

        document.getElementById('themeSelect')?.addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.updateTheme();
            this.saveSettings();
        });

        const toggleMap = {
            'borderStreakToggle': 'borderStreakEnabled',
            'voiceResponseToggle': 'voiceResponse',
            'voiceToggle': 'voiceActivation',
            'autoSendToggle': 'autoSendAfterWakeWord',
            'pinToggle': 'pinEnabled',
            'proceedWithoutConfirmationToggle': 'proceedWithoutConfirmation',
            'windowVisibilityToggle': 'windowVisibility',
            'autoStartToggle': 'openAtLogin',
            'floatingButtonToggle': 'floatingButtonVisible',
            'remoteAccessToggle': 'remoteAccessEnabled'
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

                    if (id === 'remoteAccessToggle' && window.settingsAPI) {
                        window.settingsAPI.toggleRemoteAccess(e.target.checked);
                    }

                    this.saveSettings();
                });
            }
        });

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

        document.getElementById('logoutButton')?.addEventListener('click', async () => {
            const confirmed = await window.settingsAPI?.showConfirmModal({
                title: 'Log Out',
                message: 'Are you sure you want to log out? Your local session will be cleared.',
                confirmText: 'Log Out',
                cancelText: 'Stay Logged In',
                type: 'warning'
            });
            if (confirmed) {
                if (window.settingsAPI) await window.settingsAPI.logout();
            }
        });

document.getElementById('deleteAllDataBtn')?.addEventListener('click', async () => {
            const confirmed = await window.settingsAPI?.showConfirmModal({
                title: 'Delete All Data?',
                message: 'DANGER: This will permanently delete ALL your local settings, sessions, and workflows. This action CANNOT be undone.',
                confirmText: 'Delete Everything',
                cancelText: 'Cancel',
                type: 'error'
            });
            if (confirmed) {
                if (window.settingsAPI) {
                    const res = await window.settingsAPI.deleteAllData();
                    if (res.success) {
                        this.showToast('All data wiped successfully', 'success');
                        setTimeout(() => window.settingsAPI.restartApp(), 1500);
                    }
                }
            }
        });

        // Close settings button (X in header)
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
            if (window.settingsAPI) {
                window.settingsAPI.closeSettings();
            }
        });

        document.getElementById('uploadSkillFolderBtn')?.addEventListener('click', async () => {
            if (window.settingsAPI && window.settingsAPI.uploadSkillFolder) {
                try {
                    const res = await window.settingsAPI.uploadSkillFolder();
                    if (res && res.success) {
                        this.showToast(`Successfully imported ${res.count || 'some'} skills`, 'success');
                        this.loadSkillsList();
                    } else if (res && res.error) {
                        this.showToast(res.error, 'error');
                    }
                } catch (e) {
                    this.showToast('Failed to upload skills', 'error');
                }
            }
        });

        document.getElementById('uploadSkillBtn')?.addEventListener('click', async () => {
            if (window.settingsAPI && window.settingsAPI.importSkill) {
                try {
                    const res = await window.settingsAPI.importSkill();
                    if (res && res.success) {
                        this.showToast(`Skill imported successfully`, 'success');
                        this.loadSkillsList();
                    } else if (res && res.error) {
                        this.showToast(res.error, 'error');
                    }
                } catch (e) {
                    this.showToast('Failed to import skill', 'error');
                }
            }
        });

        document.getElementById('quitButton')?.addEventListener('click', async () => {
            const confirmed = await window.settingsAPI?.showConfirmModal({
                title: 'Quit Control?',
                message: 'The application will close. Any in-progress work in other windows may be interrupted.',
                confirmText: 'Quit',
                cancelText: 'Cancel',
                type: 'question'
            });
            if (confirmed && window.settingsAPI) window.settingsAPI.quitApp();
        });

        document.getElementById('changePinButton')?.addEventListener('click', () => {
            this.showPinModal('change');
        });

        document.getElementById('editToggleChatBtn')?.addEventListener('click', () => this.recordHotkey('toggleChat'));
        document.getElementById('editStopActionBtn')?.addEventListener('click', () => this.recordHotkey('stopAction'));
        document.getElementById('resetHotkeysBtn')?.addEventListener('click', () => {
            this.settings.hotkeys = { toggleChat: 'Ctrl+Space', stopAction: 'Alt+Z' };
            this.updateHotkeysUI();
            this.saveSettings();
        });

        document.getElementById('pinCancelButton')?.addEventListener('click', () => {
            const modal = document.getElementById('pinModal');
            if (modal) modal.style.display = 'none';
            if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(false);
        });

        document.getElementById('pinConfirmButton')?.addEventListener('click', () => {
            this.handlePinConfirm();
        });

        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('.modal-overlay')) return;
            if (this.isInPageModalOpen()) return;

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

        const toggleMap = {
            'borderStreakToggle': 'borderStreakEnabled',
            'voiceResponseToggle': 'voiceResponse',
            'voiceToggle': 'voiceActivation',
            'autoSendToggle': 'autoSendAfterWakeWord',
            'pinToggle': 'pinEnabled',
            'proceedWithoutConfirmationToggle': 'proceedWithoutConfirmation',
            'windowVisibilityToggle': 'windowVisibility',
            'autoStartToggle': 'openAtLogin',
            'floatingButtonToggle': 'floatingButtonVisible',
            'remoteAccessToggle': 'remoteAccessEnabled'
        };

        Object.keys(toggleMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.checked = !!this.settings[toggleMap[id]];
            }
        });

        const providerInputs = [
            'geminiApiKey', 'geminiModel', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl',
            'anthropicApiKey', 'anthropicModel', 'openrouterApiKey', 'openrouterModel',
            'ollamaUrl', 'ollamaModel', 'xaiApiKey', 'xaiModel'
        ];

        providerInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = this.settings[id] || '';
        });

        const provider = this.settings.modelProvider || 'gemini';
        document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('active'));
        const card = document.querySelector(`.provider-card[data-provider="${provider}"]`);
        if (card) {
            card.classList.add('active');
            document.querySelectorAll('.provider-config').forEach(conf => conf.classList.remove('active'));
            const config = document.getElementById(`${provider}Config`);
            if (config) config.classList.add('active');
        }

        const layout = this.settings.layout || 'classic';
        const layoutCard = document.querySelector(`.layout-card[data-layout="${layout}"]`);
        if (layoutCard) {
            document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('active'));
            layoutCard.classList.add('active');
        }

        if (document.getElementById('ttsRateSlider')) {
            document.getElementById('ttsRateSlider').value = this.settings.ttsRate || 1.0;
            document.getElementById('ttsRateValue').textContent = (this.settings.ttsRate || 1.0).toFixed(1);
        }

        this.updateTheme();
        this.updateUserInfo();
        this.updateHotkeysUI();

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

const actUsed = this.currentUser.actCount || 0;
            const askUsed = this.currentUser.askCount || 0;
            const plan = (this.currentUser.plan || 'free').toLowerCase();
            let actLimitStr = plan === 'master' ? '∞' : (plan === 'pro' ? '200' : '10');
            let askLimitStr = plan === 'master' ? '∞' : (plan === 'pro' ? '500' : '200');

            if (document.getElementById('actLimitText')) {
                document.getElementById('actLimitText').textContent = `${actUsed} / ${actLimitStr}`;
            }
            if (document.getElementById('askLimitText')) {
                document.getElementById('askLimitText').textContent = `${askUsed} / ${askLimitStr}`;
            }

            const totalTokens = this.currentUser.totalTokens || 0;
            const dailyTokens = Object.values(this.currentUser.dailyTokenData || {}).reduce((a, b) => a + (b || 0), 0);
            
            if (document.getElementById('statTotalTokens')) document.getElementById('statTotalTokens').textContent = totalTokens.toLocaleString();
            if (document.getElementById('statDailyTokens')) document.getElementById('statDailyTokens').textContent = dailyTokens.toLocaleString();
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
        if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(true);
        
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
            if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(false);
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
        if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(true);
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
                    if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(false);
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
                if (window.settingsAPI?.setModalActive) window.settingsAPI.setModalActive(false);
            }
        }
    }

    skillIconClass(name) {
        const cmd = (name || '').toLowerCase();
        if (cmd.includes('web')) return 'fas fa-globe';
        if (cmd.includes('cmd') || cmd.includes('terminal')) return 'fas fa-terminal';
        if (cmd.includes('file') || cmd.includes('read')) return 'fas fa-file-alt';
        if (cmd.includes('code') || cmd.includes('edit')) return 'fas fa-code';
        if (cmd.includes('media') || cmd.includes('audio')) return 'fas fa-volume-up';
        return 'fas fa-bolt';
    }

    async loadSkillsList() {
        const container = document.getElementById('skillsListContainer');
        if (!container || !window.settingsAPI || !window.settingsAPI.getSkills) return;

        try {
            const data = await window.settingsAPI.getSkills();
            const behaviors = data.behaviors || [];

            if (behaviors.length === 0) {
                container.innerHTML = '<div class="setting-desc">No skills installed. Upload a file or folder above.</div>';
                return;
            }

            container.innerHTML = '';
            behaviors.forEach((skill) => {
                const row = document.createElement('div');
                row.className = 'skill-item-row';

                const meta = document.createElement('div');
                meta.className = 'skill-item-meta';

                const titleRow = document.createElement('div');
                titleRow.className = 'skill-item-name';
                const ic = document.createElement('i');
                ic.className = this.skillIconClass(skill.name);
                ic.setAttribute('style', 'width:14px;margin-right:8px;opacity:0.85;');
                titleRow.appendChild(ic);
                titleRow.appendChild(document.createTextNode(skill.name || 'Unnamed'));

                meta.appendChild(titleRow);

                if (skill.description) {
                    const desc = document.createElement('div');
                    desc.className = 'skill-item-desc';
                    desc.textContent = skill.description;
                    meta.appendChild(desc);
                }

                const preview = document.createElement('div');
                preview.className = 'skill-item-preview';
                preview.textContent = skill.pattern || '—';

                meta.appendChild(preview);

                const actions = document.createElement('div');
                actions.className = 'skill-item-actions';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'btn btn-secondary edit-skill-btn';
                editBtn.setAttribute('data-name', skill.name);
                editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit';
                editBtn.addEventListener('click', () => this.openSkillEditor(skill));

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'btn btn-secondary delete-skill-btn';
                delBtn.setAttribute('data-name', skill.name);
                delBtn.setAttribute('style', 'color: var(--danger);');
                delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);

                row.appendChild(meta);
                row.appendChild(actions);
                container.appendChild(row);
            });

            container.querySelectorAll('.delete-skill-btn').forEach((btn) => {
                btn.addEventListener('click', async (e) => {
                    const name = e.currentTarget.getAttribute('data-name');
                    const confirmed = await window.settingsAPI?.showConfirmModal({
                        title: 'Delete skill?',
                        message: `Remove "${name}" from your installed skills? This cannot be undone.`,
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        type: 'warning'
                    });
                    if (!confirmed || !window.settingsAPI.deleteSkill) return;
                    const res = await window.settingsAPI.deleteSkill(name);
                    if (res.success) {
                        this.showToast('Skill deleted', 'success');
                        this.loadSkillsList();
                    } else {
                        this.showToast('Failed to delete', 'error');
                    }
                });
            });
        } catch (e) {
            container.innerHTML = '<div class="setting-desc">Failed to load skills.</div>';
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
