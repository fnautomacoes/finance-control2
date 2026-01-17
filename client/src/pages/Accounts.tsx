import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Wallet } from "lucide-react";
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
    bankName: "",
    creditLimit: "",
  });

  // Queries
  const accountsQuery = trpc.accounts.list.useQuery();
  const createAccountMutation = trpc.accounts.create.useMutation();
  const updateAccountMutation = trpc.accounts.update.useMutation();
  const deleteAccountMutation = trpc.accounts.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createAccountMutation.mutateAsync({
        ...formData,
        creditLimit: formData.type === "credit_card" ? formData.creditLimit : undefined,
      });
      toast.success("Conta criada com sucesso!");
      setFormData({
        name: "",
        type: "checking",
        currency: "BRL",
        initialBalance: "0",
        bankName: "",
        creditLimit: "",
      });
      setOpen(false);
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar conta");
      console.error(error);
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
        bankName: formData.bankName,
        creditLimit: formData.type === "credit_card" ? formData.creditLimit : undefined,
      });
      toast.success("Conta atualizada com sucesso!");
      setEditOpen(false);
      setSelectedAccount(null);
      accountsQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar conta");
      console.error(error);
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
      console.error(error);
    }
  };

  const openEditDialog = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance || "0",
      bankName: account.bankName || "",
      creditLimit: account.creditLimit || "",
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (account: any) => {
    setSelectedAccount(account);
    setDeleteOpen(true);
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

  const accounts = accountsQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie suas contas e saldos</p>
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

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsQuery.isLoading ? (
          <div className="col-span-full text-center py-8">Carregando contas...</div>
        ) : accounts.length > 0 ? (
          accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        ID: {account.id}
                      </span>
                    </div>
                    <CardDescription>{ACCOUNT_TYPES[account.type] || account.type}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-2xl font-bold ${parseFloat(account.balance as string) < 0 ? "text-red-600" : ""}`}>
                    {account.currency} {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {account.bankName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p className="text-sm font-medium">{account.bankName}</p>
                  </div>
                )}
                {account.type === "credit_card" && account.creditLimit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Limite</p>
                    <p className="text-sm font-medium">
                      {account.currency} {parseFloat(account.creditLimit as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openDeleteDialog(account)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhuma conta registrada</p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table View for Desktop */}
      {accounts.length > 0 && (
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Visão em Tabela</CardTitle>
            <CardDescription>Todas as contas com IDs para uso na API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Nome</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-left py-2 px-4">Banco</th>
                    <th className="text-left py-2 px-4">Moeda</th>
                    <th className="text-right py-2 px-4">Saldo</th>
                    <th className="text-center py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs bg-muted/30">{account.id}</td>
                      <td className="py-3 px-4 font-medium">{account.name}</td>
                      <td className="py-3 px-4">{ACCOUNT_TYPES[account.type] || account.type}</td>
                      <td className="py-3 px-4 text-muted-foreground">{account.bankName || "-"}</td>
                      <td className="py-3 px-4">{account.currency}</td>
                      <td className={`py-3 px-4 text-right font-medium ${parseFloat(account.balance as string) < 0 ? "text-red-600" : ""}`}>
                        {parseFloat(account.balance as string).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(account)}
                          >
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Contas</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold">
                  R$ {accounts.reduce((sum, acc) => sum + parseFloat(acc.balance as string), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contas Correntes</p>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.type === "checking").length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimentos</p>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.type === "investment").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
