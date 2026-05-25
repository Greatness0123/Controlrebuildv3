import { R as React, j as jsxRuntimeExports } from "./globals-DPKk9YB3.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
import { t as twMerge, c as clsx } from "./Button-CSJGGdAl.js";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Input = React.forwardRef(
  ({ className, variant = "default", error, icon, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full", children: [
      icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: icon, size: "sm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: cn(
            "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            variant === "code" && "font-mono bg-black/20",
            error && "border-red-500 focus-visible:ring-red-500",
            icon && "pl-10",
            "border-[var(--border-default)] focus-visible:ring-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
            className
          ),
          ref,
          ...props
        }
      )
    ] });
  }
);
Input.displayName = "Input";
export {
  Input as I
};
