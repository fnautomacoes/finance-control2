import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, TrendingUp, PieChart as PieChartIcon, Percent, Building2, Download, Printer, Maximize2 } from "lucide-react";
import { exportToCSV, printPage, toggleFullscreen, formatCurrencyForExport, formatDateForExport } from "@/lib/export-utils";
import { toast } from "sonner";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Função para calcular rendimento CDI
const CDI_ANNUAL_RATE = 0.1315; // 13.15% ao ano (taxa CDI aproximada)

function calculateCdiYield(
  investedAmount: number,
  cdiPercentage: number,
  purchaseDate: string
): { currentValue: number; yield: number; yieldPercentage: number } {
  const purchase = new Date(purchaseDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) {
    return { currentValue: investedAmount, yield: 0, yieldPercentage: 0 };
  }

  // Taxa diária do CDI: (1 + taxa_anual)^(1/252) - 1
  const dailyCdiRate = Math.pow(1 + CDI_ANNUAL_RATE, 1 / 252) - 1;

  // Taxa ajustada pelo percentual do CDI (ex: 100% CDI, 120% CDI)
  const adjustedDailyRate = dailyCdiRate * (cdiPercentage / 100);

  // Rendimento composto: Valor * (1 + taxa_diária)^dias
  const currentValue = investedAmount * Math.pow(1 + adjustedDailyRate, daysDiff);
  const yieldValue = currentValue - investedAmount;
  const yieldPercentage = (yieldValue / investedAmount) * 100;

  return { currentValue, yield: yieldValue, yieldPercentage };
}

export default function Investments() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountId: 1,
    name: "",
    ticker: "",
    type: "stock" as "stock" | "etf" | "fund" | "fii" | "bond" | "cdb" | "lci_lca" | "crypto" | "real_estate" | "other",
    quantity: "",
    averagePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    // Campos CDI
    cdiPercentage: "100",
    fixedRate: "",
    maturityDate: "",
    institution: "",
  });

  // Queries
  const investmentsQuery = trpc.investments.list.useQuery();
  const accountsQuery = trpc.accounts.list.useQuery();
  const createInvestmentMutation = trpc.investments.create.useMutation();

  const isCdiInvestment = formData.type === "cdb" || formData.type === "lci_lca";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInvestmentMutation.mutateAsync({
        ...formData,
        accountId: Number(formData.accountId),
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
        maturityDate: formData.maturityDate ? new Date(formData.maturityDate).toISOString() : undefined,
        cdiPercentage: isCdiInvestment ? formData.cdiPercentage : undefined,
        fixedRate: formData.fixedRate || undefined,
        institution: formData.institution || undefined,
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
        cdiPercentage: "100",
        fixedRate: "",
        maturityDate: "",
        institution: "",
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
              const exportData = investments.map((inv) => {
                const isCdi = inv.type === "cdb" || inv.type === "lci_lca";
                const totalCost = parseFloat(inv.totalCost as string);
                const cdiPct = parseFloat(inv.cdiPercentage as string || "100");
                const yieldCalc = isCdi
                  ? calculateCdiYield(totalCost, cdiPct, inv.purchaseDate)
                  : { currentValue: totalCost, yield: 0, yieldPercentage: 0 };

                return {
                  Ativo: inv.name,
                  Tipo: inv.type,
                  Investido: formatCurrencyForExport(totalCost),
                  "% CDI": isCdi ? `${cdiPct}%` : "-",
                  "Valor Atual": formatCurrencyForExport(yieldCalc.currentValue),
                  Rendimento: isCdi ? formatCurrencyForExport(yieldCalc.yield) : "-",
                  "Data Compra": formatDateForExport(inv.purchaseDate),
                  Instituição: inv.institution || "-",
                };
              });
              exportToCSV(exportData, `investimentos-${formatDateForExport(new Date())}`);
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
                      <SelectItem value="cdb">CDB</SelectItem>
                      <SelectItem value="lci_lca">LCI/LCA</SelectItem>
                      <SelectItem value="crypto">Criptomoeda</SelectItem>
                      <SelectItem value="real_estate">Imóvel</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos específicos para CDB/LCI/LCA */}
              {isCdiInvestment && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cdiPercentage">% do CDI *</Label>
                      <div className="relative">
                        <Input
                          id="cdiPercentage"
                          name="cdiPercentage"
                          type="number"
                          step="0.01"
                          value={formData.cdiPercentage}
                          onChange={handleInputChange}
                          placeholder="100"
                          className="pr-8"
                          required
                        />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Ex: 100, 110, 120</p>
                    </div>

                    <div>
                      <Label htmlFor="fixedRate">Taxa Prefixada (opcional)</Label>
                      <Input
                        id="fixedRate"
                        name="fixedRate"
                        type="number"
                        step="0.01"
                        value={formData.fixedRate}
                        onChange={handleInputChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maturityDate">Data de Vencimento</Label>
                      <Input
                        id="maturityDate"
                        name="maturityDate"
                        type="date"
                        value={formData.maturityDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="institution">Instituição</Label>
                      <div className="relative">
                        <Input
                          id="institution"
                          name="institution"
                          value={formData.institution}
                          onChange={handleInputChange}
                          placeholder="Ex: Nubank, Inter, C6"
                          className="pr-8"
                        />
                        <Building2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Para CDI: apenas valor investido. Para outros: quantidade e preço médio */}
              {isCdiInvestment ? (
                <div>
                  <Label htmlFor="averagePrice">Valor Investido (R$) *</Label>
                  <Input
                    id="averagePrice"
                    name="averagePrice"
                    type="number"
                    step="0.01"
                    value={formData.averagePrice}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Para CDI, quantidade = 1 automaticamente
                      setFormData(prev => ({ ...prev, quantity: "1" }));
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
              ) : (
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
              )}

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
                      <th className="text-right py-2 px-4">Investido</th>
                      <th className="text-right py-2 px-4">% CDI</th>
                      <th className="text-right py-2 px-4">Valor Atual</th>
                      <th className="text-right py-2 px-4">Rendimento</th>
                      <th className="text-center py-2 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const isCdi = inv.type === "cdb" || inv.type === "lci_lca";
                      const totalCost = parseFloat(inv.totalCost as string);
                      const cdiPct = parseFloat(inv.cdiPercentage as string || "100");

                      // Calcula rendimento CDI se for CDB/LCI/LCA
                      const yieldCalc = isCdi
                        ? calculateCdiYield(totalCost, cdiPct, inv.purchaseDate)
                        : { currentValue: parseFloat(inv.currentValue as string || inv.totalCost as string), yield: 0, yieldPercentage: 0 };

                      const typeLabels: Record<string, string> = {
                        stock: "Ação",
                        etf: "ETF",
                        fund: "Fundo",
                        fii: "FII",
                        bond: "Título",
                        cdb: "CDB",
                        lci_lca: "LCI/LCA",
                        crypto: "Cripto",
                        real_estate: "Imóvel",
                        other: "Outro",
                      };

                      return (
                        <tr key={inv.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{inv.name}</p>
                              {inv.institution && (
                                <p className="text-xs text-muted-foreground">{inv.institution}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">{typeLabels[inv.type] || inv.type}</td>
                          <td className="py-3 px-4 text-right">
                            R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCdi ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                {cdiPct}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            R$ {yieldCalc.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCdi && yieldCalc.yield > 0 ? (
                              <div className="text-green-600">
                                <p className="font-medium">+R$ {yieldCalc.yield.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs">+{yieldCalc.yieldPercentage.toFixed(2)}%</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                      );
                    })}
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
