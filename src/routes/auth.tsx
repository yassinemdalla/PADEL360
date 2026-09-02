import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { sessionQueryKey, fetchSession } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to PADEL360 — Players & Club Managers" },
      {
        name: "description",
        content:
          "Sign in or create a PADEL360 account as a player or club manager to track matches and manage courts.",
      },
      { property: "og:title", content: "Sign in to PADEL360" },
      { property: "og:description", content: "One account for padel players and club managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  displayName: z.string().trim().min(2, "Name is too short").max(60).optional(),
});

type Role = "player" | "club_manager";

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("player");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function afterAuth() {
    const session = await queryClient.fetchQuery({ queryKey: sessionQueryKey, queryFn: fetchSession });
    await navigate({ to: session?.role === "club_manager" ? "/manager" : "/dashboard" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.displayName, role },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      await afterAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    await afterAuth();
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-ink text-sand flex flex-col">
      <header className="border-b-4 border-court">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="size-9 bg-court grid place-items-center">
              <span className="font-display font-black text-ink text-lg">P</span>
            </div>
            <span className="font-display font-black text-xl tracking-tight uppercase">PADEL360</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="px-6 py-14 max-w-xl mx-auto lg:mx-0 lg:ml-auto w-full">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-court mb-4">
            /// {mode === "signin" ? "Welcome back" : "Create account"}
          </div>
          <h1 className="font-display font-black uppercase tracking-tighter text-5xl leading-[0.85]">
            {mode === "signin" ? (
              <>
                Sign
                <br />
                <span className="text-clay">In.</span>
              </>
            ) : (
              <>
                Join the
                <br />
                <span className="text-clay">Court.</span>
              </>
            )}
          </h1>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-sand/60">I am a</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { key: "player", label: "Player" },
                        { key: "club_manager", label: "Club Manager" },
                      ] as const
                    ).map((o) => (
                      <button
                        type="button"
                        key={o.key}
                        onClick={() => setRole(o.key)}
                        className={`border-2 px-3 py-3 font-display font-bold uppercase text-sm ${
                          role === o.key ? "bg-court text-ink border-court" : "border-sand/30 text-sand"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-sand/60" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={60}
                    className="mt-2 w-full bg-transparent border-2 border-sand/30 px-3 py-3 font-mono text-sm focus:border-court outline-none"
                    placeholder="Lena Moreau"
                  />
                </div>
              </>
            )}

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-sand/60" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="mt-2 w-full bg-transparent border-2 border-sand/30 px-3 py-3 font-mono text-sm focus:border-court outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-sand/60" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
                className="mt-2 w-full bg-transparent border-2 border-sand/30 px-3 py-3 font-mono text-sm focus:border-court outline-none"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-court font-display w-full py-3 text-sm disabled:opacity-50"
            >
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-sand/40">
            <span className="h-px flex-1 bg-sand/20" /> or <span className="h-px flex-1 bg-sand/20" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="w-full border-2 border-sand/40 py-3 font-display font-bold uppercase text-sm hover:bg-sand hover:text-ink disabled:opacity-50"
          >
            Continue with Google
          </button>

          <p className="mt-6 font-mono text-xs text-sand/60">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-court underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </section>

        <section className="hidden lg:block bg-court text-ink">
          <div className="h-full px-10 py-16 max-w-md">
            <h2 className="font-display font-black uppercase tracking-tighter text-4xl leading-[0.9]">
              One account.
              <br />
              Two sides of
              <br />
              the net.
            </h2>
            <ul className="mt-8 space-y-4 font-mono text-sm">
              <li className="border-l-4 border-ink pl-3">
                <strong className="font-display block text-lg">Players</strong>
                Track matches, watch your level climb, find partners and book courts.
              </li>
              <li className="border-l-4 border-ink pl-3">
                <strong className="font-display block text-lg">Club managers</strong>
                Own your courts, hold slots for maintenance and see every booking live.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
