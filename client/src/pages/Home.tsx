import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
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

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Home() {
  const [period, setPeriod] = useState("month");
  const [checkedAccounts, setCheckedAccounts] = useState<number[]>([]);

  const accountsQuery = trpc.accounts.list.useQuery();
  const transactionsQuery = trpc.transactions.list.useQuery();

  // Initialize checked accounts
  React.useEffect(() => {
    if (accountsQuery.data && checkedAccounts.length === 0) {
      setCheckedAccounts(accountsQuery.data.map((a) => a.id));
    }
  }, [accountsQuery.data]);

  // Mock data for goals by category
  const goalsData = [
    { name: "Alimentação", spent: 450, budget: 600, percentage: 75 },
    { name: "Transporte", spent: 280, budget: 400, percentage: 70 },
    { name: "Saúde", spent: 150, budget: 300, percentage: 50 },
  ];

  // Mock data for goals by center
  const goalsByCenterData = [
    { center: "Sem centro", spent: 450, budget: 600, percentage: 75 },
    { center: "Casa", spent: 280, budget: 400, percentage: 70 },
    { center: "Empresa", spent: 150, budget: 300, percentage: 50 },
  ];

  // Mock data for income goals by center
  const incomeGoalsByCenterData = [
    { center: "Sem centro", goal: 5000, realized: 4500, residue: 500 },
    { center: "Casa", goal: 2000, realized: 1800, residue: 200 },
    { center: "Empresa", goal: 3000, realized: 3200, residue: -200 },
  ];

  // Mock data for cash flow (monthly)
  const cashFlowData = [
    { month: "Jan", balance: 2500, "Saldo em 31 Jan": 2500 },
    { month: "Fev", balance: 2100, "Saldo em 28 Fev": 2100 },
    { month: "Mar", balance: 3200, "Saldo em 31 Mar": 3200 },
    { month: "Abr", balance: 2800, "Saldo em 30 Abr": 2800 },
    { month: "Mai", balance: 3100, "Saldo em 31 Mai": 3100 },
    { month: "Jun", balance: 2900, "Saldo em 30 Jun": 2900 },
  ];

  // Mock data for expenses by center
  const expensesByCenterData = [
    { name: "Sem centro", value: 96.99, percentage: 97 },
    { name: "Casa", value: 2.17 },
    { name: "Telefonia", value: 0.89 },
  ];

  // Mock data for cash results with table format
  const cashResultsData = [
    { account: "Conta Corrente", entries: 8000, exits: 5000, result: 3000 },
    { account: "Banco Inter", entries: 6000, exits: 3500, result: 2500 },
    { account: "Conta C6 PJ", entries: 5000, exits: 2000, result: 3000 },
  ];

  // Mock data for expenses by category
  const expensesByCategoryData = [
    { name: "Pessoais", value: 58.73 },
    { name: "Cartão de Crédito", value: 18.87 },
    { name: "Empresa", value: 9.69 },
    { name: "Transferência para Poupança", value: 7.57 },
    { name: "Casa", value: 4.47 },
    { name: "Automóvel", value: 3.86 },
    { name: "Alimentação", value: 3.86 },
    { name: "Telefonia", value: 0.89 },
  ];

  // Mock data for income by category
  const incomeData = [
    { name: "Salário", value: 5000 },
    { name: "Freelance", value: 1200 },
    { name: "Investimentos", value: 800 },
  ];

  // Mock data for income by center
  const incomeByCenterData = [
    { name: "Sem centro", value: 5000 },
    { name: "Casa", value: 1200 },
    { name: "Empresa", value: 800 },
  ];

  // Mock data for balance sheet
  const balanceSheetData = {
    ativo: {
      disponivel: 4000,
      realisavel: 2000,
    },
    passivo: {
      devedor: 1500,
      exigivel: 1000,
    },
  };

  // Calculate saldos de caixa totals
  const saldosCaixa = useMemo(() => {
    if (!accountsQuery.data) return { confirmado: 0, projetado: 0 };

    return accountsQuery.data
      .filter((a) => checkedAccounts.includes(a.id))
      .reduce(
        (acc, account) => {
          const balance = parseFloat(account.balance as string) || 0;
          return {
            confirmado: acc.confirmado + balance,
            projetado: acc.projetado + balance * 1.1, // Mock: 10% more projected
          };
        },
        { confirmado: 0, projetado: 0 }
      );
  }, [accountsQuery.data, checkedAccounts]);

  const handleAccountToggle = (accountId: number) => {
    setCheckedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const recentTransactions = transactionsQuery.data?.slice(0, 5) || [];

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
            <p className="text-2xl font-bold">R$ 4.000,00</p>
            <p className="text-xs text-muted-foreground">Contas + Investimentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contas Bancárias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 4.000,00</p>
            <p className="text-xs text-muted-foreground">{accountsQuery.data?.length || 0} contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ 0,00</p>
            <p className="text-xs text-muted-foreground">12 ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Metas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Goals by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metas de despesas</CardTitle>
              <CardDescription>Situação projetada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalsData.map((goal) => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-xs text-muted-foreground">
                      R$ {goal.spent} / R$ {goal.budget}
                    </span>
                  </div>
                  <Progress value={goal.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Goals by Center */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metas de despesas por centro</CardTitle>
              <CardDescription>Situação projetada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goalsByCenterData.map((goal) => (
                <div key={goal.center} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{goal.center}</span>
                    <span className="text-xs text-muted-foreground">
                      R$ {goal.spent} / R$ {goal.budget}
                    </span>
                  </div>
                  <Progress value={goal.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cash Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="balance" stroke="#ef4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm">
                {cashFlowData.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>Saldo em {item.month}:</span>
                    <span className="font-bold text-green-600">R$ {item.balance.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Center */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por centro</CardTitle>
              <CardDescription>Situação projetada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expensesByCenterData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="percentage"
                  >
                    {expensesByCenterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expensesByCenterData.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.percentage || 0}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          {/* Cash Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saldos de caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Confirmado</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {saldosCaixa.confirmado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projetado</p>
                  <p className="text-lg font-bold text-blue-600">
                    R$ {saldosCaixa.projetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
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
                        R$ {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total Confirmado</span>
                  <span className="font-bold text-green-600">
                    R$ {saldosCaixa.confirmado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Projetado</span>
                  <span className="font-bold text-blue-600">
                    R$ {saldosCaixa.projetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cartões de crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-orange-500" />
                    <span className="text-sm font-medium">C$ Bank</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Fatura 25/01/2025 (Fechamento 15/01/2025)
                  </p>
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="text-sm font-bold text-green-600 mt-2">R$ 2.500,00</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-purple-500" />
                    <span className="text-sm font-medium">Nubank</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Fatura 09/01/2026 (Fechamento 02/01/2026)
                  </p>
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="text-sm font-bold text-green-600 mt-2">R$ 1.800,00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"} R${" "}
                        {parseFloat(tx.amount as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
          {/* Cash Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados de caixa</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {cashResultsData.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-2">{item.account}</td>
                        <td className="text-right py-2 px-2 text-green-600 font-medium">
                          R$ {item.entries.toLocaleString("pt-BR")}
                        </td>
                        <td className="text-right py-2 px-2 text-red-600 font-medium">
                          R$ {item.exits.toLocaleString("pt-BR")}
                        </td>
                        <td className="text-right py-2 px-2 font-bold text-blue-600">
                          R$ {item.result.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                      <span>Disponível</span>
                      <span className="font-medium">R$ {balanceSheetData.ativo.disponivel.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Realizável</span>
                      <span className="font-medium">R$ {balanceSheetData.ativo.realisavel.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        R${" "}
                        {(balanceSheetData.ativo.disponivel + balanceSheetData.ativo.realisavel).toLocaleString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-red-600 mb-2">Passivo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Devedor</span>
                      <span className="font-medium">R$ {balanceSheetData.passivo.devedor.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exigível</span>
                      <span className="font-medium">R$ {balanceSheetData.passivo.exigivel.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total</span>
                      <span className="text-red-600">
                        R${" "}
                        {(balanceSheetData.passivo.devedor + balanceSheetData.passivo.exigivel).toLocaleString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Despesas por categoria</CardTitle>
              <CardDescription>Situação projetada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                {expensesByCategoryData.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {incomeData.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-green-600">R$ {item.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-green-600">R$ 7.000,00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income by Center */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas por centro</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={incomeByCenterData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {incomeByCenterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {incomeByCenterData.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-green-600">R$ {item.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income Goals by Center */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metas de receita por centro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Centro</th>
                      <th className="text-right py-2 px-2">Meta</th>
                      <th className="text-right py-2 px-2">Realizado</th>
                      <th className="text-right py-2 px-2">Resíduo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeGoalsByCenterData.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-2">{item.center}</td>
                        <td className="text-right py-2 px-2 font-medium">
                          R$ {item.goal.toLocaleString("pt-BR")}
                        </td>
                        <td className="text-right py-2 px-2 text-green-600 font-medium">
                          R$ {item.realized.toLocaleString("pt-BR")}
                        </td>
                        <td
                          className={`text-right py-2 px-2 font-bold ${
                            item.residue >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          R$ {item.residue.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
