import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { NewsPage } from './pages/NewsPage';
import { ContactPage } from './pages/ContactPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-[#F8F7F2] text-[#17211B] selection:bg-[#D5A62E] selection:text-[#17211B]">
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
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          {/* Footer Landmark */}
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
