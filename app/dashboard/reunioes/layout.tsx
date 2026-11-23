import { SecaoGuard } from "@/components/secao-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SecaoGuard id="reunioes">{children}</SecaoGuard>;
}
