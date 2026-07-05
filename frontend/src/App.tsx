import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/marketing/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { AccountConnectPage } from "@/pages/app/AccountConnectPage";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { ResourceExplorerPage } from "@/pages/app/ResourceExplorerPage";
import { DependencyGraphPage } from "@/pages/app/DependencyGraphPage";
import { RecommendationsPage } from "@/pages/app/RecommendationsPage";
import { CleanupPlannerPage } from "@/pages/app/CleanupPlannerPage";
import { ScheduledCleanupPage } from "@/pages/app/ScheduledCleanupPage";
import { TemplatesPage } from "@/pages/app/TemplatesPage";
import { CostAnalyticsPage } from "@/pages/app/CostAnalyticsPage";
import { CleanupHistoryPage } from "@/pages/app/CleanupHistoryPage";
import { ReportsPage } from "@/pages/app/ReportsPage";
import { NotificationsPage } from "@/pages/app/NotificationsPage";
import { AdminPage } from "@/pages/app/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="accounts" element={<AccountConnectPage />} />
        <Route path="explorer" element={<ResourceExplorerPage />} />
        <Route path="dependencies" element={<DependencyGraphPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="planner" element={<CleanupPlannerPage />} />
        <Route path="scheduled" element={<ScheduledCleanupPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="cost" element={<CostAnalyticsPage />} />
        <Route path="history" element={<CleanupHistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
