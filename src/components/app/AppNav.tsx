"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NodeRecord } from "@/lib/ingestions/types";

const NAV_ITEMS = [
  { href: "/dump", label: "Dump", pill: "MVP" },
  { href: "/vault", label: "Vault", pill: "Demo" }
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetch("/api/nodes")
          .then((res) => res.json())
          .then((data) => setNodes(data.nodes || []))
          .catch(() => {});
      }
    });
  }, [supabase, pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNodes([]);
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

      {user && nodes.length > 0 && (
        <>
          <div className="app-nav__section" style={{ marginTop: "24px" }}>Nodes</div>
          {nodes.map((node) => (
            <Link
              key={node.id}
              className="app-nav__link"
              data-active={pathname === `/nodes/${node.id}`}
              href={`/nodes/${node.id}`}
              style={{ padding: "8px 14px", fontSize: "13px" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {node.title}
              </span>
              <span className={`status-badge status-badge--${node.visibility}`} style={{ padding: "1px 6px", fontSize: "9px" }}>
                {node.visibility[0]}
              </span>
            </Link>
          ))}
        </>
      )}

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
