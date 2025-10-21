import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RequestService from "./pages/RequestService";
import AboutUs from "./pages/AboutUs";
import Partnership from "./pages/Partnership";
import TrackRescue from "./pages/TrackRescue";
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
            <Route path="/customer" element={<CustomerDashboard />} />
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/request-service" element={<RequestService />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/partnership" element={<Partnership />} />
            <Route path="/track-rescue" element={<TrackRescue />} />
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
