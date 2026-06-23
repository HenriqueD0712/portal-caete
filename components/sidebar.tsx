"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, FileText, Eye, Building2, Shield, MessageSquare,
  Table2, ChevronDown, ChevronRight, Menu, X, LogOut, Layers, ScrollText,
} from "lucide-react";
import { navigationSections } from "@/src/config/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/src/lib/utils";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  apresentacao3d: Layers,
  panoramas: Eye,
  executivo: Building2,
  planilhas: Table2,
  orcamentos: FileText,
  contrato: ScrollText,
  reunioes: MessageSquare,
  cuidados: Shield,
};

export function Sidebar({
  nomeProjeto,
  nome,
  subcategoriasExecutivo = [],
}: {
  nomeProjeto?: string;
  nome?: string;
  subcategoriasExecutivo?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["executivo"]);

  function toggleExpand(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full bg-[var(--verde-escuro)]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Image
          src="/logo.png"
          alt="Estúdio Caeté"
          width={120}
          height={48}
          className="h-auto brightness-0 invert"
        />
      </div>

      {/* Home */}
      <div className="px-3 pt-4 pb-1">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            pathname === "/dashboard"
              ? "bg-[var(--terracota)] text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <Home size={16} />
          Início
        </Link>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navigationSections.map((section, idx) => {
          const items = section.items.map((item) => {
            if (item.isDynamic && item.id === "executivo") {
              return {
                ...item,
                subItems: subcategoriasExecutivo.map((sub) => ({
                  id: sub,
                  label: sub.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
                  href: `/dashboard/executivo/${sub}`,
                })),
              };
            }
            return item;
          });

          return (
            <div key={section.id} className={idx > 0 ? "pt-4 border-t border-white/10" : ""}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-1.5">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = iconMap[item.id] ?? FileText;
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const isExpanded = expanded.includes(item.id);
                  const hasSubItems = item.subItems && item.subItems.length > 0;

                  return (
                    <li key={item.id}>
                      {hasSubItems ? (
                        <>
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                              isActive
                                ? "bg-white/15 text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <Icon size={15} />
                              {item.label}
                            </span>
                            {isExpanded ? (
                              <ChevronDown size={13} className="opacity-60" />
                            ) : (
                              <ChevronRight size={13} className="opacity-60" />
                            )}
                          </button>
                          {isExpanded && (
                            <ul className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                              {item.subItems!.map((sub) => {
                                const subActive = pathname === sub.href;
                                return (
                                  <li key={sub.id}>
                                    <Link
                                      href={sub.href}
                                      onClick={() => setOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                                        subActive
                                          ? "bg-[var(--terracota)] text-white font-medium"
                                          : "text-white/60 hover:bg-white/10 hover:text-white"
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                            isActive
                              ? "bg-[var(--terracota)] text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <Icon size={15} />
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* User + logout */}
      <div className="p-3 border-t border-white/10">
        {(nomeProjeto || nome) && (
          <div className="px-3 py-2 mb-1">
            {nomeProjeto && (
              <p className="text-xs font-medium text-white truncate">{nomeProjeto}</p>
            )}
            {nome && <p className="text-xs text-white/50 truncate">{nome}</p>}
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all"
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
      {/* ── Mobile top header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--verde-escuro)] flex items-center px-4 shadow-lg gap-4">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <Link href="/dashboard" className="flex-1 flex justify-center" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Estúdio Caeté"
            width={130}
            height={48}
            className="h-9 w-auto brightness-0 invert"
          />
        </Link>
        <div className="w-10 shrink-0" />
      </header>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-1"
        >
          <X size={20} />
        </button>
        <NavContent />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  );
}
