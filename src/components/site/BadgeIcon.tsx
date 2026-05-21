import { Mail, Target, Trophy, Sparkles, Zap, Flame, ShieldAlert, Shuffle, Crown } from "lucide-react";

interface BadgeIconProps {
  id: string;
  className?: string;
}

export function BadgeIcon({ id, className = "h-6 w-6" }: BadgeIconProps) {
  switch (id) {
    case "first-call":
      return <Mail className={`${className} text-blue-400`} />;
    case "knew-ball":
      return <Target className={`${className} text-emerald-400`} />;
    case "strong-call":
      return <Target className={`${className} text-lime-400`} />;
    case "sharp-call":
      return <Sparkles className={`${className} text-cyan-400`} />;
    case "perfect-slate":
      return <Trophy className={`${className} text-amber-400`} />;
    case "score-prophet":
      return <Sparkles className={`${className} text-purple-400`} />;
    case "first-blood":
      return <Zap className={`${className} text-yellow-400`} />;
    case "hot-foot":
      return <Flame className={`${className} text-rose-400`} />;
    case "upset-hunter":
      return <ShieldAlert className={`${className} text-orange-400`} />;
    case "chaos-merchant":
      return <Shuffle className={`${className} text-red-400`} />;
    case "country-captain":
      return <Crown className={`${className} text-cyan-400`} />;
    default:
      return <Trophy className={`${className} text-primary`} />;
  }
}
