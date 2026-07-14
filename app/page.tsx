import Image from "next/image";
import { siteText } from "@/src/config/site-text";
import { LoginForm } from "@/app/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--creme)] px-4">
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

          <LoginForm />
        </div>

        <p className="text-sm text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} {siteText.siteName}. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
