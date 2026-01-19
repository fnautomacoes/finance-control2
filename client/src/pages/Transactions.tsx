import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { TransactionModal } from "@/components/TransactionModal";
import { PartialConfirmDialog } from "@/components/PartialConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  CheckCircle,
  Clock,
  CheckCheck,
  Link2,
  Edit2,
  Trash2,
  Copy,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SortOrder = "creation" | "alphabetical" | "value-asc" | "value-desc";
type StatusFilter = "all" | "pending" | "scheduled" | "confirmed" | "reconciled";

export default function Transactions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [partialConfirmOpen, setPartialConfirmOpen] = useState(false);
  const [partialConfirmTransaction, setPartialConfirmTransaction] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTransaction, setDeleteTransactionState] = useState<any>(null);

  // View settings
  const [showDailyBalance, setShowDailyBalance] = useState(true);
  const [alternateColors, setAlternateColors] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>("creation");

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAccount, setSelectedAccount] = useState<number>(0);

  const utils = trpc.useUtils();

  // Queries
  const transactionsQuery = trpc.transactions.list.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: statusFilter,
    accountId: selectedAccount || undefined,
  });
  const accountsQuery = trpc.accounts.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();

  // Debug logging
  useEffect(() => {
    console.log("━━━ Transactions Page ━━━");
    console.log("Query status:", transactionsQuery.isLoading ? "Loading" : transactionsQuery.isError ? "Error" : "Success");
    console.log("Total transactions:", transactionsQuery.data?.length || 0);
    console.log("Filters:", { startDate, endDate, statusFilter, selectedAccount });
  }, [transactionsQuery.data, transactionsQuery.isLoading, startDate, endDate, statusFilter, selectedAccount]);

  // Mutations
  const confirmMutation = trpc.transactions.confirm.useMutation({
    onSuccess: () => {
      toast.success("Transação confirmada!");
      utils.transactions.list.invalidate();
    },
  });

  const reconcileMutation = trpc.transactions.reconcile.useMutation({
    onSuccess: () => {
      toast.success("Transação conciliada!");
      utils.transactions.list.invalidate();
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      toast.success("Transação excluída!");
      utils.transactions.list.invalidate();
      setDeleteOpen(false);
      setDeleteTransactionState(null);
    },
  });

  const cloneMutation = trpc.transactions.clone.useMutation({
    onSuccess: () => {
      toast.success("Transação clonada!");
      utils.transactions.list.invalidate();
    },
  });

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    if (!transactionsQuery.data) return new Map<string, any[]>();

    const grouped = new Map<string, any[]>();

    // Group by date
    transactionsQuery.data.forEach((tx) => {
      const date = tx.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(tx);
    });

    // Sort transactions within each day
    grouped.forEach((transactions, date) => {
      let sorted = [...transactions];

      switch (sortOrder) {
        case "alphabetical":
          sorted.sort((a, b) => a.description.localeCompare(b.description));
          break;
        case "value-asc":
          sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
          break;
        case "value-desc":
          sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
          break;
        case "creation":
        default:
          sorted.sort((a, b) => a.id - b.id);
          break;
      }

      grouped.set(date, sorted);
    });

    return grouped;
  }, [transactionsQuery.data, sortOrder]);

  // Calculate cumulative balance
  const transactionsWithBalance = useMemo(() => {
    if (!showDailyBalance) return groupedTransactions;

    const result = new Map<string, any[]>();
    let cumulativeBalance = 0;

    // Sort dates descending
    const sortedDates = Array.from(groupedTransactions.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate balance from oldest to newest, then reverse for display
    const reversedDates = [...sortedDates].reverse();
    reversedDates.forEach((date) => {
      const dayTransactions = groupedTransactions.get(date) || [];
      const withBalance = dayTransactions.map((tx, idx) => {
        const value = parseFloat(tx.amount);
        cumulativeBalance += tx.type === "income" ? value : -value;
        return {
          ...tx,
          runningBalance: idx === dayTransactions.length - 1 ? cumulativeBalance : null,
        };
      });
      result.set(date, withBalance);
    });

    // Reorder for display (newest first)
    const finalResult = new Map<string, any[]>();
    sortedDates.forEach((date) => {
      finalResult.set(date, result.get(date) || []);
    });

    return finalResult;
  }, [groupedTransactions, showDailyBalance]);

  // Summary calculations
  const summary = useMemo(() => {
    if (!transactionsQuery.data) return { income: 0, expense: 0, balance: 0 };

    const income = transactionsQuery.data
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + parseFloat(tx.amount as string), 0);

    const expense = transactionsQuery.data
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + parseFloat(tx.amount as string), 0);

    return { income, expense, balance: income - expense };
  }, [transactionsQuery.data]);

  const handleAction = async (action: string, transaction: any) => {
    switch (action) {
      case "confirm":
        await confirmMutation.mutateAsync({ id: transaction.id });
        break;
      case "confirmPartially":
        setPartialConfirmTransaction(transaction);
        setPartialConfirmOpen(true);
        break;
      case "reconcile":
        await reconcileMutation.mutateAsync({ id: transaction.id });
        break;
      case "edit":
        setSelectedTransaction(transaction);
        setModalType(transaction.type);
        setModalOpen(true);
        break;
      case "delete":
        setDeleteTransactionState(transaction);
        setDeleteOpen(true);
        break;
      case "clone":
        await cloneMutation.mutateAsync({ id: transaction.id });
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendente", class: "bg-yellow-100 text-yellow-800" },
      scheduled: { label: "Agendado", class: "bg-blue-100 text-blue-800" },
      confirmed: { label: "Confirmado", class: "bg-green-100 text-green-800" },
      reconciled: { label: "Conciliado", class: "bg-purple-100 text-purple-800" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "-";
    const category = categoriesQuery.data?.find((c) => c.id === categoryId);
    return category?.name || "-";
  };

  const getAccountName = (accountId: number) => {
    const account = accountsQuery.data?.find((a) => a.id === accountId);
    return account?.name || "-";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setModalType("income");
              setSelectedTransaction(null);
              setModalOpen(true);
            }}
            variant="outline"
            className="bg-green-50 hover:bg-green-100 border-green-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Receita
          </Button>
          <Button
            onClick={() => {
              setModalType("expense");
              setSelectedTransaction(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Despesa
          </Button>
        </div>
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
              R$ {summary.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
              R$ {summary.expense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {summary.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Data Inicial</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Data Final</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="scheduled">Agendados</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="reconciled">Conciliados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Conta</label>
          <Select
            value={selectedAccount.toString()}
            onValueChange={(v) => setSelectedAccount(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas as contas</SelectItem>
              {accountsQuery.data?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Ordenar por</label>
          <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creation">Criação</SelectItem>
              <SelectItem value="alphabetical">Alfabética</SelectItem>
              <SelectItem value="value-asc">Valor Crescente</SelectItem>
              <SelectItem value="value-desc">Valor Decrescente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Options */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="daily-balance"
            checked={showDailyBalance}
            onCheckedChange={(checked) => setShowDailyBalance(!!checked)}
          />
          <label htmlFor="daily-balance" className="text-sm cursor-pointer">
            Exibir saldo acumulado por dia
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="alternate-colors"
            checked={alternateColors}
            onCheckedChange={(checked) => setAlternateColors(!!checked)}
          />
          <label htmlFor="alternate-colors" className="text-sm cursor-pointer">
            Linhas em cores alternadas
          </label>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              utils.transactions.list.invalidate();
              toast.success("Lista atualizada!");
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        {transactionsQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando transações...
          </div>
        ) : transactionsWithBalance.size === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">Nenhum lançamento encontrado</p>
            <Button
              onClick={() => {
                setModalType("expense");
                setSelectedTransaction(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Lançamento
            </Button>
          </div>
        ) : (
          Array.from(transactionsWithBalance.entries()).map(([date, transactions]) => (
            <div key={date} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg">
                <h3 className="font-semibold">
                  {format(new Date(date + "T12:00:00"), "dd/MM/yyyy")} -{" "}
                  {format(new Date(date + "T12:00:00"), "EEEE", { locale: ptBR })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {transactions.length}{" "}
                  {transactions.length === 1 ? "lançamento" : "lançamentos"}
                </span>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Descrição</th>
                      <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Conta</th>
                      <th className="text-left p-3 text-sm font-medium hidden lg:table-cell">Categoria</th>
                      <th className="text-right p-3 text-sm font-medium">Valor</th>
                      {showDailyBalance && (
                        <th className="text-right p-3 text-sm font-medium hidden md:table-cell">Saldo</th>
                      )}
                      <th className="text-center p-3 text-sm font-medium w-12">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any, idx: number) => (
                      <tr
                        key={tx.id}
                        className={`border-b hover:bg-muted/50 ${
                          alternateColors && idx % 2 === 1 ? "bg-muted/20" : ""
                        }`}
                      >
                        <td className="p-3">{getStatusBadge(tx.status)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {tx.isRecurring && (
                              <Clock
                                className="h-4 w-4 text-blue-500 flex-shrink-0"
                                title="Recorrente"
                              />
                            )}
                            <div>
                              <span className="font-medium">{tx.description}</span>
                              {tx.installmentNumber && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({tx.installmentNumber}/{tx.totalInstallments})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm hidden md:table-cell">
                          {getAccountName(tx.accountId)}
                        </td>
                        <td className="p-3 text-sm hidden lg:table-cell">
                          {getCategoryName(tx.categoryId)}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-medium ${
                              tx.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"} R${" "}
                            {parseFloat(tx.amount).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        {showDailyBalance && (
                          <td className="p-3 text-right font-semibold hidden md:table-cell">
                            {tx.runningBalance !== null && (
                              <span
                                className={
                                  tx.runningBalance >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                R${" "}
                                {tx.runningBalance.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {tx.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleAction("confirm", tx)}
                                  >
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAction("confirmPartially", tx)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar Parcialmente
                                  </DropdownMenuItem>
                                </>
                              )}
                              {tx.status === "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() => handleAction("reconcile", tx)}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Conciliar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAction("edit", tx)}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction("clone", tx)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Clonar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAction("delete", tx)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transaction={selectedTransaction}
        type={modalType}
      />

      {/* Partial Confirm Dialog */}
      <PartialConfirmDialog
        open={partialConfirmOpen}
        onOpenChange={setPartialConfirmOpen}
        transaction={partialConfirmTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "
              {deleteTransaction?.description}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTransaction) {
                  deleteMutation.mutate({ id: deleteTransaction.id });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
