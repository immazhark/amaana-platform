"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { path: string; label: string };

function isActive(pathname: string, path: string) {
  if (path === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/requests/");
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AdminNavigation({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation">
      {items.map(item => {
        const active = isActive(pathname, item.path);
        return <Link href={item.path} key={item.path} aria-current={active ? "page" : undefined}>{item.label}</Link>;
      })}
    </nav>
  );
}
