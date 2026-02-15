import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Clock, CheckCircle2, XCircle, Users, FileText, Loader2 } from "lucide-react";

interface EmailBroadcast {
  id: number;
  subject: string;
  htmlContent: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  status: string;
  sentBy: string | null;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const almaty = new Date(d.getTime() + 5 * 60 * 60 * 1000);
  return almaty.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + almaty.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string) {
  switch (status) {
    case "sending":
      return <Badge variant="secondary" data-testid="badge-status-sending"><Clock className="mr-1 h-3 w-3" />Отправляется</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-green-600" data-testid="badge-status-completed"><CheckCircle2 className="mr-1 h-3 w-3" />Отправлено</Badge>;
    case "failed":
      return <Badge variant="destructive" data-testid="badge-status-failed"><XCircle className="mr-1 h-3 w-3" />Ошибка</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function ComposeTab() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/superadmin/email/broadcast", {
        subject,
        htmlContent: content,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/email/broadcasts"] });
      toast({ title: `Рассылка отправляется ${data.recipientCount} получателям` });
      setSubject("");
      setContent("");
    },
    onError: (e: any) => {
      toast({ title: "Ошибка отправки", description: e.message, variant: "destructive" });
    },
  });

  const templates = [
    {
      name: "Объявление",
      subject: "Важное обновление от Tapp",
      content: `<h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">Важное обновление</h2>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Здравствуйте!</p>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Текст объявления...</p>
<p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">С уважением,<br/>Команда Tapp</p>`,
    },
    {
      name: "Новая функция",
      subject: "Новая функция в Tapp!",
      content: `<h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">Новая функция!</h2>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Здравствуйте!</p>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Мы рады сообщить о новой функции в Tapp:</p>
<div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0; font-weight: 600;">Название функции</p>
  <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 8px 0 0;">Описание...</p>
</div>
<p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">С уважением,<br/>Команда Tapp</p>`,
    },
    {
      name: "Акция",
      subject: "Специальное предложение от Tapp!",
      content: `<h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px;">Специальное предложение!</h2>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Здравствуйте!</p>
<p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">У нас есть специальное предложение для вас:</p>
<div style="background: #eef2ff; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
  <p style="font-size: 24px; font-weight: 700; color: #2563eb; margin: 0;">Текст акции</p>
  <p style="color: #666; font-size: 14px; margin: 8px 0 0;">Условия...</p>
</div>
<p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">С уважением,<br/>Команда Tapp</p>`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Новая рассылка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center mr-1">Шаблоны:</span>
            {templates.map(t => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                onClick={() => { setSubject(t.subject); setContent(t.content); }}
                data-testid={`button-template-${t.name}`}
              >
                {t.name}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Тема письма</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Введите тему рассылки..."
              data-testid="input-email-subject"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Содержимое (HTML)</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Введите HTML содержимое рассылки..."
              className="min-h-[200px] font-mono text-sm"
              data-testid="input-email-content"
            />
          </div>

          {content && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Предпросмотр</label>
              <div className="rounded-xl border border-border p-4 bg-white dark:bg-zinc-900">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Будет отправлено всем зарегистрированным пользователям
            </p>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!subject.trim() || !content.trim() || sendMutation.isPending}
              data-testid="button-send-broadcast"
            >
              {sendMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Отправить рассылку
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTab() {
  const { data: broadcasts, isLoading } = useQuery<EmailBroadcast[]>({
    queryKey: ["/api/superadmin/email/broadcasts"],
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!broadcasts || broadcasts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Рассылок пока нет</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.map(b => (
        <Card key={b.id} data-testid={`card-broadcast-${b.id}`}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-sm truncate" data-testid={`text-broadcast-subject-${b.id}`}>{b.subject}</h3>
                  {statusBadge(b.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {b.recipientCount} получателей
                  </span>
                  {b.status === "completed" && (
                    <>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {b.successCount} доставлено
                      </span>
                      {b.failCount > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {b.failCount} ошибок
                        </span>
                      )}
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(b.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SuperAdminEmail() {
  useDocumentTitle("Email рассылки — SuperAdmin");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
          <Mail className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" data-testid="text-email-title">Email рассылки</h1>
          <p className="text-xs text-muted-foreground">Отправка рассылок всем владельцам магазинов</p>
        </div>
      </div>

      <Tabs defaultValue="compose">
        <TabsList data-testid="tabs-email">
          <TabsTrigger value="compose" data-testid="tab-compose">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Написать
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <ComposeTab />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
