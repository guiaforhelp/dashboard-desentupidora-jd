import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Campanhas from "./pages/Campanhas";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/campanhas">
        <DashboardLayout>
          <Campanhas />
        </DashboardLayout>
      </Route>
      <Route path="/upload">
        <DashboardLayout>
          <Upload />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/:id">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
