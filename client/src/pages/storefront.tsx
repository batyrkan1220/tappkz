import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, Plus, Minus, Trash2, ImageIcon, MapPin, Phone, Search, Menu, X, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { SiWhatsapp, SiInstagram } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { PhoneInput } from "@/components/phone-input";
import { getBusinessLabels } from "@shared/schema";
import type { Store, Product, Category, StoreTheme, StoreSettings } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreData {
  store: Store;
  products: Product[];
  categories: Category[];
  theme: StoreTheme;
  settings: StoreSettings;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ru-KZ").format(price) + " ₸";
}

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "search">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerComment, setCustomerComment] = useState("");
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const { data, isLoading, error } = useQuery<StoreData>({
    queryKey: ["/api/storefront", params.slug],
  });

  const [visitTracked, setVisitTracked] = useState(false);
  if (data && !visitTracked) {
    setVisitTracked(true);
    apiRequest("POST", `/api/storefront/${params.slug}/event`, { eventType: "visit" }).catch(() => {});
  }

  const store = data?.store;
  const products = data?.products || [];
  const categories = data?.categories || [];
  const theme = data?.theme;
  const settings = data?.settings;

  const businessLabels = getBusinessLabels(store?.businessType);

  const primaryColor = theme?.primaryColor || "#16a34a";
  const secondaryColor = theme?.secondaryColor || null;
  const bannerOverlay = theme?.bannerOverlay ?? true;

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => p.isActive);
    if (activeCategory !== null) {
      filtered = filtered.filter((p) => p.categoryId === activeCategory);
    }
    if (activeTab === "search" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [products, activeCategory, activeTab, searchQuery]);

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    apiRequest("POST", `/api/storefront/${params.slug}/event`, { eventType: "add_to_cart", metaJson: { productId: product.id } }).catch(() => {});
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!store || !settings || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const orderItems = cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.discountPrice || i.product.price,
        imageUrl: i.product.imageUrls?.[0] || null,
      }));

      const orderRes = await apiRequest("POST", `/api/storefront/${params.slug}/order`, {
        customerName,
        customerPhone,
        customerAddress: customerAddress || null,
        customerComment: customerComment || null,
        items: orderItems,
        paymentMethod: "whatsapp",
      });

      const order = await orderRes.json();
      const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;

      const itemsText = cart
        .map((i) => {
          const price = i.product.discountPrice || i.product.price;
          return `*${i.quantity}x* ${i.product.name} - ${formatPrice(price * i.quantity)}`;
        })
        .join("\n");

      const totalFormatted = new Intl.NumberFormat("ru-KZ").format(cartTotal);

      let msg = `*#${order.orderNumber}*\n\n`;
      msg += `${itemsText}\n\n`;
      msg += `Итого: *${totalFormatted} ₸*\n\n`;
      msg += `Покупатель: *${customerName}* ${customerPhone}\n`;
      if (customerAddress) msg += `Адрес: ${customerAddress}\n`;
      if (customerComment) msg += `Комментарий: ${customerComment}\n`;
      msg += `\nСмотреть счёт:\n${invoiceUrl}`;

      const encoded = encodeURIComponent(msg);
      const phone = store.whatsappPhone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");

      apiRequest("POST", `/api/storefront/${params.slug}/event`, { eventType: "checkout_click" }).catch(() => {});

      setCheckoutOpen(false);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerComment("");
    } catch (e) {
      console.error("Order creation failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryProductCount = (catId: number) => {
    return products.filter((p) => p.isActive && p.categoryId === catId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between px-4 py-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
        <Skeleton className="mx-4 h-40 rounded-2xl" />
        <div className="space-y-3 p-4 mt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-sm rounded-2xl border p-8 text-center bg-card">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-lg font-semibold">Магазин не найден</p>
          <p className="mt-1 text-sm text-muted-foreground">Проверьте ссылку и попробуйте снова</p>
        </div>
      </div>
    );
  }

  const tabLabel = businessLabels.itemLabelPlural;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMenuOpen(true)}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="w-9" />

          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { setActiveTab("search"); }}
              data-testid="button-search-top"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="relative" data-testid="button-open-cart">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Корзина</SheetTitle>
                </SheetHeader>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Корзина пуста</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="mt-4 flex-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
                      <div className="space-y-3 pr-2">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center gap-3 rounded-xl border p-2.5" data-testid={`cart-item-${item.product.id}`}>
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {item.product.imageUrls?.[0] ? (
                                <img src={item.product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.product.name}</p>
                              <p className="text-sm font-bold" style={{ color: primaryColor }}>
                                {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product.id)}>
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Итого:</span>
                        <span className="text-lg font-bold" style={{ color: primaryColor }} data-testid="text-cart-total">{formatPrice(cartTotal)}</span>
                      </div>
                      <Button
                        className="w-full gap-2 text-white rounded-full"
                        style={{ backgroundColor: "#25D366" }}
                        onClick={() => setCheckoutOpen(true)}
                        data-testid="button-checkout"
                      >
                        <SiWhatsapp className="h-4 w-4" />
                        Оформить заказ
                      </Button>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <div className="relative">
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="h-40 w-full sm:h-48"
              style={{
                background: theme?.bannerUrl
                  ? `url(${theme.bannerUrl}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}08)`,
              }}
            />
            {theme?.bannerUrl && bannerOverlay && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30 rounded-2xl" />
            )}
          </div>
        </div>
        <div className="flex flex-col items-center -mt-12 relative z-10">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            {theme?.logoUrl ? (
              <AvatarImage src={theme.logoUrl} alt={store.name} />
            ) : null}
            <AvatarFallback
              className="text-xl font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {store.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="mt-2 text-lg font-bold tracking-tight text-center" data-testid="text-store-name">
            {store.name}
          </h1>
          {store.city && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {store.city}
            </p>
          )}
          {store.description && (
            <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground px-4">
              {store.description}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-lg border-b border-border/30">
        <div className="flex">
          <button
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "overview" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            onClick={() => { setActiveTab("overview"); setSearchQuery(""); }}
            data-testid="tab-overview"
          >
            {tabLabel}
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "search" ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("search")}
            data-testid="tab-search"
          >
            <Search className="h-4 w-4" />
            Поиск
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 py-4 pb-28">
        {activeTab === "search" && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                data-testid="input-search"
                autoFocus
              />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "overview" && categories.length > 0 && (
          <div className="mb-4">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1">
                <button
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeCategory === null ? "text-white shadow-sm" : "bg-muted text-foreground"}`}
                  style={activeCategory === null ? { backgroundColor: primaryColor } : {}}
                  onClick={() => setActiveCategory(null)}
                  data-testid="button-category-all"
                >
                  Все
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeCategory === c.id ? "text-white shadow-sm" : "bg-muted text-foreground"}`}
                    style={activeCategory === c.id ? { backgroundColor: primaryColor } : {}}
                    onClick={() => setActiveCategory(c.id)}
                    data-testid={`button-category-${c.id}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {activeTab === "search" && searchQuery ? (
              <>
                <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Ничего не найдено по запросу "{searchQuery}"</p>
              </>
            ) : (
              <>
                <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Товары пока не добавлены</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((p) => {
              const cartItem = cart.find((i) => i.product.id === p.id);
              return (
                <div
                  key={p.id}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card"
                  onClick={() => setSelectedProduct(p)}
                  data-testid={`card-storefront-product-${p.id}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {p.imageUrls?.[0] ? (
                      <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {p.discountPrice && (
                      <Badge
                        className="absolute top-2 left-2 rounded-full text-[10px] px-1.5 py-0.5 text-white border-0"
                        style={{ backgroundColor: secondaryColor || primaryColor }}
                      >
                        -{Math.round((1 - p.discountPrice / p.price) * 100)}%
                      </Badge>
                    )}
                    {!cartItem ? (
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute bottom-2 right-2 rounded-full shadow-md bg-white/90 dark:bg-background/90 backdrop-blur-sm border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        data-testid={`button-add-to-cart-${p.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-white/90 dark:bg-background/90 backdrop-blur-sm shadow-md px-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(p.id, -1)}
                          data-testid={`button-qty-minus-${p.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{cartItem.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(p.id, 1)}
                          data-testid={`button-qty-plus-${p.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight line-clamp-2" data-testid={`text-storefront-product-name-${p.id}`}>{p.name}</p>
                    {settings?.showPrices !== false && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {p.discountPrice ? (
                          <>
                            <span className="text-sm font-bold" style={{ color: secondaryColor || primaryColor }}>{formatPrice(p.discountPrice)}</span>
                            <span className="text-[11px] text-muted-foreground line-through">{formatPrice(p.price)}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold">{formatPrice(p.price)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
                data-testid="button-bottom-cart"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
                    {cartCount}
                  </span>
                  <span className="font-semibold">Корзина</span>
                </div>
                <span className="font-bold" data-testid="text-bottom-total">{formatPrice(cartTotal)}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Корзина</SheetTitle>
              </SheetHeader>
              <ScrollArea className="mt-4" style={{ maxHeight: "calc(80vh - 200px)" }}>
                <div className="space-y-3 pr-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 rounded-xl border p-2.5" data-testid={`cart-item-bottom-${item.product.id}`}>
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.product.imageUrls?.[0] ? (
                          <img src={item.product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.product.name}</p>
                        <p className="text-sm font-bold" style={{ color: primaryColor }}>
                          {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, -1)} data-testid={`button-cart-qty-minus-${item.product.id}`}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, 1)} data-testid={`button-cart-qty-plus-${item.product.id}`}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product.id)} data-testid={`button-cart-remove-${item.product.id}`}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Итого:</span>
                  <span className="text-lg font-bold" style={{ color: primaryColor }} data-testid="text-bottom-cart-total">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  className="w-full gap-2 text-white rounded-full"
                  style={{ backgroundColor: "#25D366" }}
                  onClick={() => setCheckoutOpen(true)}
                  data-testid="button-checkout"
                >
                  <SiWhatsapp className="h-4 w-4" />
                  Оформить заказ
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>{selectedProduct?.description || "Подробности о товаре"}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <>
              <div className="aspect-square overflow-hidden bg-muted">
                {selectedProduct.imageUrls?.[0] ? (
                  <img src={selectedProduct.imageUrls[0]} alt={selectedProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <h2 className="text-xl font-bold" data-testid="text-product-detail-name">{selectedProduct.name}</h2>
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                )}
                {settings?.showPrices !== false && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedProduct.discountPrice ? (
                      <>
                        <span className="text-xl font-bold" style={{ color: secondaryColor || primaryColor }}>{formatPrice(selectedProduct.discountPrice)}</span>
                        <span className="text-muted-foreground line-through">{formatPrice(selectedProduct.price)}</span>
                        <Badge variant="secondary" className="text-xs rounded-full" style={{ backgroundColor: (secondaryColor || primaryColor) + "15", color: secondaryColor || primaryColor }}>
                          -{Math.round((1 - selectedProduct.discountPrice / selectedProduct.price) * 100)}%
                        </Badge>
                      </>
                    ) : (
                      <span className="text-xl font-bold">{formatPrice(selectedProduct.price)}</span>
                    )}
                  </div>
                )}
                {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedProduct.imageUrls.map((url, i) => (
                      <img key={i} src={url} alt="" className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
                    ))}
                  </div>
                )}
                <Button
                  className="w-full rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  data-testid="button-add-to-cart-detail"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> В корзину
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="sr-only">{store.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск"
                className="pl-9 rounded-full bg-muted/50 border-0"
                onClick={() => {
                  setActiveTab("search");
                  setMenuOpen(false);
                }}
                readOnly
                data-testid="input-menu-search"
              />
            </div>

            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover-elevate"
              onClick={() => {
                setActiveTab("overview");
                setActiveCategory(null);
                setSearchQuery("");
                setMenuOpen(false);
              }}
              data-testid="button-menu-all"
            >
              {tabLabel}
            </button>

            {categories.length > 0 && (
              <div>
                <button
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-bold"
                  onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                  data-testid="button-menu-categories-toggle"
                >
                  <span>{businessLabels.categoryLabel}</span>
                  {categoriesExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {categoriesExpanded && (
                  <div className="space-y-0.5 mt-1">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover-elevate ${activeCategory === c.id ? "font-semibold" : ""}`}
                        onClick={() => {
                          setActiveCategory(c.id);
                          setActiveTab("overview");
                          setMenuOpen(false);
                        }}
                        data-testid={`button-menu-category-${c.id}`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground">{getCategoryProductCount(c.id)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              {store.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-3">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{store.city}</span>
                </div>
              )}
              {settings?.phoneNumber && (
                <a href={`tel:${settings.phoneNumber}`} className="flex items-center gap-2 text-sm text-muted-foreground px-3">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{settings.phoneNumber}</span>
                </a>
              )}
              {settings?.instagramUrl && (
                <a
                  href={`https://instagram.com/${settings.instagramUrl.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground px-3"
                >
                  <SiInstagram className="h-4 w-4 shrink-0" />
                  <span>{settings.instagramUrl}</span>
                </a>
              )}
              {store.whatsappPhone && (
                <a
                  href={`https://wa.me/${store.whatsappPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground px-3"
                >
                  <SiWhatsapp className="h-4 w-4 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
            <DialogDescription>Заполните данные для оформления</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ваше имя *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Алия Нурланова" data-testid="input-checkout-name" />
            </div>
            <div>
              <Label>Телефон *</Label>
              <PhoneInput value={customerPhone} onValueChange={setCustomerPhone} data-testid="input-checkout-phone" />
            </div>
            {settings?.checkoutAddressEnabled && (
              <div>
                <Label>Адрес доставки</Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="ул. Абая 1, кв 10" data-testid="input-checkout-address" />
              </div>
            )}
            {settings?.checkoutCommentEnabled && (
              <div>
                <Label>Комментарий</Label>
                <Textarea value={customerComment} onChange={(e) => setCustomerComment(e.target.value)} placeholder="Пожелания к заказу" data-testid="input-checkout-comment" />
              </div>
            )}

            <div className="rounded-xl border p-3">
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between gap-2">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span className="shrink-0">{formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                <span>Итого</span>
                <span data-testid="text-checkout-total">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full gap-2 text-white rounded-full"
              style={{ backgroundColor: "#25D366" }}
              disabled={!customerName || !customerPhone || customerPhone.replace(/\D/g, "").length < 11 || isSubmitting}
              onClick={handleCheckout}
              data-testid="button-send-whatsapp"
            >
              <SiWhatsapp className="h-5 w-5" />
              {isSubmitting ? "Создание заказа..." : "Оформить заказ в WhatsApp"}
            </Button>

          </div>
        </DialogContent>
      </Dialog>

      <footer className="mx-auto max-w-lg border-t border-border/30 px-4 py-6 text-center">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground" data-testid="link-footer-takesale">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground">
            <ShoppingBag className="h-3 w-3 text-background" />
          </div>
          <span>Сделано в <span className="font-semibold text-foreground">TakeSale</span></span>
        </a>
      </footer>
    </div>
  );
}
