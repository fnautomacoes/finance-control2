import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit2, Wallet, Search, X, Filter, DollarSign, CreditCard, PiggyBank } from "lucide-react";
import { toast } from "sonner";

const ACCOUNT_TYPES: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  investment: "Investimento",
  credit_card: "Cartão de Crédito",
  other: "Outro",
};

interface AccountFormData {
  name: string;
  type: "checking" | "savings" | "investment" | "credit_card" | "other";
  currency: "BRL" | "USD" | "EUR";
  initialBalance: string;
  balance: string;
  bankName: string;
  creditLimit?: string;
}

export default function Accounts() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "checking",
    currency: "BRL",
    initialBalance: "0",
    balance: "0",
    bankName: "",
    creditLimit: "",
  });

  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const accountsQuery = trpc.accounts.list.useQuery();
  const createAccountMutation = trpc.accounts.create.useMutation();
  const updateAccountMutation = trpc.accounts.update.useMutation();
  const deleteAccountMutation = trpc.accounts.delete.useMutation();

  const accounts = accountsQuery.data || [];

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (filterType !== "all" && acc.type !== filterType) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!acc.name.toLowerCase().includes(search) &&
            !(acc.bankName?.toLowerCase().includes(search))) {
          return false;
        }
      }
      return true;
    });
  }, [accounts, filterType, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createAccountMutation.mutateAsync({
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        initialBalance: formData.initialBalance,
        balance: formData.initialBalance,
        bankName: formData.bankName || undefined,
        creditLimit: formData.type === "credit_card" ? formData.creditLimit : undefined,
      });
      toast.success("Conta criada com sucesso!");
      setFormData({
        name: "",
        type: "checking",
        currency: "BRL",
        initialBalance: "0",
        balance: "0",
        bankName: "",
        creditLimit: "",
      });
      setOpen(false);
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar conta");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      await updateAccountMutation.mutateAsync({
        id: selectedAccount.id,
        name: formData.name,
        type: formData.type,
        balance: formData.balance,
        bankName: formData.bankName || undefined,
        creditLimit: formData.type === "credit_card" ? formData.creditLimit : undefined,
      });
      toast.success("Conta atualizada com sucesso!");
      setEditOpen(false);
      setSelectedAccount(null);
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar conta");
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      await deleteAccountMutation.mutateAsync({ id: selectedAccount.id });
      toast.success("Conta excluída com sucesso!");
      setDeleteOpen(false);
      setSelectedAccount(null);
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao excluir conta. Verifique se não há transações vinculadas.");
    }
  };

  const openEditDialog = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance?.toString() || "0",
      balance: account.balance?.toString() || "0",
      bankName: account.bankName || "",
      creditLimit: account.creditLimit?.toString() || "",
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (account: any) => {
    setSelectedAccount(account);
    setDeleteOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilterType("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filterType !== "all" || searchTerm !== "";

  // Stats
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance as string), 0);
  const checkingCount = accounts.filter((a) => a.type === "checking").length;
  const investmentCount = accounts.filter((a) => a.type === "investment").length;
  const creditCardCount = accounts.filter((a) => a.type === "credit_card").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Contas Bancárias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas e saldos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Conta</DialogTitle>
              <DialogDescription>Crie uma nova conta bancária ou de investimento</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Conta Corrente Principal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Moeda *</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="initialBalance">Saldo Inicial</Label>
                <Input
                  id="initialBalance"
                  name="initialBalance"
                  type="number"
                  step="0.01"
                  value={formData.initialBalance}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              {formData.type === "credit_card" && (
                <div>
                  <Label htmlFor="creditLimit">Limite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="bankName">Nome do Banco</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Criando..." : "Criar Conta"}
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
              <DollarSign className="h-4 w-4" />
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBalance < 0 ? "text-red-600" : "text-green-600"}`}>
              R$ {totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Contas Correntes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{checkingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{investmentCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cartões de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{creditCardCount}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Tipo de Conta</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome da conta ou banco..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filterType !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {ACCOUNT_TYPES[filterType]}
                  <button onClick={() => setFilterType("all")} className="ml-1 hover:text-destructive">
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

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas</CardTitle>
          <CardDescription>
            {filteredAccounts.length} {filteredAccounts.length === 1 ? "conta encontrada" : "contas encontradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsQuery.isLoading ? (
            <div className="text-center py-8">Carregando contas...</div>
          ) : filteredAccounts.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredAccounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{account.name}</span>
                        {account.bankName && (
                          <p className="text-xs text-muted-foreground">{account.bankName}</p>
                        )}
                      </div>
                      <Badge variant="outline">{ACCOUNT_TYPES[account.type] || account.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Saldo</span>
                      <span className={`font-medium ${parseFloat(account.balance as string) < 0 ? "text-red-600" : "text-green-600"}`}>
                        {account.currency} {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {account.type === "credit_card" && account.creditLimit && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Limite</span>
                        <span className="text-sm">
                          {parseFloat(account.creditLimit as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-end gap-1 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(account)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteDialog(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <ScrollArea className="hidden md:block w-full">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium">Banco</th>
                      <th className="text-left py-3 px-4 font-medium">Moeda</th>
                      <th className="text-right py-3 px-4 font-medium">Saldo</th>
                      <th className="text-right py-3 px-4 font-medium">Limite</th>
                      <th className="text-center py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{account.id}</td>
                        <td className="py-3 px-4 font-medium">{account.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{ACCOUNT_TYPES[account.type] || account.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{account.bankName || "-"}</td>
                        <td className="py-3 px-4">{account.currency}</td>
                        <td className={`py-3 px-4 text-right font-medium ${parseFloat(account.balance as string) < 0 ? "text-red-600" : "text-green-600"}`}>
                          {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {account.type === "credit_card" && account.creditLimit
                            ? parseFloat(account.creditLimit as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(account)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(account)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters ? "Nenhuma conta encontrada com os filtros aplicados" : "Nenhuma conta registrada"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeira Conta
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
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>Atualize os dados da conta</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Conta *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Conta Corrente Principal"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-balance">Saldo Atual</Label>
              <Input
                id="edit-balance"
                name="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>

            {formData.type === "credit_card" && (
              <div>
                <Label htmlFor="edit-creditLimit">Limite de Crédito</Label>
                <Input
                  id="edit-creditLimit"
                  name="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <Label htmlFor="edit-bankName">Nome do Banco</Label>
              <Input
                id="edit-bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Ex: Banco do Brasil"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateAccountMutation.isPending}>
                {updateAccountMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta "{selectedAccount?.name}"? Esta ação não pode ser desfeita.
              <br /><br />
              <strong className="text-red-600">Atenção:</strong> Se houver transações vinculadas a esta conta, a exclusão falhará.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
