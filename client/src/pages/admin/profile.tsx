import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User, Lock, Camera, Loader2, CheckCircle2, Calendar, Mail, Shield } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function ProfilePage() {
  useDocumentTitle("Профиль");
  const { toast } = useToast();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setProfileImageUrl(user.profileImageUrl || null);
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string; profileImageUrl?: string | null }) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Профиль обновлён" });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/auth/password", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Пароль изменён" });
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("images", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      return res.json();
    },
    onSuccess: (data: { urls: string[] }) => {
      const url = data.urls?.[0];
      if (!url) return;
      setProfileImageUrl(url);
      profileMutation.mutate({ firstName, lastName, phone, profileImageUrl: url });
    },
    onError: () => {
      toast({ title: "Ошибка загрузки фото", variant: "destructive" });
    },
  });

  const handleSaveProfile = () => {
    profileMutation.mutate({ firstName, lastName, phone, profileImageUrl });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Минимум 6 символов", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  if (!user) {
    return (
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const initials = (user.firstName?.[0] || user.email?.[0] || "U").toUpperCase();
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Almaty" })
    : null;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Профиль</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление личными данными и безопасностью</p>
      </div>

      <Card className="p-6" data-testid="card-profile-info">
        <div className="flex items-start gap-5 mb-6">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={profileImageUrl || undefined} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="button-change-avatar"
              type="button"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-avatar-upload"
            />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-lg font-semibold truncate" data-testid="text-profile-name">
              {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Имя не указано"}
            </h2>
            <p className="text-sm text-muted-foreground truncate" data-testid="text-profile-email">{user.email}</p>
            <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {createdDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  С {createdDate}
                </span>
              )}
              {user.isSuperAdmin && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Shield className="h-3 w-3" />
                  Администратор
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Личные данные
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Введите имя"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Введите фамилию"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="pl-10 bg-muted/50"
                data-testid="input-email"
              />
            </div>
            <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (XXX) XXX-XX-XX"
              data-testid="input-phone"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={profileMutation.isPending}
              data-testid="button-save-profile"
            >
              {profileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-change-password">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Изменить пароль
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Введите текущий пароль"
              data-testid="input-current-password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Повторите пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleChangePassword}
              disabled={passwordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              variant="outline"
              data-testid="button-change-password"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Изменить пароль
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
