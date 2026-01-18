import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  Ban,
} from "lucide-react";

type Step = "upload" | "account" | "preview" | "importing" | "complete";

interface ParsedTransaction {
  fitId: string;
  date: string;
  amount: string;
  type: "income" | "expense";
  description: string;
  isDuplicate: boolean;
  selected: boolean;
  suggestedCategoryId?: number;
  categoryId?: number;
}

interface ParseResult {
  bankId: string;
  bankAccountId: string;
  accountType: string;
  currency: string;
  balance?: number;
  startDate?: string;
  endDate?: string;
  transactions: ParsedTransaction[];
  summary: {
    total: number;
    new: number;
    duplicates: number;
  };
}

const formatCurrency = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function ImportOFX() {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [updateBalance, setUpdateBalance] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicatesSkipped: number;
    balanceChange: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const accountsQuery = trpc.accounts.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();

  // Mutations
  const parseMutation = trpc.ofx.parse.useMutation();
  const importMutation = trpc.ofx.import.useMutation();

  const accounts = accountsQuery.data || [];
  const categories = categoriesQuery.data || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.name.toLowerCase().endsWith(".ofx")) {
      toast.error("Por favor, selecione um arquivo .ofx");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    try {
      const content = await file.text();
      setSelectedFile(file);
      setFileContent(content);
      setStep("account");
    } catch {
      toast.error("Erro ao ler o arquivo");
    }
  };

  const handleAccountSelect = async () => {
    if (!selectedAccountId || !fileContent) return;

    try {
      const result = await parseMutation.mutateAsync({
        fileContent,
        accountId: selectedAccountId,
      });

      setParseResult(result);
      setTransactions(
        result.transactions.map((tx) => ({
          ...tx,
          categoryId: tx.suggestedCategoryId,
        }))
      );
      setStep("preview");
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar arquivo OFX");
    }
  };

  const handleToggleTransaction = (fitId: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.fitId === fitId ? { ...tx, selected: !tx.selected } : tx
      )
    );
  };

  const handleToggleAll = (selected: boolean) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.isDuplicate ? tx : { ...tx, selected }))
    );
  };

  const handleCategoryChange = (fitId: string, categoryId: number | undefined) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.fitId === fitId ? { ...tx, categoryId } : tx
      )
    );
  };

  const handleImport = async () => {
    if (!selectedAccountId || !parseResult) return;

    const selectedTransactions = transactions.filter((tx) => tx.selected && !tx.isDuplicate);

    if (selectedTransactions.length === 0) {
      toast.error("Nenhuma transação selecionada para importar");
      return;
    }

    setStep("importing");
    setImportProgress(10);

    try {
      setImportProgress(30);

      const result = await importMutation.mutateAsync({
        accountId: selectedAccountId,
        fileName: selectedFile?.name,
        bankId: parseResult.bankId,
        bankAccountId: parseResult.bankAccountId,
        startDate: parseResult.startDate,
        endDate: parseResult.endDate,
        transactions: selectedTransactions.map((tx) => ({
          fitId: tx.fitId,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          categoryId: tx.categoryId,
        })),
        updateBalance,
      });

      setImportProgress(100);
      setImportResult(result);
      setStep("complete");
      toast.success(`${result.imported} transações importadas com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar transações");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setFileContent("");
    setSelectedAccountId(null);
    setParseResult(null);
    setTransactions([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedCount = transactions.filter((tx) => tx.selected && !tx.isDuplicate).length;
  const newCount = transactions.filter((tx) => !tx.isDuplicate).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importar OFX</h1>
          <p className="text-muted-foreground">
            Importe extratos bancários no formato OFX
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {["upload", "account", "preview", "complete"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s || (step === "importing" && s === "preview")
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "account", "preview", "complete"].indexOf(step) >
                    ["upload", "account", "preview", "complete"].indexOf(s)
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {["upload", "account", "preview", "complete"].indexOf(step) > i ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  ["upload", "account", "preview", "complete"].indexOf(step) > i
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>1. Selecione o arquivo OFX</CardTitle>
            <CardDescription>
              Faça upload do extrato bancário no formato OFX (.ofx)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Clique ou arraste o arquivo aqui
              </p>
              <p className="text-sm text-muted-foreground">
                Arquivos .ofx até 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Account */}
      {step === "account" && (
        <Card>
          <CardHeader>
            <CardTitle>2. Selecione a conta</CardTitle>
            <CardDescription>
              Escolha a conta bancária para importar as transações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Conta de destino</Label>
              <Select
                value={selectedAccountId?.toString() || ""}
                onValueChange={(value) => setSelectedAccountId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - {formatCurrency(parseFloat(account.balance as string))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleReset}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleAccountSelect}
                disabled={!selectedAccountId || parseMutation.isPending}
              >
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && parseResult && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>3. Revisar transações</CardTitle>
              <CardDescription>
                Verifique e selecione as transações para importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{parseResult.summary.total}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-600">Novas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {parseResult.summary.new}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-yellow-600">Duplicadas</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {parseResult.summary.duplicates}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-600">Selecionadas</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCount}</p>
                </div>
              </div>

              {parseResult.startDate && parseResult.endDate && (
                <p className="text-sm text-muted-foreground mb-4">
                  Período: {formatDate(parseResult.startDate)} a{" "}
                  {formatDate(parseResult.endDate)}
                </p>
              )}

              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAll(true)}
                >
                  Selecionar todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAll(false)}
                >
                  Desmarcar todas
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <Checkbox
                    id="updateBalance"
                    checked={updateBalance}
                    onCheckedChange={(checked) => setUpdateBalance(!!checked)}
                  />
                  <Label htmlFor="updateBalance" className="text-sm">
                    Atualizar saldo da conta
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 w-12"></th>
                      <th className="text-left py-3 px-4">Data</th>
                      <th className="text-left py-3 px-4">Descrição</th>
                      <th className="text-left py-3 px-4">Categoria</th>
                      <th className="text-right py-3 px-4">Valor</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.fitId}
                        className={`${
                          tx.isDuplicate
                            ? "bg-yellow-50 dark:bg-yellow-950/20 opacity-60"
                            : tx.selected
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={tx.selected}
                            disabled={tx.isDuplicate}
                            onCheckedChange={() => handleToggleTransaction(tx.fitId)}
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={tx.categoryId?.toString() || "none"}
                            onValueChange={(value) =>
                              handleCategoryChange(
                                tx.fitId,
                                value === "none" ? undefined : parseInt(value)
                              )
                            }
                            disabled={tx.isDuplicate}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue placeholder="Sem categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem categoria</SelectItem>
                              {categories
                                .filter((c) => c.type === tx.type)
                                .map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td
                          className={`py-3 px-4 text-right whitespace-nowrap font-medium ${
                            tx.type === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.isDuplicate ? (
                            <Badge variant="outline" className="text-yellow-600">
                              <Ban className="h-3 w-3 mr-1" />
                              Duplicada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Nova
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("account")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || importMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Importar {selectedCount} transações
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Importando transações...</h3>
              <p className="text-muted-foreground mb-4">
                Por favor, aguarde enquanto processamos as transações
              </p>
              <Progress value={importProgress} className="w-64 mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {step === "complete" && importResult && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Importação concluída!</h3>
              <p className="text-muted-foreground mb-6">
                Suas transações foram importadas com sucesso
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-600">Importadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.imported}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-yellow-600">Ignoradas</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {importResult.duplicatesSkipped}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-600">Saldo</p>
                  <p
                    className={`text-xl font-bold ${
                      importResult.balanceChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {importResult.balanceChange >= 0 ? "+" : ""}
                    {formatCurrency(importResult.balanceChange)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleReset}>
                  Importar outro arquivo
                </Button>
                <Button onClick={() => (window.location.href = "/transactions")}>
                  Ver transações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Como obter o arquivo OFX?</p>
              <p>
                Acesse o internet banking do seu banco e procure pela opção de
                exportar extrato no formato OFX ou OFC. A maioria dos bancos
                brasileiros oferece esta opção na área de extratos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
