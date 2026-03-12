import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="page page--readable">
      <header className="page-header">
        <p className="page-header__eyebrow">Capture. Retrieve. Share.</p>
        <h1 className="page-header__title">
          SlopVault starts with one ingestion door.
        </h1>
        <p className="page-header__copy">
          The MVP does not ask users to understand seed imports, trace imports,
          standalone prompts, or artifact batches before they begin. It asks them to
          bring whatever they have to one place.
        </p>
      </header>

      <section className="card">
        <h2 className="card__title">What is working right now</h2>
        <p className="card__copy">
          SlopVault is now backed by Supabase with full ingestion flows, 
          auth-protected private vaults, and a heuristic parser that 
          handles messy copy-paste from all major LLMs.
        </p>
        <div className="button-row hero-actions">
          {user ? (
            <>
              <Link className="button button--primary" href="/dump">
                Open The Dumpster
              </Link>
              <Link className="button" href="/vault">
                Open Vault
              </Link>
            </>
          ) : (
            <>
              <Link className="button button--primary" href="/auth/signin">
                Sign In
              </Link>
              <Link className="button" href="/auth/signup">
                Create Account
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

