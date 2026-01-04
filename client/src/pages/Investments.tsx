import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Investments() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountId: 1,
    name: "",
    ticker: "",
    type: "stock" as const,
    quantity: "",
    averagePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // Queries
  const investmentsQuery = trpc.investments.list.useQuery();
  const accountsQuery = trpc.accounts.list.useQuery();
  const createInvestmentMutation = trpc.investments.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInvestmentMutation.mutateAsync({
        ...formData,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
      });
      toast.success("Investimento criado com sucesso!");
      setFormData({
        accountId: 1,
        name: "",
        ticker: "",
        type: "stock",
        quantity: "",
        averagePrice: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
      investmentsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar investimento");
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
      [name]: value,
    }));
  };

  // Cálculos
  const investments = investmentsQuery.data || [];
  const totalInvested = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.totalCost as string),
    0
  );
  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.currentValue as string || inv.totalCost as string),
    0
  );
  const totalGain = totalCurrentValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Dados para gráficos
  const investmentsByType = investments.reduce((acc: any, inv) => {
    const existing = acc.find((item: any) => item.name === inv.type);
    if (existing) {
      existing.value += parseFloat(inv.totalCost as string);
    } else {
      acc.push({ name: inv.type, value: parseFloat(inv.totalCost as string) });
    }
    return acc;
  }, []);

  const evolutionData = [
    { month: "Jan", valor: 5000 },
    { month: "Fev", valor: 5500 },
    { month: "Mar", valor: 6200 },
    { month: "Abr", valor: 6800 },
    { month: "Mai", valor: 7500 },
    { month: "Jun", valor: totalCurrentValue },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investimentos</h1>
          <p className="text-muted-foreground">Gerencie sua carteira de investimentos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Investimento</DialogTitle>
              <DialogDescription>Registre um novo ativo na sua carteira</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Ativo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Petrobras"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticker">Ticker</Label>
                  <Input
                    id="ticker"
                    name="ticker"
                    value={formData.ticker}
                    onChange={handleInputChange}
                    placeholder="Ex: PETR4"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Ação</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="fund">Fundo</SelectItem>
                      <SelectItem value="fii">FII</SelectItem>
                      <SelectItem value="bond">Título</SelectItem>
                      <SelectItem value="crypto">Criptomoeda</SelectItem>
                      <SelectItem value="real_estate">Imóvel</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="averagePrice">Preço Médio *</Label>
                  <Input
                    id="averagePrice"
                    name="averagePrice"
                    type="number"
                    step="0.01"
                    value={formData.averagePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">Data de Compra *</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
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

              <Button type="submit" className="w-full" disabled={createInvestmentMutation.isPending}>
                {createInvestmentMutation.isPending ? "Criando..." : "Criar Investimento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {totalCurrentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ganho/Perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {gainPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{investments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Patrimonial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Patrimonial</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#3b82f6" name="Valor" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição
            </CardTitle>
            <CardDescription>Por tipo de ativo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={investmentsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${((value / totalInvested) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {investmentsByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card>
        <CardHeader>
          <CardTitle>Carteira</CardTitle>
          <CardDescription>{investments.length} ativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {investmentsQuery.isLoading ? (
              <div className="text-center py-8">Carregando investimentos...</div>
            ) : investments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4">Ativo</th>
                      <th className="text-left py-2 px-4">Tipo</th>
                      <th className="text-right py-2 px-4">Quantidade</th>
                      <th className="text-right py-2 px-4">Preço Médio</th>
                      <th className="text-right py-2 px-4">Total Investido</th>
                      <th className="text-center py-2 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{inv.name}</td>
                        <td className="py-3 px-4 capitalize">{inv.type}</td>
                        <td className="py-3 px-4 text-right">{parseFloat(inv.quantity as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right">
                          R$ {parseFloat(inv.averagePrice as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          R$ {parseFloat(inv.totalCost as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Nenhum investimento registrado</p>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Investimento
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
