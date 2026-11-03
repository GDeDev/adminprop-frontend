import {
  Calendar,
  Camera,
  FileText,
  Handshake,
  Home,
  Key,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Shield,
  Smile,
  Star,
  type LucideIcon,
} from "lucide-react"

import type { SiteContent } from "@adminprop/shared-types"

/** La lista cerrada de íconos de los pasos (la misma que valida la API). */
const STEP_ICONS: Record<string, LucideIcon> = {
  search: Search,
  home: Home,
  key: Key,
  handshake: Handshake,
  "file-text": FileText,
  calendar: Calendar,
  phone: Phone,
  "map-pin": MapPin,
  shield: Shield,
  star: Star,
  camera: Camera,
  smile: Smile,
}

/** Ícono neutro de un servicio sin imagen. */
export function serviceIcon(index: number): string {
  return ["key", "home", "file-text"][index % 3] ?? "home"
}

export function StepIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = STEP_ICONS[name] ?? Star
  return <Icon aria-hidden className={className} />
}

type Network = SiteContent["contact"]["socials"][number]["network"]

const LABELS: Record<Network, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  X: "X",
}

/** Glifos simples de cada red (lucide ya no trae logos de marcas). */
const PATHS: Record<Network, string> = {
  FACEBOOK:
    "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.2v3h2.5V21z",
  INSTAGRAM:
    "M12 7.6A4.4 4.4 0 1 0 12 16.4 4.4 4.4 0 0 0 12 7.6zm0 7.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6zM16.9 6.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 3.5c-2.3 0-2.6 0-3.5.1-2.6.1-3.8 1.4-3.9 3.9-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 2.6 1.4 3.8 3.9 3.9.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c2.6-.1 3.8-1.4 3.9-3.9.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-2.6-1.4-3.8-3.9-3.9-.9-.1-1.2-.1-3.5-.1z",
  LINKEDIN:
    "M6.9 8.9H4V20h2.9zM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM20 13.4c0-3-1.6-4.7-3.9-4.7-1.2 0-2.2.7-2.7 1.4V8.9h-2.9V20h2.9v-6c0-1.4.7-2.4 1.9-2.4 1.1 0 1.8.8 1.8 2.3V20H20z",
  YOUTUBE:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z",
  TIKTOK:
    "M16.6 3h-2.9v12.1a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.6a5.5 5.5 0 1 0 4.7 5.4V9.1a6.7 6.7 0 0 0 3.9 1.2V7.4a3.9 3.9 0 0 1-3.9-4.4z",
  X: "M17.8 3.5h3l-6.5 7.5 7.7 10h-6l-4.7-6.1-5.4 6.1h-3l7-8L2.3 3.5h6.1l4.2 5.6zm-1 16h1.7L7.4 5.2H5.6z",
}

export function SocialLink({
  network,
  url,
  className,
}: {
  network: Network
  url: string
  className?: string
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={LABELS[network]}
      className={className}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
        <path d={PATHS[network]} />
      </svg>
    </a>
  )
}

/** Globo de chat para los botones de WhatsApp (lucide no trae logos de marcas). */
export function WhatsAppGlyph({ className }: { className?: string }) {
  return <MessageCircle aria-hidden className={className} />
}
