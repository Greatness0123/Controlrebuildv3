import { u as useConstant, e as motionValue, r as reactExports, M as MotionConfigContext, i as isMotionValue, f as frame, h as useIsomorphicLayoutEffect, d as frameData, a as animateValue, j as jsxRuntimeExports, m as motion, A as AnimatePresence, c as client, R as React } from "./globals-DPKk9YB3.js";
function useMotionValue(initial) {
  const value = useConstant(() => motionValue(initial));
  const { isStatic } = reactExports.useContext(MotionConfigContext);
  if (isStatic) {
    const [, setLatest] = reactExports.useState(initial);
    reactExports.useEffect(() => value.on("change", setLatest), []);
  }
  return value;
}
function toNumber(v) {
  if (typeof v === "number")
    return v;
  return parseFloat(v);
}
function useSpring(source, config = {}) {
  const { isStatic } = reactExports.useContext(MotionConfigContext);
  const activeSpringAnimation = reactExports.useRef(null);
  const value = useMotionValue(isMotionValue(source) ? toNumber(source.get()) : source);
  const latestValue = reactExports.useRef(value.get());
  const latestSetter = reactExports.useRef(() => {
  });
  const startAnimation = () => {
    const animation = activeSpringAnimation.current;
    if (animation && animation.time === 0) {
      animation.sample(frameData.delta);
    }
    stopAnimation();
    activeSpringAnimation.current = animateValue({
      keyframes: [value.get(), latestValue.current],
      velocity: value.getVelocity(),
      type: "spring",
      restDelta: 1e-3,
      restSpeed: 0.01,
      ...config,
      onUpdate: latestSetter.current
    });
  };
  const stopAnimation = () => {
    if (activeSpringAnimation.current) {
      activeSpringAnimation.current.stop();
    }
  };
  reactExports.useInsertionEffect(() => {
    return value.attach((v, set) => {
      if (isStatic)
        return set(v);
      latestValue.current = v;
      latestSetter.current = set;
      frame.update(startAnimation);
      return value.get();
    }, stopAnimation);
  }, [JSON.stringify(config)]);
  useIsomorphicLayoutEffect(() => {
    if (isMotionValue(source)) {
      return source.on("change", (v) => value.set(toNumber(v)));
    }
  }, [value]);
  return value;
}
function GhostCursorApp() {
  const [pos, setPos] = reactExports.useState({ x: 0, y: 0 });
  const [text, setText] = reactExports.useState(null);
  const [isGuiding, setIsGuiding] = reactExports.useState(false);
  const [isIdle, setIsIdle] = reactExports.useState(true);
  const springX = useSpring(0, { damping: 30, stiffness: 200 });
  const springY = useSpring(0, { damping: 30, stiffness: 200 });
  reactExports.useEffect(() => {
    if (!window.ghostCursorAPI) return;
    const unsubMove = window.ghostCursorAPI.onMove((_, data) => {
      setIsIdle(false);
      springX.set(data.x);
      springY.set(data.y);
      setPos({ x: data.x, y: data.y });
    });
    const unsubMouseMove = window.ghostCursorAPI.onMouseMove((_, data) => {
      if (isIdle) {
        springX.set(data.x);
        springY.set(data.y);
        setPos({ x: data.x, y: data.y });
      }
    });
    const unsubText = window.ghostCursorAPI.onUpdateText((_, data) => {
      setText(data.text);
    });
    const unsubGuiding = window.ghostCursorAPI.onSetGuiding((_, data) => {
      setIsGuiding(data.guiding);
    });
    const unsubIdle = window.ghostCursorAPI.onStartIdle(() => {
      setIsIdle(true);
      setText(null);
    });
    window.ghostCursorAPI.initGhostCursorSettings();
    return () => {
      unsubMove();
      unsubMouseMove();
      unsubText();
      unsubGuiding();
      unsubIdle();
    };
  }, [isIdle]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-screen w-screen overflow-hidden pointer-events-none select-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      style: { x: springX, y: springY },
      className: "absolute top-0 left-0 flex flex-col items-center",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "svg",
            {
              width: "28",
              height: "28",
              viewBox: "0 0 28 28",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              className: "drop-shadow-xl",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M2 2L12 24L16 14L26 10L2 2Z",
                  fill: "#1c1c1e",
                  stroke: "white",
                  strokeWidth: "2",
                  strokeLinejoin: "round"
                }
              )
            }
          ),
          isGuiding && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full animate-ping bg-white/20 scale-150" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: text && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.8, y: 10 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.8, y: 10 },
            className: "mt-4 max-w-[260px] bg-bg-surface/84 backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-2xl",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-medium text-white leading-relaxed", children: text }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => window.ghostCursorAPI.stepCompleted(),
                  className: "mt-2 w-full py-1.5 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-wider pointer-events-auto hover:bg-white/90 active:scale-95 transition-all",
                  children: "Done"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-surface border-l border-t border-border-subtle rotate-45" })
            ]
          }
        ) })
      ]
    }
  ) });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(GhostCursorApp, {}) })
);
