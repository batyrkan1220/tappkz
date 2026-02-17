import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface GeoResult {
  address: string;
  lat: string | null;
  lon: string | null;
}

interface YandexAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onGeoResult?: (result: GeoResult | null) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

let ymapsLoadPromise: Promise<any> | null = null;
let ymapsInstance: any = null;
let ymapsLoadFailed = false;

async function loadYmaps(): Promise<any> {
  if (ymapsInstance) return ymapsInstance;
  if (ymapsLoadFailed) return null;
  if (ymapsLoadPromise) return ymapsLoadPromise;

  ymapsLoadPromise = (async () => {
    try {
      const res = await fetch("/api/yandex-maps-key");
      if (!res.ok) throw new Error("No API key");
      const { apiKey } = await res.json();
      if (!apiKey) throw new Error("No API key");

      return new Promise((resolve, reject) => {
        if ((window as any).ymaps) {
          (window as any).ymaps.ready(() => {
            ymapsInstance = (window as any).ymaps;
            resolve(ymapsInstance);
          });
          return;
        }

        const script = document.createElement("script");
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
        script.async = true;
        script.onload = () => {
          (window as any).ymaps.ready(() => {
            ymapsInstance = (window as any).ymaps;
            resolve(ymapsInstance);
          });
        };
        script.onerror = () => {
          ymapsLoadFailed = true;
          reject(new Error("Failed to load Yandex Maps"));
        };
        document.head.appendChild(script);
      });
    } catch (e) {
      ymapsLoadFailed = true;
      ymapsLoadPromise = null;
      return null;
    }
  })();

  return ymapsLoadPromise;
}

export function YandexAddressInput({
  value,
  onChange,
  onGeoResult,
  placeholder = "Начните вводить адрес...",
  className,
  "data-testid": testId,
}: YandexAddressInputProps) {
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; value: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ymapsReady, setYmapsReady] = useState(false);
  const [ymapsFailed, setYmapsFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadYmaps().then((ym) => {
      if (ym) setYmapsReady(true);
      else setYmapsFailed(true);
    }).catch(() => setYmapsFailed(true));
  }, []);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 2 || !ymapsReady) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const ymaps = await loadYmaps();
      if (!ymaps) { setIsLoading(false); return; }
      const res = await ymaps.suggest(text, { results: 5 });
      const items = (res || []).map((r: any) => ({
        displayName: r.displayName || r.value || "",
        value: r.value || r.displayName || "",
      }));
      if (items.length > 0) {
        setSuggestions(items);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch {
      setSuggestions([]);
      setIsOpen(false);
      setYmapsFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [ymapsReady]);

  const selectSuggestion = async (s: { displayName: string; value: string }) => {
    onChange(s.value);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);

    if (onGeoResult && ymapsReady) {
      try {
        const ymaps = await loadYmaps();
        if (!ymaps) return;
        const geocodeResult = await ymaps.geocode(s.value, { results: 1 });
        const geoObject = geocodeResult.geoObjects.get(0);
        if (geoObject) {
          const coords = geoObject.geometry.getCoordinates();
          onGeoResult({
            address: geoObject.getAddressLine() || s.value,
            lat: String(coords[0]),
            lon: String(coords[1]),
          });
        } else {
          onGeoResult(null);
        }
      } catch {
        onGeoResult(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className={`pl-9 ${className || ""}`}
          data-testid={testId}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg" data-testid="dropdown-address-suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`w-full text-left px-3 py-2.5 text-sm flex items-start gap-2.5 transition-colors ${
                i === activeIndex ? "bg-accent" : "hover-elevate"
              } ${i === 0 ? "rounded-t-md" : ""} ${i === suggestions.length - 1 ? "rounded-b-md" : ""}`}
              onClick={() => selectSuggestion(s)}
              data-testid={`option-address-suggestion-${i}`}
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="truncate">{s.displayName}</p>
            </button>
          ))}
        </div>
      )}
      {ymapsFailed && (
        <p className="text-xs text-muted-foreground mt-1" data-testid="text-yandex-api-warning">
          Автодополнение адреса недоступно. Введите адрес вручную.
        </p>
      )}
    </div>
  );
}
