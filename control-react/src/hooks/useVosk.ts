import { useState, useCallback, useRef, useEffect } from 'react';

export const useVosk = (onResult: (text: string, isPartial: boolean) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsConnecting(false);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Simple script processor fallback if Worklet is too complex for this environment
      // But original used Worklet, let's try to stick to a similar pattern or use ScriptProcessor for simplicity if needed.
      // For Phase 5, reliability is key.

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor as unknown as AudioWorkletNode;

      source.connect(processor);
      processor.connect(audioContext.destination);

      const ws = new WebSocket('ws://127.0.0.1:2700');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsRecording(true);
        console.log('[Vosk] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.partial) {
            onResult(data.partial, true);
          } else if (data.text) {
            onResult(data.text, false);
          }
        } catch (e) {
          console.error('[Vosk] Message error', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Vosk] WebSocket error', err);
        stopRecording();
      };

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(pcmData.buffer);
      };

    } catch (err) {
      console.error('[Vosk] Failed to start recording', err);
      setIsConnecting(false);
      stopRecording();
    }
  }, [isRecording, onResult, stopRecording]);

  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  return { startRecording, stopRecording, isRecording, isConnecting };
};
