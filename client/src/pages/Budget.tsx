import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatMonth = (date: Date) => {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

export default function Budget() {
  const [activeTab, setActiveTab] = useState("expenses");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "budget" as const,
    targetAmount: "",
    categoryId: undefined as number | undefined,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const goalsQuery = trpc.goals.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const dashboardQuery = trpc.dashboard.summary.useQuery({
    startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  });
  const createGoalMutation = trpc.goals.create.useMutation();

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  // Filter goals by type and current month
  const budgetGoals = useMemo(() => {
    if (!goalsQuery.data) return [];
    return goalsQuery.data.filter((g) => {
      if (g.type !== "budget") return false;
      const startDate = new Date(g.startDate);
      const endDate = g.endDate ? new Date(g.endDate) : null;
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      return startDate <= monthEnd && (!endDate || endDate >= monthStart);
    });
  }, [goalsQuery.data, currentMonth]);

  const savingsGoals = useMemo(() => {
    if (!goalsQuery.data) return [];
    return goalsQuery.data.filter((g) => g.type === "savings");
  }, [goalsQuery.data]);

  const investmentGoals = useMemo(() => {
    if (!goalsQuery.data) return [];
    return goalsQuery.data.filter((g) => g.type === "investment");
  }, [goalsQuery.data]);

  // Calculate spent amounts by category from dashboard data
  const spentByCategory = useMemo(() => {
    if (!dashboardQuery.data?.expensesByCategory) return {};
    const result: Record<number, number> = {};
    dashboardQuery.data.expensesByCategory.forEach((e) => {
      if (e.categoryId) {
        result[e.categoryId] = e.value;
      }
    });
    return result;
  }, [dashboardQuery.data?.expensesByCategory]);

  // Calculate income by category
  const incomeByCategory = useMemo(() => {
    if (!dashboardQuery.data?.incomeByCategory) return {};
    const result: Record<number, number> = {};
    dashboardQuery.data.incomeByCategory.forEach((i) => {
      if (i.categoryId) {
        result[i.categoryId] = i.value;
      }
    });
    return result;
  }, [dashboardQuery.data?.incomeByCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGoalMutation.mutateAsync({
        name: formData.name,
        type: formData.type,
        targetAmount: formData.targetAmount,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        categoryId: formData.categoryId,
      });
      toast.success("Meta criada com sucesso!");
      setFormData({
        name: "",
        type: "budget",
        targetAmount: "",
        categoryId: undefined,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
      setOpenDialog(false);
      goalsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar meta");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "categoryId" ? parseInt(value) : value,
    }));
  };

  if (goalsQuery.isLoading || categoriesQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const renderGoalCard = (goal: NonNullable<typeof goalsQuery.data>[0], spent: number) => {
    const target = parseFloat(goal.targetAmount as string);
    const percentage = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
    const remaining = target - spent;
    const isOverBudget = spent > target;

    return (
      <Card key={goal.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{goal.name}</span>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(spent)} / {formatCurrency(target)}
            </span>
          </div>
          <Progress value={percentage} className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : ""}`} />
          <div className="flex justify-between text-sm">
            <span className={isOverBudget ? "text-red-500" : "text-green-600"}>
              {isOverBudget ? "Excedido: " : "Restante: "}
              {formatCurrency(Math.abs(remaining))}
            </span>
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string) => (
    <Card>
      <CardContent className="py-16 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-2">
          Sem metas de {type} definidas no período.
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          Escolha um período diferente ou defina uma nova meta.
        </p>
        <Button onClick={() => setOpenDialog(true)} className="bg-teal-500 hover:bg-teal-600">
          Definir metas
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metas de orçamento</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="investments">Investimentos</TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Month Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium capitalize">
                    {formatMonth(currentMonth)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
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
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3 space-y-4">
            <TabsContent value="expenses" className="m-0 space-y-4">
              {budgetGoals.length > 0 ? (
                budgetGoals.map((goal) => {
                  const spent = goal.categoryId ? spentByCategory[goal.categoryId] || 0 : 0;
                  return renderGoalCard(goal, spent);
                })
              ) : (
                renderEmptyState("despesa")
              )}
            </TabsContent>

            <TabsContent value="income" className="m-0 space-y-4">
              {(() => {
                const incomeGoals = (goalsQuery.data || []).filter(
                  (g) => g.type === "budget" && categoriesQuery.data?.find((c) => c.id === g.categoryId)?.type === "income"
                );
                return incomeGoals.length > 0
                  ? incomeGoals.map((goal) => {
                      const received = goal.categoryId ? incomeByCategory[goal.categoryId] || 0 : 0;
                      return renderGoalCard(goal, received);
                    })
                  : renderEmptyState("receita");
              })()}
            </TabsContent>

            <TabsContent value="investments" className="m-0 space-y-4">
              {investmentGoals.length > 0 ? (
                investmentGoals.map((goal) => {
                  const current = parseFloat(goal.currentAmount as string || "0");
                  return renderGoalCard(goal, current);
                })
              ) : (
                renderEmptyState("investimento")
              )}
            </TabsContent>

            <TabsContent value="evolution" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evolução das Metas</CardTitle>
                </CardHeader>
                <CardContent>
                  {goalsQuery.data && goalsQuery.data.length > 0 ? (
                    <div className="space-y-4">
                      {goalsQuery.data.slice(0, 5).map((goal) => {
                        const target = parseFloat(goal.targetAmount as string || "0");
                        const current = parseFloat(goal.currentAmount as string || "0");
                        const percentage = target > 0 ? (current / target) * 100 : 0;

                        return (
                          <div key={goal.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{goal.name}</span>
                              <span className="text-muted-foreground">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={Math.min(100, percentage)} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhuma meta cadastrada para acompanhar evolução.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Create Goal Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
            <DialogDescription>Defina uma meta de orçamento, economia ou investimento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Meta *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Limite de gastos com alimentação"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="savings">Economia</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetAmount">Valor Alvo *</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={formData.categoryId?.toString() || ""}
                onValueChange={(v) => handleSelectChange("categoryId", v)}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createGoalMutation.isPending}>
              {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-teal-500 hover:bg-teal-600"
        size="icon"
        onClick={() => setOpenDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
