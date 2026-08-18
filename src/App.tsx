import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// Lazy-loaded GIS Lab Page
const InvestmentMapLabPage = lazy(() => import('./pages/InvestmentMapLabPage'));
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { StaffAuthorizationProvider } from './context/StaffAuthorizationContext';

// Public Layout & Components
import { ScrollProgress } from './components/common/scroll';
import { BackToTopButton } from './components/common/BackToTopButton';
import { ScrollToTop } from './components/common/ScrollToTop';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { ContactPage } from './pages/ContactPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { AchievementDetailPage } from './pages/AchievementDetailPage';
import { InvestmentPage } from './pages/InvestmentPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BlockchainTraceabilityPage } from './pages/BlockchainTraceabilityPage';
import { ChatLauncher } from './components/chat/ChatLauncher';
import { ChatPanel } from './components/chat/ChatPanel';
import { ChatMessage } from './services/chatService';

// Admin Auth & Authorization Guards
import { AdminSignInPage } from './pages/admin/AdminSignInPage';
import { AttestationAdminPage } from './pages/admin/attestation/AttestationAdminPage';
import { ForgotPasswordPage } from './pages/admin/ForgotPasswordPage';
import { RequireAuthentication } from './components/auth/RequireAuthentication';
import { RequireStaffAuthorization } from './components/auth/RequireStaffAuthorization';
import { RequirePermission } from './components/auth/RequirePermission';
import { UnauthorizedPage } from './pages/admin/UnauthorizedPage';

// Admin Layout & Subpages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ContentManagementPage } from './pages/admin/ContentManagementPage';
import { AdminNewsListPage } from './pages/admin/news/AdminNewsListPage';
import { AdminNewsCreatePage } from './pages/admin/news/AdminNewsCreatePage';
import { AdminNewsEditPage } from './pages/admin/news/AdminNewsEditPage';
import { AdminNewsPreviewPage } from './pages/admin/news/AdminNewsPreviewPage';
import { AdminNewsHistoryPage } from './pages/admin/news/AdminNewsHistoryPage';
import { AdminNewsActivityPage } from './pages/admin/news/AdminNewsActivityPage';
import { AdminAchievementListPage } from './pages/admin/achievements/AdminAchievementListPage';
import { AdminAchievementTrashPage } from './pages/admin/achievements/AdminAchievementTrashPage';
import { AdminAchievementCreatePage } from './pages/admin/achievements/AdminAchievementCreatePage';
import { AdminAchievementEditPage } from './pages/admin/achievements/AdminAchievementEditPage';
import { AdminAchievementPreviewPage } from './pages/admin/achievements/AdminAchievementPreviewPage';
import { AdminAchievementHistoryPage } from './pages/admin/achievements/AdminAchievementHistoryPage';
import { AdminAlertListPage } from './pages/admin/alerts/AdminAlertListPage';
import { AdminAlertTrashPage } from './pages/admin/alerts/AdminAlertTrashPage';
import { AdminAlertCreatePage } from './pages/admin/alerts/AdminAlertCreatePage';
import { AdminAlertEditPage } from './pages/admin/alerts/AdminAlertEditPage';
import { AdminAlertPreviewPage } from './pages/admin/alerts/AdminAlertPreviewPage';
import { AdminAlertHistoryPage } from './pages/admin/alerts/AdminAlertHistoryPage';
import { MarketManagementPage } from './pages/admin/MarketManagementPage';
import { ResourcesManagementPage } from './pages/admin/ResourcesManagementPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { InvestmentAdminLayout } from './pages/admin/investment/InvestmentAdminLayout';
import { AdminInvestmentOverviewPage } from './pages/admin/investment/AdminInvestmentOverviewPage';
import { AdminDatasetsPage } from './pages/admin/investment/AdminDatasetsPage';
import { AdminDatasetCreatePage } from './pages/admin/investment/AdminDatasetCreatePage';
import { AdminDatasetDetailPage } from './pages/admin/investment/AdminDatasetDetailPage';
import { AdminDatasetPreviewPage } from './pages/admin/investment/AdminDatasetPreviewPage';
import { AdminSourcesPage } from './pages/admin/investment/AdminSourcesPage';
import { AdminZoneProfilesPage } from './pages/admin/investment/AdminZoneProfilesPage';
import { AdminOpportunitiesPage } from './pages/admin/investment/AdminOpportunitiesPage';
import { AdminInfrastructurePage } from './pages/admin/investment/AdminInfrastructurePage';
import { AdminMapConfigPage } from './pages/admin/investment/AdminMapConfigPage';
import { AdminInvestmentActivityPage } from './pages/admin/investment/AdminInvestmentActivityPage';
import { AdminInvestmentTestsPage } from './pages/admin/investment/AdminInvestmentTestsPage';

function PublicLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] dark:bg-[#0B1912] text-[#17211B] dark:text-[#E6F0EA] selection:bg-[#D7A928] selection:text-[#063D2A] transition-colors duration-200">
      <ScrollProgress />
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BackToTopButton />
      <ChatLauncher isOpen={isChatOpen} onClick={() => setIsChatOpen(true)} />
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        setMessages={setChatMessages}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <StaffAuthorizationProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  {/* Admin Authentication & Authorization Routes */}
                  <Route path="/admin/login" element={<AdminSignInPage />} />
                  <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected Admin Shell & Module Routes */}
                  <Route
                    path="/admin"
                    element={
                      <RequireStaffAuthorization>
                        <AdminLayout />
                      </RequireStaffAuthorization>
                    }
                  >
                    <Route
                      index
                      element={
                        <RequirePermission
                          requiredPermission="dashboard.view"
                          moduleTitle="Dashboard Overview"
                        >
                          <AdminDashboardPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="content"
                      element={
                        <RequirePermission
                          requiredPermission="content.view"
                          moduleTitle="Content Management"
                        >
                          <ContentManagementPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news"
                      element={
                        <RequirePermission
                          requiredPermission="content.view"
                          moduleTitle="News Management"
                        >
                          <AdminNewsListPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news/new"
                      element={
                        <RequirePermission
                          requiredPermission="content.create"
                          moduleTitle="Create News Draft"
                        >
                          <AdminNewsCreatePage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news/:newsSlug/edit"
                      element={
                        <RequirePermission
                          requiredPermission="content.edit"
                          moduleTitle="Edit News Article"
                        >
                          <AdminNewsEditPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news/:newsSlug/preview"
                      element={
                        <RequirePermission
                          requiredPermission="content.view"
                          moduleTitle="Preview News Article"
                        >
                          <AdminNewsPreviewPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news/:newsSlug/history"
                      element={
                        <RequirePermission
                          requiredPermission="content.view"
                          moduleTitle="Article Audit History"
                        >
                          <AdminNewsHistoryPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="news/activity"
                      element={
                        <RequirePermission
                          requiredPermission="content.view"
                          moduleTitle="News Activity Log"
                        >
                          <AdminNewsActivityPage />
                        </RequirePermission>
                      }
                    />

                    {/* Achievement Management Routes */}
                    <Route
                      path="achievements"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.view"
                          moduleTitle="Achievement Management"
                        >
                          <AdminAchievementListPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="achievements/trash"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.view"
                          moduleTitle="Achievements Trash"
                        >
                          <AdminAchievementTrashPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="achievements/new"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.create"
                          moduleTitle="Create Achievement"
                        >
                          <AdminAchievementCreatePage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="achievements/:achievementSlug/edit"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.edit"
                          moduleTitle="Edit Achievement"
                        >
                          <AdminAchievementEditPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="achievements/:achievementSlug/preview"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.view"
                          moduleTitle="Preview Achievement"
                        >
                          <AdminAchievementPreviewPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="achievements/:achievementSlug/history"
                      element={
                        <RequirePermission
                          requiredPermission="achievement.view"
                          moduleTitle="Achievement Audit History"
                        >
                          <AdminAchievementHistoryPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts"
                      element={
                        <RequirePermission
                          requiredPermission="alert.view"
                          moduleTitle="Agricultural Alerts & Advisories Directory"
                        >
                          <AdminAlertListPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts/trash"
                      element={
                        <RequirePermission
                          requiredPermission="alert.view"
                          moduleTitle="Agricultural Alerts Trash"
                        >
                          <AdminAlertTrashPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts/new"
                      element={
                        <RequirePermission
                          requiredPermission="alert.create"
                          moduleTitle="Create Agricultural Alert"
                        >
                          <AdminAlertCreatePage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts/:slug/edit"
                      element={
                        <RequirePermission
                          requiredPermission="alert.edit"
                          moduleTitle="Edit Agricultural Alert"
                        >
                          <AdminAlertEditPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts/:slug/preview"
                      element={
                        <RequirePermission
                          requiredPermission="alert.view"
                          moduleTitle="Preview Agricultural Alert"
                        >
                          <AdminAlertPreviewPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="alerts/:slug/history"
                      element={
                        <RequirePermission
                          requiredPermission="alert.view"
                          moduleTitle="Agricultural Alert Audit History"
                        >
                          <AdminAlertHistoryPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="market"
                      element={
                        <RequirePermission
                          requiredPermission="market.manage"
                          moduleTitle="Market Commodity Management"
                        >
                          <MarketManagementPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="attestation"
                      element={
                        <RequirePermission
                          requiredPermission="attestation.manage"
                          moduleTitle="Attestation Management"
                        >
                          <AttestationAdminPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="resources"
                      element={
                        <RequirePermission
                          requiredPermission="resources.manage"
                          moduleTitle="Resources & Manuals Management"
                        >
                          <ResourcesManagementPage />
                        </RequirePermission>
                      }
                    />
                    <Route
                      path="staff"
                      element={
                        <RequirePermission
                          requiredPermission="staff.manage"
                          moduleTitle="Staff User Management"
                        >
                          <StaffManagementPage />
                        </RequirePermission>
                      }
                    />
                    {/* Investment CMS Workspace Routes */}
                    <Route
                      path="investment"
                      element={
                        <RequirePermission
                          requiredPermission="investment.view"
                          moduleTitle="Investment CMS"
                        >
                          <InvestmentAdminLayout />
                        </RequirePermission>
                      }
                    >
                      <Route index element={<AdminInvestmentOverviewPage />} />
                      <Route path="zones" element={<AdminZoneProfilesPage />} />
                      <Route path="datasets" element={<AdminDatasetsPage />} />
                      <Route path="datasets/new" element={<AdminDatasetCreatePage />} />
                      <Route path="datasets/:datasetId" element={<AdminDatasetDetailPage />} />
                      <Route path="datasets/:datasetId/preview" element={<AdminDatasetPreviewPage />} />
                      <Route path="sources" element={<AdminSourcesPage />} />
                      <Route path="opportunities" element={<AdminOpportunitiesPage />} />
                      <Route path="infrastructure" element={<AdminInfrastructurePage />} />
                      <Route path="config" element={<AdminMapConfigPage />} />
                      <Route path="activity" element={<AdminInvestmentActivityPage />} />
                      <Route path="tests" element={<AdminInvestmentTestsPage />} />
                    </Route>
                    <Route
                      path="settings"
                      element={
                        <RequirePermission
                          requiredPermission="settings.manage"
                          moduleTitle="Bureau System Settings"
                        >
                          <SettingsPage />
                        </RequirePermission>
                      }
                    />
                  </Route>

                  {/* Public Website Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:productSlug" element={<ProductDetailPage />} />
                    <Route path="/programs" element={<ProgramsPage />} />
                    <Route path="/achievements" element={<AchievementsPage />} />
                    <Route
                      path="/achievements/:achievementSlug"
                      element={<AchievementDetailPage />}
                    />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/alerts/:alertSlug" element={<AlertDetailPage />} />
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:newsSlug" element={<NewsDetailPage />} />
                    <Route
                      path="/investment/map-lab"
                      element={
                        <Suspense fallback={
                          <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              <span>Loading GIS Lab...</span>
                            </div>
                          </div>
                        }>
                          <InvestmentMapLabPage />
                        </Suspense>
                      }
                    />
                    <Route path="/investment/*" element={<InvestmentPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/traceability/scan" element={<BlockchainTraceabilityPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </StaffAuthorizationProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
