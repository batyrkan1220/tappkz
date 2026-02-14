import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { ru } from "date-fns/locale";

type PresetKey =
  | "today"
  | "yesterday"
  | "max"
  | "last7"
  | "last14"
  | "last28"
  | "last30"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth";

interface Preset {
  key: PresetKey;
  label: string;
  getRange: () => DateRange;
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function getPresets(): Preset[] {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = new Date(today);
  const dow = thisWeekStart.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  thisWeekStart.setDate(thisWeekStart.getDate() + mondayOffset);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const maxStart = new Date(2024, 0, 1);

  function daysAgo(n: number): DateRange {
    const from = new Date(today);
    from.setDate(from.getDate() - (n - 1));
    return { from, to: today };
  }

  return [
    { key: "today", label: "Сегодня", getRange: () => ({ from: today, to: today }) },
    { key: "yesterday", label: "Вчера", getRange: () => ({ from: yesterday, to: yesterday }) },
    { key: "max", label: "Максимум", getRange: () => ({ from: maxStart, to: today }) },
    { key: "last7", label: "Последние 7 дн.", getRange: () => daysAgo(7) },
    { key: "last14", label: "Последние 14 дн.", getRange: () => daysAgo(14) },
    { key: "last28", label: "Последние 28 дн.", getRange: () => daysAgo(28) },
    { key: "last30", label: "Последние 30 дн.", getRange: () => daysAgo(30) },
    { key: "thisWeek", label: "Эта неделя", getRange: () => ({ from: thisWeekStart, to: today }) },
    { key: "lastWeek", label: "Прошлая неделя", getRange: () => ({ from: lastWeekStart, to: lastWeekEnd }) },
    { key: "thisMonth", label: "Этот месяц", getRange: () => ({ from: thisMonthStart, to: today }) },
    { key: "lastMonth", label: "Прошлый месяц", getRange: () => ({ from: lastMonthStart, to: lastMonthEnd }) },
  ];
}

function formatRuDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Almaty" });
}

function matchPreset(range: DateRange, presets: Preset[]): PresetKey | null {
  if (!range.from || !range.to) return null;
  const fromTime = startOfDay(range.from).getTime();
  const toTime = startOfDay(range.to).getTime();
  for (const p of presets) {
    const pr = p.getRange();
    if (pr.from && pr.to) {
      if (startOfDay(pr.from).getTime() === fromTime && startOfDay(pr.to).getTime() === toTime) {
        return p.key;
      }
    }
  }
  return null;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);
  const [tempPreset, setTempPreset] = useState<PresetKey | null>(null);

  const presets = useMemo(() => getPresets(), []);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempRange(dateRange);
      setTempPreset(matchPreset(dateRange, presets));
    }
    setOpen(isOpen);
  };

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getRange();
    setTempRange(range);
    setTempPreset(preset.key);
  };

  const handleApply = () => {
    if (tempRange.from) {
      onDateRangeChange({
        from: tempRange.from,
        to: tempRange.to || tempRange.from,
      });
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const displayLabel = useMemo(() => {
    if (!dateRange.from) return "Выберите период";
    const preset = matchPreset(dateRange, presets);
    if (preset) {
      const p = presets.find((pr) => pr.key === preset);
      if (p) return p.label;
    }
    if (dateRange.to && dateRange.from.getTime() !== dateRange.to.getTime()) {
      return `${formatRuDate(dateRange.from)} – ${formatRuDate(dateRange.to)}`;
    }
    return formatRuDate(dateRange.from);
  }, [dateRange, presets]);

  const currentMonth = tempRange.from ? new Date(tempRange.from.getFullYear(), tempRange.from.getMonth()) : new Date();

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-sm font-medium"
          data-testid="button-date-range"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={8}
      >
        <div className="flex" data-testid="date-range-picker-panel">
          <div className="w-48 border-r p-3 space-y-0.5 max-h-[420px] overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
              Недавно использованные
            </div>
            {presets.map((preset) => (
              <button
                key={preset.key}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                  tempPreset === preset.key
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover-elevate"
                }`}
                onClick={() => handlePresetClick(preset)}
                data-testid={`preset-${preset.key}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="p-3 pb-0">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={(range) => {
                  if (range) {
                    setTempRange(range);
                    setTempPreset(null);
                  }
                }}
                numberOfMonths={2}
                locale={ru}
                defaultMonth={currentMonth}
                disabled={{ after: new Date() }}
                data-testid="calendar-range"
              />
            </div>

            <div className="border-t px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer" data-testid="compare-toggle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    disabled
                  />
                  <span className="text-sm text-muted-foreground">Сравнить</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">
                    {tempPreset ? presets.find((p) => p.key === tempPreset)?.label || "Период" : "Период"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-muted px-2.5 py-1 rounded text-foreground" data-testid="text-range-from">
                    {tempRange.from ? formatRuDate(tempRange.from) : "—"}
                  </span>
                  <span className="text-muted-foreground">–</span>
                  <span className="bg-muted px-2.5 py-1 rounded text-foreground" data-testid="text-range-to">
                    {tempRange.to ? formatRuDate(tempRange.to) : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Часовой пояс: Время в Астане (UTC+5)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel-date"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleApply}
                    data-testid="button-apply-date"
                  >
                    Обновить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
