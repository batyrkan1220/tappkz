import { Input } from "@/components/ui/input";
import { forwardRef, useCallback, useRef, useLayoutEffect } from "react";

function formatLocal(digits: string): string {
  if (digits.length === 0) return "";
  let r = "(" + digits.slice(0, 3);
  if (digits.length >= 3) r += ") ";
  if (digits.length > 3) r += digits.slice(3, 6);
  if (digits.length > 6) r += "-" + digits.slice(6, 8);
  if (digits.length > 8) r += "-" + digits.slice(8, 10);
  return r;
}

function formatPhoneValue(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.length > 0 && !digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  let result = "+7";
  if (digits.length > 1) result += " (" + digits.slice(1, 4);
  if (digits.length >= 4) result += ") ";
  if (digits.length > 4) result += digits.slice(4, 7);
  if (digits.length > 7) result += "-" + digits.slice(7, 9);
  if (digits.length > 9) result += "-" + digits.slice(9, 11);
  return result;
}

function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onValueChange: (rawDigits: string) => void;
  "data-testid"?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    const pendingCursor = useRef<number | null>(null);

    const fullDigits = value ? value.replace(/\D/g, "") : "";
    let normalized = fullDigits;
    if (normalized.startsWith("8")) normalized = "7" + normalized.slice(1);
    if (normalized.length > 0 && !normalized.startsWith("7")) normalized = "7" + normalized;
    normalized = normalized.slice(0, 11);

    const localDigits = normalized.length > 1 ? normalized.slice(1) : "";
    const displayValue = localDigits.length > 0 ? `+7 ${formatLocal(localDigits)}` : "";

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (el && pendingCursor.current !== null) {
        const pos = Math.min(pendingCursor.current, (displayValue || "+7 ").length);
        el.setSelectionRange(pos, pos);
        pendingCursor.current = null;
      }
    });

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (!val.startsWith("+7")) {
          const digits = val.replace(/\D/g, "");
          if (digits.length === 0) {
            onValueChange("");
            pendingCursor.current = 0;
            return;
          }
          val = digits;
        } else {
          val = val.slice(2).trim();
        }
        const raw = val.replace(/\D/g, "").slice(0, 10);
        if (raw.length === 0) {
          onValueChange("");
          pendingCursor.current = 0;
          return;
        }
        const newDisplay = "+7 " + formatLocal(raw);
        const cursorInInput = e.target.selectionStart ?? e.target.value.length;
        let digitsBeforeCursor = 0;
        for (let i = 0; i < cursorInInput && i < e.target.value.length; i++) {
          if (/\d/.test(e.target.value[i]) && i >= 2) digitsBeforeCursor++;
        }
        let newPos = 3;
        let count = 0;
        for (let i = 3; i < newDisplay.length; i++) {
          if (/\d/.test(newDisplay[i])) {
            count++;
            if (count === digitsBeforeCursor) { newPos = i + 1; break; }
          }
        }
        if (count < digitsBeforeCursor) newPos = newDisplay.length;
        pendingCursor.current = newPos;
        onValueChange("7" + raw);
      },
      [onValueChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        const el = innerRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        if (start <= 3 && e.key === "Backspace" && el.selectionEnd === start) {
          e.preventDefault();
          return;
        }
        if (start < 3) {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Tab" && e.key !== "End" && e.key !== "Home") {
            e.preventDefault();
            el.setSelectionRange(3, 3);
          }
        }
      },
      []
    );

    const handleFocus = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      if (!displayValue) {
        onValueChange("7");
        pendingCursor.current = 3;
      } else {
        setTimeout(() => {
          const pos = el.selectionStart ?? 0;
          if (pos < 3) el.setSelectionRange(3, 3);
        }, 0);
      }
    }, [displayValue, onValueChange]);

    const handleBlur = useCallback(() => {
      if (localDigits.length === 0) {
        onValueChange("");
      }
    }, [localDigits, onValueChange]);

    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref]
    );

    return (
      <Input
        ref={setRefs}
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="+7 (___) ___-__-__"
        className={className || ""}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput, formatPhoneValue, extractDigits };
