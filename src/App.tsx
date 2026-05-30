import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes }      from "react-router-dom";
import { Toaster }         from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition }  from "@/components/PageTransition";

import Index            from "./pages/Index";
import Committees       from "./pages/Committees";
import Matrix           from "./pages/Matrix";
import Register         from "./pages/Register";
import Schedule         from "./pages/Schedule";
import Venue            from "./pages/Venue";
import Login            from "./pages/Login";
import SecretariatLogin from "./pages/SecretariatLogin";
import Secretariat      from "./pages/Secretariat";
import Delegate         from "./pages/Delegate";
import Brochure         from "./pages/Brochure";
import NotFound         from "./pages/NotFound";
import AboutPage        from "./pages/About";
import GalleryPage      from "./pages/Gallery";
import { SecretariatsPage } from "./pages/SecretariatsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster richColors closeButton position="top-right" />
      <BrowserRouter>
        <PageTransition />
        <Routes>
          <Route path="/"                  element={<Index />} />
          <Route path="/secretariats"      element={<SecretariatsPage type="secretariat" />} />
          <Route path="/staff"             element={<SecretariatsPage type="staff" />} />
          <Route path="/committees"        element={<Committees />} />
          <Route path="/matrix"            element={<Matrix />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/schedule"          element={<Schedule />} />
          <Route path="/venue"             element={<Venue />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/secretariat-login" element={<SecretariatLogin />} />
          <Route path="/secretariat"       element={<Secretariat />} />
          <Route path="/delegate"          element={<Delegate />} />
          <Route path="/brochure"          element={<Brochure />} />
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/gallery"           element={<GalleryPage />} />
          <Route path="*"                  element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
