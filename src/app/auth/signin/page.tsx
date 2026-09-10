"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dump");
      router.refresh();
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Identify yourself.</h1>
        <p className="page-header__copy">
          Enter your credentials to access your private vault.
        </p>
      </header>

      <div className="card" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <form onSubmit={handleSignIn} className="dump-stack">
          <div className="dump-stack">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dump-input"
              required
            />
          </div>
          <div className="dump-stack" style={{ marginTop: "16px" }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="dump-input"
              required
            />
          </div>
          {error && <div className="info-banner" style={{ marginTop: "16px" }}>{error}</div>}
          <div className="button-row" style={{ marginTop: "24px" }}>
            <button
              type="submit"
              className="button button--primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          <p style={{ marginTop: "16px", fontSize: "14px" }}>
            Don't have an account? <Link href="/auth/signup" style={{ textDecoration: "underline" }}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
