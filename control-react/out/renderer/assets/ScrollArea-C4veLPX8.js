import { R as React, j as jsxRuntimeExports } from "./globals-DPKk9YB3.js";
import { t as twMerge, c as clsx } from "./Button-CSJGGdAl.js";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ScrollArea = React.forwardRef(
  ({ children, className }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref,
        className: cn("overflow-y-auto overflow-x-hidden custom-scrollbar", className),
        children
      }
    );
  }
);
ScrollArea.displayName = "ScrollArea";
export {
  ScrollArea as S
};
