import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

const COUNTRIES = [
  { code: "KZ", dial: "+7", name: "Казахстан" },
  { code: "RU", dial: "+7", name: "Россия" },
  { code: "UZ", dial: "+998", name: "Узбекистан" },
  { code: "KG", dial: "+996", name: "Кыргызстан" },
  { code: "TJ", dial: "+992", name: "Таджикистан" },
  { code: "TM", dial: "+993", name: "Туркменистан" },
  { code: "AZ", dial: "+994", name: "Азербайджан" },
  { code: "GE", dial: "+995", name: "Грузия" },
  { code: "AM", dial: "+374", name: "Армения" },
  { code: "BY", dial: "+375", name: "Беларусь" },
  { code: "UA", dial: "+380", name: "Украина" },
  { code: "MD", dial: "+373", name: "Молдова" },
  { code: "TR", dial: "+90", name: "Турция" },
  { code: "AE", dial: "+971", name: "ОАЭ" },
  { code: "SA", dial: "+966", name: "Саудовская Аравия" },
  { code: "US", dial: "+1", name: "США" },
  { code: "GB", dial: "+44", name: "Великобритания" },
  { code: "DE", dial: "+49", name: "Германия" },
  { code: "FR", dial: "+33", name: "Франция" },
  { code: "IT", dial: "+39", name: "Италия" },
  { code: "ES", dial: "+34", name: "Испания" },
  { code: "PL", dial: "+48", name: "Польша" },
  { code: "CN", dial: "+86", name: "Китай" },
  { code: "JP", dial: "+81", name: "Япония" },
  { code: "KR", dial: "+82", name: "Южная Корея" },
  { code: "IN", dial: "+91", name: "Индия" },
  { code: "BR", dial: "+55", name: "Бразилия" },
  { code: "MX", dial: "+52", name: "Мексика" },
  { code: "CA", dial: "+1", name: "Канада" },
  { code: "AU", dial: "+61", name: "Австралия" },
  { code: "IL", dial: "+972", name: "Израиль" },
  { code: "EG", dial: "+20", name: "Египет" },
  { code: "NG", dial: "+234", name: "Нигерия" },
  { code: "ZA", dial: "+27", name: "ЮАР" },
  { code: "TH", dial: "+66", name: "Таиланд" },
  { code: "ID", dial: "+62", name: "Индонезия" },
  { code: "MY", dial: "+60", name: "Малайзия" },
  { code: "SG", dial: "+65", name: "Сингапур" },
  { code: "PH", dial: "+63", name: "Филиппины" },
  { code: "VN", dial: "+84", name: "Вьетнам" },
  { code: "PK", dial: "+92", name: "Пакистан" },
  { code: "BD", dial: "+880", name: "Бангладеш" },
  { code: "AR", dial: "+54", name: "Аргентина" },
  { code: "CL", dial: "+56", name: "Чили" },
  { code: "CO", dial: "+57", name: "Колумбия" },
  { code: "PE", dial: "+51", name: "Перу" },
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

  const phoneDigits = value.replace(/\D/g, "");

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
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
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
                  onValueChange(phoneDigits, c.code);
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
