import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion } from "./globals-DPKk9YB3.js";
const Tooltip = ({ content, children, delay = 150 }) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  const [timeoutId, setTimeoutId] = reactExports.useState(null);
  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };
  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "relative inline-block",
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleMouseEnter,
      onBlur: handleMouseLeave,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isVisible && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95, y: 5 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: 5 },
            transition: { duration: 0.1 },
            className: "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded shadow-lg whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none",
            children: [
              content,
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-elevated)]" })
            ]
          }
        ) })
      ]
    }
  );
};
export {
  Tooltip as T
};
