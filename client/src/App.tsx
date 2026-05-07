import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, AuthProvider, PlayerProvider } from "@/lib/app-context";
import { MiniAudioPlayer } from "@/components/brand/AudioPlayer";

import HomePage from "@/pages/home";
import LibraryPage from "@/pages/library";
import PrayerDetailPage from "@/pages/prayer-detail";
import CustomPrayerPage, { CustomPrayerSuccessPage } from "@/pages/custom-prayer";
import FreePrayerPage from "@/pages/free-prayer";
import DashboardPage from "@/pages/dashboard";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/pages/auth";
import { AboutPage, ContactPage, LegalPage } from "@/pages/static-pages";
import {
  AdminDashboard,
  AdminPrayers,
  AdminCategories,
  AdminCustomRequests,
  AdminOrders,
  AdminUsers,
  AdminAnalytics,
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
      <Route path="/prayer/:slug" component={PrayerDetailPage} />
      <Route path="/custom-prayer" component={CustomPrayerPage} />
      <Route path="/custom-prayer/success" component={CustomPrayerSuccessPage} />
      <Route path="/free-prayer" component={FreePrayerPage} />
      <Route path="/dashboard" component={DashboardPage} />

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

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/prayers" component={AdminPrayers} />
      <Route path="/admin/uploads" component={AdminUploads} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/custom-requests" component={AdminCustomRequests} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
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
          <PlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Router hook={useHashLocation}>
                <AppRouter />
                <MiniAudioPlayer />
              </Router>
            </TooltipProvider>
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
