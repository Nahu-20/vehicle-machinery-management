import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { StaffAuthorizationProvider } from './context/StaffAuthorizationContext';

// Public Layout & Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { NewsPage } from './pages/NewsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { ContactPage } from './pages/ContactPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { AchievementDetailPage } from './pages/AchievementDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ChatLauncher } from './components/chat/ChatLauncher';
import { ChatPanel } from './components/chat/ChatPanel';
import { ChatMessage } from './services/chatService';

// Admin Auth & Authorization Guards
import { AdminSignInPage } from './pages/admin/AdminSignInPage';
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
import { AlertsManagementPage } from './pages/admin/AlertsManagementPage';
import { MarketManagementPage } from './pages/admin/MarketManagementPage';
import { ResourcesManagementPage } from './pages/admin/ResourcesManagementPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { SettingsPage } from './pages/admin/SettingsPage';

function PublicLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] dark:bg-[#0B1912] text-[#17211B] dark:text-[#E6F0EA] selection:bg-[#D7A928] selection:text-[#063D2A] transition-colors duration-200">
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
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
                      path="alerts"
                      element={
                        <RequirePermission
                          requiredPermission="alerts.manage"
                          moduleTitle="Agricultural Alerts Management"
                        >
                          <AlertsManagementPage />
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
                    <Route path="/contact" element={<ContactPage />} />
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
