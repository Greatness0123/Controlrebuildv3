import { useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { AppSettings } from '../types/settings';

export const useSettings = () => {
  const storeSettings = useSettingsStore();
  const { setSettings, updateSettings } = storeSettings;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await window.settingsAPI.getSettings();
      setSettings(settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, [setSettings]);

  const saveSettings = useCallback((updates: Partial<AppSettings>) => {
    // Update local store immediately
    updateSettings(updates);

    // Debounce save to main process
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await window.settingsAPI.saveSettings(updates);
      } catch (error) {
        console.error('Failed to save settings to main:', error);
      }
    }, 500);
  }, [updateSettings]);

  useEffect(() => {
    if (!window.settingsAPI) return;

    const unsubSettingsUpdated = window.settingsAPI.onSettingsUpdated((_, settings) => {
      setSettings(settings);
    });

    fetchSettings();

    return () => {
      unsubSettingsUpdated();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [setSettings, fetchSettings]);

  return { settings: storeSettings, saveSettings, fetchSettings };
};
