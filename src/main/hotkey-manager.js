const { globalShortcut, app } = require('electron');

class HotkeyManager {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
    }

    setupHotkeys(customHotkeys = null) {

        const hotkeys = customHotkeys || {
            toggleChat: 'CommandOrControl+Space',
            stopAction: 'Alt+Z'
        };

        console.log('Setting up hotkeys:', hotkeys);

        if (hotkeys.toggleChat) {
            this.registerShortcut(hotkeys.toggleChat, 'toggle-chat', () => {
                console.log('Toggle chat hotkey triggered');
                this.emitToMain('toggle-chat');
            });
        }

        if (hotkeys.stopAction) {
            this.registerShortcut(hotkeys.stopAction, 'stop-action', () => {
                console.log('Stop AI action hotkey triggered');
                this.emitToMain('stop-action');
            });
        }

        console.log('Global hotkeys registered successfully');
    }

    updateHotkeys(newHotkeys) {
        console.log('Updating hotkeys to:', newHotkeys);
        this.unregisterAll();
        this.setupHotkeys(newHotkeys);
    }

    registerShortcut(accelerator, id, handler) {
        if (!accelerator || accelerator.trim().endsWith('+')) {
            console.warn(`Skipping invalid hotkey: ${accelerator}`);
            return false;
        }

        try {
            const success = globalShortcut.register(accelerator, handler);

            if (success) {
                this.shortcuts.set(id, { accelerator, handler });
                console.log(`Registered hotkey: ${accelerator} for ${id}`);
            } else {
                console.error(`Failed to register hotkey: ${accelerator} for ${id}`);
            }

            return success;
        } catch (e) {
            console.error(`Error registering hotkey ${accelerator}:`, e);
            return false;
        }
    }

    unregisterShortcut(id) {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            globalShortcut.unregister(shortcut.accelerator);
            this.shortcuts.delete(id);
            console.log(`Unregistered hotkey: ${shortcut.accelerator} for ${id}`);
            return true;
        }
        return false;
    }

    unregisterAll() {
        globalShortcut.unregisterAll();
        this.shortcuts.clear();
        console.log('All global hotkeys unregistered');
    }

    enable() {
        this.isEnabled = true;

        this.setupHotkeys();
    }

    disable() {
        this.isEnabled = false;
        this.unregisterAll();
    }

    emitToMain(event, data = {}) {

        if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            global.mainWindow.webContents.send('hotkey-triggered', { event, data });
        }

        if (process.emit) {
            process.emit('hotkey-triggered', { event, data });
        }
    }

    getRegisteredShortcuts() {
        return Array.from(this.shortcuts.keys());
    }

    isShortcutRegistered(accelerator) {
        return globalShortcut.isRegistered(accelerator);
    }
}

module.exports = HotkeyManager;
