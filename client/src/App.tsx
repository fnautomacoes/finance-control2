import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MainLayout } from "./components/MainLayout";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Investments from "./pages/Investments";
import Categories from "./pages/Categories";
import CashFlow from "./pages/CashFlow";
import PayablesReceivables from "./pages/PayablesReceivables";
import PaidReceived from "./pages/PaidReceived";
import CreditCards from "./pages/CreditCards";
import Budget from "./pages/Budget";

function AppRoutes() {
  return (
    <MainLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/accounts"} component={Accounts} />
        <Route path={"/transactions"} component={Transactions} />
        <Route path={"/investments"} component={Investments} />
        <Route path={"/categories"} component={Categories} />
        <Route path={"/flow"} component={CashFlow} />
        <Route path={"/payables-receivables"} component={PayablesReceivables} />
        <Route path={"/paid-received"} component={PaidReceived} />
        <Route path={"/credit-cards"} component={CreditCards} />
        <Route path={"/budget"} component={Budget} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Login page without MainLayout */}
      <Route path={"/login"} component={Login} />
      {/* All other routes with MainLayout */}
      <Route component={AppRoutes} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
