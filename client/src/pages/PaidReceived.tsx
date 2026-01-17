import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ThumbsUp,
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

export default function PaidReceived() {
  const [activeTab, setActiveTab] = useState("paid");
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
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showReconciled, setShowReconciled] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    paidDate: new Date().toISOString().split("T")[0],
  });

  const payablesQuery = trpc.payables.list.useQuery();
  const receivablesQuery = trpc.receivables.list.useQuery();
  const createPayableMutation = trpc.payables.create.useMutation();
  const createReceivableMutation = trpc.receivables.create.useMutation();

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
    if (!formData.description || !formData.amount || !formData.paidDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (activeTab === "paid") {
        await createPayableMutation.mutateAsync({
          description: formData.description,
          amount: formData.amount,
          dueDate: formData.paidDate,
          status: "paid",
          paidDate: formData.paidDate,
        });
        toast.success("Despesa paga registrada com sucesso!");
        payablesQuery.refetch();
      } else {
        await createReceivableMutation.mutateAsync({
          description: formData.description,
          amount: formData.amount,
          dueDate: formData.paidDate,
          status: "received",
          receivedDate: formData.paidDate,
        });
        toast.success("Receita recebida registrada com sucesso!");
        receivablesQuery.refetch();
      }
      setOpenDialog(false);
      setFormData({
        description: "",
        amount: "",
        paidDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error("Erro ao registrar");
    }
  };

  // Filter paid items
  const paidItems = useMemo(() => {
    if (!payablesQuery.data) return [];
    return payablesQuery.data.filter((p) => {
      if (p.status !== "paid") return false;
      if (!p.paidDate) return false;
      const paidDate = new Date(p.paidDate);
      return paidDate >= startDate && paidDate <= endDate;
    });
  }, [payablesQuery.data, startDate, endDate]);

  // Filter received items
  const receivedItems = useMemo(() => {
    if (!receivablesQuery.data) return [];
    return receivablesQuery.data.filter((r) => {
      if (r.status !== "received") return false;
      if (!r.receivedDate) return false;
      const receivedDate = new Date(r.receivedDate);
      return receivedDate >= startDate && receivedDate <= endDate;
    });
  }, [receivablesQuery.data, startDate, endDate]);

  // Calculate totals
  const totalPaid = paidItems.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
  const totalReceived = receivedItems.reduce((sum, r) => sum + parseFloat(r.amount as string), 0);
  const periodResult = totalReceived - totalPaid;

  if (payablesQuery.isLoading || receivablesQuery.isLoading) {
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
        <h1 className="text-2xl font-semibold">Contas pagas e recebidas</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="paid">Pagas</TabsTrigger>
            <TabsTrigger value="received">Recebidas</TabsTrigger>
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
                    <span>Pago</span>
                    <span className="font-medium">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recebido</span>
                    <span className="font-medium">{formatCurrency(totalReceived)}</span>
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
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filtrar</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Confirmados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Conciliados</span>
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
                    const data = activeTab === "paid" ? paidItems : receivedItems;
                    const exportData = data.map((item) => ({
                      Descrição: item.description,
                      Valor: formatCurrencyForExport(parseFloat(item.amount as string)),
                      Data: formatDateForExport(activeTab === "paid" ? item.paidDate || "" : item.receivedDate || ""),
                    }));
                    exportToCSV(
                      exportData,
                      `contas-${activeTab === "paid" ? "pagas" : "recebidas"}-${formatDateForExport(new Date())}`
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

            <TabsContent value="paid" className="m-0">
              <Card>
                <CardContent className="p-0">
                  {paidItems.length > 0 ? (
                    <div className="divide-y">
                      {paidItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="text-sm text-muted-foreground w-20">
                              {item.paidDate
                                ? new Date(item.paidDate).toLocaleDateString("pt-BR")
                                : ""}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.description}</p>
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
                              {formatCurrency(-parseFloat(item.amount as string))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <ThumbsUp className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Nenhuma despesa confirmada no período escolhido.
                      </p>
                      <p className="text-muted-foreground text-sm mb-4">
                        Você pode escolher outro período ou lançar uma nova despesa.
                      </p>
                      <Button variant="link" className="text-teal-600">
                        Incluir despesa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="received" className="m-0">
              <Card>
                <CardContent className="p-0">
                  {receivedItems.length > 0 ? (
                    <div className="divide-y">
                      {receivedItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="text-sm text-muted-foreground w-20">
                              {item.receivedDate
                                ? new Date(item.receivedDate).toLocaleDateString("pt-BR")
                                : ""}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.description}</p>
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
                              {formatCurrency(parseFloat(item.amount as string))}
                            </span>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <ThumbsUp className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Nenhuma receita confirmada no período escolhido.
                      </p>
                      <p className="text-muted-foreground text-sm mb-4">
                        Você pode escolher outro período ou lançar uma nova receita.
                      </p>
                      <Button variant="link" className="text-teal-600">
                        Incluir receita
                      </Button>
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
              {activeTab === "paid" ? "Registrar Despesa Paga" : "Registrar Receita Recebida"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "paid"
                ? "Registre uma despesa já paga"
                : "Registre uma receita já recebida"}
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
              <Label htmlFor="paidDate">
                {activeTab === "paid" ? "Data do Pagamento *" : "Data do Recebimento *"}
              </Label>
              <Input
                id="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={(e) =>
                  setFormData({ ...formData, paidDate: e.target.value })
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
