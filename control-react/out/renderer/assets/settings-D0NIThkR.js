import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion, c as client, R as React } from "./globals-DPKk9YB3.js";
import { u as useSettingsStore } from "./settingsStore-DFfpgfUE.js";
import { u as useAuth, B as Badge } from "./Badge-Cfd5F8c8.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
import { B as Button } from "./Button-CSJGGdAl.js";
import { I as Input } from "./Input-jH2I69LP.js";
import { S as ScrollArea } from "./ScrollArea-C4veLPX8.js";
import "./immer-zSCVQdSb.js";
const useSettings = () => {
  const storeSettings = useSettingsStore();
  const { setSettings, updateSettings } = storeSettings;
  const saveTimeoutRef = reactExports.useRef(null);
  const fetchSettings = reactExports.useCallback(async () => {
    try {
      const settings = await window.settingsAPI.getSettings();
      setSettings(settings);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, [setSettings]);
  const saveSettings = reactExports.useCallback((updates) => {
    updateSettings(updates);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await window.settingsAPI.saveSettings(updates);
      } catch (error) {
        console.error("Failed to save settings to main:", error);
      }
    }, 500);
  }, [updateSettings]);
  reactExports.useEffect(() => {
    if (!window.settingsAPI) return;
    const unsubSettingsUpdated = window.settingsAPI.onSettingsUpdated((_, settings) => {
      setSettings(settings);
    });
    fetchSettings();
    return () => {
      unsubSettingsUpdated();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [setSettings, fetchSettings]);
  return { settings: storeSettings, saveSettings, fetchSettings };
};
function SettingsApp() {
  const { settings, saveSettings } = useSettings();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = reactExports.useState("general");
  const [appVersion, setAppVersion] = reactExports.useState("1.0.0");
  reactExports.useEffect(() => {
    window.settingsAPI.getAppVersion().then((v) => setAppVersion(v.version));
  }, []);
  const tabs = [
    { id: "general", icon: "Settings2", label: "General" },
    { id: "models", icon: "Brain", label: "Models" },
    { id: "voice", icon: "Mic", label: "Voice" },
    { id: "appearance", icon: "Palette", label: "Appearance" },
    { id: "workflows", icon: "GitBranch", label: "Workflows" },
    { id: "security", icon: "Shield", label: "Security" },
    { id: "advanced", icon: "Code2", label: "Advanced" }
  ];
  const providers = [
    { id: "gemini", name: "Gemini" },
    { id: "anthropic", name: "Claude" },
    { id: "openai", name: "OpenAI" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "ollama", name: "Ollama" },
    { id: "xai", name: "xAI" },
    { id: "openrouter", name: "OpenRouter" }
  ];
  const handleImportSkill = async () => {
    const res = await window.chatAPI.importSkill();
    if (res && res.success) {
      alert(`Imported ${res.count} skills`);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen bg-bg-base text-text-primary overflow-hidden border-l border-border-strong select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[180px] bg-bg-surface border-r border-border-subtle flex flex-col pt-6 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-text-muted", children: "Settings" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 space-y-1 px-3", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.id),
          className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-text-secondary hover:text-white hover:bg-white/5"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: tab.icon, size: "sm" }),
            tab.label
          ]
        },
        tab.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-border-subtle space-y-4", children: [
        user && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs uppercase", children: user.name[0] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold truncate", children: user.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "success", className: "w-fit scale-75 origin-left", children: user.plan })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: logout,
            className: "w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "LogOut", size: "sm" }),
              "Sign Out"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-16 flex items-center justify-between px-8 border-b border-border-subtle bg-bg-elevated/50 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold uppercase tracking-widest", children: tabs.find((t) => t.id === activeTab)?.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-text-disabled uppercase", children: [
          "Control Build ",
          appVersion
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-10 max-w-3xl space-y-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { mode: "wait", children: [
        activeTab === "general" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            className: "space-y-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "Startup Behavior" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Launch at Startup" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-muted", children: "Automatically open Control when you log in" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: settings.openAtLogin,
                      onChange: (e) => saveSettings({ openAtLogin: e.target.checked }),
                      className: "w-4 h-4 accent-white"
                    }
                  )
                ] }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "Privacy & Visibility" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Hide from Screen Recording" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-muted", children: "Prevents the window from appearing in screenshots/videos" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: settings.windowVisibility,
                      onChange: (e) => saveSettings({ windowVisibility: e.target.checked }),
                      className: "w-4 h-4 accent-white"
                    }
                  )
                ] }) })
              ] })
            ]
          },
          "general"
        ),
        activeTab === "models" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            className: "space-y-10",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "AI Provider" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-3", children: providers.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => saveSettings({ modelProvider: p.id }),
                    className: `p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${settings.modelProvider === p.id ? "bg-white text-black border-white shadow-xl scale-105" : "bg-bg-surface border-border-subtle text-text-secondary hover:border-border-strong hover:text-white"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: p.id === "gemini" ? "Sparkles" : p.id === "anthropic" ? "Shield" : "Brain", size: "lg" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: p.name })
                    ]
                  },
                  p.id
                )) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "Model Configuration" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-text-secondary ml-1", children: "Selected Model" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: settings.selectedModel,
                      onChange: (e) => saveSettings({ selectedModel: e.target.value }),
                      placeholder: "e.g. gemini-2.0-flash"
                    }
                  )
                ] }) })
              ] })
            ]
          },
          "models"
        ),
        activeTab === "security" && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "PIN Protection" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 bg-bg-surface border border-border-subtle rounded-xl space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Enable Security PIN" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-text-muted", children: "Require a PIN to unlock the chat and settings" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: settings.pinEnabled,
                  onChange: (e) => saveSettings({ pinEnabled: e.target.checked }),
                  className: "w-4 h-4 accent-white"
                }
              )
            ] }),
            settings.pinEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-6 border-t border-border-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", iconLeft: "Key", children: "Change Security PIN" }) })
          ] })
        ] }) }, "security"),
        activeTab === "advanced" && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[11px] font-bold uppercase tracking-widest text-text-muted", children: "Data Management" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 bg-bg-surface border border-border-subtle rounded-xl space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Custom Skills" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Import learned behaviors from JSON or Markdown files." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", iconLeft: "Download", onClick: handleImportSkill, children: "Import Skills" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 bg-bg-surface border border-border-subtle rounded-xl space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: "Export Workspace" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-text-muted", children: "Export all settings and workflows to a portable file." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", iconLeft: "Upload", children: "Export Data" })
            ] })
          ] })
        ] }) }, "advanced"),
        !["general", "models", "security", "advanced"].includes(activeTab) && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "py-20 text-center opacity-20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Construction", size: 48, className: "mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase font-bold tracking-widest", children: "Additional settings tabs coming soon" })
        ] })
      ] }) }) })
    ] })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsApp, {}) })
);
