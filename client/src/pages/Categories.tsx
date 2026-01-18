import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ColorPicker";
import { Plus, Trash2, Edit2, Tag, ChevronRight, FolderTree, Search, X, Filter } from "lucide-react";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    color: "#3b82f6",
    type: "expense",
    parentId: null,
  });

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterParent, setFilterParent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Main categories for filter dropdown
  const mainCategories = categories.filter((c) => !c.parentId);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Filter by type
      if (filterType !== "all" && cat.type !== filterType) return false;

      // Filter by parent category
      if (filterParent !== "all") {
        const parentId = parseInt(filterParent);
        if (cat.id !== parentId && cat.parentId !== parentId) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!cat.name.toLowerCase().includes(search) &&
            !(cat.description?.toLowerCase().includes(search))) {
          return false;
        }
      }

      return true;
    });
  }, [categories, filterType, filterParent, searchTerm]);

  // Organize categories in hierarchy
  const organizedCategories = useMemo(() => {
    const parentCategories = filteredCategories.filter((c) => !c.parentId);
    const childCategories = filteredCategories.filter((c) => c.parentId);

    const childrenMap = new Map<number, Category[]>();
    childCategories.forEach((child) => {
      if (child.parentId) {
        const existing = childrenMap.get(child.parentId) || [];
        existing.push(child);
        childrenMap.set(child.parentId, existing);
      }
    });

    const result: (Category & { isChild: boolean; hasChildren: boolean })[] = [];
    parentCategories.forEach((parent) => {
      const children = childrenMap.get(parent.id) || [];
      result.push({ ...parent, isChild: false, hasChildren: children.length > 0 });
      children.forEach((child) => {
        result.push({ ...child, isChild: true, hasChildren: false });
      });
    });

    // Add orphaned children
    childCategories.forEach((child) => {
      if (!result.find((c) => c.id === child.id)) {
        result.push({ ...child, isChild: true, hasChildren: false });
      }
    });

    return result;
  }, [filteredCategories]);

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
        color: "#3b82f6",
        type: "expense",
        parentId: null,
      });
      setOpen(false);
      categoriesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar categoria");
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
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3b82f6",
      type: category.type,
      parentId: category.parentId,
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: "income" | "expense") => {
    setFormData((prev) => ({ ...prev, type, parentId: null }));
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterParent("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filterType !== "all" || filterParent !== "all" || searchTerm !== "";

  // Stats
  const totalCategories = categories.length;
  const incomeCategories = categories.filter((c) => c.type === "income").length;
  const expenseCategories = categories.filter((c) => c.type === "expense").length;
  const parentCount = categories.filter((c) => !c.parentId).length;

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

              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                label="Cor da Categoria *"
              />

              <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCategories}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{parentCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{incomeCategories}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{expenseCategories}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Categoria Principal</Label>
              <Select value={filterParent} onValueChange={setFilterParent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome da categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filterType !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {filterType === "income" ? "Receitas" : "Despesas"}
                  <button onClick={() => setFilterType("all")} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filterParent !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {mainCategories.find((c) => c.id === parseInt(filterParent))?.name}
                  <button onClick={() => setFilterParent("all")} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            {filteredCategories.length} {filteredCategories.length === 1 ? "categoria encontrada" : "categorias encontradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <div className="text-center py-8">Carregando categorias...</div>
          ) : organizedCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Cor</th>
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Categoria Pai</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Descrição</th>
                    <th className="text-left py-3 px-4">Criada em</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedCategories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-b hover:bg-muted/50 ${category.isChild ? "bg-muted/20" : ""}`}
                    >
                      <td className="py-3 px-4 font-mono text-xs">{category.id}</td>
                      <td className="py-3 px-4">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                          title={category.color || "#3b82f6"}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          {category.isChild && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {category.name}
                          {category.hasChildren && (
                            <Badge variant="outline" className="text-xs">Pai</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {getParentName(category.parentId) || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            category.type === "income"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {category.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {category.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(category.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
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
          ) : (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters ? "Nenhuma categoria encontrada com os filtros aplicados" : "Nenhuma categoria criada"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
            </div>

            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
              label="Cor da Categoria *"
            />

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
