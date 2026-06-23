export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  subItems?: SubMenuItem[];
}

export const navigation: MenuItem[] = [
  {
    id: "orcamentos",
    label: "Orçamentos",
    href: "/dashboard/orcamentos",
  },
  {
    id: "cronograma",
    label: "Cronograma",
    href: "/dashboard/cronograma",
  },
  {
    id: "progresso",
    label: "Progresso",
    href: "/dashboard/progresso",
  },
  {
    id: "midias",
    label: "Mídias",
    href: "/dashboard/midias",
    subItems: [
      { id: "visual", label: "Visual 3D", href: "/dashboard/midias/visual" },
      { id: "panoramas", label: "Panoramas 360°", href: "/dashboard/midias/panoramas" },
    ],
  },
  {
    id: "executivo",
    label: "Executivo",
    href: "/dashboard/executivo",
    subItems: [
      { id: "obra", label: "Obra", href: "/dashboard/executivo/obra" },
      { id: "marcenaria", label: "Marcenaria", href: "/dashboard/executivo/marcenaria" },
      { id: "marmoraria", label: "Marmoraria", href: "/dashboard/executivo/marmoraria" },
      // Para adicionar novo submenu: copie a linha acima, mude o id, label e href
    ],
  },
  {
    id: "cuidados",
    label: "Cuidados",
    href: "/dashboard/cuidados",
  },
  {
    id: "reunioes",
    label: "Reuniões",
    href: "/dashboard/reunioes",
  },
  {
    id: "planilhas",
    label: "Planilhas",
    href: "/dashboard/planilhas",
  },
];
