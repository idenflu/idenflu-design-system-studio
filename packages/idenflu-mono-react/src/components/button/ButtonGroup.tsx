import * as React from "react";
import type { Size } from "../../shared/types";

export interface ButtonGroupProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "role"> {
  /** Sets a common size for the buttons in the group. */
  size?: Size;
}

/** Groups direct Button children within a shared outline. */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup({ className, size, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        role="group"
        data-size={size}
        className={className ? `button-group ${className}` : "button-group"}
      />
    );
  }
);
