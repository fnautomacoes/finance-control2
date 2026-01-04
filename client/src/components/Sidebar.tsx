import { Link } from "wouter";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Tag,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contas", href: "/accounts", icon: Wallet },
  { name: "Transações", href: "/transactions", icon: TrendingUp },
  { name: "Investimentos", href: "/investments", icon: TrendingUp },
  { name: "Categorias", href: "/categories", icon: Tag },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
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
          "fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <Link href="/">
              <a className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  FC
                </div>
                <span>FinanceControl</span>
              </a>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <Link href="/settings">
              <a
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </a>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
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
      <div className="hidden md:block w-64" />
    </>
  );
}
