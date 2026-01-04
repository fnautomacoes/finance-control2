import { useEffect, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Wallet, Target, PieChart } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  // Fetch data using tRPC hooks
  const accountsQuery = trpc.accounts.list.useQuery();
  const transactionsQuery = trpc.transactions.list.useQuery();
  const investmentsQuery = trpc.investments.list.useQuery();
  const goalsQuery = trpc.goals.list.useQuery();

  useEffect(() => {
    if (accountsQuery.data) setAccounts(accountsQuery.data);
    if (transactionsQuery.data) setTransactions(transactionsQuery.data);
    if (investmentsQuery.data) setInvestments(investmentsQuery.data);
    if (goalsQuery.data) setGoals(goalsQuery.data);

    const isLoading = accountsQuery.isLoading || transactionsQuery.isLoading || investmentsQuery.isLoading || goalsQuery.isLoading;
    setLoading(isLoading);
  }, [accountsQuery.data, transactionsQuery.data, investmentsQuery.data, goalsQuery.data, accountsQuery.isLoading, transactionsQuery.isLoading, investmentsQuery.isLoading, goalsQuery.isLoading]);

  // Calcular totais
  const totalAccounts = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue || 0), 0);
  const totalAssets = totalAccounts + totalInvestments;

  // Dados para gráficos
  const monthlyData = [
    { month: "Jan", receita: 4000, despesa: 2400 },
    { month: "Fev", receita: 3000, despesa: 1398 },
    { month: "Mar", receita: 2000, despesa: 9800 },
    { month: "Abr", receita: 2780, despesa: 3908 },
    { month: "Mai", receita: 1890, despesa: 4800 },
    { month: "Jun", receita: 2390, despesa: 3800 },
  ];

  const investmentTypes = [
    { name: "Ações", value: 35 },
    { name: "ETFs", value: 25 },
    { name: "Fundos", value: 20 },
    { name: "Criptos", value: 20 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao FinanceControl</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAssets.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Contas + Investimentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAccounts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{accounts.length} contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalInvestments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{investments.length} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">Metas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Receitas vs Despesas (últimos 6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
                <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Investimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Investimentos</CardTitle>
            <CardDescription>Distribuição por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChartComponent>
                <Pie
                  data={investmentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {investmentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChartComponent>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas operações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className={`font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "income" ? "+" : "-"} R$ {parseFloat(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contas Bancárias */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias</CardTitle>
          <CardDescription>Suas contas e saldos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">{account.bankName || "Conta"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {parseFloat(account.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma conta registrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
