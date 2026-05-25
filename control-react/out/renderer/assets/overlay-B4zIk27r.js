import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion, c as client, R as React } from "./globals-DPKk9YB3.js";
import { c as create, d as devtools, i as immer } from "./immer-zSCVQdSb.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
const useOverlayStore = create()(
  devtools(
    immer((set) => ({
      isVisible: true,
      isMinimized: false,
      actions: [],
      position: { x: 0, y: 0 },
      interactionMode: "none",
      setVisible: (value) => set((state) => {
        state.isVisible = value;
      }),
      setMinimized: (value) => set((state) => {
        state.isMinimized = value;
      }),
      pushAction: (action) => set((state) => {
        state.actions.push(action);
      }),
      clearActions: () => set((state) => {
        state.actions = [];
      }),
      setPosition: (pos) => set((state) => {
        state.position = pos;
      }),
      setInteractionMode: (mode) => set((state) => {
        state.interactionMode = mode;
      })
    })),
    { name: "OverlayStore", enabled: false }
  )
);
const useOverlay = () => {
  const {
    setVisible,
    setInteractionMode,
    pushAction,
    setMinimized
  } = useOverlayStore();
  reactExports.useEffect(() => {
    if (!window.overlayAPI) return;
    const unsubShowFloating = window.overlayAPI.onShowFloatingButton(() => {
      setVisible(true);
    });
    const unsubHideFloating = window.overlayAPI.onHideFloatingButton(() => {
      setVisible(false);
    });
    const unsubInteractionMode = window.overlayAPI.onInteractionModeChanged((_, data) => {
      setInteractionMode(data.interactive ? "all" : "none");
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
function OverlayApp() {
  useOverlay();
  const { isVisible, isMinimized, actions, setVisible, setMinimized, clearActions } = useOverlayStore();
  const [glowType, setGlowType] = reactExports.useState(null);
  const [pinRequired, setPinRequired] = reactExports.useState(false);
  const [pinValue, setPinRequiredValue] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!window.overlayAPI) return;
    const unsubGlow = window.overlayAPI.onShowVisualEffect((_, data) => {
      setGlowType(data.type);
      setTimeout(() => setGlowType(null), 3e3);
    });
    const unsubPin = window.overlayAPI.onRequestPinAndToggle(() => {
      setPinRequired(true);
    });
    return () => {
      unsubGlow();
      unsubPin();
    };
  }, []);
  const handlePinSubmit = async () => {
    const res = await window.overlayAPI.verifyPin(pinValue);
    if (res && res.valid) {
      setPinRequired(false);
      setPinRequiredValue("");
      await window.overlayAPI.unlockApp(pinValue);
      window.chatAPI.toggleChat();
    } else {
      setPinRequiredValue("");
    }
  };
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-screen w-screen overflow-hidden pointer-events-none select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: pinRequired && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-[10005] flex items-center justify-center pointer-events-auto",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bg-elevated border border-border-strong rounded-2xl p-8 w-80 shadow-2xl space-y-6 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-white", children: "Enter PIN" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "This device is protected. Enter your PIN to continue." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              maxLength: 4,
              autoFocus: true,
              value: pinValue,
              onChange: (e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPinRequiredValue(val);
                if (val.length === 4) ;
              },
              className: "w-full bg-black/40 border-none rounded-xl py-4 text-center text-2xl tracking-[1em] text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPinRequired(false), className: "flex-1 py-3 rounded-xl bg-white/5 text-text-secondary text-xs font-bold uppercase hover:bg-white/10 transition-colors", children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handlePinSubmit, className: "flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold uppercase hover:bg-white/90 transition-colors", children: "Confirm" })
          ] })
        ] })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: glowType && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: `fixed inset-0 pointer-events-none z-0 border-[6px] ${glowType === "task-active" ? "border-purple-500/30" : "border-blue-500/30"} blur-md`
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isMinimized ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        onClick: () => setMinimized(false),
        className: "fixed bottom-6 right-6 w-4 h-4 bg-white rounded-full shadow-2xl pointer-events-auto cursor-pointer border-2 border-black group",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-white rounded-full animate-ping opacity-25" })
      },
      "minimized"
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        className: "fixed top-6 right-6 w-[380px] bg-bg-base/82 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between px-4 h-12 bg-white/5 border-b border-white/5 select-none", style: { WebkitAppRegion: "drag" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", style: { WebkitAppRegion: "no-drag" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "GripVertical", size: "md", className: "text-text-muted cursor-grab active:cursor-grabbing" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-text-secondary", children: "Action Feed" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", style: { WebkitAppRegion: "no-drag" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => window.chatAPI.stopTask(),
                  className: "p-2 rounded-md hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Square", size: "sm" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setMinimized(true),
                  className: "p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Minus", size: "sm" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: actions.slice(-3).map((action, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { y: 10, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: -10, opacity: 0 },
                className: "flex items-start gap-4 p-3 bg-white/5 rounded-xl border border-white/5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Play", size: "md" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[13px] font-bold text-white truncate", children: action.tool }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-text-muted line-clamp-1", children: JSON.stringify(action.parameters) })
                  ] })
                ]
              },
              i
            )) }),
            actions.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-[11px] font-medium text-text-disabled uppercase tracking-widest", children: "Waiting for task..." })
          ] }),
          actions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              initial: { scaleX: 0 },
              animate: { scaleX: 1 },
              className: "h-1 bg-white origin-left"
            }
          )
        ]
      },
      "expanded"
    ) })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OverlayApp, {}) })
);
