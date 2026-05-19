import { useEffect, useState } from "react";
import { TEAMS } from "@/lib/match-data";
import { useStore, shortAddress } from "@/lib/store";

/* Modal that walks the user through:
 *  1. Connect wallet
 *  2. Create fan profile (display name, country, favorite team)
 * Stays mounted while open; closes itself once profile is complete.
 */
export function OnboardingModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { wallet, profile, connectWallet, createProfile } = useStore();
  const [step, setStep] = useState<"wallet" | "profile">(wallet ? "profile" : "wallet");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState<string>("ARG");
  const [team, setTeam] = useState<string>("BRA");

  useEffect(() => {
    if (!open) return;
    setStep(wallet ? "profile" : "wallet");
  }, [open, wallet]);

  useEffect(() => {
    if (open && profile) {
      onComplete?.();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile]);

  if (!open) return null;

  const teamOptions = Object.values(TEAMS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          ×
        </button>

        {step === "wallet" && (
          <div className="relative p-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Step 1 / 2</span>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Connect wallet to lock your call</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your prediction is saved. Connect your wallet to anchor it on X Layer before kickoff.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                await new Promise((r) => setTimeout(r, 600));
                connectWallet();
                setPending(false);
                setStep("profile");
              }}
              className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Connecting…" : "Connect wallet"}
            </button>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              gas-free on X Layer · no signature required for demo
            </p>
          </div>
        )}

        {step === "profile" && (
          <form
            className="relative p-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createProfile({ displayName: name.trim(), country, favoriteTeam: team });
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Step 2 / 2</span>
            <h2 className="mt-2 font-display text-3xl tracking-tight">Create your fan profile</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Links your Ball IQ, country rank, badges, and call history to{" "}
              <span className="font-mono text-foreground">{wallet ? shortAddress(wallet) : "wallet"}</span>.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="Display name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="@pelz0x"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </Field>
              <Field label="Country you support">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  {teamOptions.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Favorite team">
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  {teamOptions.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:bg-surface-elevated disabled:text-muted-foreground"
            >
              Create profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}