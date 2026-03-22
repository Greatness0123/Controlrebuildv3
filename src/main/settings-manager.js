const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class SettingsManager {
    constructor() {
        const { app } = require('electron');

        this.settingsDir = app.getPath('userData');
        this.globalSettingsFile = path.join(this.settingsDir, 'settings.json');
        this.currentUserId = null;

        fs.ensureDirSync(this.settingsDir);

        this.settings = this._loadSettings();

        if (this.settings.userDetails && this.settings.userDetails.id) {
            this.switchUser(this.settings.userDetails.id);
        }
    }

    _getUserSettingsFile(userId) {
        return path.join(this.settingsDir, `settings_${userId}.json`);
    }

    _loadSettings(userId = null) {
        const settingsFile = userId ? this._getUserSettingsFile(userId) : this.globalSettingsFile;

        try {
            if (fs.existsSync(settingsFile)) {
                const data = fs.readFileSync(settingsFile, 'utf8');
                const loaded = JSON.parse(data);
                console.log(`Settings loaded from: ${settingsFile}`);
                return { ...this._getDefaults(), ...loaded };
            }
        } catch (err) {
            console.warn('Failed to load settings file, using defaults:', err.message);
        }

        return this._getDefaults();
    }

    _getDefaults() {
        return {
            pinEnabled: false,
            voiceActivation: true,
            voiceResponse: true,
            muteNotifications: false,
            greetingTTS: false,
            autoSendAfterWakeWord: false,
            proceedWithoutConfirmation: false,
            lastMode: 'act',
            windowVisibility: false,  // Default: hide window during actions
            openAtLogin: false,
            wakeWordToggleChat: false,
            floatingButtonVisible: true,
            edgeGlowEnabled: true,    // New: control purple edge glow during Act mode
            borderStreakEnabled: true, // New: control purple border streak on windows
            workflowTriggersEnabled: true, // New: control keyword/time triggers for workflows
            theme: 'light',           // New: light or dark theme
            modelProvider: 'gemini',
            openrouterModel: 'anthropic/claude-3.5-sonnet',
            openrouterCustomModel: '',
            openrouterApiKey: '',
            ollamaEnabled: false,
            ollamaUrl: 'http://localhost:11434',
            ollamaModel: 'llama3',
            ttsVoice: 'en-US-AriaNeural',
            ttsRate: 1.0,
            ttsVolume: 1.0,
            userAuthenticated: false,
            hotkeys: {
                toggleChat: process.platform === 'darwin' ? 'Command+.' : 'CommandOrControl+Space',
                stopAction: 'Alt+Z'
            },
            remoteAccessEnabled: false,
            userDetails: null
        };
    }

    _saveToFile() {
        try {
            fs.ensureDirSync(this.settingsDir);

            fs.writeFileSync(this.globalSettingsFile, JSON.stringify(this.settings, null, 2), 'utf8');
            console.log('Global settings saved to:', this.globalSettingsFile);

            if (this.currentUserId) {
                const userSettingsFile = this._getUserSettingsFile(this.currentUserId);

                const userSettings = { ...this.settings };
                delete userSettings.userAuthenticated; // Auth state stays global
                delete userSettings.userDetails; // User details stay global
                fs.writeFileSync(userSettingsFile, JSON.stringify(userSettings, null, 2), 'utf8');
                console.log('User settings saved to:', userSettingsFile);
            }

            return true;
        } catch (err) {
            console.error('Failed to save settings file:', err.message);
            return false;
        }
    }

    switchUser(userId) {
        if (!userId) {
            console.log('No user ID provided, using global settings');
            this.currentUserId = null;
            return;
        }

        console.log(`Switching to user settings for: ${userId}`);
        this.currentUserId = userId;

        const userSettings = this._loadSettings(userId);

        const authState = {
            userAuthenticated: this.settings.userAuthenticated,
            userDetails: this.settings.userDetails
        };

        this.settings = {
            ...this._getDefaults(),
            ...userSettings,
            ...authState
        };

        console.log('User settings loaded and merged');
    }

    getSettings() {
        return { ...this.settings };
    }

    getSetting(key) {
        return this.settings[key];
    }

    updateSettings(updates) {
        try {

            if (updates.userDetails && updates.userDetails.id &&
                updates.userDetails.id !== this.currentUserId) {

                this.switchUser(updates.userDetails.id);
            }

            this.settings = {
                ...this.settings,
                ...updates
            };

            this._saveToFile();
            return true;
        } catch (err) {
            console.error('Failed to update settings:', err.message);
            return false;
        }
    }

    resetSettings() {
        this.currentUserId = null;
        this.settings = this._getDefaults();
        return this._saveToFile();
    }

    getSettingsPath() {
        return this.currentUserId
            ? this._getUserSettingsFile(this.currentUserId)
            : this.globalSettingsFile;
    }
}

module.exports = SettingsManager;
