import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PartialConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: number;
    amount: string;
    description: string;
  } | null;
  onSuccess?: () => void;
}

export function PartialConfirmDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: PartialConfirmDialogProps) {
  const [partialAmount, setPartialAmount] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (transaction) {
      setPartialAmount(transaction.amount);
    }
  }, [transaction]);

  const confirmPartiallyMutation = trpc.transactions.confirmPartially.useMutation({
    onSuccess: () => {
      toast.success("Transação confirmada parcialmente!");
      utils.transactions.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao confirmar transação: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    await confirmPartiallyMutation.mutateAsync({
      id: transaction.id,
      partialAmount,
    });
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Parcialmente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Transação</Label>
            <p className="font-medium">{transaction.description}</p>
          </div>

          <div>
            <Label>Valor Original</Label>
            <Input
              value={`R$ ${parseFloat(transaction.amount).toFixed(2)}`}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label>Valor Confirmado *</Label>
            <Input
              type="number"
              step="0.01"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Informe o valor efetivamente confirmado
            </p>
          </div>

          {parseFloat(partialAmount) !== parseFloat(transaction.amount) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="text-yellow-800">
                Diferença:{" "}
                <span className="font-bold">
                  R${" "}
                  {Math.abs(
                    parseFloat(partialAmount) - parseFloat(transaction.amount)
                  ).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={confirmPartiallyMutation.isPending}
            >
              {confirmPartiallyMutation.isPending
                ? "Confirmando..."
                : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
