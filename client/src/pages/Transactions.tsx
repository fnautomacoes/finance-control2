import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type TransactionStatus = "pending" | "scheduled" | "confirmed" | "cancelled";

type Transaction = {
  id: number;
  accountId: number;
  description: string;
  amount: string;
  type: "income" | "expense";
  date: string;
  categoryId?: number | null;
  notes?: string | null;
};

export default function Transactions() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [selectedAccount, setSelectedAccount] = useState<number>(0); // 0 = Todas as contas
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");
  const [showDebug, setShowDebug] = useState(false);
  const [formData, setFormData] = useState({
    accountId: 0,
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    categoryId: undefined as number | undefined,
    notes: "",
  });
  const [editFormData, setEditFormData] = useState({
    accountId: 1,
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    categoryId: undefined as number | undefined,
    notes: "",
  });

  // Queries
  const transactionsQuery = trpc.transactions.list.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const accountsQuery = trpc.accounts.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const createTransactionMutation = trpc.transactions.create.useMutation();
  const updateTransactionMutation = trpc.transactions.update.useMutation();
  const deleteTransactionMutation = trpc.transactions.delete.useMutation();

  // Debug logging
  useEffect(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 [Transactions Page] Estado atualizado");
    console.log("   Query status:", {
      isLoading: transactionsQuery.isLoading,
      isFetching: transactionsQuery.isFetching,
      isError: transactionsQuery.isError,
      isSuccess: transactionsQuery.isSuccess,
    });
    console.log("   Total recebido do backend:", transactionsQuery.data?.length || 0);
    console.log("   Filtros ativos:", { filterType, selectedAccount, filterStatus });
    if (transactionsQuery.data && transactionsQuery.data.length > 0) {
      console.log("   Primeira transação:", transactionsQuery.data[0]);
    }
    if (transactionsQuery.error) {
      console.error("   ❌ Erro:", transactionsQuery.error);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }, [transactionsQuery.data, transactionsQuery.isLoading, transactionsQuery.isError, filterType, selectedAccount, filterStatus]);

  // Set default account when accounts are loaded
  useEffect(() => {
    if (accountsQuery.data && accountsQuery.data.length > 0 && formData.accountId === 0) {
      setFormData((prev) => ({ ...prev, accountId: accountsQuery.data[0].id }));
    }
  }, [accountsQuery.data, formData.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTransactionMutation.mutateAsync({
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      toast.success("Transação criada com sucesso!");
      setFormData({
        accountId: accountsQuery.data?.[0]?.id || 0,
        description: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        categoryId: undefined,
        notes: "",
      });
      setOpen(false);
      transactionsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar transação");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "categoryId" || name === "accountId" ? parseInt(value) : value,
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === "categoryId" || name === "accountId" ? parseInt(value) : value,
    }));
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditFormData({
      accountId: tx.accountId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: new Date(tx.date).toISOString().split("T")[0],
      categoryId: tx.categoryId ?? undefined,
      notes: tx.notes ?? "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      await updateTransactionMutation.mutateAsync({
        id: selectedTransaction.id,
        accountId: editFormData.accountId,
        description: editFormData.description,
        amount: editFormData.amount,
        type: editFormData.type,
        date: new Date(editFormData.date).toISOString(),
        categoryId: editFormData.categoryId,
        notes: editFormData.notes,
      });
      toast.success("Transação atualizada com sucesso!");
      setEditOpen(false);
      setSelectedTransaction(null);
      transactionsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar transação");
      console.error(error);
    }
  };

  const handleDeleteClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransactionMutation.mutateAsync({ id: selectedTransaction.id });
      toast.success("Transação excluída com sucesso!");
      setDeleteOpen(false);
      setSelectedTransaction(null);
      transactionsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao excluir transação");
      console.error(error);
    }
  };

  const filteredTransactions = transactionsQuery.data?.filter((tx) => {
    if (filterType === "all" && selectedAccount === 0) return true;
    if (selectedAccount !== 0 && tx.accountId !== selectedAccount) return false;
    if (filterType === "all") return true;
    return tx.type === filterType;
  }) || [];

  const selectedAccountData = accountsQuery.data?.find((acc) => acc.id === selectedAccount);

  const totalIncome = filteredTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount as string), 0);

  const totalExpense = filteredTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount as string), 0);

  const balance = totalIncome - totalExpense;

  // Calcula saldo anterior e saldo progressivo
  let previousBalance = selectedAccountData ? parseFloat(selectedAccountData.balance as string) - balance : 0;
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const transactionsWithBalance = sortedTransactions.map((tx, index) => {
    const amount = parseFloat(tx.amount as string);
    const txBalance = previousBalance + (index > 0 ? 0 : balance);
    previousBalance = txBalance - (tx.type === "income" ? amount : -amount);
    return {
      ...tx,
      runningBalance: txBalance,
    };
  });

  // Calcular transações filtradas para o debug
  const debugInfo = {
    queryStatus: transactionsQuery.isLoading ? "⏳ Loading" : transactionsQuery.isError ? "❌ Error" : "✅ Success",
    totalFromBackend: transactionsQuery.data?.length || 0,
    afterFilters: filteredTransactions.length,
    filters: { filterType, selectedAccount, filterStatus },
    accounts: accountsQuery.data?.map(a => ({ id: a.id, name: a.name })) || [],
  };

  return (
    <div className="space-y-6">
      {/* Debug Card - Toggle with button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs"
        >
          {showDebug ? "Ocultar Debug" : "🔧 Debug"}
        </Button>
      </div>

      {showDebug && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🔧 Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>Query Status: <span className="font-bold">{debugInfo.queryStatus}</span></div>
              <div>Erro: <span className="font-bold">{transactionsQuery.error?.message || "Nenhum"}</span></div>
              <div>Dados recebidos: <span className="font-bold text-blue-600">{debugInfo.totalFromBackend} transações</span></div>
              <div>Após filtros: <span className="font-bold text-green-600">{debugInfo.afterFilters} transações</span></div>
              <div>Filtro tipo: <span className="font-bold">{filterType}</span></div>
              <div>Filtro conta: <span className="font-bold">{selectedAccount === 0 ? "Todas" : selectedAccount}</span></div>
            </div>
            <div className="border-t pt-2">
              <div className="font-bold mb-1">Contas disponíveis:</div>
              <div className="flex gap-2 flex-wrap">
                {debugInfo.accounts.map(acc => (
                  <span key={acc.id} className="bg-white px-2 py-1 rounded text-xs">
                    {acc.id}: {acc.name}
                  </span>
                ))}
              </div>
            </div>
            {transactionsQuery.data && transactionsQuery.data.length > 0 && (
              <div className="border-t pt-2">
                <div className="font-bold mb-1">Primeira transação recebida:</div>
                <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(transactionsQuery.data[0], null, 2)}
                </pre>
              </div>
            )}
            {transactionsQuery.data && transactionsQuery.data.length === 0 && (
              <div className="border-t pt-2 text-red-600 font-bold">
                ⚠️ Backend retornou 0 transações! Verifique os logs do servidor.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Transação</DialogTitle>
              <DialogDescription>Registre uma receita ou despesa</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex: Compra no supermercado"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountId">Conta *</Label>
                  <Select value={formData.accountId.toString()} onValueChange={(value) => handleSelectChange("accountId", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accountsQuery.data?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId?.toString() || ""}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
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

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observações adicionais"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createTransactionMutation.isPending}>
                {createTransactionMutation.isPending ? "Criando..." : "Criar Transação"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Account Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedAccount.toString()} onValueChange={(value) => setSelectedAccount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas as contas</SelectItem>
                  {accountsQuery.data?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Account Summary */}
          {selectedAccountData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo anterior</span>
                    <span className="font-medium">
                      R$ {(parseFloat(selectedAccountData.balance as string) - balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receitas</span>
                    <span className="font-medium text-green-600">
                      R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Despesas</span>
                    <span className="font-medium text-red-600">
                      R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Saldo final</span>
                    <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                      R$ {parseFloat(selectedAccountData.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              className="font-medium"
            >
              Todas
            </Button>
            <Button
              variant={filterType === "income" ? "default" : "outline"}
              onClick={() => setFilterType("income")}
              className="text-green-600"
            >
              Receitas
            </Button>
            <Button
              variant={filterType === "expense" ? "default" : "outline"}
              onClick={() => setFilterType("expense")}
              className="text-red-600"
            >
              Despesas
            </Button>
          </div>

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              {transactionsQuery.isLoading ? (
                <div className="text-center py-8">Carregando transações...</div>
              ) : transactionsWithBalance.length > 0 ? (
                <div className="divide-y">
                  {/* Previous Balance */}
                  <div className="p-4 bg-muted/30 flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Saldo anterior</span>
                    <span className="text-sm font-bold text-green-600">
                      R$ {previousBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Transactions */}
                  {transactionsWithBalance.map((tx) => {
                    const category = categoriesQuery.data?.find((c) => c.id === tx.categoryId);
                    return (
                      <div
                        key={tx.id}
                        className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">#{tx.id}</span>
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                tx.type === "income" ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            <span className="text-sm font-medium truncate">{new Date(tx.date).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{category?.name || "Sem categoria"}</p>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "income" ? "+" : "-"} R$ {parseFloat(tx.amount as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm font-bold text-green-600">
                              R$ {tx.runningBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(tx as Transaction)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteClick(tx as Transaction)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Nenhuma transação registrada</p>
                  <Button onClick={() => setOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeira Transação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação #{selectedTransaction?.id}</DialogTitle>
            <DialogDescription>Atualize os dados da transação</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-description">Descrição *</Label>
              <Input
                id="edit-description"
                name="description"
                value={editFormData.description}
                onChange={handleEditInputChange}
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Tipo *</Label>
                <Select value={editFormData.type} onValueChange={(value) => handleEditSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-amount">Valor *</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Data *</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={editFormData.date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-accountId">Conta *</Label>
                <Select value={editFormData.accountId.toString()} onValueChange={(value) => handleEditSelectChange("accountId", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountsQuery.data?.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-categoryId">Categoria</Label>
              <Select
                value={editFormData.categoryId?.toString() || ""}
                onValueChange={(value) => handleEditSelectChange("categoryId", value)}
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

            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Input
                id="edit-notes"
                name="notes"
                value={editFormData.notes}
                onChange={handleEditInputChange}
                placeholder="Observações adicionais"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateTransactionMutation.isPending}>
                {updateTransactionMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "{selectedTransaction?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTransactionMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
