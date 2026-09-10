"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sign up with Supabase Auth
    // The profile will be created via a database trigger (once implemented)
    // or manually here for now if the trigger isn't ready.
    // For MVP, we'll include pseudonym in the user's metadata and
    // let the trigger handle it.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          pseudonym,
        },
      },
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
        <h1 className="page-header__title">Choose a pseudonym.</h1>
        <p className="page-header__copy">
          No real names. No profile photos. Just your ideas.
        </p>
      </header>

      <div className="card" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <form onSubmit={handleSignUp} className="dump-stack">
          <div className="dump-stack">
            <label htmlFor="pseudonym">Pseudonym</label>
            <input
              id="pseudonym"
              type="text"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              className="dump-input"
              placeholder="ghost_in_the_vault"
              required
            />
          </div>
          <div className="dump-stack" style={{ marginTop: "16px" }}>
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
              {loading ? "Signing up..." : "Create account"}
            </button>
          </div>
          <p style={{ marginTop: "16px", fontSize: "14px" }}>
            Already have an account? <Link href="/auth/signin" style={{ textDecoration: "underline" }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
