import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";

const COUNTRIES = [
  { code: "KZ", dial: "+7", name: "Казахстан", mask: "(___) ___-__-__", maxDigits: 10 },
  { code: "RU", dial: "+7", name: "Россия", mask: "(___) ___-__-__", maxDigits: 10 },
  { code: "UZ", dial: "+998", name: "Узбекистан", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "KG", dial: "+996", name: "Кыргызстан", mask: "(___) __-__-__", maxDigits: 9 },
  { code: "TJ", dial: "+992", name: "Таджикистан", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "TM", dial: "+993", name: "Туркменистан", mask: "(__) __-__-__", maxDigits: 8 },
  { code: "AZ", dial: "+994", name: "Азербайджан", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "GE", dial: "+995", name: "Грузия", mask: "(___) __-__-__", maxDigits: 9 },
  { code: "AM", dial: "+374", name: "Армения", mask: "(__) __-__-__", maxDigits: 8 },
  { code: "BY", dial: "+375", name: "Беларусь", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "UA", dial: "+380", name: "Украина", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "MD", dial: "+373", name: "Молдова", mask: "(__) __-__-__", maxDigits: 8 },
  { code: "TR", dial: "+90", name: "Турция", mask: "(___) ___-__-__", maxDigits: 10 },
  { code: "AE", dial: "+971", name: "ОАЭ", mask: "(__) ___-____", maxDigits: 9 },
  { code: "SA", dial: "+966", name: "Саудовская Аравия", mask: "(__) ___-____", maxDigits: 9 },
  { code: "US", dial: "+1", name: "США", mask: "(___) ___-____", maxDigits: 10 },
  { code: "GB", dial: "+44", name: "Великобритания", mask: "(____) ______", maxDigits: 10 },
  { code: "DE", dial: "+49", name: "Германия", mask: "(____) _______", maxDigits: 11 },
  { code: "FR", dial: "+33", name: "Франция", mask: "(_) __-__-__-__", maxDigits: 9 },
  { code: "IT", dial: "+39", name: "Италия", mask: "(___) ___-____", maxDigits: 10 },
  { code: "ES", dial: "+34", name: "Испания", mask: "(___) __-__-__", maxDigits: 9 },
  { code: "PL", dial: "+48", name: "Польша", mask: "(___) ___-___", maxDigits: 9 },
  { code: "CN", dial: "+86", name: "Китай", mask: "(___) ____-____", maxDigits: 11 },
  { code: "JP", dial: "+81", name: "Япония", mask: "(__) ____-____", maxDigits: 10 },
  { code: "KR", dial: "+82", name: "Южная Корея", mask: "(__) ____-____", maxDigits: 10 },
  { code: "IN", dial: "+91", name: "Индия", mask: "(____) ______", maxDigits: 10 },
  { code: "BR", dial: "+55", name: "Бразилия", mask: "(__) _____-____", maxDigits: 11 },
  { code: "MX", dial: "+52", name: "Мексика", mask: "(___) ___-____", maxDigits: 10 },
  { code: "CA", dial: "+1", name: "Канада", mask: "(___) ___-____", maxDigits: 10 },
  { code: "AU", dial: "+61", name: "Австралия", mask: "(___) ___-___", maxDigits: 9 },
  { code: "IL", dial: "+972", name: "Израиль", mask: "(__) ___-____", maxDigits: 9 },
  { code: "EG", dial: "+20", name: "Египет", mask: "(___) ___-____", maxDigits: 10 },
  { code: "NG", dial: "+234", name: "Нигерия", mask: "(___) ___-____", maxDigits: 10 },
  { code: "ZA", dial: "+27", name: "ЮАР", mask: "(__) ___-____", maxDigits: 9 },
  { code: "TH", dial: "+66", name: "Таиланд", mask: "(__) ___-____", maxDigits: 9 },
  { code: "ID", dial: "+62", name: "Индонезия", mask: "(___) ____-____", maxDigits: 11 },
  { code: "MY", dial: "+60", name: "Малайзия", mask: "(__) ____-____", maxDigits: 10 },
  { code: "SG", dial: "+65", name: "Сингапур", mask: "(____)-____", maxDigits: 8 },
  { code: "PH", dial: "+63", name: "Филиппины", mask: "(___) ___-____", maxDigits: 10 },
  { code: "VN", dial: "+84", name: "Вьетнам", mask: "(__) ___-__-__", maxDigits: 9 },
  { code: "PK", dial: "+92", name: "Пакистан", mask: "(___) ___-____", maxDigits: 10 },
  { code: "BD", dial: "+880", name: "Бангладеш", mask: "(____) ______", maxDigits: 10 },
  { code: "AR", dial: "+54", name: "Аргентина", mask: "(___) ___-____", maxDigits: 10 },
  { code: "CL", dial: "+56", name: "Чили", mask: "(_) ____-____", maxDigits: 9 },
  { code: "CO", dial: "+57", name: "Колумбия", mask: "(___) ___-____", maxDigits: 10 },
  { code: "PE", dial: "+51", name: "Перу", mask: "(___) ___-___", maxDigits: 9 },
];

