import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Tag, ChevronRight, FolderTree } from "lucide-react";
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

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  type: "income" | "expense";
  parentId: number | null;
}

interface Category {
  id: number;
  userId: number;
  parentId: number | null;
  name: string;
  description: string | null;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Categories() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    color: COLORS[0].value,
    type: "expense",
    parentId: null,
  });

  // Queries
  const categoriesQuery = trpc.categories.list.useQuery();
  const createCategoryMutation = trpc.categories.create.useMutation();
  const updateCategoryMutation = trpc.categories.update.useMutation();
  const deleteCategoryMutation = trpc.categories.delete.useMutation();

  const categories = (categoriesQuery.data || []) as Category[];

  // Get parent categories (categories without parent) filtered by type
  const getParentOptions = (type: "income" | "expense", excludeId?: number) => {
    return categories.filter(
      (c) => c.type === type && c.parentId === null && c.id !== excludeId
    );
  };

  // Get parent category name
  const getParentName = (parentId: number | null) => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || null;
  };

  // Organize categories in hierarchy
  const organizedCategories = useMemo(() => {
    const parentCategories = categories.filter((c) => !c.parentId);
    const childCategories = categories.filter((c) => c.parentId);

    // Create a map of parent -> children
    const childrenMap = new Map<number, Category[]>();
    childCategories.forEach((child) => {
      if (child.parentId) {
        const existing = childrenMap.get(child.parentId) || [];
        existing.push(child);
        childrenMap.set(child.parentId, existing);
      }
    });

    // Build flat list with proper ordering
    const result: (Category & { isChild: boolean; hasChildren: boolean })[] = [];
    parentCategories.forEach((parent) => {
      const children = childrenMap.get(parent.id) || [];
      result.push({ ...parent, isChild: false, hasChildren: children.length > 0 });
      children.forEach((child) => {
        result.push({ ...child, isChild: true, hasChildren: false });
      });
    });

    // Add any orphaned children (shouldn't happen normally)
    childCategories.forEach((child) => {
      if (!result.find((c) => c.id === child.id)) {
        result.push({ ...child, isChild: true, hasChildren: false });
      }
    });

    return result;
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCategoryMutation.mutateAsync({
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        color: formData.color,
        parentId: formData.parentId,
      });
      toast.success("Categoria criada com sucesso!");
      setFormData({
        name: "",
        description: "",
        color: COLORS[0].value,
        type: "expense",
        parentId: null,
      });
      setSelectedColor(COLORS[0].value);
      setOpen(false);
      categoriesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar categoria");
      console.error(error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      await updateCategoryMutation.mutateAsync({
        id: selectedCategory.id,
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        type: formData.type,
        parentId: formData.parentId,
      });
      toast.success("Categoria atualizada com sucesso!");
      setEditOpen(false);
      setSelectedCategory(null);
      categoriesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar categoria");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategoryMutation.mutateAsync({ id: selectedCategory.id });
      toast.success("Categoria excluída com sucesso!");
      setDeleteOpen(false);
      setSelectedCategory(null);
      categoriesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir categoria");
      console.error(error);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || COLORS[0].value,
      type: category.type,
      parentId: category.parentId,
    });
    setSelectedColor(category.color || COLORS[0].value);
    setEditOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type: "income" | "expense") => {
    setFormData((prev) => ({
      ...prev,
      type,
      parentId: null, // Reset parent when type changes
    }));
  };

  // Count stats
  const parentCount = categories.filter((c) => !c.parentId).length;
  const childCount = categories.filter((c) => c.parentId).length;

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
                <Label>Tipo *</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.type === "expense" ? "default" : "outline"}
                    onClick={() => handleTypeChange("expense")}
                    className="flex-1"
                  >
                    Despesa
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "income" ? "default" : "outline"}
                    onClick={() => handleTypeChange("income")}
                    className="flex-1"
                  >
                    Receita
                  </Button>
                </div>
              </div>

              <div>
                <Label>Categoria Pai</Label>
                <Select
                  value={formData.parentId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId: value === "none" ? null : parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Nenhuma (categoria principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                    {getParentOptions(formData.type).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione uma categoria pai para criar uma subcategoria
                </p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Categorias Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{parentCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias de Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.filter((c) => c.type === "expense").length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.filter((c) => c.type === "income").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div>
        {categoriesQuery.isLoading ? (
          <div className="text-center py-8">Carregando categorias...</div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizedCategories.map((category) => (
              <Card
                key={category.id}
                className={`hover:shadow-lg transition-shadow ${
                  category.isChild ? "ml-6 border-l-4" : ""
                }`}
                style={category.isChild ? { borderLeftColor: category.color || "#3b82f6" } : undefined}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {category.isChild && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{category.name}</CardTitle>
                        {category.parentId && (
                          <p className="text-xs text-muted-foreground">
                            Subcategoria de: {getParentName(category.parentId)}
                          </p>
                        )}
                        {category.description && (
                          <CardDescription className="text-xs truncate">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      ID: {category.id}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        category.type === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {category.type === "income" ? "Receita" : "Despesa"}
                      </span>
                      {category.hasChildren && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          Pai
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(category)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
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
            <CardDescription>Todas as categorias com IDs para uso na API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Cor</th>
                    <th className="text-left py-2 px-4">Nome</th>
                    <th className="text-left py-2 px-4">Categoria Pai</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-left py-2 px-4">Descrição</th>
                    <th className="text-left py-2 px-4">Criada em</th>
                    <th className="text-center py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedCategories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b hover:bg-muted/50 ${category.isChild ? "bg-muted/20" : ""}`}
                    >
                      <td className="py-3 px-4 font-mono text-xs bg-muted/30">{category.id}</td>
                      <td className="py-3 px-4">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          {category.isChild && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {category.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {getParentName(category.parentId) || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          category.type === "income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {category.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {category.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(category.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(category)}
                          >
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>Atualize os dados da categoria</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Categoria *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Alimentação"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  onClick={() => handleTypeChange("expense")}
                  className="flex-1"
                >
                  Despesa
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  onClick={() => handleTypeChange("income")}
                  className="flex-1"
                >
                  Receita
                </Button>
              </div>
            </div>

            <div>
              <Label>Categoria Pai</Label>
              <Select
                value={formData.parentId?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentId: value === "none" ? null : parseInt(value),
                  }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Nenhuma (categoria principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                  {getParentOptions(formData.type, selectedCategory?.id).map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione uma categoria pai para transformar em subcategoria
              </p>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateCategoryMutation.isPending}>
                {updateCategoryMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"? Esta ação não pode ser desfeita.
              {categories.some((c) => c.parentId === selectedCategory?.id) && (
                <span className="block mt-2 text-yellow-600">
                  Atenção: Esta categoria possui subcategorias. Remova-as primeiro.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
