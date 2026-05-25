import { Flag } from "./Flag";
import { TEAMS } from "@/lib/match-data";
import { ShieldCheck, TrendingUp, Clock, ArrowUpRight } from "lucide-react";

export function ProofCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
      <div className="relative grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            04 / Share
          </span>
          <h2 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
            One screenshot.
            <br />
            <span className="text-glow-gold text-gold">Whole timeline silent.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm text-muted-foreground md:text-base leading-relaxed">
            Every locked call gets a proof card with the match, the prediction, the kickoff
            timestamp and a verifiable X Layer transaction. Drop it in the group chat. End the debate.
          </p>
        </div>

        <div className="relative px-2 py-4">
          {/* Subtle glowing aura behind the card */}
          <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-primary/10 via-gold/5 to-primary/10 opacity-70 blur-3xl" />

          <article className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090c12]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(25,227,111,0.05)] transition hover:border-primary/30">
            {/* Holographic glowing top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Verified Header / Hardware Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 bg-white/[0.01]">
              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Verified Proof // X Layer
              </span>
              <span className="rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-1 font-mono text-[8px] tracking-[0.1em] text-white/90">
                TX: <span className="text-primary font-semibold">0x4a…b91c</span>
              </span>
            </div>

            {/* Ticket body */}
            <div className="relative overflow-hidden px-6 py-7">
              {/* Very faint background cyber scanline pattern */}
              <div className="pointer-events-none absolute inset-0 bg-scanline opacity-[0.04]" />

              {/* Called It Badge */}
              <div className="relative flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-gold shadow-[0_0_15px_rgba(232,223,200,0.05)]">
                  <span className="h-1 w-1 rounded-full bg-gold animate-pulse" />
                  🏆 Called it · pre-kickoff
                </span>
              </div>

              {/* Match Scoreboard */}
              <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group/flag mb-2">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/30 to-gold/30 opacity-0 group-hover/flag:opacity-100 blur-sm transition duration-300" />
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-slate-900/60 p-0.5 shadow-md">
                      <Flag team={TEAMS.MAR} className="relative h-9 w-14 object-cover rounded-md transition group-hover/flag:scale-105" />
                    </div>
                  </div>
                  <div className="font-display text-sm font-extrabold tracking-tight text-white">Morocco</div>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">{TEAMS.MAR.code}</span>
                </div>

                <div className="flex flex-col items-center justify-center px-4">
                  <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40 mb-1">FT SCORE</span>
                  <div className="relative flex items-center justify-center gap-2">
                    <span className="font-display text-4xl font-black tracking-tighter text-glow-gold text-gold tabular-nums">2</span>
                    <span className="text-lg font-bold text-white/30 animate-pulse">:</span>
                    <span className="font-display text-4xl font-black tracking-tighter text-glow-gold text-gold tabular-nums">1</span>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary font-semibold">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    SUCCESS
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative group/flag mb-2">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/30 to-gold/30 opacity-0 group-hover/flag:opacity-100 blur-sm transition duration-300" />
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-slate-900/60 p-0.5 shadow-md">
                      <Flag team={TEAMS.POR} className="relative h-9 w-14 object-cover rounded-md transition group-hover/flag:scale-105" />
                    </div>
                  </div>
                  <div className="font-display text-sm font-extrabold tracking-tight text-white">Portugal</div>
                  <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">{TEAMS.POR.code}</span>
                </div>
              </div>

              {/* Call Details Card */}
              <div className="relative mt-6 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center overflow-hidden">
                {/* Tech corner accents */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/20" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/20" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-primary/20" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/20" />

                <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/80 block mb-2.5">PREDICTED LINE</span>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="rounded bg-white/[0.04] px-2.5 py-1 font-medium text-white border border-white/[0.02]">
                    Morocco wins
                  </span>
                  <span className="text-primary/40">•</span>
                  <span className="rounded bg-white/[0.04] px-2.5 py-1 font-mono text-gold border border-white/[0.02]">
                    Score 2-1
                  </span>
                  <span className="text-primary/40">•</span>
                  <span className="rounded bg-white/[0.04] px-2.5 py-1 font-medium text-white border border-white/[0.02]">
                    BTTS: Yes
                  </span>
                </div>
              </div>
            </div>

            {/* Tech Laser Divider (replaces clunky ticket notches) */}
            <div className="relative py-2 px-4 flex items-center justify-between">
              <span className="text-white/20 font-mono text-[8px] font-light">[+]</span>
              <div className="flex-1 mx-2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent border-t border-dashed border-white/10" />
              <span className="text-white/20 font-mono text-[8px] font-light">[+]</span>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-white/[0.01]">
              {[
                { label: "Ball IQ", value: "+820", sub: "Earned", icon: ShieldCheck, color: "text-primary text-glow-green" },
                { label: "Form", value: "84%", sub: "World Class", icon: TrendingUp, color: "text-gold text-glow-gold" },
                { label: "Locked", value: "T-02:14:08", sub: "Pre-kick", icon: Clock, color: "text-white" },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="relative group/stat overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-center transition hover:bg-white/[0.04] hover:border-white/[0.08]">
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground flex items-center justify-center gap-1 mb-1">
                    <Icon className="h-3 w-3 text-muted-foreground/60 transition group-hover/stat:text-primary" />
                    {label}
                  </div>
                  <div className={`font-display text-base font-extrabold tracking-tight ${color}`}>
                    {value}
                  </div>
                  <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground/40 mt-0.5">
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with lock verification */}
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-4 rounded-b-2xl font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="flex items-center gap-1.5 text-white/70">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                knewball.xyz/u/atlas.mar
              </span>
              <span className="flex items-center gap-1 text-primary hover:text-primary/80 transition font-semibold cursor-pointer">
                view proof
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
