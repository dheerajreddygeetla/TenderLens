import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import PublicRoute from "./routes/PublicRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import FullPageSpinner from "./components/FullPageSpinner.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tenders from "./pages/Tenders.jsx";
import TenderDetails from "./pages/TenderDetails.jsx";
import Companies from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Bids from "./pages/Bids.jsx";
import Contracts from "./pages/Contracts.jsx";
import Documents from "./pages/Documents.jsx";
import Analysis from "./pages/Analysis.jsx";
import Risks from "./pages/Risks.jsx";
import Graph from "./pages/Graph.jsx";
import Map from "./pages/Map.jsx";
import Reports from "./pages/Reports.jsx";
import Notifications from "./pages/Notifications.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

function RootRedirect() {
  const { status } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/tenders/:id" element={<TenderDetails />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyDetails />} />
            <Route path="/bids" element={<Bids />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/risks" element={<Risks />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/map" element={<Map />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
