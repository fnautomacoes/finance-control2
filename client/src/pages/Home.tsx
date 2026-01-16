import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import React from "react";
import { useState, useMemo } from "react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

// Helper function to format currency
const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Helper function to get date range based on period
const getDateRange = (period: string) => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

// Helper to format month names
const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-");
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return monthNames[parseInt(month) - 1] || monthStr;
};

export default function Home() {
  const [period, setPeriod] = useState("month");
  const [checkedAccounts, setCheckedAccounts] = useState<number[]>([]);

  const dateRange = useMemo(() => getDateRange(period), [period]);

  const accountsQuery = trpc.accounts.list.useQuery();
  const dashboardQuery = trpc.dashboard.summary.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Initialize checked accounts when accounts load
  React.useEffect(() => {
    if (accountsQuery.data && checkedAccounts.length === 0) {
      setCheckedAccounts(accountsQuery.data.map((a) => a.id));
    }
  }, [accountsQuery.data]);

  const handleAccountToggle = (accountId: number) => {
    setCheckedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  // Calculate totals from checked accounts
  const saldosCaixa = useMemo(() => {
    if (!accountsQuery.data) return { confirmado: 0, projetado: 0 };

    const checkedAccountsData = accountsQuery.data.filter((a) => checkedAccounts.includes(a.id));
    const confirmado = checkedAccountsData.reduce((acc, account) => {
      return acc + (parseFloat(account.balance as string) || 0);
    }, 0);

    return {
      confirmado,
      projetado: confirmado, // Projetado = confirmado (sem transações pendentes)
    };
  }, [accountsQuery.data, checkedAccounts]);

  // Calculate totals for expenses by category chart
  const expensesTotal = useMemo(() => {
    if (!dashboardQuery.data?.expensesByCategory) return 0;
    return dashboardQuery.data.expensesByCategory.reduce((acc, e) => acc + e.value, 0);
  }, [dashboardQuery.data?.expensesByCategory]);

  const expensesByCategoryWithPercentage = useMemo(() => {
    if (!dashboardQuery.data?.expensesByCategory || expensesTotal === 0) return [];
    return dashboardQuery.data.expensesByCategory.map((e) => ({
      ...e,
      percentage: (e.value / expensesTotal) * 100,
    }));
  }, [dashboardQuery.data?.expensesByCategory, expensesTotal]);

  // Calculate totals for income by category
  const incomeTotal = useMemo(() => {
    if (!dashboardQuery.data?.incomeByCategory) return 0;
    return dashboardQuery.data.incomeByCategory.reduce((acc, i) => acc + i.value, 0);
  }, [dashboardQuery.data?.incomeByCategory]);

  // Calculate patrimônio total
  const patrimonioTotal = useMemo(() => {
    if (!dashboardQuery.data) return 0;
    return (
      dashboardQuery.data.totalBalance +
      dashboardQuery.data.totalInvestments +
      dashboardQuery.data.totalAssets -
      dashboardQuery.data.totalLiabilities
    );
  }, [dashboardQuery.data]);

  // Loading state
  if (dashboardQuery.isLoading || accountsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      {/* Header with Period Filter */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visão geral</h1>
          <p className="text-muted-foreground">Bem-vindo ao FinanceControl</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(patrimonioTotal)}</p>
            <p className="text-xs text-muted-foreground">Contas + Investimentos - Passivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data?.totalBalance || 0)}</p>
            <p className="text-xs text-muted-foreground">{accountsQuery.data?.length || 0} contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data?.totalInvestments || 0)}</p>
            <p className="text-xs text-muted-foreground">Total investido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.activeGoals || 0}</p>
            <p className="text-xs text-muted-foreground">Metas em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progresso das Metas</CardTitle>
              <CardDescription>Situação atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.goalsWithProgress && data.goalsWithProgress.length > 0 ? (
                data.goalsWithProgress.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta cadastrada</p>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.transactionsByMonth && data.transactionsByMonth.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.transactionsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={formatMonth}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" name="Receitas" stroke="#10b981" />
                      <Line type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" />
                      <Line type="monotone" dataKey="balance" name="Saldo" stroke="#3b82f6" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm border-t pt-3">
                    {data.transactionsByMonth.slice(-3).map((item) => (
                      <div key={item.month} className="flex justify-between">
                        <span>Saldo em {formatMonth(item.month)}:</span>
                        <span className={`font-bold ${item.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(item.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados de transações</p>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por Categoria</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategoryWithPercentage.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={expensesByCategoryWithPercentage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {expensesByCategoryWithPercentage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {expensesByCategoryWithPercentage.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem despesas no período</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          {/* Cash Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saldos de Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Confirmado</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(saldosCaixa.confirmado)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projetado</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(saldosCaixa.projetado)}</p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-3">
                {accountsQuery.data?.map((account) => (
                  <div key={account.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={checkedAccounts.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(parseFloat(account.balance as string) || 0)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!accountsQuery.data || accountsQuery.data.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhuma conta cadastrada</p>
                )}
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total Confirmado</span>
                  <span className="font-bold text-green-600">{formatCurrency(saldosCaixa.confirmado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Projetado</span>
                  <span className="font-bold text-blue-600">{formatCurrency(saldosCaixa.projetado)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cartões de Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.creditCards && data.creditCards.length > 0 ? (
                data.creditCards.map((card) => (
                  <div key={card.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-purple-500" />
                      <span className="text-sm font-medium">{card.name}</span>
                    </div>
                    {card.bankName && (
                      <p className="text-xs text-muted-foreground mb-1">{card.bankName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={`text-sm font-bold ${card.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(card.balance)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum cartão cadastrado</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {data.recentTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                          {tx.categoryName && ` • ${tx.categoryName}`}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum lançamento recente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Cash Results by Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados de Caixa</CardTitle>
              <CardDescription>Por conta no período</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.cashResultsByAccount && data.cashResultsByAccount.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Conta</th>
                        <th className="text-right py-2 px-2">Entradas</th>
                        <th className="text-right py-2 px-2">Saídas</th>
                        <th className="text-right py-2 px-2">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cashResultsByAccount.map((item) => (
                        <tr key={item.accountId} className="border-b last:border-0">
                          <td className="py-2 px-2">{item.accountName}</td>
                          <td className="text-right py-2 px-2 text-green-600 font-medium">
                            {formatCurrency(item.income)}
                          </td>
                          <td className="text-right py-2 px-2 text-red-600 font-medium">
                            {formatCurrency(item.expense)}
                          </td>
                          <td
                            className={`text-right py-2 px-2 font-bold ${
                              item.result >= 0 ? "text-blue-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(item.result)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sem movimentações no período</p>
              )}
            </CardContent>
          </Card>

          {/* Balance Sheet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balanço Patrimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-green-600 mb-2">Ativo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Contas</span>
                      <span className="font-medium">{formatCurrency(data?.totalBalance || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investimentos</span>
                      <span className="font-medium">{formatCurrency(data?.totalInvestments || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outros Ativos</span>
                      <span className="font-medium">{formatCurrency(data?.totalAssets || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          (data?.totalBalance || 0) + (data?.totalInvestments || 0) + (data?.totalAssets || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-red-600 mb-2">Passivo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Dívidas</span>
                      <span className="font-medium">{formatCurrency(data?.totalLiabilities || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span className="text-red-600">{formatCurrency(data?.totalLiabilities || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Patrimônio Líquido</span>
                  <span className={patrimonioTotal >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(patrimonioTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por Categoria</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.incomeByCategory && data.incomeByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={data.incomeByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {data.incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {data.incomeByCategory.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-green-600">{formatCurrency(incomeTotal)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sem receitas no período</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
