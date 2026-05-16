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
    addActionStep,
    updateActionStep,
    clearActions,
  } = useChatStore();

  const executeTask = useCallback(async (text: string, mode: 'ask' | 'act' | 'click' = 'act') => {
    if (!activeSessionId) return;

    setProcessing(true);
    setMode(mode);
    clearActions();

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
  }, [activeSessionId, addMessage, setProcessing, setMode, clearActions]);

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

    const unsubActionStart = window.chatAPI.onActionStart((_, data) => {
      addActionStep({
        step: 0,
        description: data.tool,
        status: 'running'
      });
    });

    const unsubActionStep = window.chatAPI.onActionStep((_, data) => {
       // Logic to update existing or add new step would go here
       // For parity with Phase 2 definitions:
       updateActionStep(data.step - 1, {
         status: 'running',
         description: data.description
       });
    });

    const unsubActionComplete = window.chatAPI.onActionComplete((_, data) => {
       // Find last running action and complete it
       updateActionStep(0, { status: 'completed' }); // Simplified for phase 3 shell
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
      unsubActionStart();
      unsubActionStep();
      unsubActionComplete();
      unsubTaskComplete();
      unsubTaskStopped();
      unsubError();
    };
  }, [activeSessionId, appendStreamChunk, finalizeStream, setProcessing, addActionStep, updateActionStep]);

  return { executeTask, stopTask };
};
