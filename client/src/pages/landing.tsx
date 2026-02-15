import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Globe,
  Menu,
  X,
  Star,
  ShoppingBag,
  ShoppingCart,
  Store,
  MapPin,
  Clock,
  Send,
  Bell,
  Search,
  Plus,
  Phone,
  Check,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { TappLogo } from "@/components/tapp-logo";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import mockNapoleon from "@/assets/images/mock-cake-napoleon.png";
import mockMacarons from "@/assets/images/mock-macarons.png";
import mockEclair from "@/assets/images/mock-eclair.png";
import mockCheesecake from "@/assets/images/mock-cheesecake.png";
import mockMedovik from "@/assets/images/mock-medovik.png";
import mockCroissant from "@/assets/images/mock-croissant.png";
import mockTruffles from "@/assets/images/mock-truffles.png";
import mockBerryTart from "@/assets/images/mock-berry-tart.png";
import mockTiramisu from "@/assets/images/mock-tiramisu.png";
import mockCinnamonRoll from "@/assets/images/mock-cinnamon-roll.png";
import mockBanner from "@/assets/images/mock-confectionery-banner.png";
import mockLogo from "@/assets/images/mock-sweetbaker-logo.png";

const MOCK_CATEGORIES = ["Все", "Торты", "Пирожные", "Выпечка", "Конфеты", "Десерты"];

const MOCK_PRODUCTS = [
  { name: "Торт Наполеон", price: "6 500", old: "7 800", cat: "Торты", img: mockNapoleon },
  { name: "Макаронс набор", price: "5 200", cat: "Пирожные", img: mockMacarons },
  { name: "Эклер шоколадный", price: "890", cat: "Пирожные", img: mockEclair },
  { name: "Чизкейк клубника", price: "1 800", cat: "Десерты", img: mockCheesecake },
  { name: "Медовик", price: "5 800", cat: "Торты", img: mockMedovik },
  { name: "Круассан", price: "750", cat: "Выпечка", img: mockCroissant },
  { name: "Трюфели набор", price: "7 400", old: "8 900", cat: "Конфеты", img: mockTruffles },
  { name: "Торт ягодный", price: "3 900", cat: "Десерты", img: mockBerryTart },
  { name: "Тирамису", price: "2 200", cat: "Десерты", img: mockTiramisu },
  { name: "Синнабон", price: "1 400", cat: "Выпечка", img: mockCinnamonRoll },
];

type DemoStep =
  | "browse"
  | "tap1" | "added1"
  | "scroll-down"
  | "switch-cat"
  | "tap2" | "added2"
  | "tap3" | "added3"
  | "cart-open"
  | "checkout"
  | "fill-form"
  | "whatsapp";

const STEP_ORDER: DemoStep[] = [
  "browse",
  "tap1", "added1",
  "switch-cat",
  "tap2", "added2",
  "tap3", "added3",
  "cart-open",
  "checkout",
  "fill-form",
  "whatsapp",
];

const STEP_DURATIONS: Record<DemoStep, number> = {
  browse: 2200,
  tap1: 900, added1: 1100,
  "scroll-down": 1500,
  "switch-cat": 1600,
  tap2: 900, added2: 1100,
  tap3: 900, added3: 1100,
  "cart-open": 2200,
  checkout: 1800,
  "fill-form": 2200,
  whatsapp: 3500,
};

const DESSERT_PRODUCTS = MOCK_PRODUCTS.filter(p => p.cat === "Десерты");

const CART_ITEMS = [
  MOCK_PRODUCTS[0],
  MOCK_PRODUCTS[3],
  MOCK_PRODUCTS[7],
];

