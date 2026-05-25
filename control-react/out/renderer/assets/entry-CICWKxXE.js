import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion, c as client, R as React } from "./globals-DPKk9YB3.js";
import { u as useAuth, B as Badge } from "./Badge-Cfd5F8c8.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
import { B as Button } from "./Button-CSJGGdAl.js";
import { I as Input } from "./Input-jH2I69LP.js";
import "./immer-zSCVQdSb.js";
const tips = [
  { icon: "Zap", title: "Avoid Interactions During ACT", description: "Don't interact with your computer while ACT mode is running tasks." },
  { icon: "Mic", title: "Toggle Greetings", description: "Enable or disable greeting voice in settings. Greetings wait if locked." },
  { icon: "WifiOff", title: "Offline Mode", description: "Cached settings and account data work offline. Offline TTS is used automatically." },
  { icon: "Command", title: "Wake Word", description: 'Say "Hey Control" to activate. Enable auto-send for automatic transcription.' },
  { icon: "Keyboard", title: "Keyboard Shortcuts", description: "Ctrl+Space: Toggle chat | Alt+Z: Stop task | Escape: Clear input" }
];
const TipsCarousel = () => {
  const [index, setIndex] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 4e3);
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 relative overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      className: "flex gap-4 p-4 bg-white/5 border border-white/5 rounded-xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-text-muted shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: tips[index].icon, size: "md" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-wider", children: tips[index].title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-text-muted line-clamp-2 leading-relaxed", children: tips[index].description })
        ] })
      ]
    },
    index
  ) }) });
};
function EntryApp() {
  const { login, user, isAuthenticated } = useAuth();
  const [view, setView] = reactExports.useState("login");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const [pin, setPin] = reactExports.useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (isAuthenticated && user) {
      setView("pin");
    }
  }, [isAuthenticated, user]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };
  const handleUnlock = async () => {
    const pinString = pin.join("");
    if (pinString.length !== 4) return;
    setIsLoading(true);
    try {
      const res = await window.entryAPI.verifyEntryId(pinString);
      if (res.success) {
        window.entryAPI.minimizeWindow();
      } else {
        setError("Invalid PIN");
      }
    } catch (e) {
      setError("Unlock failed");
    } finally {
      setIsLoading(false);
    }
  };
  const features = [
    { icon: "Zap", text: "Automate anything on your desktop" },
    { icon: "Mic", text: "Voice-activated with Hey Control" },
    { icon: "Lock", text: "Runs entirely on your machine" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen bg-bg-base overflow-hidden border border-border-strong rounded-xl shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[45%] bg-bg-surface p-10 flex flex-col justify-between border-r border-border-subtle relative select-none", style: { WebkitAppRegion: "drag" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-12", style: { WebkitAppRegion: "no-drag" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 mb-6 bg-white rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2L2 7L12 12L22 7L12 2Z", fill: "black" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 17L12 22L22 17", stroke: "black", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 12L12 17L22 12", stroke: "black", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tight mb-2", children: "Control" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-text-secondary text-sm leading-relaxed", children: "The intelligent interface for your computer." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: features.map((f, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: f.icon, size: "md" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-text-secondary", children: f.text })
        ] }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TipsCarousel, {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-text-disabled font-mono flex justify-between", style: { WebkitAppRegion: "no-drag" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "v1.0.0 — PRODUCTION" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "© 2026" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 right-4 flex gap-2 z-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.entryAPI.minimizeWindow(), className: "p-1.5 rounded-md hover:bg-white/10 text-text-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Minus", size: "sm" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.entryAPI.closeWindow("entry"), className: "p-1.5 rounded-md hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "X", size: "sm" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { mode: "wait", children: [
        view === "login" && !isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.form,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
            onSubmit: handleLogin,
            className: "w-full max-w-sm space-y-6",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Sign In" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Enter your credentials to continue" })
              ] }),
              error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400", children: error }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1", children: "Email Address" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      placeholder: "name@example.com",
                      type: "email",
                      value: email,
                      onChange: (e) => setEmail(e.target.value),
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1", children: "Password" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        type: showPassword ? "text" : "password",
                        placeholder: "••••••••",
                        value: password,
                        onChange: (e) => setPassword(e.target.value),
                        required: true
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowPassword(!showPassword),
                        className: "absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: showPassword ? "EyeOff" : "Eye", size: "sm" })
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading: isLoading, children: "Continue" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setView("register"),
                  className: "text-xs text-text-muted hover:text-white transition-colors",
                  children: [
                    "Don't have an account? ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-medium underline", children: "Register" })
                  ]
                }
              ) })
            ]
          },
          "login"
        ),
        (view === "pin" || isAuthenticated) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            className: "w-full max-w-sm space-y-8 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-black text-black", children: (user?.name || "C")[0] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-bold", children: [
                    "Welcome back, ",
                    user?.firstName || user?.name || "User"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "success", children: user?.plan || "Free Plan" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center gap-3", children: pin.map((digit, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: `pin-${i}`,
                    type: "password",
                    maxLength: 1,
                    value: digit,
                    onChange: (e) => handlePinChange(i, e.target.value),
                    className: "w-12 h-16 bg-bg-surface border border-border-default focus:border-white rounded-xl text-center text-2xl font-bold outline-none transition-all"
                  },
                  i
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: handleUnlock, loading: isLoading, children: "Unlock & Start" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => window.settingsAPI.logout(),
                  className: "text-xs text-text-muted hover:text-white transition-colors",
                  children: "Use different account"
                }
              )
            ]
          },
          "pin"
        ),
        view === "register" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
            className: "w-full max-w-sm space-y-6",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Create Account" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Registration is handled securely on our web dashboard." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 border border-dashed border-border-subtle rounded-2xl text-center space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Globe", size: "lg" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", className: "w-full", onClick: () => window.settingsAPI.openWebsite(), children: "Open Dashboard" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setView("login"),
                  className: "text-xs text-text-muted hover:text-white transition-colors",
                  children: "Back to Sign In"
                }
              ) })
            ]
          },
          "register"
        )
      ] }) })
    ] })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(EntryApp, {}) })
);
