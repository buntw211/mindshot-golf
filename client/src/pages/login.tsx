import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import mindshotLogo from "@assets/mindshot_logo.png";

const API_BASE = "172.16.227.133";

export default function Login() {
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setMessage("Email verified. You can sign in now.");
    }
  }, []);

  async function handleSignUp() {
  setLoading(true);
  setMessage("");

  try {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    console.log("SIGNUP STATUS:", res.status);
    console.log("SIGNUP RESPONSE:", text);

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      setMessage(data.message || `Signup failed (${res.status})`);
      return;
    }

    setMessage(data.message || "Account created. Check your email to verify.");
    setMode("signin");
    setPassword("");
    setConfirmPassword("");
  } catch (error: any) {
    console.error("SIGNUP ERROR:", error);
    setMessage(error?.message || "Unable to create account");
  } finally {
    setLoading(false);
  }
}

  async function handleSignIn() {
  setLoading(true);
  setMessage("");

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    console.log("LOGIN STATUS:", res.status);
    console.log("LOGIN RESPONSE:", text);

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      setMessage(data.message || `Unable to sign in (${res.status})`);
      return;
    }

    setLocation("/dashboard");
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    setMessage(error?.message || "Unable to sign in");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
            <img
              src={mindshotLogo}
              alt="MindShot"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                {mode === "signin" ? "Sign In" : "Create Account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "signin"
                  ? "Sign in to access your journals and progress."
                  : "Create your account and verify your email address."}
              </p>
            </div>

            <div className="space-y-3">
              <input
                className="w-full border rounded-md px-3 py-2 bg-background"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                className="w-full border rounded-md px-3 py-2 bg-background"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {mode === "signup" && (
                <input
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
            </div>

            {message && (
              <div className="text-sm rounded-md border px-3 py-2 bg-background">
                {message}
              </div>
            )}

            <div className="space-y-2">
              {mode === "signin" ? (
                <Button
                  className="w-full"
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleSignUp}
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setMode(mode === "signin" ? "signup" : "signin")
                }
                disabled={loading}
              >
                {mode === "signin"
                  ? "Need an account? Create one"
                  : "Already have an account? Sign in"}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/")}
                disabled={loading}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}