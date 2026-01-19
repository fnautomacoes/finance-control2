import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any;
  type: "income" | "expense";
  onSuccess?: () => void;
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  type,
  onSuccess,
}: TransactionModalProps) {
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    accountId: 0,
    categoryId: undefined as number | undefined,
    notes: "",
    contactId: undefined as number | undefined,
    documentNumber: "",
    observations: "",
    tags: "",
    status: "pending" as "pending" | "scheduled" | "confirmed" | "reconciled",
    // Recurrence
    recurrenceType: "single" as "single" | "installment" | "fixed",
    recurrenceFrequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    recurrenceInterval: 1,
    totalInstallments: 2,
    startInstallment: 1,
    installmentValue: "",
  });

  // Reset form when modal opens or transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount || "",
        date: transaction.date || new Date().toISOString().split("T")[0],
        description: transaction.description || "",
        accountId: transaction.accountId || 0,
        categoryId: transaction.categoryId || undefined,
        notes: transaction.notes || "",
        contactId: transaction.contactId || undefined,
        documentNumber: transaction.documentNumber || "",
        observations: transaction.observations || "",
        tags: transaction.tags || "",
        status: transaction.status || "pending",
        recurrenceType: "single",
        recurrenceFrequency: "monthly",
        recurrenceInterval: 1,
        totalInstallments: 2,
        startInstallment: 1,
        installmentValue: "",
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        categoryId: undefined,
        notes: "",
        contactId: undefined,
        documentNumber: "",
        observations: "",
        tags: "",
        status: "pending",
        recurrenceType: "single",
        recurrenceFrequency: "monthly",
        recurrenceInterval: 1,
        totalInstallments: 2,
        startInstallment: 1,
        installmentValue: "",
      }));
    }
    setShowCustomRecurrence(false);
  }, [transaction, open]);

  const accountsQuery = trpc.accounts.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const contactsQuery = trpc.contacts.list.useQuery();

  // Set default account when accounts load
  useEffect(() => {
    if (accountsQuery.data && accountsQuery.data.length > 0 && formData.accountId === 0) {
      setFormData((prev) => ({ ...prev, accountId: accountsQuery.data![0].id }));
    }
  }, [accountsQuery.data, formData.accountId]);

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      toast.success("Transação criada com sucesso!");
      utils.transactions.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: () => {
      toast.success("Transação atualizada com sucesso!");
      utils.transactions.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.accountId === 0) {
      toast.error("Selecione uma conta");
      return;
    }

    if (transaction) {
      // Update existing transaction
      await updateMutation.mutateAsync({
        id: transaction.id,
        accountId: formData.accountId,
        description: formData.description,
        amount: formData.amount,
        type,
        date: formData.date,
        categoryId: formData.categoryId,
        notes: formData.notes || null,
        contactId: formData.contactId,
        documentNumber: formData.documentNumber || null,
        observations: formData.observations || null,
        tags: formData.tags || null,
        status: formData.status,
      });
    } else {
      // Create new transaction
      const recurrence =
        formData.recurrenceType !== "single"
          ? {
              type: formData.recurrenceType,
              frequency: formData.recurrenceFrequency,
              interval: formData.recurrenceInterval,
              totalInstallments: formData.totalInstallments,
              startInstallment: formData.startInstallment,
              installmentValue: formData.installmentValue || formData.amount,
            }
          : undefined;

      await createMutation.mutateAsync({
        accountId: formData.accountId,
        description: formData.description,
        amount: formData.amount,
        type,
        date: formData.date,
        categoryId: formData.categoryId,
        notes: formData.notes || null,
        contactId: formData.contactId,
        documentNumber: formData.documentNumber || null,
        observations: formData.observations || null,
        tags: formData.tags || null,
        status: formData.status,
        recurrence,
      });
    }
  };

  const filteredCategories = categoriesQuery.data?.filter((c) => c.type === type) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar" : "Nova"}{" "}
            {type === "income" ? "Receita" : "Despesa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>

            {/* Tab: Basic Data */}
            <TabsContent value="basic" className="space-y-4">
              {/* Amount */}
              <div>
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Recurrence (only for new transactions) */}
              {!transaction && (
                <div>
                  <Label>Repetição</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value: "single" | "installment" | "fixed") =>
                      setFormData((prev) => ({ ...prev, recurrenceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Única</SelectItem>
                      <SelectItem value="installment">Parcelada</SelectItem>
                      <SelectItem value="fixed">Fixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Installment Configuration */}
              {!transaction && formData.recurrenceType === "installment" && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  {!showCustomRecurrence ? (
                    <>
                      <div>
                        <Label>Periodicidade</Label>
                        <Select
                          value={formData.recurrenceFrequency}
                          onValueChange={(value: any) =>
                            setFormData((prev) => ({
                              ...prev,
                              recurrenceFrequency: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diária</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Número de Parcelas</Label>
                        <Input
                          type="number"
                          min="2"
                          value={formData.totalInstallments}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              totalInstallments: parseInt(e.target.value) || 2,
                            }))
                          }
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomRecurrence(true)}
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Personalizar
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Repetição</Label>
                        <Select
                          value={formData.recurrenceFrequency}
                          onValueChange={(value: any) =>
                            setFormData((prev) => ({
                              ...prev,
                              recurrenceFrequency: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diária</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Repete-se a cada</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={formData.recurrenceInterval}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                recurrenceInterval: parseInt(e.target.value) || 1,
                              }))
                            }
                            className="w-20"
                          />
                          <span className="flex items-center text-sm">
                            {formData.recurrenceFrequency === "monthly"
                              ? "meses"
                              : formData.recurrenceFrequency === "yearly"
                              ? "anos"
                              : formData.recurrenceFrequency === "weekly"
                              ? "semanas"
                              : "dias"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label>Número de Parcelas</Label>
                        <Input
                          type="number"
                          min="2"
                          value={formData.totalInstallments}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              totalInstallments: parseInt(e.target.value) || 2,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Parcela Inicial</Label>
                        <Input
                          type="number"
                          min="1"
                          max={formData.totalInstallments}
                          value={formData.startInstallment}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startInstallment: parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label>Valor da Parcela (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.installmentValue}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              installmentValue: e.target.value,
                            }))
                          }
                          placeholder={formData.amount || "Mesmo valor"}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Deixe em branco para usar o valor informado acima
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomRecurrence(false)}
                        className="w-full"
                      >
                        Voltar ao básico
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Fixed Recurrence */}
              {!transaction && formData.recurrenceType === "fixed" && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label>Periodicidade</Label>
                    <Select
                      value={formData.recurrenceFrequency}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurrenceFrequency: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Serão geradas 12 ocorrências futuras automaticamente
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Conta de luz"
                  required
                />
              </div>

              {/* Account */}
              <div>
                <Label>Conta *</Label>
                <Select
                  value={formData.accountId.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountId: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountsQuery.data?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: value === "none" ? undefined : parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Tab: Details */}
            <TabsContent value="details" className="space-y-4">
              {/* Notes */}
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="Anotações rápidas"
                />
              </div>

              {/* Contact */}
              <div>
                <Label>Contato</Label>
                <Select
                  value={formData.contactId?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactId: value === "none" ? undefined : parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {contactsQuery.data?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document Number */}
              <div>
                <Label>Número do Documento</Label>
                <Input
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentNumber: e.target.value,
                    }))
                  }
                  placeholder="Nota fiscal, boleto, etc."
                />
              </div>

              {/* Observations */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      observations: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Observações detalhadas"
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="reconciled">Conciliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
