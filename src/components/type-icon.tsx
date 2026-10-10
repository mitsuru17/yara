import {
  AlertTriangle,
  Eye,
  Hammer,
  HandMetal,
  House,
  ShieldAlert,
  UserRoundX,
  Wine,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  robbery: ShieldAlert,
  theft: UserRoundX,
  harassment: AlertTriangle,
  house: House,
  vandalism: Hammer,
  suspicious: Eye,
  alcohol: Wine,
};

export function TypeIcon({
  icon,
  color,
  size = "md",
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = ICONS[icon] ?? HandMetal;
  const box = { sm: "h-8 w-8", md: "h-11 w-11", lg: "h-14 w-14" }[size];
  const glyph = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${box}`}
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <Icon className={glyph} strokeWidth={2.2} />
    </span>
  );
}
