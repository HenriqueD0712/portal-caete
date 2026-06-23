"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, FileText, Calendar, BarChart2, Image as ImageIcon,
  Eye, Building2, Hammer, Mountain, Shield, MessageSquare,
  Table2, ChevronDown, ChevronRight, Menu, X, LogOut, Layers,
} from "lucide-react";
import { navigation } from "@/src/config/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/src/lib/utils";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  orcamentos: FileText,
  cronograma: Calendar,
  progresso: BarChart2,
  midias: ImageIcon,
  visual: Layers,
  panoramas: Eye,
  executivo: Building2,
  obra: Building2,
  marcenaria: Hammer,
  marmoraria: Mountain,
  cuidados: Shield,
  reunioes: MessageSquare,
  planilhas: Table2,
};

export function Sidebar({ nomeProjeto, nome }: { nomeProjeto?: string; nome?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["midias", "executivo"]);

  function toggleExpand(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full bg-[var(--verde-escuro)]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Image src="/logo.png" alt="Estúdio Caeté" width={120} height={48} className="h-auto brightness-0 invert" />
      </div>

      {/* Home link */}
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

      {/* Nav links */}
      <ul className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navigation.map((item) => {
          const Icon = iconMap[item.id] ?? FileText;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isExpanded = expanded.includes(item.id);

          return (
            <li key={item.id}>
              {item.subItems ? (
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
                    {isExpanded ? <ChevronDown size={13} className="opacity-60" /> : <ChevronRight size={13} className="opacity-60" />}
                  </button>
                  {isExpanded && (
                    <ul className="mt-0.5 ml-4 pl-3 border-l border-white/10 space-y-0.5">
                      {item.subItems.map((sub) => {
                        const SubIcon = iconMap[sub.id] ?? FileText;
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
                              <SubIcon size={13} />
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

      {/* User + logout */}
      <div className="p-3 border-t border-white/10">
        {(nomeProjeto || nome) && (
          <div className="px-3 py-2 mb-1">
            {nomeProjeto && <p className="text-xs font-medium text-white truncate">{nomeProjeto}</p>}
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
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-[var(--verde-escuro)] border border-white/20 rounded-lg p-2 shadow-md"
      >
        <Menu size={18} className="text-white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  );
}
