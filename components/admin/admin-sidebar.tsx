"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/src/lib/utils";

const links = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-[var(--border)]">
        <Image src="/logo.png" alt="Estúdio Caeté" width={120} height={48} className="h-auto" />
        <span className="mt-2 inline-block text-xs bg-[var(--terracota)] text-white px-2 py-0.5 rounded-full">
          Admin
        </span>
      </div>

      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active ? "bg-[var(--verde-escuro)] text-white" : "text-[var(--foreground)] hover:bg-[var(--creme-escuro)]"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="pt-2 border-t border-[var(--border)] mt-2">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--creme-escuro)] transition-colors"
          >
            <ExternalLink size={14} />
            Ver portal cliente
          </Link>
        </li>
      </ul>

      <div className="p-3 border-t border-[var(--border)]">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--creme-escuro)] transition-colors"
          >
            <LogOut size={14} />
            Sair
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-white border border-[var(--border)] rounded-md p-2 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[var(--muted-foreground)]">
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[var(--border)] min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  );
}
