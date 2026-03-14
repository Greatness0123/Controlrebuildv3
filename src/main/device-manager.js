const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * DeviceManager ensures the desktop app has a persistent identity
 * and stores pairing state locally.
 */
class DeviceManager {
    constructor() {
        this.configPath = null;
        this.deviceId = null;
        this.pairingData = null;
    }

    _init() {
        if (this.configPath) return;
        const { app } = require('electron');
        this.configPath = path.join(app.getPath('userData'), 'remoteDevice.json');
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readJsonSync(this.configPath);
                this.deviceId = data.deviceId;
                this.pairingData = data.pairingData;
            }

            if (!this.deviceId) {
                this.deviceId = uuidv4();
                this._save();
            }
        } catch (err) {
            console.error('[DeviceManager] Error loading config:', err);
            this.deviceId = uuidv4();
        }
    }

    _save() {
        try {
            fs.writeJsonSync(this.configPath, {
                deviceId: this.deviceId,
                pairingData: this.pairingData,
                updatedAt: new Date().toISOString(),
                hostname: os.hostname(),
                platform: os.platform()
            }, { spaces: 2 });
        } catch (err) {
            console.error('[DeviceManager] Error saving config:', err);
        }
    }

    getDeviceId() {
        this._init();
        return this.deviceId;
    }

    getPairingData() {
        this._init();
        return this.pairingData;
    }

    setPairingData(data) {
        this._init();
        this.pairingData = data;
        this._save();
    }

    clearPairing() {
        this._init();
        this.pairingData = null;
        this._save();
    }

    isPaired() {
        this._init();
        return !!(this.pairingData && this.pairingData.status === 'paired');
    }
}

module.exports = new DeviceManager();
