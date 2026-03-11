"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dump", label: "Dump", pill: "MVP" },
  { href: "/vault", label: "Vault", pill: "Demo" }
] as const;

export function AppNav() {
  const pathname = usePathname();

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
    </nav>
  );
}
