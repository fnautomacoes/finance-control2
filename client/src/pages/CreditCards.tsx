import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  MoreVertical,
  Check,
  Search,
} from "lucide-react";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatMonth = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

export default function CreditCards() {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showUnreconciled, setShowUnreconciled] = useState(true);
  const [showReconciled, setShowReconciled] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCardDialog, setOpenCardDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [cardFormData, setCardFormData] = useState({
    name: "",
    creditLimit: "",
    closingDay: "1",
    dueDay: "10",
  });
  const [transactionFormData, setTransactionFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: undefined as number | undefined,
  });

  const accountsQuery = trpc.accounts.list.useQuery();
  const transactionsQuery = trpc.transactions.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const createAccountMutation = trpc.accounts.create.useMutation();
  const createTransactionMutation = trpc.transactions.create.useMutation();

  // Filter only credit card accounts
  const creditCards = useMemo(() => {
    if (!accountsQuery.data) return [];
    return accountsQuery.data.filter((a) => a.type === "credit_card");
  }, [accountsQuery.data]);

  // Select first card by default
  useMemo(() => {
    if (creditCards.length > 0 && selectedCardId === null) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  // Filter transactions for selected card and month
  const cardTransactions = useMemo(() => {
    if (!transactionsQuery.data || !selectedCardId) return [];
    return transactionsQuery.data.filter((t) => {
      if (t.accountId !== selectedCardId) return false;
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth.getMonth() &&
        txDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  }, [transactionsQuery.data, selectedCardId, currentMonth]);

  // Calculate invoice totals
  const invoiceTotals = useMemo(() => {
    const expenses = cardTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

    const payments = cardTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

    return {
      expenses,
      payments,
      total: expenses - payments,
      previousBalance: 0, // Would need historical data
      toPay: expenses - payments,
    };
  }, [cardTransactions]);

  // Calculate credit limit info
  const limitInfo = useMemo(() => {
    const limit = selectedCard?.creditLimit ? parseFloat(selectedCard.creditLimit as string) : 0;
    const used = invoiceTotals.expenses;
    return {
      total: limit,
      used,
      available: limit - used,
    };
  }, [invoiceTotals.expenses, selectedCard]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  // Calculate closing and due dates (example: closing on 2nd, due on 9th)
  const closingDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(2);
    date.setMonth(date.getMonth() + 1);
    return date;
  }, [currentMonth]);

  const dueDate = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(9);
    date.setMonth(date.getMonth() + 1);
    return date;
  }, [currentMonth]);

  const handleCreateCard = async () => {
    if (!cardFormData.name || !cardFormData.creditLimit) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        name: cardFormData.name,
        type: "credit_card",
        balance: "0",
        creditLimit: cardFormData.creditLimit,
      });
      toast.success("Cartão de crédito criado com sucesso!");
      setOpenCardDialog(false);
      setCardFormData({
        name: "",
        creditLimit: "",
        closingDay: "1",
        dueDay: "10",
      });
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar cartão de crédito");
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedCardId || !transactionFormData.description || !transactionFormData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTransactionMutation.mutateAsync({
        accountId: selectedCardId,
        description: transactionFormData.description,
        amount: transactionFormData.amount,
        type: "expense",
        date: transactionFormData.date,
        categoryId: transactionFormData.categoryId,
      });
      toast.success("Transação criada com sucesso!");
      setOpenTransactionDialog(false);
      setTransactionFormData({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: undefined,
      });
      transactionsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar transação");
    }
  };

  if (accountsQuery.isLoading || transactionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const renderCardDialog = () => (
    <Dialog open={openCardDialog} onOpenChange={setOpenCardDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Cadastre um novo cartão de crédito
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Nome do Cartão *</Label>
            <Input
              id="cardName"
              value={cardFormData.name}
              onChange={(e) =>
                setCardFormData({ ...cardFormData, name: e.target.value })
              }
              placeholder="Ex: Nubank, Inter, C6..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Limite de Crédito *</Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              value={cardFormData.creditLimit}
              onChange={(e) =>
                setCardFormData({ ...cardFormData, creditLimit: e.target.value })
              }
              placeholder="0,00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Dia de Fechamento</Label>
              <Input
                id="closingDay"
                type="number"
                min="1"
                max="31"
                value={cardFormData.closingDay}
                onChange={(e) =>
                  setCardFormData({ ...cardFormData, closingDay: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Dia de Vencimento</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={cardFormData.dueDay}
                onChange={(e) =>
                  setCardFormData({ ...cardFormData, dueDay: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenCardDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateCard} disabled={createAccountMutation.isPending}>
            {createAccountMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderTransactionDialog = () => (
    <Dialog open={openTransactionDialog} onOpenChange={setOpenTransactionDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Adicione uma nova transação ao cartão {selectedCard?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={transactionFormData.description}
              onChange={(e) =>
                setTransactionFormData({ ...transactionFormData, description: e.target.value })
              }
              placeholder="Ex: Compra no mercado..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={transactionFormData.amount}
              onChange={(e) =>
                setTransactionFormData({ ...transactionFormData, amount: e.target.value })
              }
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={transactionFormData.date}
              onChange={(e) =>
                setTransactionFormData({ ...transactionFormData, date: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={transactionFormData.categoryId?.toString() || ""}
              onValueChange={(value) =>
                setTransactionFormData({
                  ...transactionFormData,
                  categoryId: value ? parseInt(value) : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriesQuery.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenTransactionDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateTransaction} disabled={createTransactionMutation.isPending}>
            {createTransactionMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (creditCards.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Cartões de crédito</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum cartão de crédito cadastrado.
            </p>
            <Button onClick={() => setOpenCardDialog(true)}>
              Cadastrar Cartão de Crédito
            </Button>
          </CardContent>
        </Card>
        {renderCardDialog()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões de crédito</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4">
          {/* Card Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {selectedCard?.name?.substring(0, 2).toUpperCase() || "CC"}
                </div>
                <Select
                  value={selectedCardId?.toString()}
                  onValueChange={(v) => setSelectedCardId(parseInt(v))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id.toString()}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Month Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium capitalize">{formatMonth(currentMonth)}</span>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Fatura atual (R$)
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechamento</span>
                  <span>{closingDate.toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span>{dueDate.toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo anterior</span>
                  <span className="text-red-500">
                    {formatCurrency(-invoiceTotals.previousBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pago</span>
                  <span className="text-green-600">
                    {formatCurrency(invoiceTotals.payments)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-red-500">
                    {formatCurrency(-invoiceTotals.total)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Valor a pagar</span>
                  <span className="text-red-500">
                    {formatCurrency(-invoiceTotals.toPay)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="link" className="flex-1 text-teal-600 text-sm p-0">
                  Fechar fatura
                </Button>
                <Button variant="link" className="flex-1 text-teal-600 text-sm p-0">
                  Lançar pagamento
                </Button>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="text-center text-muted-foreground">Detalhamento</div>
                <div className="flex justify-between">
                  <span>Despesas</span>
                  <span className="text-red-500">
                    {formatCurrency(-invoiceTotals.expenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total conciliado</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total não conciliado</span>
                  <span className="text-red-500">
                    {formatCurrency(-invoiceTotals.expenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Despesas fixas</span>
                  <span className="text-red-500">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-teal-600">
                  <span className="underline cursor-pointer">Parcelas futuras</span>
                  <span className="underline cursor-pointer">Antecipar parcelas</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="text-center text-muted-foreground">Limite (Total)</div>
                <div className="flex justify-between">
                  <span>Limite da conta</span>
                  <span className="text-green-600">{formatCurrency(limitInfo.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilizado</span>
                  <span className="text-red-500">{formatCurrency(-limitInfo.used)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Disponível</span>
                  <span className="text-green-600">{formatCurrency(limitInfo.available)}</span>
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
                <span className="text-sm">Não conciliados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">Conciliados</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              {cardTransactions.length > 0 ? (
                <div className="divide-y">
                  {cardTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <div className="text-sm text-muted-foreground w-20">
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>→ {selectedCard?.name}</span>
                            <span>Categoria</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Check className="h-4 w-4" />
                        </Button>
                        <span
                          className={`text-sm font-medium w-24 text-right ${
                            tx.type === "income" ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {tx.type === "income" ? "" : "-"}
                          {formatCurrency(parseFloat(tx.amount as string))}
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
                  <p className="text-muted-foreground mb-4">
                    Nenhuma transação neste cartão para o período selecionado.
                  </p>
                  <Button>Adicionar Transação</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-teal-500 hover:bg-teal-600"
        size="icon"
        onClick={() => setOpenTransactionDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Card Button */}
      <Button
        className="fixed bottom-6 right-24 shadow-lg"
        variant="outline"
        onClick={() => setOpenCardDialog(true)}
      >
        Novo Cartão
      </Button>

      {renderCardDialog()}
      {renderTransactionDialog()}
    </div>
  );
}
