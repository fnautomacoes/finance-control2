import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { Plus } from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Home() {
  const accountsQuery = trpc.accounts.list.useQuery();
  const transactionsQuery = trpc.transactions.list.useQuery();

  // Mock data for goals
  const goalsData = [
    { name: "Alimentação", spent: 450, budget: 600, percentage: 75 },
    { name: "Transporte", spent: 280, budget: 400, percentage: 70 },
    { name: "Saúde", spent: 150, budget: 300, percentage: 50 },
  ];

  // Mock data for cash flow
  const cashFlowData = [
    { month: "Jan", value: 2500 },
    { month: "Fev", value: 2100 },
    { month: "Mar", value: 3200 },
    { month: "Abr", value: 2800 },
    { month: "Mai", value: 3100 },
    { month: "Jun", value: 2900 },
  ];

  // Mock data for expenses by center
  const expensesByCenterData = [
    { name: "Sem centro", value: 96.99, percentage: 97 },
    { name: "Casa", value: 2.17 },
    { name: "Telefonia", value: 0.89 },
  ];

  // Mock data for cash results
  const cashResultsData = [
    { name: "Conta", entries: 8000, exits: 5000 },
    { name: "Banco Inter", entries: 6000, exits: 3500 },
    { name: "Conta C6 PJ", entries: 5000, exits: 2000 },
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

  const recentTransactions = transactionsQuery.data?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visão geral</h1>
          <p className="text-muted-foreground">Bem-vindo ao FinanceControl</p>
        </div>
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
          {/* Goals */}
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
              <Button className="w-full mt-4 bg-teal-500 hover:bg-teal-600">
                Adicionar este recurso agora
              </Button>
            </CardContent>
          </Card>

          {/* Cash Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" dot={false} />
                </LineChart>
              </ResponsiveContainer>
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
              <Button className="w-full mt-4 bg-teal-500 hover:bg-teal-600">
                Adicionar este recurso agora
              </Button>
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
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {accountsQuery.data?.map((account) => (
                  <div key={account.id} className="flex items-center gap-3">
                    <Checkbox defaultChecked />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-green-600">R$ 4.000,00</span>
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
                  <p className="text-xs text-muted-foreground">Fatura 25/01/2026</p>
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
                  <p className="text-xs text-muted-foreground">Fatura 09/01/2026</p>
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
              <Button className="w-full mt-4 bg-teal-500 hover:bg-teal-600">
                Fazer lançamento
              </Button>
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
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashResultsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entries" fill="#10b981" name="Entradas" />
                  <Bar dataKey="exits" fill="#ef4444" name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {cashResultsData.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.name}</span>
                    <span className="font-medium">
                      E: R$ {item.entries} | S: R$ {item.exits}
                    </span>
                  </div>
                ))}
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
        </div>
      </div>
    </div>
  );
}
