import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, AuthProvider } from "@/lib/app-context";
import { CookieConsent } from "@/components/brand/CookieConsent";

import HomePage from "@/pages/home";
import LibraryPage from "@/pages/library";
import PrayerDetailPage from "@/pages/prayer-detail";
import CustomPrayerPage, { CustomPrayerSuccessPage } from "@/pages/custom-prayer";
import AccountPage from "@/pages/account";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/pages/auth";
import {
  AboutPage,
  ContactPage,
  LegalPage,
  PrivacyPage,
  TermsPage,
  CookiesPage,
  CaliforniaPrivacyPage,
  GdprPage,
  DisclaimerPage,
  RefundsPage,
  PrivacyChoicesPage,
} from "@/pages/static-pages";
import {
  AdminDashboard,
  AdminCustomRequests,
  AdminSettings,
  AdminUploads,
} from "@/pages/admin";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      {/* User pages */}
      <Route path="/" component={HomePage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/library/:category" component={LibraryPage} />
      <Route path="/prayer/:id" component={PrayerDetailPage} />
      <Route path="/custom-prayer" component={CustomPrayerPage} />
      <Route path="/custom-prayer/success" component={CustomPrayerSuccessPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/dashboard" component={AccountPage} />

      {/* Auth pages */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Static pages */}
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/legal" component={LegalPage} />
      <Route path="/legal/:section" component={LegalPage} />

      {/* Legal shortcut routes */}
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/privacy-policy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/terms-of-service" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/cookie-policy" component={CookiesPage} />
      <Route path="/california-privacy" component={CaliforniaPrivacyPage} />
      <Route path="/do-not-sell" component={CaliforniaPrivacyPage} />
      <Route path="/gdpr" component={GdprPage} />
      <Route path="/disclaimer" component={DisclaimerPage} />
      <Route path="/refunds" component={RefundsPage} />
      <Route path="/privacy-choices" component={PrivacyChoicesPage} />
      <Route path="/your-privacy-choices" component={PrivacyChoicesPage} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/uploads" component={AdminUploads} />
      <Route path="/admin/custom-requests" component={AdminCustomRequests} />
      <Route path="/admin/settings" component={AdminSettings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
              <CookieConsent />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
