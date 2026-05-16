import { useCallback, useEffect, useState } from 'react';

export const useVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWakewordEnabled, setIsWakewordEnabled] = useState(true);

  const speak = useCallback(async (text: string) => {
    // Note: The original speak-text handler was identified in analysis,
    // but often greet-greeting or tts-test-voice is used.
    // Mapping to speakGreeting for generic use as per chat-preload.js
    await window.chatAPI.speakGreeting(text);
  }, []);

  const stopSpeaking = useCallback(async () => {
    await window.chatAPI.stopAudio();
  }, []);

  const toggleWakeword = useCallback(async (enabled: boolean) => {
    const success = await window.chatAPI.setWakewordEnabled(enabled);
    if (success) setIsWakewordEnabled(enabled);
  }, []);

  useEffect(() => {
    if (!window.chatAPI) return;

    const unsubStarted = window.chatAPI.onAudioStarted(() => {
      setIsSpeaking(true);
    });

    const unsubStopped = window.chatAPI.onAudioStopped(() => {
      setIsSpeaking(false);
    });

    return () => {
      unsubStarted();
      unsubStopped();
    };
  }, []);

  return { speak, stopSpeaking, isSpeaking, isWakewordEnabled, toggleWakeword };
};
