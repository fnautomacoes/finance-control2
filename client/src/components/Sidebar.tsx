import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ArrowRightLeft,
  List,
  TrendingUp,
  FileText,
  CheckCircle,
  CreditCard,
  Target,
  PieChart,
  Users,
  Zap,
  BarChart3,
  TrendingUpIcon,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Tag,
  Layers,
  Wallet,
  User,
  FileCheck,
  Briefcase,
  Hash,
  Paperclip,
  Wrench,
  Download,
  Lock,
  Sliders,
  Key,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  highlight?: boolean;
}

const menuItems: MenuItem[] = [
  {
    name: "Visão geral",
    href: "/",
    icon: LayoutGrid,
  },
  {
    name: "Movimentações e caixa",
    icon: ArrowRightLeft,
    children: [
      { name: "Lançamentos", href: "/transactions", icon: List },
      { name: "Fluxo", href: "/flow", icon: TrendingUp },
      { name: "A pagar e receber", href: "/payables-receivables", icon: FileText },
      { name: "Págos e recebidas", href: "/paid-received", icon: CheckCircle },
      { name: "Extrato de contas", href: "/transactions", icon: CreditCard, highlight: true },
      { name: "Cartões de crédito", href: "/credit-cards", icon: CreditCard },
    ],
  },
  {
    name: "Metas",
    icon: Target,
    children: [
      { name: "Orçamento", href: "/budget", icon: PieChart },
      { name: "Centros", href: "/cost-centers", icon: Layers },
      { name: "Economia", href: "/savings", icon: Zap },
    ],
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Investimentos",
    href: "/investments",
    icon: TrendingUpIcon,
  },
  {
    name: "Cadastros",
    icon: Settings,
    children: [
      { name: "Categorias", href: "/categories", icon: Tag },
      { name: "Centros", href: "/centers", icon: Layers },
      { name: "Contas", href: "/accounts", icon: Wallet },
      { name: "Contatos", href: "/contacts", icon: User },
      { name: "Formas de pagamento", href: "/payment-methods", icon: CreditCard },
      { name: "Projetos", href: "/projects", icon: Briefcase },
      { name: "Tags", href: "/tags", icon: Hash },
    ],
  },
  {
    name: "Documentos",
    href: "/documents",
    icon: Paperclip,
  },
  {
    name: "Regras de preenchimento",
    href: "/rules",
    icon: Wrench,
  },
  {
    name: "Importar OFX",
    href: "/import-ofx",
    icon: Upload,
    highlight: true,
  },
  {
    name: "Fechamento posição",
    href: "/closing",
    icon: Lock,
  },
  {
    name: "Configurações de utilização",
    href: "/settings",
    icon: Sliders,
  },
  {
    name: "API",
    href: "/api-settings",
    icon: Key,
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Movimentações e caixa"]);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Desconectado com sucesso");
      window.location.href = "/";
    } catch (error) {
      toast.error("Erro ao desconectar");
    }
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isItemActive = (href?: string): boolean => {
    if (!href) return false;
    return location === href || location.startsWith(href + "/");
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left",
              "text-slate-700 hover:bg-slate-100",
              depth === 0 ? "font-medium" : "text-sm"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
            />
          </button>

          {isExpanded && item.children && (
            <div className="ml-2 border-l border-slate-200 pl-2 space-y-1 mt-1">
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
          item.highlight
            ? "bg-teal-100 text-teal-700 font-medium"
            : isActive
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-slate-700 hover:bg-slate-100",
          depth > 0 && "text-sm pl-8"
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="bg-white border"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                FC
              </div>
              <span>FinanceControl</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
              <span>{logoutMutation.isPending ? "Desconectando..." : "Sair"}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Offset */}
      <div className="hidden md:block w-72" />
    </>
  );
}
