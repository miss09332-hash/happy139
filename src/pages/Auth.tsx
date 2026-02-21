import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palmtree, LogIn, UserPlus, Mail } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { user, loading } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const { signIn, signUp } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(loginForm.email, loginForm.password);
      toast.success("登入成功");
    } catch (err: any) {
      toast.error("登入失敗", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim()) {
      toast.error("請填寫姓名");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(signupForm.email, signupForm.password, signupForm.name);
      toast.success("註冊成功，已自動登入");
    } catch (err: any) {
      toast.error("註冊失敗", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("請輸入 Email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("重設密碼信已寄出", { description: "請到信箱點擊連結來重設密碼" });
      setForgotMode(false);
    } catch (err: any) {
      toast.error("寄送失敗", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Palmtree className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">休假管理系統</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">登入或註冊以開始使用</p>
        </CardHeader>
        <CardContent>
          {forgotMode ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">輸入你的 Email，我們會寄一封重設密碼的信給你。</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  <Mail className="h-4 w-4" />
                  {submitting ? "寄送中..." : "寄送重設密碼信"}
                </Button>
              </form>
              <Button variant="link" className="w-full" onClick={() => setForgotMode(false)}>
                ← 返回登入
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="login" className="flex-1">登入</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">註冊</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>密碼</Label>
                    <Input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    <LogIn className="h-4 w-4" />
                    {submitting ? "登入中..." : "登入"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setForgotMode(true)}
                  >
                    忘記密碼？
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>姓名</Label>
                    <Input
                      required
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      placeholder="王小明"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>密碼</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="至少 6 個字元"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    <UserPlus className="h-4 w-4" />
                    {submitting ? "註冊中..." : "註冊"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
