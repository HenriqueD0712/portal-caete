"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-base font-medium">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className="h-11 w-full rounded-md border border-[var(--input)] bg-white px-3 text-base outline-none focus:ring-2 focus:ring-[var(--verde-escuro)] transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-base font-medium">Senha</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            className="h-11 w-full rounded-md border border-[var(--input)] bg-white pl-3 pr-11 text-base outline-none focus:ring-2 focus:ring-[var(--verde-escuro)] transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)] hover:text-[var(--verde-escuro)] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-base text-[var(--muted-foreground)] select-none cursor-pointer">
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          className="h-4 w-4 accent-[var(--verde-escuro)]"
        />
        Manter conectado neste dispositivo
      </label>

      {state?.error && (
        <p className="text-base text-red-600 bg-red-50 px-3 py-2 rounded-md">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-md bg-[var(--verde-escuro)] text-white text-base font-medium hover:bg-[var(--verde-medio)] disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
      >
        {isPending && (
          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
        )}
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
