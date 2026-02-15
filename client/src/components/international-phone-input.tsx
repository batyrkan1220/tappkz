import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

const COUNTRIES = [
  { code: "KZ", dial: "+7", name: "Казахстан", maxDigits: 10 },
  { code: "RU", dial: "+7", name: "Россия", maxDigits: 10 },
  { code: "UZ", dial: "+998", name: "Узбекистан", maxDigits: 9 },
  { code: "KG", dial: "+996", name: "Кыргызстан", maxDigits: 9 },
  { code: "TJ", dial: "+992", name: "Таджикистан", maxDigits: 9 },
  { code: "TM", dial: "+993", name: "Туркменистан", maxDigits: 8 },
  { code: "AZ", dial: "+994", name: "Азербайджан", maxDigits: 9 },
  { code: "GE", dial: "+995", name: "Грузия", maxDigits: 9 },
  { code: "AM", dial: "+374", name: "Армения", maxDigits: 8 },
  { code: "BY", dial: "+375", name: "Беларусь", maxDigits: 9 },
  { code: "UA", dial: "+380", name: "Украина", maxDigits: 9 },
  { code: "MD", dial: "+373", name: "Молдова", maxDigits: 8 },
  { code: "TR", dial: "+90", name: "Турция", maxDigits: 10 },
  { code: "AE", dial: "+971", name: "ОАЭ", maxDigits: 9 },
  { code: "SA", dial: "+966", name: "Саудовская Аравия", maxDigits: 9 },
  { code: "US", dial: "+1", name: "США", maxDigits: 10 },
  { code: "GB", dial: "+44", name: "Великобритания", maxDigits: 10 },
  { code: "DE", dial: "+49", name: "Германия", maxDigits: 11 },
  { code: "FR", dial: "+33", name: "Франция", maxDigits: 9 },
  { code: "IT", dial: "+39", name: "Италия", maxDigits: 10 },
  { code: "ES", dial: "+34", name: "Испания", maxDigits: 9 },
  { code: "PL", dial: "+48", name: "Польша", maxDigits: 9 },
  { code: "CN", dial: "+86", name: "Китай", maxDigits: 11 },
  { code: "JP", dial: "+81", name: "Япония", maxDigits: 10 },
  { code: "KR", dial: "+82", name: "Южная Корея", maxDigits: 10 },
  { code: "IN", dial: "+91", name: "Индия", maxDigits: 10 },
  { code: "BR", dial: "+55", name: "Бразилия", maxDigits: 11 },
  { code: "MX", dial: "+52", name: "Мексика", maxDigits: 10 },
  { code: "CA", dial: "+1", name: "Канада", maxDigits: 10 },
  { code: "AU", dial: "+61", name: "Австралия", maxDigits: 9 },
  { code: "IL", dial: "+972", name: "Израиль", maxDigits: 9 },
  { code: "EG", dial: "+20", name: "Египет", maxDigits: 10 },
  { code: "NG", dial: "+234", name: "Нигерия", maxDigits: 10 },
  { code: "ZA", dial: "+27", name: "ЮАР", maxDigits: 9 },
  { code: "TH", dial: "+66", name: "Таиланд", maxDigits: 9 },
  { code: "ID", dial: "+62", name: "Индонезия", maxDigits: 11 },
  { code: "MY", dial: "+60", name: "Малайзия", maxDigits: 10 },
  { code: "SG", dial: "+65", name: "Сингапур", maxDigits: 8 },
  { code: "PH", dial: "+63", name: "Филиппины", maxDigits: 10 },
  { code: "VN", dial: "+84", name: "Вьетнам", maxDigits: 9 },
  { code: "PK", dial: "+92", name: "Пакистан", maxDigits: 10 },
  { code: "BD", dial: "+880", name: "Бангладеш", maxDigits: 10 },
  { code: "AR", dial: "+54", name: "Аргентина", maxDigits: 10 },
  { code: "CL", dial: "+56", name: "Чили", maxDigits: 9 },
  { code: "CO", dial: "+57", name: "Колумбия", maxDigits: 10 },
  { code: "PE", dial: "+51", name: "Перу", maxDigits: 9 },
];

interface InternationalPhoneInputProps {
  value: string;
  countryCode: string;
  onValueChange: (fullPhone: string, countryCode: string) => void;
  className?: string;
  "data-testid"?: string;
}

export function InternationalPhoneInput({
  value,
  countryCode,
  onValueChange,
  className,
  "data-testid": testId,
}: InternationalPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const maxLen = selected.maxDigits;

  const phoneDigits = value.replace(/\D/g, "").slice(0, maxLen);

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

  return (
    <div className="relative">
      <div className="flex">
        <button
          ref={buttonRef}
          type="button"
          className="flex h-9 items-center gap-1 rounded-l-md border border-r-0 bg-muted px-2.5 text-sm text-muted-foreground select-none shrink-0"
          onClick={() => { setOpen(!open); setSearch(""); }}
          data-testid={testId ? `${testId}-country` : "button-country-select"}
        >
          <span className="font-mono text-xs font-semibold opacity-70">{selected.code}</span>
          <span>{selected.dial}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
        <Input
          type="tel"
          inputMode="tel"
          value={phoneDigits}
          maxLength={maxLen}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
            onValueChange(digits, countryCode);
          }}
          placeholder="Номер телефона"
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
                onClick={() => {
                  const trimmed = phoneDigits.slice(0, c.maxDigits);
                  onValueChange(trimmed, c.code);
                  setOpen(false);
                  setSearch("");
                }}
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
