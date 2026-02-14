import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, QrCode, Wifi, WifiOff, ArrowLeft, RefreshCw, Trash2, Search, AlertTriangle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import QRCode from "qrcode";

interface WhatsAppAccount {
  id: string;
  provider: string;
  status: string;
  name?: string;
  identifier?: string;
}

interface Chat {
  id: string;
  name?: string;
  timestamp?: string;
  last_message?: string;
  unread_count?: number;
  attendees_count?: number;
  attendees?: { display_name?: string; id?: string; profile_picture?: string }[];
}

interface Message {
  id: string;
  text?: string;
  body?: string;
  timestamp?: string;
  created_at?: string;
  sender_id?: string;
  is_sender?: boolean;
  sender?: { display_name?: string; id?: string };
  role?: string;
}

function formatTime(ts: string | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const kzOffset = 5 * 60 * 60 * 1000;
  const kzDate = new Date(d.getTime() + kzOffset);
  const kzNow = new Date(now.getTime() + kzOffset);
  const isToday = kzDate.toDateString() === kzNow.toDateString();
  if (isToday) {
    return kzDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }
  return kzDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function NotConfiguredView() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/30">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight" data-testid="text-not-configured-title">WhatsApp Inbox не настроен</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm" data-testid="text-not-configured-description">
          Для работы WhatsApp Inbox необходимо настроить интеграцию с Unipile. Обратитесь к администратору платформы для настройки UNIPILE_DSN и UNIPILE_ACCESS_TOKEN.
        </p>
      </div>
    </div>
  );
}

function QRConnectView({ onConnected }: { onConnected: () => void }) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const data = await apiRequest("POST", "/api/whatsapp/connect");
      return data.json();
    },
    onSuccess: async (data: any) => {
      const qrText = data.checkpoint?.qrcode || data.qrcode || data.code;
      if (qrText) {
        const url = await QRCode.toDataURL(qrText, { width: 280, margin: 2 });
        setQrDataUrl(url);
      }
      const id = data.account_id || data.id;
      if (id) {
        setAccountId(id);
        setPolling(true);
      }
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка подключения", description: e.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!polling || !accountId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/whatsapp/account/${accountId}`);
        const data = await res.json();
        if (data.status === "OK" || data.status === "connected" || data.connection_params) {
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
          toast({ title: "WhatsApp подключён!" });
          onConnected();
        }
      } catch {}
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [polling, accountId]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-950/30">
        <SiWhatsapp className="h-8 w-8 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight" data-testid="text-connect-title">Подключите WhatsApp</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm" data-testid="text-connect-description">
          Отсканируйте QR-код в приложении WhatsApp, чтобы управлять сообщениями из этой панели
        </p>
      </div>
      {qrDataUrl ? (
        <div className="space-y-4 text-center">
          <Card className="inline-block p-4">
            <img src={qrDataUrl} alt="QR Code" className="h-[280px] w-[280px]" data-testid="img-whatsapp-qr" />
          </Card>
          <div className="space-y-1">
            <p className="text-sm font-medium" data-testid="text-qr-instruction">Откройте WhatsApp на телефоне</p>
            <p className="text-xs text-muted-foreground">Настройки → Связанные устройства → Привязка устройства</p>
          </div>
          {polling && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="text-polling-status">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Ожидание сканирования...
            </div>
          )}
          <Button variant="outline" onClick={() => connectMutation.mutate()} data-testid="button-refresh-qr">
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Обновить QR
          </Button>
        </div>
      ) : (
        <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} data-testid="button-connect-whatsapp">
          <QrCode className="mr-1.5 h-4 w-4" />
          {connectMutation.isPending ? "Генерация QR..." : "Получить QR-код"}
        </Button>
      )}
    </div>
  );
}

