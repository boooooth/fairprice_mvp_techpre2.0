"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  isTelegram?: boolean;
  user?: { role?: string; [key: string]: any } | null;
}

export default function Header({
  user = null,
}: HeaderProps) {
  // Admin panel is accessed directly from the Profile tab; remove top header to preserve full screen height
  return null;
}
