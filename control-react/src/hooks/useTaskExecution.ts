import { useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { TaskPayload } from '../types/chat';

export const useTaskExecution = () => {
  const {
    activeSessionId,
    addMessage,
    appendStreamChunk,
    finalizeStream,
    setProcessing,
    setMode,
  } = useChatStore();

  const executeTask = useCallback(async (text: string, mode: 'ask' | 'act' | 'click' = 'act') => {
    if (!activeSessionId) return;

    setProcessing(true);
    setMode(mode);

    // Add user message optimistically
    addMessage(activeSessionId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    });

    try {
      const payload: TaskPayload = { text, mode };
      await window.chatAPI.executeTask(payload, mode);
    } catch (error) {
      console.error('Task execution failed:', error);
      setProcessing(false);
    }
  }, [activeSessionId, addMessage, setProcessing, setMode]);

  const stopTask = useCallback(async () => {
    await window.chatAPI.stopTask();
    setProcessing(false);
  }, [setProcessing]);

  useEffect(() => {
    if (!activeSessionId || !window.chatAPI) return;

    const unsubStream = window.chatAPI.onAIStream((_, data) => {
      appendStreamChunk(data.text);
    });

    const unsubResponse = window.chatAPI.onAIResponse((_, data) => {
      finalizeStream(activeSessionId, crypto.randomUUID());
    });

    const unsubTaskComplete = window.chatAPI.onTaskComplete(() => {
      setProcessing(false);
    });

    const unsubTaskStopped = window.chatAPI.onTaskStopped(() => {
      setProcessing(false);
    });

    const unsubError = window.chatAPI.onBackendError((_, error) => {
      console.error('Backend error:', error);
      setProcessing(false);
    });

    return () => {
      unsubStream();
      unsubResponse();
      unsubTaskComplete();
      unsubTaskStopped();
      unsubError();
    };
  }, [activeSessionId, appendStreamChunk, finalizeStream, setProcessing]);

  return { executeTask, stopTask };
};
