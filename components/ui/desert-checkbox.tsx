"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useState, InputHTMLAttributes, type ReactNode } from "react";

export interface DesertCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
}

/**
 * FusionZone styled checkbox component
 * 
 * - Unchecked: light background, subtle border
 * - Checked: primary background, white check
 * - Focused: visible primary-tinted focus ring
 * - Disabled: muted appearance
 *
 * Uses React state for the check mark visibility rather than CSS peer selectors,
 * because Tailwind v4 peer-checked variants are not reliably generated for all CSS
 * properties in this project's build configuration.
 */
export const DesertCheckbox = forwardRef<HTMLInputElement, DesertCheckboxProps>(
  ({ className, label, labelClassName, wrapperClassName, disabled, checked: checkedProp, onChange, ...props }, ref) => {
    const [checked, setChecked] = useState(checkedProp ?? false);

    // Sync with controlled prop when provided
    useEffect(() => {
      if (checkedProp !== undefined) {
        setChecked(checkedProp);
      }
    }, [checkedProp]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // For uncontrolled inputs, track the state ourselves
      if (checkedProp === undefined) {
        setChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-60",
          wrapperClassName
        )}
      >
        <div className="relative flex items-center justify-center rounded focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-1">
          <input
            type="checkbox"
            ref={ref}
            disabled={disabled}
            checked={checkedProp}
            onChange={handleChange}
            className={cn(
              "sr-only",
              className
            )}
            {...props}
          />
          {/* Custom checkbox visual */}
          <div
            className={cn(
              "h-4 w-4 rounded border transition-all duration-150",
              "flex items-center justify-center",
              checked
                ? "border-primary bg-primary"
                : "border-border bg-background",
              disabled && "opacity-50",
              "hover:border-primary/50"
            )}
          >
            {checked && (
              /* Filled check mark — solid path stays crisp at any size */
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 text-primary-foreground"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span
            className={cn(
              "text-xs text-foreground",
              disabled && "text-muted-foreground",
              labelClassName
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

DesertCheckbox.displayName = "DesertCheckbox";

export default DesertCheckbox;
