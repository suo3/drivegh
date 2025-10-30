import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import RequestService from "./pages/RequestService";
import GetHelp from "./pages/GetHelp";
import AboutUs from "./pages/AboutUs";
import Partnership from "./pages/Partnership";
import TrackRescue from "./pages/TrackRescue";
import RequestDetails from "./pages/RequestDetails";
import Billing from "./pages/Billing";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/request-service" element={<RequestService />} />
            <Route path="/get-help" element={<GetHelp />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/partnership" element={<Partnership />} />
            <Route path="/track-rescue" element={<TrackRescue />} />
            <Route path="/track/:code" element={<RequestDetails />} />
            <Route path="/request/:id" element={<RequestDetails />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
