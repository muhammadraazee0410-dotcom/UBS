import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AccountProfilePage from "./pages/AccountProfilePage";
import BankLettersPage from "./pages/BankLettersPage";
import InternationalTransferPage from "./pages/InternationalTransferPage";
import DomesticTransferPage from "./pages/DomesticTransferPage";
import BillPaymentPage from "./pages/BillPaymentPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import PaymentTrackingPage from "./pages/PaymentTrackingPage";
import BeneficiaryPage from "./pages/BeneficiaryPage";
import ServerConsolePage from "./pages/ServerConsolePage";
import DatabasePage from "./pages/DatabasePage";
import DocumentsPage from "./pages/DocumentsPage";
import StatementPage from "./pages/StatementPage";
import CISPage from "./pages/CISPage";
import LedgerTransferPage from "./pages/LedgerTransferPage";
import Layout from "./components/Layout";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-swiss-bg flex items-center justify-center">
        <div className="text-slate-900 font-mono">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/account-profile" element={<AccountProfilePage />} />
                    <Route path="/bank-letters" element={<BankLettersPage />} />
                    <Route path="/cis" element={<CISPage />} />
                    <Route path="/ledger-transfer" element={<LedgerTransferPage />} />
                    <Route path="/international-transfer" element={<InternationalTransferPage />} />
                    <Route path="/domestic-transfer" element={<DomesticTransferPage />} />
                    <Route path="/bill-payment" element={<BillPaymentPage />} />
                    <Route path="/transactions" element={<TransactionHistoryPage />} />
                    <Route path="/tracking" element={<PaymentTrackingPage />} />
                    <Route path="/beneficiaries" element={<BeneficiaryPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/statement" element={<StatementPage />} />
                    <Route path="/console" element={<ServerConsolePage />} />
                    <Route path="/database" element={<DatabasePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
