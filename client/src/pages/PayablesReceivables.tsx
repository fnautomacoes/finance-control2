import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  RefreshCw,
  Maximize2,
  Printer,
  Download,
} from "lucide-react";
import { exportToCSV, printPage, toggleFullscreen, formatCurrencyForExport, formatDateForExport } from "@/lib/export-utils";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};

export default function PayablesReceivables() {
  const [activeTab, setActiveTab] = useState("payables");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (6 - date.getDay()));
    return date;
  });
  const [showPending, setShowPending] = useState(true);
  const [showScheduled, setShowScheduled] = useState(true);
  const [checkedAccounts, setCheckedAccounts] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const payablesQuery = trpc.payables.list.useQuery();
  const receivablesQuery = trpc.receivables.list.useQuery();
  const accountsQuery = trpc.accounts.list.useQuery();
  const createPayableMutation = trpc.payables.create.useMutation();
  const createReceivableMutation = trpc.receivables.create.useMutation();

  // Initialize checked accounts
  useMemo(() => {
    if (accountsQuery.data && checkedAccounts.length === 0) {
      setCheckedAccounts(accountsQuery.data.map((a) => a.id));
    }
  }, [accountsQuery.data]);

  const handleAccountToggle = (accountId: number) => {
    setCheckedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const navigatePeriod = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -7 : 7;
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
    setEndDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (activeTab === "payables") {
        await createPayableMutation.mutateAsync({
          description: formData.description,
          amount: formData.amount,
          dueDate: formData.dueDate,
        });
        toast.success("Conta a pagar criada com sucesso!");
        payablesQuery.refetch();
      } else {
        await createReceivableMutation.mutateAsync({
          description: formData.description,
          amount: formData.amount,
          dueDate: formData.dueDate,
        });
        toast.success("Conta a receber criada com sucesso!");
        receivablesQuery.refetch();
      }
      setOpenDialog(false);
      setFormData({
        description: "",
        amount: "",
        dueDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error("Erro ao criar conta");
    }
  };

  // Filter payables/receivables by date and status
  const filteredPayables = useMemo(() => {
    if (!payablesQuery.data) return [];
    return payablesQuery.data.filter((p) => {
      const dueDate = new Date(p.dueDate);
      const inDateRange = dueDate >= startDate && dueDate <= endDate;
      const statusMatch =
        (showPending && p.status === "pending") ||
        (showScheduled && p.status === "overdue");
      return inDateRange && statusMatch;
    });
  }, [payablesQuery.data, startDate, endDate, showPending, showScheduled]);

  const filteredReceivables = useMemo(() => {
    if (!receivablesQuery.data) return [];
    return receivablesQuery.data.filter((r) => {
      const dueDate = new Date(r.dueDate);
      const inDateRange = dueDate >= startDate && dueDate <= endDate;
      const statusMatch =
        (showPending && r.status === "pending") ||
        (showScheduled && r.status === "overdue");
      return inDateRange && statusMatch;
    });
  }, [receivablesQuery.data, startDate, endDate, showPending, showScheduled]);

  // Calculate totals
  const totalPayables = filteredPayables.reduce(
    (sum, p) => sum + parseFloat(p.amount as string),
    0
  );
  const totalReceivables = filteredReceivables.reduce(
    (sum, r) => sum + parseFloat(r.amount as string),
    0
  );
  const periodResult = totalReceivables - totalPayables;

  // Group by account
  const payablesByAccount = useMemo(() => {
    const grouped: Record<number, number> = {};
    filteredPayables.forEach((p) => {
      // Use a default account for now since payables don't have accountId
      const accountId = 1;
      grouped[accountId] = (grouped[accountId] || 0) + parseFloat(p.amount as string);
    });
    return grouped;
  }, [filteredPayables]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-500";
      case "overdue":
        return "bg-red-600";
      case "paid":
      case "received":
        return "bg-green-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getRelativeDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "amanhã";
    if (diffDays === -1) return "ontem";
    return d.toLocaleDateString("pt-BR");
  };

  if (payablesQuery.isLoading || receivablesQuery.isLoading || accountsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contas a pagar e receber</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="payables">A pagar</TabsTrigger>
            <TabsTrigger value="receivables">A receber</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Period Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => navigatePeriod("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => navigatePeriod("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Period Result */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm">Resultado do período</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>A pagar</span>
                    <span className="text-red-500 font-medium">
                      {formatCurrency(-totalPayables)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>A receber</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(totalReceivables)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Resultado</span>
                    <span className={periodResult >= 0 ? "text-green-600" : "text-red-500"}>
                      {formatCurrency(periodResult)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accounts */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={checkedAccounts.length === accountsQuery.data?.length} />
                    <span>Contas</span>
                  </div>
                  <span className="text-muted-foreground">Total a pagar</span>
                </div>
                {accountsQuery.data?.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={checkedAccounts.includes(account.id)}
                        onCheckedChange={() => handleAccountToggle(account.id)}
                      />
                      <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-xs">
                        {account.name.charAt(0)}
                      </div>
                      <span className="text-sm">{account.name}</span>
                    </div>
                    <span className="text-sm text-red-500 font-medium">
                      {formatCurrency(-(payablesByAccount[account.id] || 0))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span className="text-sm">Total</span>
                  <span className="text-sm text-red-500">{formatCurrency(-totalPayables)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filtrar</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Agendados</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  title="Tela cheia"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const data = activeTab === "payables" ? filteredPayables : filteredReceivables;
                    const exportData = data.map((item) => ({
                      Descrição: item.description,
                      Valor: formatCurrencyForExport(parseFloat(item.amount as string)),
                      Vencimento: formatDateForExport(item.dueDate),
                      Status: item.status || "pending",
                    }));
                    exportToCSV(
                      exportData,
                      `contas-${activeTab === "payables" ? "pagar" : "receber"}-${formatDateForExport(new Date())}`
                    );
                    toast.success("Dados exportados com sucesso!");
                  }}
                  title="Exportar CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={printPage}
                  title="Imprimir"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="payables" className="m-0">
              <Card>
                <CardContent className="p-0">
                  {filteredPayables.length > 0 ? (
                    <div className="divide-y">
                      {filteredPayables.map((payable) => (
                        <div
                          key={payable.id}
                          className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(payable.status || "pending")}`}
                            />
                            <div className="text-sm text-muted-foreground w-20">
                              {getRelativeDate(payable.dueDate)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{payable.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  Conta
                                </Badge>
                                <span>Categoria</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-red-500 w-24 text-right">
                              {formatCurrency(-parseFloat(payable.amount as string))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Nenhuma conta a pagar no período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="receivables" className="m-0">
              <Card>
                <CardContent className="p-0">
                  {filteredReceivables.length > 0 ? (
                    <div className="divide-y">
                      {filteredReceivables.map((receivable) => (
                        <div
                          key={receivable.id}
                          className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(receivable.status || "pending")}`}
                            />
                            <div className="text-sm text-muted-foreground w-20">
                              {getRelativeDate(receivable.dueDate)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{receivable.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  Conta
                                </Badge>
                                <span>Categoria</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-green-600 w-24 text-right">
                              {formatCurrency(parseFloat(receivable.amount as string))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Nenhuma conta a receber no período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-teal-500 hover:bg-teal-600"
        size="icon"
        onClick={() => setOpenDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "payables" ? "Nova Conta a Pagar" : "Nova Conta a Receber"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "payables"
                ? "Adicione uma nova conta a pagar"
                : "Adicione uma nova conta a receber"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Aluguel, Salário..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPayableMutation.isPending || createReceivableMutation.isPending}
            >
              {createPayableMutation.isPending || createReceivableMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
