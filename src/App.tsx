import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
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
import { NotFoundPage } from './pages/NotFoundPage';
import { ChatLauncher } from './components/chat/ChatLauncher';
import { ChatPanel } from './components/chat/ChatPanel';
import { ChatMessage } from './services/chatService';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col bg-[#FAFAF7] dark:bg-[#0B1912] text-[#17211B] dark:text-[#E6F0EA] selection:bg-[#D7A928] selection:text-[#063D2A] transition-colors duration-200">
              {/* Header Landmark */}
              <Header />

              {/* Main Landmark */}
              <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/programs" element={<ProgramsPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/alerts/:alertSlug" element={<AlertDetailPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:newsSlug" element={<NewsDetailPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              {/* Footer Landmark */}
              <Footer />

              {/* Chatbot Floating Launcher & Responsive Panel */}
              <ChatLauncher
                isOpen={isChatOpen}
                onClick={() => setIsChatOpen(true)}
              />
              <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                setMessages={setChatMessages}
              />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
