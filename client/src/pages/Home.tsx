import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Design Philosophy: Minimalismo Contemporâneo com Foco em Dados
 * - Tipografia: Playfair Display para títulos (elegância), Poppins para corpo (modernidade)
 * - Cores: Azul #1e40af (confiança), Verde #10b981 (receita), Vermelho #ef4444 (despesa)
 * - Layout: Assimétrico com scroll vertical, cards modulares
 * - Animações: Fade-ins suaves, hover effects discretos
 */

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ReportItem {
  title: string;
  count: number;
  color: string;
}

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features: FeatureItem[] = [
    {
      icon: <Globe className="w-6 h-6 text-blue-700" />,
      title: "Multimoedas",
      description: "Suporte completo para R$, USD$ e Euro (€)",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-700" />,
      title: "Relatórios Avançados",
      description: "Mais de 30 relatórios personalizáveis",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-700" />,
      title: "Gestão de Investimentos",
      description: "Controle completo de carteiras diversificadas",
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-700" />,
      title: "Segurança",
      description: "Todas as transações auditadas e rastreáveis",
    },
  ];

  const reports: ReportItem[] = [
    { title: "Patrimônio e Orçamento", count: 13, color: "bg-blue-100" },
    { title: "Controle de Contas", count: 6, color: "bg-green-100" },
    { title: "Detalhamento de Receitas", count: 4, color: "bg-amber-100" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">MD</span>
            </div>
            <h1 className="text-xl font-display font-bold text-gray-900">
              Meu Dinheiro
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-blue-700 transition">
              Funcionalidades
            </a>
            <a href="#reports" className="hover:text-blue-700 transition">
              Relatórios
            </a>
            <a href="#versions" className="hover:text-blue-700 transition">
              Versões
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
              <h2 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 leading-tight">
                Gestão Financeira Completa
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                O <strong>Meu Dinheiro</strong> é uma plataforma online de gestão
                financeira e investimentos ágil, intuitiva e completa. Desenvolvida
                para atender pessoas, empresas e instituições que buscam excelência
                no controle de seus ativos e passivos.
              </p>
              <div className="flex gap-4">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                  Explorar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" className="border-gray-300">
                  Saiba Mais
                </Button>
              </div>
            </div>
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <img
                src="/images/hero-dashboard.png"
                alt="Dashboard do Meu Dinheiro"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="container">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4 text-center">
            Funcionalidades Principais
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Ferramentas poderosas para gerenciar sua vida financeira com clareza e
            precisão
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 p-3 bg-blue-50 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Versions Section */}
      <section id="versions" className="py-20">
        <div className="container">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-16 text-center">
            Duas Versões Poderosas
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Versão Pessoal */}
            <Card className="p-8 border-0 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900">
                  Versão Pessoal
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Recursos avançados para gestão patrimonial e financeira de pessoas,
                famílias e profissionais liberais.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Controle de contas bancárias e cartões",
                  "Integração bancária automatizada",
                  "Metas de orçamento e economia",
                  "Gestão patrimonial completa",
                  "Carne Leão para profissionais liberais",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-blue-700 hover:bg-blue-800">
                Explorar Versão Pessoal
              </Button>
            </Card>

            {/* Versão Empresarial */}
            <Card className="p-8 border-0 bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900">
                  Versão Empresarial
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Controle gerencial e operacional sofisticado para pequenos negócios
                e instituições.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Planejamento estratégico empresarial",
                  "DRE Gerencial e Balanço Patrimonial",
                  "Análise de KPIs de mercado",
                  "Gestão de contas a pagar/receber",
                  "Estruturação por centros de custos",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-green-700 hover:bg-green-800">
                Explorar Versão Empresarial
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Reports Section */}
      <section id="reports" className="bg-gray-50 py-20">
        <div className="container">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-6 text-center">
            Relatórios Abrangentes
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Mais de 30 relatórios diferentes para explorar seus dados de forma mais
            intuitiva, compreender melhor as tendências e salvar ou compartilhar
            facilmente
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {reports.map((report, index) => (
              <Card
                key={index}
                className={`p-6 border-0 ${report.color} hover:shadow-md transition-shadow cursor-pointer`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.title}
                </h3>
                <p className="text-3xl font-bold text-blue-700">{report.count}</p>
                <p className="text-sm text-gray-600 mt-2">relatórios disponíveis</p>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-0 bg-white shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Patrimônio e Orçamento
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Balanço Patrimonial</li>
                <li>• Evolução do Patrimônio</li>
                <li>• Totais por Categoria</li>
                <li>• Comparação entre Períodos</li>
                <li>• Evolução de Metas</li>
              </ul>
            </Card>

            <Card className="p-8 border-0 bg-white shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Controle e Detalhamento
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Fluxo de Caixa</li>
                <li>• Contas a Pagar/Receber</li>
                <li>• Lançamentos por Categoria</li>
                <li>• Análise por Projeto</li>
                <li>• Histórico Detalhado</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Investments Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold text-gray-900 mb-6">
                Gestão Completa de Investimentos
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Gerenciador completo de carteiras diversificadas com suporte a
                múltiplos ativos financeiros. Acompanhe a posição consolidada,
                rentabilidade histórica e análise comparativa com índices de mercado.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Ações, Opções, FIIs e ETFs",
                  "Fundos de Investimento e Previdência",
                  "Tesouro Direto e Títulos Bancários",
                  "Criptomoedas e Moedas",
                  "Cálculo automático de Imposto de Renda",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-700 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Button className="bg-blue-700 hover:bg-blue-800">
                Saiba Mais sobre Investimentos
              </Button>
            </div>
            <div className="relative">
              <img
                src="/images/investment-portfolio.png"
                alt="Gestão de Investimentos"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="/images/reports-analytics.png"
                alt="Relatórios e Analytics"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-4xl font-display font-bold mb-6">
                Análise Profunda de Dados
              </h2>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Visualize suas informações financeiras com clareza através de
                gráficos intuitivos, tabelas detalhadas e painéis personalizáveis.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Dashboard personalizável com múltiplos painéis",
                  "Gráficos interativos e animados",
                  "Filtros avançados por período, categoria e projeto",
                  "Exportação configurável de dados",
                  "Comparação entre períodos e índices",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-white text-blue-700 hover:bg-gray-100">
                Explorar Análises
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-16 text-center">
            Por Que Escolher Meu Dinheiro?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Explorar Dados de Forma Intuitiva
              </h3>
              <p className="text-gray-600">
                Interface minimalista e clara que facilita a compreensão de suas
                informações financeiras sem complexidade desnecessária.
              </p>
            </Card>

            <Card className="p-8 border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Compreender Melhor as Tendências
              </h3>
              <p className="text-gray-600">
                Gráficos e relatórios avançados que revelam padrões, tendências e
                insights valiosos sobre sua saúde financeira.
              </p>
            </Card>

            <Card className="p-8 border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Salvar ou Compartilhar Facilmente
              </h3>
              <p className="text-gray-600">
                Exporte seus dados em múltiplos formatos, compartilhe relatórios com
                facilidade e mantenha backups seguros de suas informações.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Comece Sua Jornada Financeira Hoje
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já transformaram sua gestão
            financeira com o Meu Dinheiro
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-6 text-lg">
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-blue-800 px-8 py-6 text-lg"
            >
              Agendar Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Versão Pessoal
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Versão Empresarial
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Investimentos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Tutoriais
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Termos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Segurança
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              &copy; 2024 Meu Dinheiro. Todos os direitos reservados. | Desenvolvido
              com dedicação
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
