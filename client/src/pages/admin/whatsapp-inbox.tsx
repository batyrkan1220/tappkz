import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Send, QrCode, Wifi, WifiOff, ArrowLeft,
  RefreshCw, Search, AlertTriangle, CheckCheck, RotateCcw,
  Phone, User, Clock
} from "lucide-react";
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
  attendees?: { display_name?: string; id?: string; profile_picture?: string; phone_number?: string }[];
  _closed?: boolean;
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

type InboxFilter = "open" | "closed" | "unread";

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
  const yesterday = new Date(kzNow);
  yesterday.setDate(yesterday.getDate() - 1);
  if (kzDate.toDateString() === yesterday.toDateString()) {
    return "Вчера";
  }
  return kzDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function formatFullDate(ts: string | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  const kzOffset = 5 * 60 * 60 * 1000;
  const kzDate = new Date(d.getTime() + kzOffset);
  return kzDate.toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC"
  });
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
          Для работы WhatsApp Inbox необходимо настроить интеграцию с Unipile. Обратитесь к администратору платформы для настройки.
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
        const sourceStatus = data.sources?.[0]?.status;
        if (data.status === "OK" || data.status === "connected" || sourceStatus === "OK") {
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

function ChatListView({
  account,
  onSelectChat,
  selectedChatId,
  filter,
  onFilterChange,
  closedChatIds,
}: {
  account: WhatsAppAccount;
  onSelectChat: (chat: Chat) => void;
  selectedChatId: string | null;
  filter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  closedChatIds: Set<string>;
}) {
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

  const filtered = useMemo(() => {
    let result = chats;
    if (filter === "closed") {
      result = result.filter((c) => closedChatIds.has(c.id));
    } else if (filter === "unread") {
      result = result.filter((c) => (c.unread_count ?? 0) > 0);
    } else {
      result = result.filter((c) => !closedChatIds.has(c.id));
    }
    if (search) {
      result = result.filter((c) => {
        const name = c.name || c.attendees?.[0]?.display_name || "";
        return name.toLowerCase().includes(search.toLowerCase());
      });
    }
    return result;
  }, [chats, filter, search, closedChatIds]);

  const filterTabs: { key: InboxFilter; label: string; count?: number }[] = [
    { key: "open", label: "Открытые", count: chats.filter((c) => !closedChatIds.has(c.id)).length },
    { key: "closed", label: "Закрытые" },
    { key: "unread", label: "Непрочитанные", count: chats.filter((c) => (c.unread_count ?? 0) > 0).length },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-3 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-1 p-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-md">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <SiWhatsapp className="h-5 w-5 text-green-600 shrink-0" />
            <h2 className="font-semibold text-sm" data-testid="text-inbox-title">Чаты</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={() => refetch()} data-testid="button-refresh-chats">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 px-3 pb-2 flex-wrap">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "ghost"}
              size="sm"
              onClick={() => onFilterChange(tab.key)}
              data-testid={`button-filter-${tab.key}`}
              className="text-xs"
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] rounded-full px-1.5 py-0 min-w-[16px]" data-testid={`badge-filter-count-${tab.key}`}>
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
              data-testid="input-search-chats"
            />
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-chats">
              {filter === "closed" ? "Нет закрытых чатов" : filter === "unread" ? "Нет непрочитанных" : "Нет чатов"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {filter === "open" ? "Новые диалоги появятся здесь" : ""}
            </p>
          </div>
        ) : (
          <div className="p-1.5">
            {filtered.map((chat) => {
              const chatName = chat.name || chat.attendees?.[0]?.display_name || "Без имени";
              const avatar = chat.attendees?.[0]?.profile_picture;
              const isSelected = selectedChatId === chat.id;
              const hasUnread = (chat.unread_count ?? 0) > 0;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`flex w-full items-center gap-3 rounded-md p-2.5 text-left transition-colors hover-elevate ${
                    isSelected ? "bg-accent" : ""
                  }`}
                  data-testid={`button-chat-${chat.id}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                        {chatName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${hasUnread ? "font-bold" : "font-medium"}`} data-testid={`text-chat-name-${chat.id}`}>
                        {chatName}
                      </p>
                      <span className={`shrink-0 text-[11px] ${hasUnread ? "text-green-600 font-semibold" : "text-muted-foreground"}`} data-testid={`text-chat-time-${chat.id}`}>
                        {formatTime(chat.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      {chat.last_message ? (
                        <p className={`truncate text-xs ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`} data-testid={`text-chat-preview-${chat.id}`}>
                          {chat.last_message}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">Нет сообщений</span>
                      )}
                      {hasUnread && (
                        <Badge className="shrink-0 rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center bg-green-600 text-white no-default-hover-elevate no-default-active-elevate" data-testid={`badge-unread-${chat.id}`}>
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-muted/80 dark:bg-muted/40 px-3 py-0.5 text-[11px] text-muted-foreground font-medium shadow-sm" data-testid="text-date-separator">
        {date}
      </span>
    </div>
  );
}

function ChatView({
  chat,
  accountId,
  onBack,
  onClose,
  onReopen,
}: {
  chat: Chat;
  accountId: string;
  onBack: () => void;
  onClose: () => void;
  onReopen: () => void;
}) {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
    },
    onError: (e: Error) => {
      toast({ title: "Ошибка отправки", description: e.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chat.id]);

  const chatName = chat.name || chat.attendees?.[0]?.display_name || "Без имени";
  const chatAvatar = chat.attendees?.[0]?.profile_picture;
  const isClosed = chat._closed;

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    const kzOffset = 5 * 60 * 60 * 1000;
    messages.forEach((msg) => {
      const ts = msg.timestamp || msg.created_at;
      if (!ts) return;
      const kzDate = new Date(new Date(ts).getTime() + kzOffset);
      const dateStr = kzDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2.5 bg-background">
        <Button size="icon" variant="ghost" onClick={onBack} className="lg:hidden shrink-0" data-testid="button-chat-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={chatAvatar} />
          <AvatarFallback className="text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
            {chatName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" data-testid="text-chat-header-name">{chatName}</p>
          <div className="flex items-center gap-1.5">
            <SiWhatsapp className="h-3 w-3 text-green-600" />
            <span className="text-[11px] text-muted-foreground" data-testid="text-chat-platform">WhatsApp</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isClosed ? (
            <Button variant="outline" size="sm" onClick={onReopen} data-testid="button-reopen-chat">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Открыть
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose} data-testid="button-close-chat">
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Закрыть
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/20 dark:bg-muted/5">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/15 mb-3" />
            <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-messages">Нет сообщений</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Начните диалог, отправив сообщение</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <DateSeparator date={group.date} />
              {group.messages.map((msg, idx) => {
                const isMine = msg.is_sender || msg.role === "sender";
                const text = msg.text || msg.body || "";
                const ts = msg.timestamp || msg.created_at;
                const kzOffset = 5 * 60 * 60 * 1000;
                const kzDate = ts ? new Date(new Date(ts).getTime() + kzOffset) : null;
                const time = kzDate ? kzDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : "";

                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const prevIsMine = prevMsg ? (prevMsg.is_sender || prevMsg.role === "sender") : null;
                const isConsecutive = prevIsMine === isMine;

                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-0.5" : "mt-2.5"}`}>
                    <div
                      className={`max-w-[70%] px-3 py-1.5 text-sm shadow-sm ${
                        isMine
                          ? `bg-green-600 text-white ${isConsecutive ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-br-md"}`
                          : `bg-card border ${isConsecutive ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-bl-md"}`
                      }`}
                      data-testid={`message-${msg.id}`}
                    >
                      {text && <p className="whitespace-pre-wrap break-words leading-relaxed" data-testid={`text-message-body-${msg.id}`}>{text}</p>}
                      <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-green-200" : "text-muted-foreground"}`}>
                        <span className="text-[10px]" data-testid={`text-message-time-${msg.id}`}>{time}</span>
                        {isMine && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {isClosed ? (
        <div className="border-t px-4 py-3 bg-muted/30 dark:bg-muted/10 text-center">
          <p className="text-xs text-muted-foreground mb-2" data-testid="text-chat-closed-notice">Этот диалог закрыт</p>
          <Button variant="outline" size="sm" onClick={onReopen} data-testid="button-reopen-chat-bottom">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Открыть повторно
          </Button>
        </div>
      ) : (
        <div className="border-t px-3 py-2.5 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (messageText.trim()) sendMutation.mutate();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
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
              className="rounded-full shrink-0"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function CustomerInfoPanel({ chat }: { chat: Chat }) {
  const chatName = chat.name || chat.attendees?.[0]?.display_name || "Без имени";
  const chatAvatar = chat.attendees?.[0]?.profile_picture;
  const phone = chat.attendees?.[0]?.phone_number || chat.attendees?.[0]?.id || "";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold" data-testid="text-info-panel-title">Информация</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarImage src={chatAvatar} />
              <AvatarFallback className="text-lg font-bold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                {chatName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold" data-testid="text-customer-name">{chatName}</p>
            <div className="flex items-center gap-1 mt-1">
              <SiWhatsapp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-muted-foreground" data-testid="text-customer-platform">WhatsApp</span>
            </div>
          </div>

          <div className="space-y-3">
            {phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">Телефон</p>
                  <p className="font-medium truncate" data-testid="text-customer-phone">{phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Последнее сообщение</p>
                <p className="font-medium" data-testid="text-customer-last-seen">{formatFullDate(chat.timestamp)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Участники</p>
                <p className="font-medium" data-testid="text-customer-attendees">{chat.attendees_count || chat.attendees?.length || 1}</p>
              </div>
            </div>
          </div>

          {(chat.attendees?.length ?? 0) > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Участники</p>
              {chat.attendees?.map((a, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={a.profile_picture} />
                    <AvatarFallback className="text-[10px] font-semibold bg-muted">
                      {(a.display_name || "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate" data-testid={`text-attendee-name-${i}`}>{a.display_name || a.id || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function WhatsAppInboxPage() {
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("open");
  const [closedChats, setClosedChats] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("wa_closed_chats");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

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

  const updateClosedChats = (updater: (prev: Set<string>) => Set<string>) => {
    setClosedChats((prev) => {
      const next = updater(prev);
      try { localStorage.setItem("wa_closed_chats", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleCloseChat = () => {
    if (!selectedChat) return;
    updateClosedChats((prev) => new Set(prev).add(selectedChat.id));
    setSelectedChat({ ...selectedChat, _closed: true });
    toast({ title: "Диалог закрыт" });
  };

  const handleReopenChat = () => {
    if (!selectedChat) return;
    updateClosedChats((prev) => {
      const next = new Set(prev);
      next.delete(selectedChat.id);
      return next;
    });
    setSelectedChat({ ...selectedChat, _closed: false });
    toast({ title: "Диалог открыт" });
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat({ ...chat, _closed: closedChats.has(chat.id) });
  };

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
  const connectedAccount = accounts.find((a) => {
    const sourceStatus = (a as any).sources?.[0]?.status;
    return a.status === "OK" || a.status === "connected" || sourceStatus === "OK";
  });

  if (!connectedAccount) {
    return (
      <div className="flex h-full items-center justify-center">
        <QRConnectView onConnected={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background" data-testid="container-inbox">
      <div className={`w-full md:w-80 lg:w-[340px] border-r flex-shrink-0 flex flex-col bg-background ${selectedChat ? "hidden md:flex" : "flex"}`}>
        <ChatListView
          account={connectedAccount}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChat?.id || null}
          filter={filter}
          onFilterChange={setFilter}
          closedChatIds={closedChats}
        />
        <div className="border-t p-2 flex items-center gap-1">
          <div className="flex items-center gap-1.5 flex-1 px-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-muted-foreground truncate" data-testid="text-connection-status">
              {connectedAccount.name || connectedAccount.identifier || "Подключено"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground shrink-0"
            onClick={() => disconnectMutation.mutate(connectedAccount.id)}
            disabled={disconnectMutation.isPending}
            data-testid="button-disconnect-whatsapp"
          >
            <WifiOff className="mr-1 h-3 w-3" />
            Отключить
          </Button>
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${selectedChat ? "flex" : "hidden md:flex"}`}>
        {selectedChat ? (
          <ChatView
            chat={selectedChat}
            accountId={connectedAccount.id}
            onBack={() => setSelectedChat(null)}
            onClose={handleCloseChat}
            onReopen={handleReopenChat}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10 dark:bg-muted/5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 dark:bg-muted/20 mb-5">
              <SiWhatsapp className="h-10 w-10 text-green-600/30" />
            </div>
            <p className="text-lg font-semibold" data-testid="text-select-chat">Выберите чат</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs" data-testid="text-select-chat-hint">
              Выберите диалог из списка слева, чтобы начать переписку
            </p>
          </div>
        )}
      </div>

      {selectedChat && (
        <div className="hidden xl:flex w-72 border-l flex-shrink-0 flex-col bg-background">
          <CustomerInfoPanel chat={selectedChat} />
        </div>
      )}
    </div>
  );
}
