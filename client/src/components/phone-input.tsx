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
    const displayValue = formatLocal(localDigits);

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (el && pendingCursor.current !== null) {
        const pos = Math.min(pendingCursor.current, displayValue.length);
        el.setSelectionRange(pos, pos);
        pendingCursor.current = null;
      }
    });

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        const el = innerRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;

        if (e.key === "Backspace" && start === end) {
          e.preventDefault();

          if (localDigits.length === 0) return;

          let charPos = start - 1;
          while (charPos >= 0 && !/\d/.test(displayValue[charPos])) charPos--;

          if (charPos < 0) {
            onValueChange("");
            pendingCursor.current = 0;
            return;
          }

          let digitIdx = 0;
          for (let i = 0; i <= charPos; i++) {
            if (/\d/.test(displayValue[i])) digitIdx++;
          }

          const newLocal = localDigits.slice(0, digitIdx - 1) + localDigits.slice(digitIdx);
          if (newLocal.length === 0) {
            onValueChange("");
            pendingCursor.current = 0;
          } else {
            const newDisplay = formatLocal(newLocal);
            let newPos = 0;
            let count = 0;
            for (let i = 0; i < newDisplay.length; i++) {
              if (/\d/.test(newDisplay[i])) {
                count++;
                if (count === digitIdx - 1) { newPos = i + 1; break; }
              }
            }
            if (digitIdx - 1 === 0) newPos = 1;
            if (count < digitIdx - 1) newPos = newDisplay.length;
            pendingCursor.current = newPos;
            onValueChange("7" + newLocal);
          }
          return;
        }

        if (e.key === "Delete" && start === end) {
          e.preventDefault();

          if (localDigits.length === 0) return;

          let charPos = start;
          while (charPos < displayValue.length && !/\d/.test(displayValue[charPos])) charPos++;

          if (charPos >= displayValue.length) return;

          let digitIdx = 0;
          for (let i = 0; i <= charPos; i++) {
            if (/\d/.test(displayValue[i])) digitIdx++;
          }

          const newLocal = localDigits.slice(0, digitIdx - 1) + localDigits.slice(digitIdx);
          if (newLocal.length === 0) {
            onValueChange("");
            pendingCursor.current = 0;
          } else {
            const newDisplay = formatLocal(newLocal);
            let newPos = 0;
            let count = 0;
            for (let i = 0; i < newDisplay.length; i++) {
              if (/\d/.test(newDisplay[i])) {
                count++;
                if (count === digitIdx - 1) { newPos = i + 1; break; }
              }
            }
            if (digitIdx - 1 === 0) newPos = 1;
            if (count < digitIdx - 1) newPos = newDisplay.length;
            pendingCursor.current = newPos;
            onValueChange("7" + newLocal);
          }
          return;
        }
      },
      [displayValue, localDigits, onValueChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        const raw = inputVal.replace(/\D/g, "").slice(0, 10);

        if (raw.length === 0) {
          onValueChange("");
          pendingCursor.current = 0;
          return;
        }

        const newDisplay = formatLocal(raw);
        const cursorInInput = e.target.selectionStart ?? inputVal.length;

        let digitsBeforeCursor = 0;
        for (let i = 0; i < cursorInInput && i < inputVal.length; i++) {
          if (/\d/.test(inputVal[i])) digitsBeforeCursor++;
        }

        let newPos = 0;
        let count = 0;
        for (let i = 0; i < newDisplay.length; i++) {
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

    const setRefs = useCallback(
      (el: HTMLInputElement | null) => {
        innerRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref]
    );

    return (
      <div className="flex">
        <div className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground select-none">
          +7
        </div>
        <Input
          ref={setRefs}
          type="tel"
          inputMode="tel"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="(___) ___-__-__"
          className={`rounded-l-none ${className || ""}`}
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput, formatPhoneValue, extractDigits };
