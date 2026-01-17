import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Code,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface ApiToken {
  id: number;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiSettings() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("365");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Fetch tokens on mount
  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/tokens", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createToken() {
    if (!tokenName.trim()) {
      toast.error("Nome do token é obrigatório");
      return;
    }

    try {
      const response = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: tokenName,
          expiresInDays: expiresInDays === "never" ? undefined : parseInt(expiresInDays),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewToken(data.data.token);
        setShowCreateDialog(false);
        setShowTokenDialog(true);
        setTokenName("");
        setExpiresInDays("365");
        fetchTokens();
        toast.success("Token criado com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erro ao criar token");
      }
    } catch (error) {
      toast.error("Erro ao criar token");
    }
  }

  async function revokeToken(id: number) {
    if (!confirm("Tem certeza que deseja revogar este token? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // For revoke, we need to pass the token in the Authorization header
      // But since this is a web interface, we use session auth via cookies
      const response = await fetch(`/api/v1/tokens/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Token revogado com sucesso");
        fetchTokens();
      } else {
        toast.error("Erro ao revogar token");
      }
    } catch (error) {
      toast.error("Erro ao revogar token");
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedEndpoint(null), 2000);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com";

  const curlExamples = [
    {
      title: "Criar Despesa",
      method: "POST",
      endpoint: "/api/v1/transactions",
      description: "Cria uma nova despesa",
      curl: `curl -X POST ${baseUrl}/api/v1/transactions \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Supermercado",
    "amount": "350.75",
    "type": "expense",
    "date": "${new Date().toISOString().split("T")[0]}",
    "accountId": 1,
    "categoryId": 3
  }'`,
    },
    {
      title: "Criar Receita",
      method: "POST",
      endpoint: "/api/v1/transactions",
      description: "Cria uma nova receita",
      curl: `curl -X POST ${baseUrl}/api/v1/transactions \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Salário",
    "amount": "5000.00",
    "type": "income",
    "date": "${new Date().toISOString().split("T")[0]}",
    "accountId": 1,
    "categoryId": 5
  }'`,
    },
    {
      title: "Listar Transações",
      method: "GET",
      endpoint: "/api/v1/transactions",
      description: "Lista transações com filtros e paginação",
      curl: `curl -X GET "${baseUrl}/api/v1/transactions?type=expense&startDate=${new Date().toISOString().slice(0, 7)}-01&limit=50" \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Obter Transação",
      method: "GET",
      endpoint: "/api/v1/transactions/:id",
      description: "Obtém uma transação específica por ID",
      curl: `curl -X GET ${baseUrl}/api/v1/transactions/42 \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Atualizar Transação",
      method: "PUT",
      endpoint: "/api/v1/transactions/:id",
      description: "Atualiza uma transação existente",
      curl: `curl -X PUT ${baseUrl}/api/v1/transactions/42 \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Supermercado - Compra mensal",
    "amount": "380.00"
  }'`,
    },
    {
      title: "Excluir Transação",
      method: "DELETE",
      endpoint: "/api/v1/transactions/:id",
      description: "Exclui uma transação (reverte o saldo)",
      curl: `curl -X DELETE ${baseUrl}/api/v1/transactions/42 \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Listar Contas",
      method: "GET",
      endpoint: "/api/v1/accounts",
      description: "Lista as contas bancárias do usuário",
      curl: `curl -X GET ${baseUrl}/api/v1/accounts \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Listar Categorias",
      method: "GET",
      endpoint: "/api/v1/categories",
      description: "Lista as categorias do usuário",
      curl: `curl -X GET ${baseUrl}/api/v1/categories \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Listar Tokens",
      method: "GET",
      endpoint: "/api/v1/tokens",
      description: "Lista os tokens de API do usuário",
      curl: `curl -X GET ${baseUrl}/api/v1/tokens \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
    {
      title: "Revogar Token",
      method: "DELETE",
      endpoint: "/api/v1/tokens/:id",
      description: "Revoga um token de API",
      curl: `curl -X DELETE ${baseUrl}/api/v1/tokens/1 \\
  -H "Authorization: Bearer SEU_TOKEN"`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuração de API</h1>
          <p className="text-slate-500 mt-1">
            Gerencie tokens de acesso e veja exemplos de integração
          </p>
        </div>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens" className="gap-2">
            <Key className="h-4 w-4" />
            Tokens de API
          </TabsTrigger>
          <TabsTrigger value="examples" className="gap-2">
            <Code className="h-4 w-4" />
            Exemplos cURL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-6">
          {/* Token Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Tokens de Acesso
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie tokens para autenticação via API
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchTokens} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Token
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tokens.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum token criado ainda.</p>
                  <p className="text-sm mt-1">
                    Crie um token para integrar com a API REST.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Último uso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">{token.name}</TableCell>
                        <TableCell>
                          {token.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Revogado</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(token.createdAt)}</TableCell>
                        <TableCell>
                          {token.expiresAt ? (
                            new Date(token.expiresAt) < new Date() ? (
                              <span className="text-red-600">Expirado</span>
                            ) : (
                              formatDate(token.expiresAt)
                            )
                          ) : (
                            <span className="text-slate-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(token.lastUsedAt)}</TableCell>
                        <TableCell className="text-right">
                          {token.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => revokeToken(token.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Revogar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Importante sobre segurança</h3>
                  <ul className="mt-2 text-sm text-amber-800 space-y-1">
                    <li>
                      - O token só é exibido uma vez, no momento da criação. Guarde-o em local seguro.
                    </li>
                    <li>- Nunca compartilhe seus tokens ou os exponha em código público.</li>
                    <li>
                      - Se um token for comprometido, revogue-o imediatamente e crie um novo.
                    </li>
                    <li>
                      - Use tokens com data de expiração para maior segurança.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Exemplos de Integração
              </CardTitle>
              <CardDescription>
                Copie e adapte os comandos cURL para integrar com a API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {curlExamples.map((example, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          example.method === "GET"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : example.method === "POST"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : example.method === "PUT"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-red-100 text-red-700 border-red-200"
                        }
                      >
                        {example.method}
                      </Badge>
                      <span className="font-medium">{example.title}</span>
                      <span className="text-slate-500 text-sm hidden md:inline">
                        {example.endpoint}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(example.curl, example.title)}
                    >
                      {copiedEndpoint === example.title ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-600 mb-3">{example.description}</p>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{example.curl}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Fields Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Referência de Campos</CardTitle>
              <CardDescription>
                Campos disponíveis para criação de transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Campos Obrigatórios</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">description</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>Descrição (1-255 chars)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">amount</TableCell>
                        <TableCell>string/number</TableCell>
                        <TableCell>Valor (ex: "150.00")</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">type</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>"income" ou "expense"</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">date</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>Data (YYYY-MM-DD)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">accountId</TableCell>
                        <TableCell>number</TableCell>
                        <TableCell>ID da conta</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-blue-700">Campos Opcionais</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">categoryId</TableCell>
                        <TableCell>number</TableCell>
                        <TableCell>ID da categoria</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">projectId</TableCell>
                        <TableCell>number</TableCell>
                        <TableCell>ID do projeto</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">contactId</TableCell>
                        <TableCell>number</TableCell>
                        <TableCell>ID do contato</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">status</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>pending/completed/cancelled</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">notes</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell>Observações (até 1000)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Token</DialogTitle>
            <DialogDescription>
              Crie um token para autenticar suas requisições à API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">Nome do Token</Label>
              <Input
                id="token-name"
                placeholder="Ex: Meu App de Integração"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Um nome para identificar onde este token será usado
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expiração</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                  <SelectItem value="never">Nunca expira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createToken}>Criar Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Token Criado com Sucesso
            </DialogTitle>
            <DialogDescription>
              Copie o token abaixo. Ele não será exibido novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input
                readOnly
                type={showToken ? "text" : "password"}
                value={newToken || ""}
                className="pr-20 font-mono text-sm"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(newToken || "", "token")}
                >
                  {copiedEndpoint === "token" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Guarde este token em local seguro. Ele não será exibido novamente.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTokenDialog(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
