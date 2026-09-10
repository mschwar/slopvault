import type { ReactNode } from "react";
import "./globals.css";
import { AppNav } from "@/components/app/AppNav";

export const metadata = {
  title: "SlopVault",
  description: "Capture, retrieve, and share AI artifacts with provenance."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="app-rail">
            <div className="app-rail__brand">
              <p className="app-rail__eyebrow">SlopVault</p>
              <div className="app-rail__title">One place for every ingest path.</div>
              <p className="app-rail__copy">
                Paste threads, upload exports, drag in artifacts, then keep or share
                what matters.
              </p>
            </div>
            <AppNav />
          </aside>

          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
