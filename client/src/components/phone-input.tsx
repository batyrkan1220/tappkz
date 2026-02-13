import { Input } from "@/components/ui/input";
import { forwardRef, useCallback } from "react";

function formatPhoneValue(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);

  let result = "+7";
  if (d.length > 1) result += " (" + d.slice(1, 4);
  if (d.length >= 4) result += ") ";
  if (d.length > 4) result += d.slice(4, 7);
  if (d.length > 7) result += "-" + d.slice(7, 9);
  if (d.length > 9) result += "-" + d.slice(9, 11);
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
  ({ value, onValueChange, ...props }, ref) => {
    const formatted = value ? formatPhoneValue(value) : "";

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const digits = extractDigits(raw);
        onValueChange(digits);
      },
      [onValueChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && extractDigits(formatted).length <= 1) {
          e.preventDefault();
          onValueChange("");
        }
      },
      [formatted, onValueChange]
    );

    const handleFocus = useCallback(() => {
      if (!value) {
        onValueChange("7");
      }
    }, [value, onValueChange]);

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        value={formatted}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder="+7 (___) ___-__-__"
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput, formatPhoneValue, extractDigits };