function applyMask(digits: string, mask: string): string {
  let result = "";
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === "_") {
      result += digits[di++];
    } else {
      result += mask[i];
    }
  }
  return result;
}

function getMaskPlaceholder(dial: string, mask: string): string {
  return `${dial} ${mask}`;
}

interface InternationalPhoneInputProps {
  value: string;
  onValueChange: (rawDigits: string) => void;
  defaultCountry?: string;
  className?: string;
  "data-testid"?: string;
}

export function InternationalPhoneInput({
  value,
  onValueChange,
  defaultCountry = "KZ",
  className,
  "data-testid": testId,
}: InternationalPhoneInputProps) {
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const dialDigits = selected.dial.replace(/\D/g, "");
  const allDigits = (value || "").replace(/\D/g, "");
  const localDigits = allDigits.startsWith(dialDigits) ? allDigits.slice(dialDigits.length) : allDigits;
  const phoneDigits = localDigits.slice(0, selected.maxDigits);
  const formatted = phoneDigits.length > 0 ? applyMask(phoneDigits, selected.mask) : "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, selected.maxDigits);
      onValueChange(raw.length > 0 ? dialDigits + raw : "");
    },
    [onValueChange, selected.maxDigits, dialDigits]
  );

  const handleCountrySelect = useCallback(
    (c: typeof COUNTRIES[0]) => {
      setCountryCode(c.code);
      const newDial = c.dial.replace(/\D/g, "");
      const trimmed = phoneDigits.slice(0, c.maxDigits);
      onValueChange(trimmed.length > 0 ? newDial + trimmed : "");
      setOpen(false);
      setSearch("");
    },
    [phoneDigits, onValueChange]
  );

  return (
    <div className="relative">
      <div className="flex">
        <button
          ref={buttonRef}
          type="button"
          className="flex h-9 items-center gap-1 rounded-l-md border border-r-0 bg-muted px-2 text-sm text-muted-foreground select-none shrink-0"
          onClick={() => { setOpen(!open); setSearch(""); }}
          data-testid={testId ? `${testId}-country` : "button-country-select"}
        >
          <span className="text-xs">{selected.code}</span>
          <span className="font-medium">{selected.dial}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
        <Input
          type="tel"
          inputMode="tel"
          value={formatted}
          onChange={handleInputChange}
          placeholder={selected.mask}
          className={`rounded-l-none ${className || ""}`}
          data-testid={testId || "input-phone"}
        />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border bg-popover shadow-lg"
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск страны..."
                className="pl-8 h-8 text-sm"
                autoFocus
                data-testid="input-country-search"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">Не найдено</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm hover-elevate ${
                  c.code === countryCode ? "bg-accent" : ""
                }`}
                onClick={() => handleCountrySelect(c)}
                data-testid={`option-country-${c.code}`}
              >
                <span className="font-mono text-xs font-semibold opacity-60 w-6 text-center">{c.code}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { COUNTRIES };
