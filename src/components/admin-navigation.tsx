"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdminNavigationActive } from "@/lib/admin-navigation";

type Item = { path: string; label: string };

export function AdminNavigation({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation">
      {items.map(item => {
        const active = isAdminNavigationActive(pathname, item.path);
        return <Link href={item.path} key={item.path} aria-current={active ? "page" : undefined}>{item.label}</Link>;
      })}
    </nav>
  );
}
