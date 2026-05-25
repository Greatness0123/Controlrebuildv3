import { r as reactExports, j as jsxRuntimeExports, m as motion, A as AnimatePresence, c as client, R as React } from "./globals-DPKk9YB3.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
function LiteApp() {
  const [inputValue, setInputValue] = reactExports.useState("");
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const [response, setResponse] = reactExports.useState(null);
  const [mode, setMode] = reactExports.useState("act");
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    setIsProcessing(true);
    setResponse(null);
    try {
      await window.liteAPI.executeTask({ text: inputValue }, mode);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };
  reactExports.useEffect(() => {
    if (!window.liteAPI) return;
    const unsubStream = window.liteAPI.onAIStream((_, data) => {
      setResponse((prev) => (prev || "") + data.text);
    });
    const unsubResponse = window.liteAPI.onAIResponse((_, data) => {
      setIsProcessing(false);
    });
    return () => {
      unsubStream();
      unsubResponse();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col w-[360px] pointer-events-auto select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        className: "h-14 bg-bg-base/90 backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex items-center px-2 gap-1 group",
        style: { WebkitAppRegion: "drag" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-text-muted group-hover:text-text-primary transition-colors cursor-grab active:cursor-grabbing", style: { WebkitAppRegion: "no-drag" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "GripVertical", size: "md" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-text-muted shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: mode === "ask" ? "MessageSquare" : mode === "act" ? "Zap" : "MousePointer", size: "md" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: inputValue,
              onChange: (e) => setInputValue(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleSend(),
              placeholder: "Ask or give a task...",
              className: "flex-1 bg-transparent border-none outline-none text-sm px-2 text-text-primary placeholder:text-text-disabled",
              style: { WebkitAppRegion: "no-drag" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", style: { WebkitAppRegion: "no-drag" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-2 rounded-lg hover:bg-white/10 text-text-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Mic", size: "md" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: isProcessing ? () => window.liteAPI.stopTask() : handleSend,
                className: `w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isProcessing ? "bg-red-500 text-white" : "bg-white text-black hover:scale-105 active:scale-95"}`,
                children: isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Square", size: "sm" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "ArrowUp", size: "sm" })
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: response && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { height: 0, opacity: 0, marginTop: 0 },
        animate: { height: "auto", opacity: 1, marginTop: 8 },
        exit: { height: 0, opacity: 0, marginTop: 0 },
        className: "bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-xl overflow-hidden relative",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-secondary leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar", children: response }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-3 border-t border-border-subtle flex justify-between items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => window.chatAPI.showWindow("chat"),
                className: "text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors",
                children: "Open Full Chat →"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setResponse(null),
                className: "text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors",
                children: "Dismiss"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-surface to-transparent pointer-events-none" })
        ]
      }
    ) })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LiteApp, {}) })
);
