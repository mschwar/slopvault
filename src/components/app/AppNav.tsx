"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dump", label: "Dump", pill: "MVP" },
  { href: "/vault", label: "Vault", pill: "Demo" }
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav__section">Primary</div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          className="app-nav__link"
          data-active={pathname.startsWith(item.href)}
          href={item.href}
        >
          <span>{item.label}</span>
          <span className="app-nav__pill">{item.pill}</span>
        </Link>
      ))}

      <div className="app-nav__section" style={{ marginTop: "24px" }}>Account</div>
      {user ? (
        <div className="app-nav__profile">
          <div className="app-nav__user-id" style={{ fontSize: "12px", opacity: 0.7, padding: "8px 12px" }}>
            {user.user_metadata?.pseudonym || user.email}
          </div>
          <button
            onClick={handleSignOut}
            className="app-nav__link"
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <>
          <Link
            className="app-nav__link"
            data-active={pathname === "/auth/signin"}
            href="/auth/signin"
          >
            Sign In
          </Link>
          <Link
            className="app-nav__link"
            data-active={pathname === "/auth/signup"}
            href="/auth/signup"
          >
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}
