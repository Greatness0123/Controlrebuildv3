import { r as reactExports, j as jsxRuntimeExports } from "./globals-DPKk9YB3.js";
import { c as create, d as devtools, i as immer } from "./immer-zSCVQdSb.js";
import { t as twMerge, c as clsx } from "./Button-CSJGGdAl.js";
const useAuthStore = create()(
  devtools(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
        state.isLoading = false;
      }),
      setLoading: (value) => set((state) => {
        state.isLoading = value;
      }),
      logout: () => set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
    })),
    { name: "AuthStore", enabled: false }
  )
);
const useAuth = () => {
  const { user, isAuthenticated, setUser, setLoading, logout: localLogout } = useAuthStore();
  const checkAuth = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const userInfo = await window.entryAPI.getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);
  const login = reactExports.useCallback(async (payload) => {
    setLoading(true);
    try {
      const result = await window.entryAPI.loginWithEmail(payload);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);
  const logout = reactExports.useCallback(async () => {
    try {
      await window.settingsAPI.logout();
      localLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [localLogout]);
  reactExports.useEffect(() => {
    if (!window.entryAPI) return;
    const unsubUserChanged = window.entryAPI.onUserChanged((_, user2) => {
      setUser(user2);
    });
    checkAuth();
    return () => {
      unsubUserChanged();
    };
  }, [setUser, checkAuth]);
  return { login, logout, checkAuth, user, isAuthenticated };
};
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Badge = ({ children, variant = "neutral", className }) => {
  const variants = {
    success: "bg-green-500/10 text-[var(--color-success)] border-green-500/20",
    error: "bg-red-500/10 text-[var(--color-error)] border-red-500/20",
    warning: "bg-yellow-500/10 text-[var(--color-warning)] border-yellow-500/20",
    neutral: "bg-white/5 text-[var(--text-secondary)] border-white/10",
    running: "bg-blue-500/10 text-[var(--color-info)] border-blue-500/20 animate-pulse"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
    variants[variant],
    className
  ), children });
};
export {
  Badge as B,
  useAuth as u
};
