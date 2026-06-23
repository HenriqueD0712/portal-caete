"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { navigation } from "@/src/config/navigation";
import { siteText } from "@/src/config/site-text";
import { logout } from "@/app/actions/auth";
import { cn } from "@/src/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["midias", "executivo"]);

  function toggleExpand(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[var(--border)]">
        <Image src="/logo.png" alt={siteText.siteName} width={130} height={52} className="h-auto" />
      </div>

      {/* Links */}
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isExpanded = expanded.includes(item.id);

          return (
            <li key={item.id}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--verde-escuro)] text-white"
                        : "text-[var(--foreground)] hover:bg-[var(--creme-escuro)]"
                    )}
                  >
                    {item.label}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {isExpanded && (
                    <ul className="mt-0.5 ml-3 pl-3 border-l border-[var(--border)] space-y-0.5">
                      {item.subItems.map((sub) => {
                        const subActive = pathname === sub.href;
                        return (
                          <li key={sub.id}>
                            <Link
                              href={sub.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "block px-3 py-1.5 rounded-md text-sm transition-colors",
                                subActive
                                  ? "bg-[var(--verde-escuro)] text-white font-medium"
                                  : "text-[var(--muted-foreground)] hover:bg-[var(--creme-escuro)] hover:text-[var(--foreground)]"
                              )}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--verde-escuro)] text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--creme-escuro)]"
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="p-3 border-t border-[var(--border)]">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--creme-escuro)] hover:text-[var(--foreground)] transition-colors"
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
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-white border border-[var(--border)] rounded-md p-2 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-[var(--muted-foreground)]"
        >
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-[var(--border)] min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  );
}
