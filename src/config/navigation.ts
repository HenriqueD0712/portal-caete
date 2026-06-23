export interface NavItem {
  id: string;
  label: string;
  href: string;
  subItems?: NavItem[];
  isDynamic?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    id: "entregas",
    label: "Entregas",
    items: [
      { id: "apresentacao3d", label: "Apresentação 3D", href: "/dashboard/midias/visual" },
      { id: "panoramas", label: "Panoramas 360°", href: "/dashboard/midias/panoramas" },
      { id: "executivo", label: "Executivo", href: "/dashboard/executivo", isDynamic: true },
      { id: "planilhas", label: "Planilhas", href: "/dashboard/planilhas" },
    ],
  },
  {
    id: "informacoes",
    label: "Informações",
    items: [
      { id: "orcamentos", label: "Orçamentos", href: "/dashboard/orcamentos" },
      { id: "reunioes", label: "Reuniões", href: "/dashboard/reunioes" },
      { id: "cuidados", label: "Cuidados", href: "/dashboard/cuidados" },
    ],
  },
];

export const navigation = navigationSections.flatMap((s) => s.items);
