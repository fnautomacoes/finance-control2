import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Tag } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Amarelo", value: "#f59e0b" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Laranja", value: "#f97316" },
  { name: "Ciano", value: "#06b6d4" },
];

export default function Categories() {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: COLORS[0].value,
    type: "expense" as const,
  });

  // Queries
  const categoriesQuery = trpc.categories.list.useQuery();
  const createCategoryMutation = trpc.categories.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCategoryMutation.mutateAsync(formData);
      toast.success("Categoria criada com sucesso!");
      setFormData({
        name: "",
        description: "",
        color: COLORS[0].value,
        type: "expense",
      });
      setSelectedColor(COLORS[0].value);
      setOpen(false);
      categoriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar categoria");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const categories = categoriesQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize suas receitas e despesas por categorias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              <DialogDescription>Crie uma categoria para organizar suas transações</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Categoria *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Alimentação"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descrição opcional"
                />
              </div>

              <div>
                <Label>Cor *</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.value);
                        setFormData((prev) => ({
                          ...prev,
                          color: color.value,
                        }));
                      }}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? "border-gray-800 scale-105"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Total de Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.filter((c) => c.isActive !== false).length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Última Criada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {categories.length > 0
                ? new Date(categories[0].createdAt).toLocaleDateString("pt-BR")
                : "Nenhuma"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div>
        {categoriesQuery.isLoading ? (
          <div className="text-center py-8">Carregando categorias...</div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="text-xs truncate">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhuma categoria criada</p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table View for Desktop */}
      {categories.length > 0 && (
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Visão em Tabela</CardTitle>
            <CardDescription>Todas as categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Cor</th>
                    <th className="text-left py-2 px-4">Nome</th>
                    <th className="text-left py-2 px-4">Descrição</th>
                    <th className="text-left py-2 px-4">Criada em</th>
                    <th className="text-center py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {category.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(category.createdAt).toLocaleDateString("pt-BR")}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
