import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Settings, Maximize2, Printer, Plus } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};

export default function CashFlow() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay()); // Start of week
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (6 - date.getDay())); // End of week
    return date;
  });
  const [includePending, setIncludePending] = useState(false);
  const [excludeInternalTransfers, setExcludeInternalTransfers] = useState(false);
  const [checkedAccounts, setCheckedAccounts] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    accountId: 0,
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    categoryId: undefined as number | undefined,
  });

  const accountsQuery = trpc.accounts.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const createTransactionMutation = trpc.transactions.create.useMutation();
  const dashboardQuery = trpc.dashboard.summary.useQuery({
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  });

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
    if (!formData.accountId || !formData.description || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createTransactionMutation.mutateAsync({
        accountId: formData.accountId,
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        date: formData.date,
        categoryId: formData.categoryId,
      });
      toast.success("Transação criada com sucesso!");
      setOpenDialog(false);
      setFormData({
        accountId: 0,
        description: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        categoryId: undefined,
      });
      dashboardQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar transação");
    }
  };

  // Calculate totals from checked accounts
  const accountTotals = useMemo(() => {
    if (!accountsQuery.data) return { total: 0 };
    return accountsQuery.data
      .filter((a) => checkedAccounts.includes(a.id))
      .reduce(
        (acc, account) => ({
          total: acc.total + (parseFloat(account.balance as string) || 0),
        }),
        { total: 0 }
      );
  }, [accountsQuery.data, checkedAccounts]);

  // Generate daily data for the chart
  const dailyData = useMemo(() => {
    const data: { date: string; balance: number; dayLabel: string }[] = [];
    const currentDate = new Date(startDate);
    let runningBalance = accountTotals.total;

    // Get transactions for the period from dashboard
    const transactions = dashboardQuery.data?.cashResultsByAccount || [];
    const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);

    // Simple distribution across days
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    while (currentDate <= endDate) {
      const dayLabel = `${currentDate.getDate()} ${currentDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}`;
      data.push({
        date: currentDate.toISOString().split("T")[0],
        balance: runningBalance,
        dayLabel,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }, [startDate, endDate, accountTotals.total, dashboardQuery.data]);

  // Cash results data
  const cashResultsData = useMemo(() => {
    if (!dashboardQuery.data?.cashResultsByAccount) return [];
    return dashboardQuery.data.cashResultsByAccount.filter((r) =>
      checkedAccounts.includes(r.accountId)
    );
  }, [dashboardQuery.data?.cashResultsByAccount, checkedAccounts]);

  const totalIncome = cashResultsData.reduce((sum, r) => sum + r.income, 0);
  const totalExpense = cashResultsData.reduce((sum, r) => sum + r.expense, 0);
  const totalResult = totalIncome - totalExpense;

  // Previous balance calculation
  const previousBalance = accountTotals.total - totalResult;

  // Bar chart data
  const barChartData = useMemo(() => {
    if (!dashboardQuery.data?.transactionsByMonth) return [];
    return dashboardQuery.data.transactionsByMonth.map((m) => ({
      ...m,
      monthLabel: m.month.split("-")[1] + " " + m.month.split("-")[0].slice(2),
    }));
  }, [dashboardQuery.data?.transactionsByMonth]);

  if (accountsQuery.isLoading || dashboardQuery.isLoading) {
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
        <h1 className="text-2xl font-semibold">Fluxo de caixa</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            Renovar assinatura
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                <Button variant="ghost" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Selector */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span></span>
                <span className="text-muted-foreground">Saldo em {formatDate(endDate)}</span>
              </div>
              {accountsQuery.data?.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={checkedAccounts.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                    />
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">{account.name}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      parseFloat(account.balance as string) >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(parseFloat(account.balance as string) || 0)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span
                  className={`text-sm font-bold ${
                    accountTotals.total >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {formatCurrency(accountTotals.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={includePending}
                  onCheckedChange={(checked) => setIncludePending(checked as boolean)}
                />
                <span className="text-sm">Considerar lançamentos pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={excludeInternalTransfers}
                  onCheckedChange={(checked) => setExcludeInternalTransfers(checked as boolean)}
                />
                <span className="text-sm">Desconsiderar transferências intracaixa</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(1)} mil`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Total"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash Flow Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4"></th>
                    <th className="text-right py-3 px-4">Entradas (R$)</th>
                    <th className="text-right py-3 px-4">Saídas (R$)</th>
                    <th className="text-right py-3 px-4">Resultado (R$)</th>
                    <th className="text-right py-3 px-4">Saldo (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Saldo anterior</td>
                    <td className="text-right py-3 px-4"></td>
                    <td className="text-right py-3 px-4"></td>
                    <td className="text-right py-3 px-4"></td>
                    <td className="text-right py-3 px-4 text-green-600 font-medium">
                      {formatCurrency(previousBalance)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 text-blue-600 underline cursor-pointer">
                      {startDate.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-right py-3 px-4">{formatCurrency(totalIncome)}</td>
                    <td className="text-right py-3 px-4 text-red-500">
                      {formatCurrency(-totalExpense)}
                    </td>
                    <td className="text-right py-3 px-4 text-red-500">
                      {formatCurrency(totalResult)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(accountTotals.total)}
                    </td>
                  </tr>
                  <tr className="bg-muted/30 font-medium">
                    <td className="py-3 px-4">Total</td>
                    <td className="text-right py-3 px-4">{formatCurrency(totalIncome)}</td>
                    <td className="text-right py-3 px-4 text-red-500">
                      {formatCurrency(-totalExpense)}
                    </td>
                    <td className="text-right py-3 px-4 text-red-500">
                      {formatCurrency(totalResult)}
                    </td>
                    <td className="text-right py-3 px-4"></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Cash Results Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado de caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ period: formatDate(startDate), income: totalIncome, expense: totalExpense, result: totalResult }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Entradas" fill="#10b981" />
                  <Bar dataKey="expense" name="Saídas" fill="#f43f5e" />
                  <Line type="monotone" dataKey="result" name="Resultado" stroke="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setOpenDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Transaction Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Adicione uma nova transação ao fluxo de caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "income" | "expense") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Conta *</Label>
              <Select
                value={formData.accountId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
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
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Salário, Aluguel..."
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
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.categoryId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
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
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createTransactionMutation.isPending}>
              {createTransactionMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
