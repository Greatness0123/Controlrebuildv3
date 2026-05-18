import { useEffect } from 'react';
import { useOverlayStore } from '../stores/overlayStore';

export const useOverlay = () => {
  const {
    setVisible,
    setInteractionMode,
    pushAction,
    setMinimized
  } = useOverlayStore();

  useEffect(() => {
    if (!window.overlayAPI) return;

    const unsubShowFloating = window.overlayAPI.onShowFloatingButton(() => {
      setVisible(true);
    });

    const unsubHideFloating = window.overlayAPI.onHideFloatingButton(() => {
      setVisible(false);
    });

    const unsubInteractionMode = window.overlayAPI.onInteractionModeChanged((_, data) => {
      setInteractionMode(data.interactive ? 'all' : 'none');
    });

    const unsubActionStart = window.overlayAPI.onActionStart((_, action) => {
      pushAction(action);
    });

    const unsubFloatingToggle = window.overlayAPI.onFloatingButtonToggle((_, visible) => {
      setVisible(visible);
    });

    return () => {
      unsubShowFloating();
      unsubHideFloating();
      unsubInteractionMode();
      unsubActionStart();
      unsubFloatingToggle();
    };
  }, [setVisible, setInteractionMode, pushAction]);

  return {};
};
