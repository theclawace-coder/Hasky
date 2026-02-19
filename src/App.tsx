import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import FleetList from './pages/fleet/FleetList';
import MachineDetail from './pages/fleet/MachineDetail';
import BookingsList from './pages/bookings/BookingsList';
import NewBooking from './pages/bookings/NewBooking';
import BookingDetail from './pages/bookings/BookingDetail';
import CustomersList from './pages/customers/CustomersList';
import CustomerDetail from './pages/customers/CustomerDetail';
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import QuotesList from './pages/quotes/QuotesList';
import Settings from './pages/settings/Settings';
import AccountingPage from './pages/accounting/AccountingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import MachineSearch from './pages/admin/MachineSearch';
import CrossHireDeals from './pages/admin/CrossHireDeals';
import CompaniesOverview from './pages/admin/CompaniesOverview';
import PublicDocumentPage from './pages/public/PublicDocumentPage';
import LandingPage from './pages/landing/LandingPage';
import FeaturesPage from './pages/landing/FeaturesPage';
import PricingPage from './pages/landing/PricingPage';
import HowItWorksPage from './pages/landing/HowItWorksPage';
import ContactPage from './pages/landing/ContactPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { Card } from './components/ui/Card';
import { isSupabaseConfigured } from './lib/supabase';

function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-slate-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-600">Use Supabase reset password flow from your auth settings or contact your admin.</p>
      </Card>
    </div>
  );
}

function NotFound() {
  return (
    <Card>
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
    </Card>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <Card className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">Missing Supabase Environment Variables</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create a <code>.env</code> file in the project root with:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY`}
          </pre>
          <p className="mt-3 text-sm text-slate-600">
            Then restart the dev server.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public marketing pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/public/:documentType/:token" element={<PublicDocumentPage />} />

      {/* Onboarding: auth-protected but NO layout wrapper */}
      <Route element={<ProtectedRoute noLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fleet" element={<FleetList />} />
        <Route path="/fleet/:id" element={<MachineDetail />} />
        <Route path="/bookings" element={<BookingsList />} />
        <Route path="/bookings/new" element={<NewBooking />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/invoices" element={<InvoicesList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/quotes" element={<QuotesList />} />
        <Route path="/accounting" element={<AccountingPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/search" element={<MachineSearch />} />
        <Route path="/admin/deals" element={<CrossHireDeals />} />
        <Route path="/admin/companies" element={<CompaniesOverview />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