function AnimatedPhoneMockup() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEP_ORDER[stepIndex];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStepIndex((prev) => (prev + 1) % STEP_ORDER.length);
    }, STEP_DURATIONS[step]);
    return () => clearTimeout(timeout);
  }, [stepIndex, step]);

  const stepIdx = STEP_ORDER.indexOf(step);
  const cartCount =
    stepIdx <= 1 ? 0 :
    stepIdx <= 3 ? 1 :
    stepIdx <= 5 ? 2 : 3;

  const cartTotals = ["", "6 500 ₸", "8 300 ₸", "12 200 ₸"];
  const cartTotal = cartTotals[cartCount];

  const showStorefront = [
    "browse", "tap1", "added1",
    "switch-cat",
    "tap2", "added2", "tap3", "added3",
  ].includes(step);
  const showCart = step === "cart-open";
  const showCheckout = step === "checkout" || step === "fill-form";
  const showWhatsapp = step === "whatsapp";

  const isScrolled = false;
  const isCatSwitched = stepIdx >= STEP_ORDER.indexOf("switch-cat") && stepIdx <= STEP_ORDER.indexOf("added3");

  const tappedProduct = step === "tap1" ? 0 : -1;
  const tappedDessert = step === "tap2" ? 0 : step === "tap3" ? 1 : -1;

  const addedProducts = new Set<number>();
  if (stepIdx >= 2) addedProducts.add(0);

  const addedDesserts = new Set<number>();
  if (stepIdx >= 5) addedDesserts.add(0);
  if (stepIdx >= 7) addedDesserts.add(1);

  const showAddedAnimation = step === "added1";
  const showDessertAddedAnimation = step === "added2" || step === "added3";
  const addedAnimIdx = step === "added1" ? 0 : -1;
  const addedDessertAnimIdx = step === "added2" ? 0 : step === "added3" ? 1 : -1;

  const activeCategory = isCatSwitched ? 5 : 0;
  const displayProducts = isCatSwitched ? DESSERT_PRODUCTS : MOCK_PRODUCTS.slice(0, 8);

  return (
    <div className="relative" data-testid="mockup-phone">
      <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-[3.5rem] blur-2xl" />
      <div className="relative mx-auto w-[280px] rounded-[3.2rem] bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-400 dark:from-zinc-400 dark:via-zinc-600 dark:to-zinc-400 p-[3px] shadow-2xl" style={{ boxShadow: "0 30px 70px -15px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)" }}>
        <div className="absolute -right-[2px] top-[120px] w-[3px] h-[35px] rounded-r-sm bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-400 dark:from-zinc-400 dark:via-zinc-500 dark:to-zinc-400" />
        <div className="absolute -right-[2px] top-[170px] w-[3px] h-[35px] rounded-r-sm bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-400 dark:from-zinc-400 dark:via-zinc-500 dark:to-zinc-400" />
        <div className="absolute -left-[2px] top-[100px] w-[3px] h-[20px] rounded-l-sm bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-400 dark:from-zinc-400 dark:via-zinc-500 dark:to-zinc-400" />
        <div className="absolute -left-[2px] top-[145px] w-[3px] h-[50px] rounded-l-sm bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-400 dark:from-zinc-400 dark:via-zinc-500 dark:to-zinc-400" />
        <div className="rounded-[3rem] bg-black p-[3px]">
          <div className="rounded-[2.8rem] overflow-hidden bg-white dark:bg-zinc-900 relative" style={{ height: "580px" }}>
            <div className="absolute top-[12px] left-1/2 -translate-x-1/2 h-[28px] w-[105px] bg-black rounded-full z-20 flex items-center justify-end pr-[18px]">
              <div className="h-[10px] w-[10px] rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #2a2a3e 0%, #0a0a12 50%, #1a1a2e 100%)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1), 0 0 3px rgba(50,50,80,0.3)" }} />
            </div>
            <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 h-[4px] w-[100px] bg-foreground/20 rounded-full z-20" />

            <div className="absolute inset-0 transition-all duration-500" style={{ opacity: showStorefront ? 1 : 0, transform: showStorefront ? "translateX(0)" : "translateX(-100%)", pointerEvents: showStorefront ? "auto" : "none" }}>
              <div className="flex items-center justify-between gap-2 px-3 pt-[48px] pb-2 border-b border-border/30">
                <div className="h-6 w-6 flex items-center justify-center">
                  <Menu className="h-3.5 w-3.5 text-foreground/70" />
                </div>
                <div className="w-6" />
                <div className="flex items-center gap-1">
                  <div className="h-6 w-6 flex items-center justify-center">
                    <Search className="h-3.5 w-3.5 text-foreground/70" />
                  </div>
                  <div className="h-6 w-6 flex items-center justify-center relative">
                    <ShoppingBag className="h-3.5 w-3.5 text-foreground/70" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary text-[6px] text-white flex items-center justify-center font-bold animate-in zoom-in duration-300">{cartCount}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative mx-2.5 mt-2">
                <div className="h-[68px] w-full overflow-hidden rounded-xl">
                  <img src={mockBanner} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/25 rounded-xl" />
                </div>
              </div>
              <div className="flex flex-col items-center -mt-5 relative z-10">
                <div className="h-11 w-11 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-md overflow-hidden"><img src={mockLogo} alt="Sweet Baker" className="h-full w-full object-cover" /></div>
                <p className="text-[10px] font-bold tracking-tight mt-1">Sweet Baker</p>
                <p className="text-[7px] text-muted-foreground mt-0.5 text-center px-6 leading-relaxed">Домашние торты, пирожные и десерты с доставкой по Алматы</p>
                <p className="text-[7px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="h-1.5 w-1.5" /> Алматы</p>
              </div>
              <div className="mx-3 mt-2 border-b border-border/30 pb-0">
                <div className="flex">
                  <div className="flex-1 text-center pb-1.5 border-b-2 border-foreground"><span className="text-[9px] font-semibold">Товары</span></div>
                  <div className="flex-1 text-center pb-1.5 text-muted-foreground"><span className="text-[9px] font-medium flex items-center justify-center gap-0.5"><Search className="h-2 w-2" /> Поиск</span></div>
                </div>
              </div>
              <div className="px-3 pt-2 pb-1.5">
                <div className="flex gap-1.5 overflow-hidden">
                  {MOCK_CATEGORIES.map((cat, i) => (
                    <span key={i} className={`shrink-0 rounded-full px-2 py-[3px] text-[8px] transition-all duration-400 ${i === activeCategory ? "bg-primary text-white font-semibold" : "bg-muted text-foreground font-medium"}`}>{cat}</span>
                  ))}
                </div>
              </div>
              <div className="px-3 pb-2 flex-1 overflow-hidden relative">
                <div className={`grid grid-cols-2 gap-1.5 transition-all duration-700 ease-in-out ${isCatSwitched ? "animate-in fade-in duration-500" : ""}`} style={{ transform: isScrolled && !isCatSwitched ? "translateY(-160px)" : "translateY(0)" }}>
                  {displayProducts.map((item, i) => {
                    const isTapped = isCatSwitched ? tappedDessert === i : tappedProduct === i;
                    const isInCart = isCatSwitched ? addedDesserts.has(i) : addedProducts.has(i);
                    const isAnimating = isCatSwitched
                      ? (showDessertAddedAnimation && addedDessertAnimIdx === i)
                      : (showAddedAnimation && addedAnimIdx === i);
                    return (
                    <div key={`${isCatSwitched ? "d" : "a"}-${i}`} className={`overflow-hidden rounded-lg border bg-card transition-all duration-300 ${isTapped ? "border-primary ring-2 ring-primary/30 scale-[0.96]" : "border-border/40"}`} data-testid={`mockup-product-${i}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                        {item.old && <span className="absolute top-1 left-1 rounded-full bg-primary text-white text-[6px] font-bold px-1 py-[1px]">-{Math.round((1 - parseInt(item.price.replace(/\s/g, '')) / parseInt(item.old.replace(/\s/g, ''))) * 100)}%</span>}
                        <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isTapped || isInCart ? "bg-primary scale-110" : "bg-white/90"}`}>
                          {isTapped || isInCart ? <Check className="h-2.5 w-2.5 text-white" /> : <Plus className="h-2.5 w-2.5 text-foreground/70" />}
                        </div>
                        {isAnimating && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-primary/90 flex items-center justify-center animate-in zoom-in fade-in duration-300"><Check className="h-4 w-4 text-white" /></div>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-[8px] font-semibold leading-tight line-clamp-2">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="text-[8px] font-bold text-primary">{item.price} ₸</span>
                          {item.old && <span className="text-[6px] text-muted-foreground line-through">{item.old} ₸</span>}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                {!isCatSwitched && <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />}
              </div>
              {cartCount > 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 animate-in slide-in-from-bottom duration-400">
                  <div className="flex items-center justify-between rounded-xl py-2 px-3 text-white" style={{ backgroundColor: "hsl(var(--primary))" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/20 px-1 text-[7px] font-bold">{cartCount}</span>
                      <span className="text-[9px] font-semibold">Корзина</span>
                    </div>
                    <span className="text-[9px] font-bold">{cartTotal}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute inset-0 transition-all duration-500" style={{ opacity: showCart ? 1 : 0, transform: showCart ? "translateX(0)" : "translateX(100%)", pointerEvents: showCart ? "auto" : "none" }}>
              <div className="flex items-center gap-2 px-3 pt-[48px] pb-2 border-b border-border/30">
                <ArrowRight className="h-3.5 w-3.5 text-foreground/70 rotate-180" />
                <span className="text-[10px] font-bold flex-1">Корзина</span>
                <span className="text-[8px] text-muted-foreground">3 товара</span>
              </div>
              <div className="px-3 pt-2 space-y-1.5">
                {CART_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 p-1.5 bg-card">
                    <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0"><img src={item.img} alt={item.name} className="h-full w-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-semibold leading-tight">{item.name}</p>
                      <p className="text-[7px] text-primary font-bold mt-0.5">{item.price} ₸</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3.5 w-3.5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold">-</div>
                      <span className="text-[8px] font-bold w-2.5 text-center">1</span>
                      <div className="h-3.5 w-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[7px] font-bold">+</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-3 mt-2 pt-2 border-t border-border/30 space-y-0.5">
                {CART_ITEMS.map((item, i) => (
                  <div key={i} className="flex justify-between text-[7px] text-muted-foreground"><span>{item.name}</span><span>{item.price} ₸</span></div>
                ))}
                <div className="flex justify-between text-[10px] font-bold mt-1.5 pt-1.5 border-t border-border/30"><span>Итого</span><span>12 200 ₸</span></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <div className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-white font-semibold text-[10px]" style={{ backgroundColor: "hsl(var(--primary))" }}>Оформить заказ <ArrowRight className="h-3 w-3" /></div>
              </div>
            </div>

            <div className="absolute inset-0 transition-all duration-500" style={{ opacity: showCheckout ? 1 : 0, transform: showCheckout ? "translateX(0)" : "translateX(100%)", pointerEvents: showCheckout ? "auto" : "none" }}>
              <div className="flex items-center gap-2 px-3 pt-[48px] pb-2 border-b border-border/30">
                <ArrowRight className="h-3.5 w-3.5 text-foreground/70 rotate-180" />
                <span className="text-[10px] font-bold flex-1">Оформление заказа</span>
              </div>
              <div className="px-3 pt-3 space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-[8px] text-muted-foreground font-medium mb-0.5 block">Ваше имя</label>
                    <div className={`rounded-lg border px-2 py-1.5 text-[9px] transition-all duration-700 ${step === "fill-form" ? "border-primary bg-primary/5" : "border-border/40 bg-muted/30"}`}>
                      <span className={`transition-opacity duration-500 ${step === "fill-form" ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"}`}>{step === "fill-form" ? "Айгуль" : "Введите имя"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] text-muted-foreground font-medium mb-0.5 block">Телефон</label>
                    <div className={`rounded-lg border px-2 py-1.5 text-[9px] transition-all duration-700 ${step === "fill-form" ? "border-primary bg-primary/5" : "border-border/40 bg-muted/30"}`}>
                      <span className={`transition-opacity duration-500 ${step === "fill-form" ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"}`}>{step === "fill-form" ? "+7 701 456 78 90" : "+7 (___) ___ __ __"}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 p-2 bg-card space-y-1">
                  <p className="text-[7px] font-semibold text-muted-foreground">Ваш заказ</p>
                  {CART_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded overflow-hidden bg-muted"><img src={item.img} alt="" className="h-full w-full object-cover" /></div>
                        <span className="text-[7px]">{item.name}</span>
                      </div>
                      <span className="text-[7px] font-bold">{item.price} ₸</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t border-border/30">
                    <span className="text-[8px] font-bold">Итого</span>
                    <span className="text-[8px] font-bold text-primary">12 200 ₸</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <div className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-white font-semibold text-[10px] transition-all duration-500 ${step === "fill-form" ? "opacity-100" : "opacity-40"}`} style={{ backgroundColor: "#25D366" }}>
                  <SiWhatsapp className="h-3.5 w-3.5" /> Отправить в WhatsApp
                </div>
              </div>
            </div>

            <div className="absolute inset-0 transition-all duration-500 flex flex-col" style={{ opacity: showWhatsapp ? 1 : 0, transform: showWhatsapp ? "scale(1)" : "scale(0.95)", pointerEvents: showWhatsapp ? "auto" : "none" }}>
              <div className="flex items-center gap-2 px-3 pt-[48px] pb-2 border-b" style={{ borderColor: "#25D366", backgroundColor: "#dcf8c6" }}>
                <ArrowRight className="h-3.5 w-3.5 rotate-180" style={{ color: "#075E54" }} />
                <div className="h-6 w-6 rounded-full overflow-hidden"><img src={mockLogo} alt="Sweet Baker" className="h-full w-full object-cover" /></div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold" style={{ color: "#075E54" }}>Sweet Baker</p>
                  <p className="text-[7px]" style={{ color: "#128C7E" }}>онлайн</p>
                </div>
                <Phone className="h-3 w-3" style={{ color: "#075E54" }} />
              </div>
              <div className="flex-1 px-3 pt-3 space-y-2 overflow-hidden" style={{ backgroundColor: "#ece5dd" }}>
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-lg px-2 py-1.5 text-[8px] leading-relaxed shadow-sm" style={{ backgroundColor: "#dcf8c6" }}>
                    <p className="font-semibold mb-0.5">Заказ №285</p>
                    <p>1x Торт Наполеон — 6 500 ₸</p>
                    <p>1x Чизкейк клубника — 1 800 ₸</p>
                    <p>1x Торт ягодный — 3 900 ₸</p>
                    <p className="font-bold mt-1 pt-1 border-t" style={{ borderColor: "#b5d8a0" }}>Итого: 12 200 ₸</p>
                    <p className="mt-1">Имя: Айгуль</p>
                    <p>Тел: +7 701 456 78 90</p>
                    <p className="mt-1 underline" style={{ color: "#1a73e8" }}>Чек: tapp.kz/invoice/285</p>
                    <div className="flex items-center justify-end gap-0.5 mt-1">
                      <span className="text-[6px]" style={{ color: "#999" }}>12:34</span>
                      <Check className="h-2 w-2" style={{ color: "#53bdeb" }} />
                      <Check className="h-2 w-2 -ml-1.5" style={{ color: "#53bdeb" }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-lg px-2 py-1.5 text-[8px] bg-white shadow-sm">
                    <p>Спасибо за заказ! Готовим ваши сладости!</p>
                    <div className="flex items-center justify-end gap-0.5 mt-1">
                      <span className="text-[6px]" style={{ color: "#999" }}>12:35</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-2 py-2 flex items-center gap-1.5" style={{ backgroundColor: "#f0f0f0" }}>
                <div className="flex-1 rounded-full bg-white px-2.5 py-1.5 text-[8px] text-muted-foreground">Написать сообщение...</div>
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#25D366" }}><Send className="h-2.5 w-2.5 text-white" /></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {STEP_ORDER.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25"}`} />
        ))}
      </div>

      <div className="text-center mt-3">
        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
          {showStorefront && step === "browse" && "Клиент выбирает товары"}
          {(step === "tap1" || step === "added1") && "Добавляет в корзину..."}
          {(step === "tap2" || step === "added2") && "Ещё один товар..."}
          {showCart && "Просматривает корзину"}
          {step === "checkout" && "Заполняет данные"}
          {step === "fill-form" && "Вводит имя и телефон"}
          {showWhatsapp && "Заказ отправлен в WhatsApp!"}
        </p>
      </div>
    </div>
  );
}

type TariffData = Record<string, { price: number; limit: number; orderLimit: number; imageLimit: number; name: string; features: string[] }>;

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: tariffs } = useQuery<TariffData>({ queryKey: ["/api/tariffs"] });

  const pricingPlans = useMemo(() => {
    const t = tariffs || {};
    const free = t.free || { price: 0, limit: 30, orderLimit: 50, imageLimit: 20, name: "Базовый", features: [] };
    const biz = t.business || { price: 17500, limit: 500, orderLimit: -1, imageLimit: -1, name: "Бизнес", features: [] };
    const ent = t.enterprise || { price: 0, limit: 5000, orderLimit: -1, imageLimit: -1, name: "Корпоративный", features: [] };
    return [
      {
        key: "free",
        name: free.name || "Базовый",
        price: "0 ₸",
        priceSuffix: "навсегда",
        includesLabel: "Включает:",
        features: free.features.length > 0 ? free.features : [
          "50 заказов в месяц",
          "20 изображений",
          "Без комиссий",
          "WhatsApp заказы",
        ],
        highlight: false,
        cta: "Начать бесплатно",
        enabled: true,
      },
      {
        key: "business",
        name: biz.name || "Бизнес",
        price: `${biz.price.toLocaleString("ru-RU")} ₸`,
        priceSuffix: "/ мес",
        includesLabel: "Всё из Базового:",
        features: biz.features.length > 0 ? biz.features : [
          "Безлимитные заказы",
          "Безлимитные изображения",
          "Кастомный домен",
          "Убрать логотип Tapp",
          "Расширенная аналитика",
          "Приоритетная поддержка",
        ],
        highlight: true,
        cta: "Подключить",
        enabled: true,
      },
      {
        key: "enterprise",
        name: ent.name || "Корпоративный",
        price: "Договор",
        priceSuffix: "",
        includesLabel: "Всё из Бизнеса:",
        features: ent.features.length > 0 ? ent.features : [
          "Персональный менеджер",
          "Индивидуальные условия",
        ],
        highlight: false,
        cta: "Связаться",
        enabled: false,
      },
    ];
  }, [tariffs]);

  return (
    <div className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <TappLogo size={32} />
            <span className="text-lg font-extrabold tracking-tight" data-testid="text-brand-name">Tapp</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-features">Возможности</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-how">Как это работает</a>
            <a href="#pricing" className="text-sm text-muted-foreground font-medium transition-colors" data-testid="link-nav-pricing">Тарифы</a>
          </div>

          <div className="flex items-center gap-2.5">
            <a href="/login">
              <Button variant="ghost" size="sm" className="font-semibold" data-testid="button-login-nav">
                Войти
              </Button>
            </a>
            <a href="/register" className="hidden sm:block">
              <Button className="rounded-full font-semibold" data-testid="button-register-nav">
                Начать бесплатно
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-5 py-4 bg-white dark:bg-background space-y-1">
            <a href="#features" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-features">Возможности</a>
            <a href="#how-it-works" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-how">Как это работает</a>
            <a href="#pricing" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-pricing">Тарифы</a>
            <a href="/register" className="block pt-2">
              <Button className="w-full rounded-full font-semibold" data-testid="button-mobile-register">Начать бесплатно</Button>
            </a>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent dark:from-primary/[0.04]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px] dark:bg-primary/[0.04]" />
        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-8 md:pt-28 md:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] dark:bg-primary/[0.08] px-4 py-1.5 mb-8 text-sm font-medium text-primary" data-testid="badge-whatsapp-partner">
              <SiWhatsapp className="h-4 w-4" />
              <span>WhatsApp Business Partner</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem]" data-testid="text-hero-heading">
              Создайте онлайн-магазин{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">для WhatsApp</span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              Принимайте заказы, управляйте продажами и растите бизнес — всё через WhatsApp
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/register">
                <Button size="lg" className="rounded-full font-semibold shadow-lg shadow-primary/25" data-testid="button-hero-cta">
                  Начать бесплатно
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5" data-testid="text-check-free"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Бесплатно</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-nocode"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Без кода</span>
              <span className="flex items-center gap-1.5" data-testid="text-check-fast"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Готово за 5 минут</span>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <AnimatedPhoneMockup />
          </div>
        </div>
      </section>

      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-features-label">Возможности</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-features-heading">
              Упростите заказы через WhatsApp
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Меньше ошибок, быстрее сделки, больше продаж
            </p>
          </div>

          <div className="grid gap-20 lg:gap-28">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-3 py-1 mb-5">
                  <SiWhatsapp className="h-3.5 w-3.5 text-[#25D366]" />
                  <span className="text-xs font-semibold text-[#25D366]">WhatsApp</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-orders">
                  Чистые заказы без путаницы
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Клиенты собирают корзину, указывают контакты и отправляют готовый заказ прямо в ваш WhatsApp. Никаких потерянных сообщений.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Автоматическое формирование заказа", "Имя, телефон, адрес в одном сообщении", "Сумма и список товаров сразу видны", "Инвойс/чек для каждого заказа"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-order-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-orders">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-[#25D366]/[0.06] dark:bg-[#25D366]/[0.08] border border-[#25D366]/15 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15">
                      <SiWhatsapp className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" data-testid="text-order-number">Новый заказ #285</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Айгуль М. · +7 701 ***-**-90</p>
                      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                        <p>1x Торт Наполеон — 6 500 ₸</p>
                        <p>1x Чизкейк клубника — 1 800 ₸</p>
                        <p>1x Торт ягодный — 3 900 ₸</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">Итого: 12 200 ₸</p>
                        <Badge variant="secondary" className="bg-[#25D366]/15 text-[#25D366] border-[#25D366]/20 text-[10px]">Новый</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Ожидает</Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Оплачен</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Доставлен</Badge>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <Card className="p-6 lg:p-8 lg:order-first order-last bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-catalog">
                <div className="space-y-3">
                  {[
                    { name: "Торт Наполеон", cat: "Торты", price: "6 500 ₸", img: mockNapoleon },
                    { name: "Макаронс набор", cat: "Пирожные", price: "5 200 ₸", img: mockMacarons },
                    { name: "Эклер шоколадный", cat: "Пирожные", price: "890 ₸", img: mockEclair },
                    { name: "Медовик", cat: "Торты", price: "5 800 ₸", img: mockMedovik },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border p-3" data-testid={`catalog-item-${i}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden shrink-0"><img src={item.img} alt="" className="h-full w-full object-cover" /></div>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.cat}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-primary shrink-0">{item.price}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Каталог</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-catalog">
                  Красивое меню за минуты
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Добавьте блюда, загрузите фото, настройте цвета и логотип. Ваше меню готово — поделитесь ссылкой в Instagram, WhatsApp или на визитке.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Категории и каталог блюд с фото", "Логотип, баннер, фирменные цвета", "Адаптивный мобильный дизайн", "Ссылка-визитка для Instagram Bio"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-catalog-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-chart-3/10 px-3 py-1 mb-5">
                  <BarChart3 className="h-3.5 w-3.5 text-chart-3" />
                  <span className="text-xs font-semibold text-chart-3">Аналитика</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl" data-testid="text-feature-manage">
                  Управляйте заказами онлайн
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Отслеживайте статусы заказов, контролируйте оплату и доставку. Вся клиентская база и аналитика в одном месте.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Статусы: новый, подтверждён, выполнен", "Контроль оплаты и доставки", "База клиентов с историей покупок", "Графики продаж и аналитика"].map((item, i) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" data-testid={`text-manage-feature-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-chart-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="p-6 lg:p-8 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60" data-testid="card-feature-manage">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "247", label: "Заказов", tid: "orders", color: "text-primary" },
                      { val: "1.2M ₸", label: "Выручка", tid: "revenue", color: "text-chart-3" },
                      { val: "89", label: "Клиентов", tid: "clients", color: "text-chart-2" },
                      { val: "4.8K", label: "Просмотров", tid: "views", color: "text-chart-4" },
                    ].map((s) => (
                      <div key={s.tid} className="rounded-xl border p-3.5 text-center" data-testid={`text-stat-${s.tid}`}>
                        <p className={`text-2xl font-extrabold tracking-tight ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-xs font-semibold">Продажи за неделю</p>
                      <Badge variant="secondary" className="bg-chart-3/10 text-chart-3 text-[10px]">+23%</Badge>
                    </div>
                    <div className="flex items-end gap-1.5 h-14">
                      {[35, 52, 41, 68, 55, 72, 80].map((h, i) => (
                        <div key={i} className="flex-1 rounded-md bg-primary/15 dark:bg-primary/10" style={{ height: `${h}%` }}>
                          <div className="w-full h-full rounded-md bg-gradient-to-t from-primary to-primary/70" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between gap-1 mt-1.5">
                      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                        <span key={d} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-primary/[0.08] to-primary/[0.04] dark:from-primary/[0.03] dark:via-primary/[0.06] dark:to-primary/[0.03]" />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Smartphone, title: "26 типов бизнеса", desc: "Еда, торговля, услуги — платформа адаптируется", tid: "business-types" },
              { icon: Clock, title: "5 минут", desc: "Время от регистрации до готового магазина", tid: "setup-time" },
              { icon: Globe, title: "Ссылка-визитка", desc: "Поделитесь в Instagram, WhatsApp, визитке", tid: "share-link" },
              { icon: BarChart3, title: "Аналитика", desc: "Просмотры, заказы, выручка в реальном времени", tid: "analytics" },
            ].map((item) => (
              <div key={item.title} className="text-center" data-testid={`stat-${item.tid}`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-how-label">Просто как 1-2-3</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-how-heading">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Три шага от идеи до первого заказа
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Создайте магазин",
                desc: "Зарегистрируйтесь, выберите тип бизнеса, добавьте товары и настройте дизайн",
                icon: Store,
                gradient: "from-primary to-primary/70",
              },
              {
                step: "2",
                title: "Поделитесь ссылкой",
                desc: "Отправьте ссылку магазина клиентам через Instagram, WhatsApp или любой канал",
                icon: Send,
                gradient: "from-chart-3 to-chart-3/70",
              },
              {
                step: "3",
                title: "Принимайте заказы",
                desc: "Получайте готовые заказы в WhatsApp, управляйте ими в панели администратора",
                icon: Bell,
                gradient: "from-chart-2 to-chart-2/70",
              },
            ].map((step) => (
              <Card key={step.step} className="relative p-6 pt-8 text-center" data-testid={`card-step-${step.step}`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-white text-sm font-bold shadow-lg`}>
                    {step.step}
                  </div>
                </div>
                <div className="mt-2 mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.07] dark:bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/30 dark:bg-muted/10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-reviews-heading">
              Что говорят продавцы
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Айгерим К.",
                role: "Кондитерская",
                text: "Раньше заказы терялись в переписке. Теперь клиенты сами выбирают торты и отправляют готовый заказ. Экономлю 3 часа в день!",
              },
              {
                name: "Марат Т.",
                role: "Ресторан доставки",
                text: "Запустил меню за один вечер. Клиенты довольны — всё понятно, удобно, красиво. Заказов стало в 2 раза больше.",
              },
              {
                name: "Динара С.",
                role: "Магазин одежды",
                text: "Идеальное решение для Instagram-бизнеса. Ставлю ссылку в шапку профиля и покупатели сразу видят весь каталог с ценами.",
              },
            ].map((t, i) => (
              <Card key={i} className="p-6" data-testid={`card-testimonial-${i}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="border-t pt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <Badge variant="secondary" className="mb-4 rounded-full font-semibold" data-testid="badge-pricing-label">Тарифы</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-pricing-heading">
            Простые тарифы
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Начните бесплатно — масштабируйтесь когда будете готовы
          </p>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {pricingPlans.map((plan, planIdx) => (
              <Card
                key={plan.key}
                className={`relative p-6 text-left ${plan.highlight ? "border-foreground border-2" : ""}`}
                data-testid={`card-pricing-${planIdx}`}
              >
                <h3 className="text-base font-semibold" data-testid={`text-plan-name-${planIdx}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.priceSuffix && (
                    <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                  )}
                </div>

                <div className="mt-5">
                  {plan.enabled ? (
                    <a href="/register" className="block">
                      <Button
                        className={`w-full rounded-md font-semibold ${plan.highlight ? "bg-foreground text-background" : ""}`}
                        variant={plan.highlight ? "default" : "outline"}
                        data-testid={`button-pricing-${planIdx}`}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" className="w-full rounded-md font-semibold" data-testid={`button-pricing-${planIdx}`}>
                      {plan.cta}
                    </Button>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-sm text-muted-foreground font-medium mb-3">{plan.includesLabel}</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, fIdx) => (
                      <li key={f} className="flex items-start gap-2 text-sm" data-testid={`text-pricing-feature-${planIdx}-${fIdx}`}>
                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.key === "business" && (
                    <p className="mt-3 text-xs text-muted-foreground">И многое другое...</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative p-10 md:p-16 text-primary-foreground">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" data-testid="text-cta-heading">
                Готовы начать продавать?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-primary-foreground/80 leading-relaxed">
                Создайте магазин бесплатно и начните принимать заказы через WhatsApp уже сегодня
              </p>
              <div className="mt-8">
                <a href="/register">
                  <Button size="lg" className="bg-white text-primary rounded-full font-semibold shadow-xl" data-testid="button-cta-bottom">
                    Начать бесплатно
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
              <p className="mt-6 text-sm text-primary-foreground/60">
                Бесплатно навсегда. Без кредитной карты.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <TappLogo size={28} />
              <span className="text-sm font-extrabold tracking-tight">Tapp</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a href="#features" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-features">Возможности</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-how">Как это работает</a>
              <a href="#pricing" className="text-sm text-muted-foreground font-medium" data-testid="link-footer-pricing">Тарифы</a>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
              Tapp 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
