import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import RequestLeave from "./pages/RequestLeave";
import LeaveCalendar from "./pages/LeaveCalendar";
import Admin from "./pages/Admin";
import NotificationSettings from "./pages/NotificationSettings";
import LeavePolicies from "./pages/LeavePolicies";
import LeaveBalance from "./pages/LeaveBalance";
import EmployeeManagement from "./pages/EmployeeManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/request-leave" element={<RequestLeave />} />
              <Route path="/leave-calendar" element={<LeaveCalendar />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="/notification-settings" element={<NotificationSettings />} />
              <Route
                path="/leave-balance"
                element={
                  <AdminRoute>
                    <LeaveBalance />
                  </AdminRoute>
                }
              />
              <Route
                path="/leave-policies"
                element={
                  <AdminRoute>
                    <LeavePolicies />
                  </AdminRoute>
                }
              />
              <Route
                path="/employee-management"
                element={
                  <AdminRoute>
                    <EmployeeManagement />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
