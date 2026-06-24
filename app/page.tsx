"use client";

import Image from "next/image";
import { siteText } from "@/src/config/site-text";
import { login } from "@/app/actions/auth";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--creme)] px-4">

      {/* Overlay de carregamento pós-login */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--creme)]">
          <Image src="/logo.png" alt={siteText.siteName} width={180} height={72} className="w-40 h-auto mb-8 opacity-80" />
          <div className="w-9 h-9 rounded-full border-[3px] border-[var(--verde-escuro)] border-t-transparent animate-spin" />
          <p className="text-base text-[var(--muted-foreground)] mt-4">Carregando portal...</p>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="w-44">
          <Image
            src="/logo.png"
            alt={siteText.siteName}
            width={300}
            height={120}
            className="w-full h-auto"
            priority
          />
        </div>

        <div className="w-full bg-white rounded-lg border border-[var(--border)] p-8 shadow-sm flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-sans text-xl font-semibold text-[var(--verde-escuro)]">
              Acesso ao Portal
            </h1>
            <p className="text-base text-[var(--muted-foreground)] mt-1">
              {siteText.siteDescription}
            </p>
          </div>

          <form action={handleSubmit} className="flex flex-col gap-4">
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
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-11 w-full rounded-md border border-[var(--input)] bg-white px-3 text-base outline-none focus:ring-2 focus:ring-[var(--verde-escuro)] transition"
              />
            </div>

            {error && (
              <p className="text-base text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-[var(--verde-escuro)] text-white text-base font-medium hover:bg-[var(--verde-medio)] disabled:opacity-60 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="text-sm text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} {siteText.siteName}. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
