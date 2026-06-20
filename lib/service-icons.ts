/**
 * Service icon mapping for FusionZone.
 * Maps string identifiers to lucide-react icon components.
 * Used by both the dashboard settings and public services page.
 */
import {
  Shield,
  Wifi,
  Printer,
  Wrench,
  MessageCircle,
  Phone,
  Laptop,
  Monitor,
  HardDrive,
  Network,
  Cable,
  Settings,
  ShoppingCart,
  Camera,
  FileCode,
  Database,
  Search,
  Globe,
  Smartphone,
  Radio,
  Cpu,
  Disc,
  Usb,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  // Security
  Shield,
  Camera,
  // Networking
  Wifi,
  Network,
  Cable,
  Radio,
  Globe,
  // POS / Printers
  Printer,
  ShoppingCart,
  // Tools / Repair
  Wrench,
  Settings,
  // Computers
  Monitor,
  Laptop,
  Cpu,
  // Data / Storage
  HardDrive,
  Database,
  Disc,
  // Software
  FileCode,
  Search,
  // Mobile
  Smartphone,
  Phone,
  // Other
  Usb,
  MessageCircle,
};

export const ICON_OPTIONS = Object.keys(SERVICE_ICONS).sort();

export function getServiceIcon(iconName: string): LucideIcon {
  return SERVICE_ICONS[iconName] ?? Wrench;
}
