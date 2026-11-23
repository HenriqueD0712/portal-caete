import { SecaoGuard } from "@/components/secao-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SecaoGuard id="apresentacao3d">{children}</SecaoGuard>;
}
