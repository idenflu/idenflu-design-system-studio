import * as React from "react";
import { cva } from "class-variance-authority";
import { type Size } from "../../shared/types";
import { Spinner } from "../spinner/Spinner";

export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonColor = "primary" | "secondary" | "danger";
export type ButtonSize = Size;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
}

const buttonClasses = cva("button idsButton", {
  variants: {
    variant: {
      default: null,
      outline: "button--outline",
      ghost: "button--ghost",
    },
    color: {
      primary: "button-color--primary",
      secondary: "button-color--secondary",
      danger: "button-color--danger",
    },
    fullWidth: { true: null, false: "button-inline" },
    iconOnly: { true: "button--icon", false: null },
    loading: { true: "button--loading", false: null },
  },
});

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "default",
      color = "primary",
      size,
      fullWidth = false,
      iconOnly = false,
      loading = false,
      disabled,
      children,
      className,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || props["aria-busy"]}
        data-size={size}
        className={buttonClasses({
          variant,
          color,
          fullWidth,
          iconOnly,
          loading,
          className,
        })}
      >
        {loading ? (
          <>
            <span className="button-loading-content">{children}</span>
            <Spinner
              size="small"
              variant="inverse"
              aria-hidden="true"
              className="button-loading-spinner"
            />
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
