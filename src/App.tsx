import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Quotes from "./pages/Quotes";
import MyTeams from "./pages/MyTeams";
import Announcements from "./pages/Announcements";
import Stock from "./pages/Stock";
import MailPage from "./pages/Mail";
import SettingsPage from "./pages/Settings";
import CRM from "./pages/CRM";
import Suppliers from "./pages/Suppliers";
import Brief from "./pages/Brief";
import NotFound from "./pages/NotFound";
import Confirm from "./pages/Confirm";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/calendar" element={<ProtectedLayout><Calendar /></ProtectedLayout>} />
            <Route path="/quotes" element={<ProtectedLayout><Quotes /></ProtectedLayout>} />
            <Route path="/my-teams" element={<ProtectedLayout><MyTeams /></ProtectedLayout>} />
            <Route path="/announcements" element={<ProtectedLayout><Announcements /></ProtectedLayout>} />
            <Route path="/stock" element={<ProtectedLayout><Stock /></ProtectedLayout>} />
            <Route path="/mail" element={<ProtectedLayout><MailPage /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
            <Route path="/crm" element={<ProtectedLayout><CRM /></ProtectedLayout>} />
            <Route path="/suppliers" element={<ProtectedLayout><Suppliers /></ProtectedLayout>} />
            <Route path="/brief" element={<ProtectedLayout><Brief /></ProtectedLayout>} />
            <Route path="/confirm/:sessionId" element={<Confirm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
