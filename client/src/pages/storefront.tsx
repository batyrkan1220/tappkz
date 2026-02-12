import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Plus, Minus, Trash2, ImageIcon, MapPin, Phone, ChevronLeft, X, CreditCard } from "lucide-react";
import { SiWhatsapp, SiInstagram } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerComment, setCustomerComment] = useState("");

  const { data, isLoading, error } = useQuery<StoreData>({
    queryKey: ["/api/storefront", params.slug],
  });

  useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/storefront/${params.slug}/event`, { eventType: "visit" });
    },
  });

  const store = data?.store;
  const products = data?.products || [];
  const categories = data?.categories || [];
  const theme = data?.theme;
  const settings = data?.settings;

  const primaryColor = theme?.primaryColor || "#2563eb";

  const filteredProducts = useMemo(() => {
    if (activeCategory === null) return products.filter((p) => p.isActive);
    return products.filter((p) => p.isActive && p.categoryId === activeCategory);
  }, [products, activeCategory]);

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

  const handleCheckout = () => {
    if (!store || !settings) return;
    const itemsText = cart
      .map((i) => {
        const price = i.product.discountPrice || i.product.price;
        return `${i.quantity}x ${i.product.name} - ${formatPrice(price * i.quantity)}`;
      })
      .join("\n");

    let msg = (settings.whatsappTemplate || "")
      .replace("{store_name}", store.name)
      .replace("{customer_name}", customerName)
      .replace("{customer_phone}", customerPhone)
      .replace("{address}", customerAddress || "Не указан")
      .replace("{comment}", customerComment || "Нет")
      .replace("{items}", itemsText)
      .replace("{total}", new Intl.NumberFormat("ru-KZ").format(cartTotal));

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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-sm p-8 text-center">
          <p className="text-lg font-semibold">Магазин не найден</p>
          <p className="mt-1 text-sm text-muted-foreground">Проверьте ссылку и попробуйте снова</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {theme?.bannerUrl && (
        <div className="h-36 w-full overflow-hidden sm:h-48">
          <img src={theme.bannerUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm" style={{ borderBottomColor: primaryColor + "30" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {theme?.logoUrl ? (
            <img src={theme.logoUrl} alt={store.name} className="h-10 w-10 rounded-md object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: primaryColor + "20" }}>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>{store.name[0]}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold" style={{ color: primaryColor }} data-testid="text-store-name">{store.name}</h1>
            {store.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {store.city}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {settings?.instagramUrl && (
              <a href={`https://instagram.com/${settings.instagramUrl.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                <Button size="icon" variant="ghost">
                  <SiInstagram className="h-4 w-4" />
                </Button>
              </a>
            )}
            {settings?.phoneNumber && (
              <a href={`tel:${settings.phoneNumber}`}>
                <Button size="icon" variant="ghost">
                  <Phone className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        {store.description && (
          <div className="mx-auto max-w-2xl px-4 pb-3">
            <p className="text-sm text-muted-foreground">{store.description}</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mx-auto max-w-2xl">
            <ScrollArea className="w-full">
              <div className="flex gap-1 px-4 pb-2">
                <Button
                  variant={activeCategory === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                  style={activeCategory === null ? { backgroundColor: primaryColor } : {}}
                  data-testid="button-category-all"
                >
                  Все
                </Button>
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    variant={activeCategory === c.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(c.id)}
                    style={activeCategory === c.id ? { backgroundColor: primaryColor } : {}}
                    data-testid={`button-category-${c.id}`}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Товары пока не добавлены</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredProducts.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer overflow-hidden hover-elevate"
                onClick={() => setSelectedProduct(p)}
                data-testid={`card-storefront-product-${p.id}`}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {p.imageUrls?.[0] ? (
                    <img src={p.imageUrls[0]} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-sm font-medium leading-tight" data-testid={`text-storefront-product-name-${p.id}`}>{p.name}</p>
                  {settings?.showPrices !== false && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {p.discountPrice ? (
                        <>
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>{formatPrice(p.discountPrice)}</span>
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold">{formatPrice(p.price)}</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md p-0">
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
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                )}
                {settings?.showPrices !== false && (
                  <div className="flex items-center gap-2">
                    {selectedProduct.discountPrice ? (
                      <>
                        <span className="text-xl font-bold" style={{ color: primaryColor }}>{formatPrice(selectedProduct.discountPrice)}</span>
                        <span className="text-muted-foreground line-through">{formatPrice(selectedProduct.price)}</span>
                        <Badge variant="secondary" className="text-xs" style={{ backgroundColor: primaryColor + "15", color: primaryColor }}>
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
                      <img key={i} src={url} alt="" className="h-16 w-16 shrink-0 rounded-md border object-cover" />
                    ))}
                  </div>
                )}
                <Button
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  data-testid="button-add-to-cart-detail"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Добавить в корзину
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-open-cart">
                  <ShoppingCart className="h-4 w-4" />
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">{cartCount}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Корзина</SheetTitle>
                </SheetHeader>
                <ScrollArea className="mt-4 max-h-[50vh]">
                  <div className="space-y-3 pr-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3" data-testid={`cart-item-${item.product.id}`}>
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.product.imageUrls?.[0] ? (
                            <img src={item.product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.product.name}</p>
                          <p className="text-sm" style={{ color: primaryColor }}>
                            {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.product.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="font-semibold">Итого:</span>
                  <span className="text-lg font-bold" style={{ color: primaryColor }} data-testid="text-cart-total">{formatPrice(cartTotal)}</span>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" data-testid="text-bottom-total">{formatPrice(cartTotal)}</span>
              <Button
                style={{ backgroundColor: "#25D366" }}
                className="gap-2 text-white"
                onClick={() => setCheckoutOpen(true)}
                data-testid="button-checkout"
              >
                <SiWhatsapp className="h-4 w-4" />
                Оформить заказ
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ваше имя *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Алия Нурланова" data-testid="input-checkout-name" />
            </div>
            <div>
              <Label>Телефон *</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+7 777 123 45 67" data-testid="input-checkout-phone" />
            </div>
            <div>
              <Label>Адрес доставки</Label>
              <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="ул. Абая 1, кв 10" data-testid="input-checkout-address" />
            </div>
            <div>
              <Label>Комментарий</Label>
              <Textarea value={customerComment} onChange={(e) => setCustomerComment(e.target.value)} placeholder="Пожелания к заказу" data-testid="input-checkout-comment" />
            </div>

            <div className="rounded-md border p-3">
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
              className="w-full gap-2 text-white"
              style={{ backgroundColor: "#25D366" }}
              disabled={!customerName || !customerPhone}
              onClick={handleCheckout}
              data-testid="button-send-whatsapp"
            >
              <SiWhatsapp className="h-5 w-5" />
              Оформить заказ в WhatsApp
            </Button>

            {settings?.kaspiEnabled && settings?.kaspiPayUrl && (
              <div className="border-t pt-4">
                <p className="mb-2 text-center text-sm font-medium text-muted-foreground">Оплата</p>
                <a
                  href={settings.kaspiPayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-kaspi-pay"
                >
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400"
                    data-testid="button-kaspi-pay"
                  >
                    <CreditCard className="h-4 w-4" />
                    Оплатить через Kaspi
                  </Button>
                </a>
                {settings.kaspiRecipientName && (
                  <p className="mt-1.5 text-center text-xs text-muted-foreground" data-testid="text-kaspi-recipient">
                    Получатель: {settings.kaspiRecipientName}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
