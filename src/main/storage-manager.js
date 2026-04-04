const fs = require('fs-extra');
const path = require('path');

class StorageManager {
    constructor() {
        this.initialized = false;
    }

    _init() {
        if (this.initialized) return;
        const { app } = require('electron');
        this.userDataDir = app.getPath('userData');
        this.preferencesFile = path.join(this.userDataDir, 'userPreferences.json');
        this.librariesFile = path.join(this.userDataDir, 'installedLibraries.json');
        this.behaviorsFile = path.join(this.userDataDir, 'learnedBehaviors.json');

        this._initFiles();
        this.initialized = true;
    }

    _initFiles() {
        if (!fs.existsSync(this.preferencesFile)) {
            const defaultPrefs = {
                defaultAppPreference: {
                    music: 'Spotify',
                    browser: 'Chrome',
                    editor: 'VS Code'
                },
                fileLocations: {
                    downloads: path.join(require('os').homedir(), 'Downloads'),
                    documents: path.join(require('os').homedir(), 'Documents')
                },
                proceedWithoutConfirmation: false
            };
            fs.writeJsonSync(this.preferencesFile, defaultPrefs, { spaces: 2 });
        }

        if (!fs.existsSync(this.librariesFile)) {
            const defaultLibraries = {
                python: [],
                node: []
            };
            fs.writeJsonSync(this.librariesFile, defaultLibraries, { spaces: 2 });
        }

        if (!fs.existsSync(this.behaviorsFile)) {
            const defaultBehaviors = {
                behaviors: []
            };
            fs.writeJsonSync(this.behaviorsFile, defaultBehaviors, { spaces: 2 });
        }
    }

    readPreferences() {
        this._init();
        try {
            return fs.readJsonSync(this.preferencesFile);
        } catch (err) {
            console.error('Error reading preferences:', err);
            return {};
        }
    }

    writePreferences(prefs) {
        this._init();
        try {
            const current = this.readPreferences();
            const updated = { ...current, ...prefs };
            fs.writeJsonSync(this.preferencesFile, updated, { spaces: 2 });
            return true;
        } catch (err) {
            console.error('Error writing preferences:', err);
            return false;
        }
    }

    readLibraries() {
        this._init();
        try {
            return fs.readJsonSync(this.librariesFile);
        } catch (err) {
            console.error('Error reading libraries:', err);
            return { python: [], node: [] };
        }
    }

    writeLibraries(libraries) {
        this._init();
        try {
            fs.writeJsonSync(this.librariesFile, libraries, { spaces: 2 });
            return true;
        } catch (err) {
            console.error('Error writing libraries:', err);
            return false;
        }
    }

    readBehaviors() {
        this._init();
        try {
            return fs.readJsonSync(this.behaviorsFile);
        } catch (err) {
            console.error('Error reading behaviors:', err);
            return { behaviors: [] };
        }
    }

    writeBehaviors(behaviors) {
        this._init();
        try {
            fs.writeJsonSync(this.behaviorsFile, behaviors, { spaces: 2 });
            return true;
        } catch (err) {
            console.error('Error writing behaviors:', err);
            return false;
        }
    }

    addBehavior(behavior) {
        const data = this.readBehaviors();

        const name = behavior.name.toLowerCase().trim();
        const existingIdx = data.behaviors.findIndex(b => b.name.toLowerCase().trim() === name);

        const newBehavior = {
            ...behavior,
            timestamp: new Date().toISOString()
        };

        if (existingIdx !== -1) {
            data.behaviors[existingIdx] = newBehavior;
        } else {
            data.behaviors.push(newBehavior);
        }

        return this.writeBehaviors(data);
    }

    deleteBehavior(name) {
        const data = this.readBehaviors();
        const lowerName = name.toLowerCase().trim();
        data.behaviors = data.behaviors.filter(b => b.name.toLowerCase().trim() !== lowerName);
        return this.writeBehaviors(data);
    }

    /**
     * Update an existing behavior by original name. Supports renaming (avoids duplicate names).
     */
    updateBehavior(originalName, updates) {
        const data = this.readBehaviors();
        const orig = (originalName || '').toLowerCase().trim();
        const idx = data.behaviors.findIndex(b => b.name.toLowerCase().trim() === orig);
        if (idx === -1) return false;

        const prev = data.behaviors[idx];
        const newName = (updates.name != null ? String(updates.name) : prev.name).trim();
        const description = updates.description != null ? String(updates.description) : (prev.description || '');
        const pattern = updates.pattern != null ? String(updates.pattern) : (prev.pattern || '');

        if (newName.toLowerCase() !== prev.name.toLowerCase().trim()) {
            const clash = data.behaviors.some(
                (b, i) => i !== idx && b.name.toLowerCase().trim() === newName.toLowerCase()
            );
            if (clash) return false;
        }

        const next = {
            ...prev,
            name: newName,
            description,
            pattern,
            timestamp: new Date().toISOString()
        };

        data.behaviors[idx] = next;
        return this.writeBehaviors(data);
    }

    addLibrary(type, name, version = 'latest') {
        const libs = this.readLibraries();
        if (!libs[type]) libs[type] = [];

        const existing = libs[type].find(l => l.name === name);
        if (existing) {
            existing.version = version;
            existing.installedAt = new Date().toISOString();
        } else {
            libs[type].push({
                name,
                version,
                installedAt: new Date().toISOString()
            });
        }
        return this.writeLibraries(libs);
    }
}

module.exports = new StorageManager();