function ChatListView({ account, onSelectChat, selectedChatId }: { account: WhatsAppAccount; onSelectChat: (chat: Chat) => void; selectedChatId: string | null }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/whatsapp/chats", account.id],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/whatsapp/chats?account_id=${queryKey[1]}`, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    refetchInterval: 10000,
  });

  const chats: Chat[] = (data?.items || []);
  const filtered = chats.filter((c) => {
    if (!search) return true;
    const name = c.name || c.attendees?.[0]?.display_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <SiWhatsapp className="h-5 w-5 text-green-600 shrink-0" />
            <span className="font-semibold text-sm truncate" data-testid="text-account-name">{account.name || account.identifier || "WhatsApp"}</span>
            <Badge variant="secondary" className="text-[10px] rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
              <Wifi className="mr-0.5 h-2.5 w-2.5" /> <span data-testid="text-account-status">Онлайн</span>
            </Badge>
          </div>
          <Button size="icon" variant="ghost" onClick={() => refetch()} data-testid="button-refresh-chats">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск чатов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
            data-testid="input-search-chats"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-chats">Нет чатов</p>
          </div>
        ) : (
          <div>
            {filtered.map((chat) => {
              const chatName = chat.name || chat.attendees?.[0]?.display_name || "Без имени";
              const avatar = chat.attendees?.[0]?.profile_picture;
              const isSelected = selectedChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover-elevate ${isSelected ? "bg-accent" : ""}`}
                  data-testid={`button-chat-${chat.id}`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                      {chatName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold" data-testid={`text-chat-name-${chat.id}`}>{chatName}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground" data-testid={`text-chat-time-${chat.id}`}>{formatTime(chat.timestamp)}</span>
                    </div>
                    {chat.last_message && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5" data-testid={`text-chat-preview-${chat.id}`}>{chat.last_message}</p>
                    )}
                  </div>
                  {(chat.unread_count ?? 0) > 0 && (
                    <Badge className="shrink-0 rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center bg-green-600 text-white no-default-hover-elevate no-default-active-elevate" data-testid={`badge-unread-${chat.id}`}>
                      {chat.unread_count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ChatView({ chat, accountId, onBack }: { chat: Chat; accountId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/whatsapp/chats", chat.id, "messages"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/whatsapp/chats/${queryKey[1]}/messages`, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    refetchInterval: 5000,
  });

  const messages: Message[] = (data?.items || []).slice().reverse();

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/whatsapp/messages", {
        chat_id: chat.id,
        text: messageText,
        account_id: accountId,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/chats", chat.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/chats", accountId] });
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка отправки", description: e.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const chatName = chat.name || chat.attendees?.[0]?.display_name || "Без имени";
  const chatAvatar = chat.attendees?.[0]?.profile_picture;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-3">
        <Button size="icon" variant="ghost" onClick={onBack} className="md:hidden" data-testid="button-chat-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={chatAvatar} />
          <AvatarFallback className="text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            {chatName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" data-testid="text-chat-name">{chatName}</p>
          <p className="text-[11px] text-muted-foreground" data-testid="text-chat-platform">WhatsApp</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground" data-testid="text-no-messages">Нет сообщений</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.is_sender || msg.role === "sender";
            const text = msg.text || msg.body || "";
            const time = formatTime(msg.timestamp || msg.created_at);
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isMine
                      ? "bg-green-600 text-white rounded-br-md"
                      : "bg-card border rounded-bl-md"
                  }`}
                  data-testid={`message-${msg.id}`}
                >
                  {text && <p className="whitespace-pre-wrap break-words" data-testid={`text-message-body-${msg.id}`}>{text}</p>}
                  <p className={`mt-0.5 text-[10px] text-right ${isMine ? "text-green-200" : "text-muted-foreground"}`} data-testid={`text-message-time-${msg.id}`}>
                    {time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (messageText.trim()) sendMutation.mutate();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Введите сообщение..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
            data-testid="input-message-text"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim() || sendMutation.isPending}
            className="rounded-full bg-green-600"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function WhatsAppInboxPage() {
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const { data: statusData, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 15000,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", `/api/whatsapp/account/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      setSelectedChat(null);
      toast({ title: "WhatsApp отключён" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statusData?.configured === false) {
    return (
      <div className="flex h-full items-center justify-center">
        <NotConfiguredView />
      </div>
    );
  }

  const accounts: WhatsAppAccount[] = statusData?.accounts || [];
  const connectedAccount = accounts.find((a) => a.status === "OK" || a.status === "connected");

  if (!connectedAccount) {
    return (
      <div className="flex h-full items-center justify-center">
        <QRConnectView onConnected={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex h-full" data-testid="container-inbox">
      <div className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
        <ChatListView
          account={connectedAccount}
          onSelectChat={setSelectedChat}
          selectedChatId={selectedChat?.id || null}
        />
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => disconnectMutation.mutate(connectedAccount.id)}
            disabled={disconnectMutation.isPending}
            data-testid="button-disconnect-whatsapp"
          >
            <WifiOff className="mr-1.5 h-3.5 w-3.5" />
            Отключить WhatsApp
          </Button>
        </div>
      </div>
      <div className={`flex-1 flex flex-col ${selectedChat ? "flex" : "hidden md:flex"}`}>
        {selectedChat ? (
          <ChatView
            chat={selectedChat}
            accountId={connectedAccount.id}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100/50 dark:bg-green-950/20 mb-4">
              <SiWhatsapp className="h-8 w-8 text-green-600/40" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground" data-testid="text-select-chat">Выберите чат</p>
            <p className="text-sm text-muted-foreground/60 mt-1" data-testid="text-select-chat-hint">Выберите диалог из списка слева</p>
          </div>
        )}
      </div>
    </div>
  );
}
