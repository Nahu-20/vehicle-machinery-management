import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  FileText,
  Bell,
  TrendingUp,
  FolderDown,
  Users,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Shield,
  ExternalLink,
  ChevronRight,
  Info,
  Award,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { hasPermission } from '../../auth/permissions';
import { Permission, StaffRole } from '../../types/auth';

interface NavMenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
}

export const AdminLayout: React.FC = () => {
  const { signOut, signOutUser } = useAuth();
  const { staffUser, role, updateLanguagePreference } = useStaffAuthorization();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLanguageChange = (lang: 'om' | 'am' | 'en') => {
    setLanguage(lang);
    updateLanguagePreference(lang);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: NavMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      href: '/admin',
      icon: LayoutDashboard,
      permission: 'dashboard.view',
    },
    {
      id: 'news',
      label: 'News Management',
      href: '/admin/news',
      icon: FileText,
      permission: 'content.view',
    },
    {
      id: 'achievements',
      label: 'Achievements',
      href: '/admin/achievements',
      icon: Award,
      permission: 'achievement.view',
    },
    {
      id: 'alerts',
      label: 'Agricultural Alerts',
      href: '/admin/alerts',
      icon: Bell,
      permission: 'alert.view',
    },
    {
      id: 'market',
      label: 'Market Prices',
      href: '/admin/market',
      icon: TrendingUp,
      permission: 'market.manage',
    },
    {
      id: 'investment',
      label: 'Investment CMS',
      href: '/admin/investment',
      icon: Database,
      permission: 'investment.view',
    },
    {
      id: 'resources',
      label: 'Resources & Manuals',
      href: '/admin/resources',
      icon: FolderDown,
      permission: 'resources.manage',
    },
    {
      id: 'staff',
      label: 'Staff User Management',
      href: '/admin/staff',
      icon: Users,
      permission: 'staff.manage',
    },
    {
      id: 'settings',
      label: 'Bureau System Settings',
      href: '/admin/settings',
      icon: Settings,
      permission: 'settings.manage',
    },
  ];

  // Filter items by permission
  const authorizedItems = menuItems.filter((item) =>
    hasPermission(staffUser, item.permission)
  );

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    } else if (signOutUser) {
      await signOutUser();
    }
    navigate('/admin/login');
  };

  const roleColors: Record<StaffRole, string> = {
    superAdmin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    contentAdmin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    editor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    marketOfficer: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    advisoryOfficer: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Prototype Disclaimer Banner */}
      <div className="bg-emerald-900 text-emerald-100 px-4 py-2 text-xs font-medium border-b border-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Oromia Agricultural Bureau</strong> — Staff Control Panel (Milestone 2.1 Staff Auth & Permissions Prototype)
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white shrink-0">
          
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white leading-tight">Oromia Agri</div>
              <div className="text-[11px] text-slate-400">Admin Control Panel</div>
            </div>
          </div>

          {/* Current User Card */}
          <div className="p-4 mx-3 my-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Identity</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[staffUser?.role || 'editor']}`}>
                {staffUser?.role}
              </span>
            </div>
            <div className="font-bold text-xs text-white truncate">{staffUser?.displayName || 'Staff User'}</div>
            <div className="text-[11px] text-slate-400 truncate">{staffUser?.email}</div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Management Modules
            </div>

            {authorizedItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  end={item.href === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            <Link
              to="/"
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Website</span>
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-colors border border-red-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header & Drawer */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span className="font-extrabold text-sm">Oromia Agri Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white p-4 space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-white">{staffUser?.displayName}</div>
              <div className="text-[11px] text-slate-400">{staffUser?.email}</div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Role: {staffUser?.role}</div>
            </div>

            <nav className="space-y-1">
              {authorizedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    end={item.href === '/admin'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link to="/" className="text-xs text-emerald-400 font-semibold">
                Public Website
              </Link>
              <button onClick={handleSignOut} className="text-xs text-red-400 font-semibold">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Navbar Header */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
            
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">
                Admin Control Panel
              </h1>
            </div>

            {/* Language & Theme Selectors */}
            <div className="flex items-center gap-3">
              
              {/* Language switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                {(['om', 'am', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all uppercase ${
                      language === lang
                        ? 'bg-emerald-700 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'light' ? 'bg-white text-amber-600 shadow' : 'text-slate-400'
                  }`}
                  title="Light Theme"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-slate-700 text-emerald-400 shadow' : 'text-slate-400'
                  }`}
                  title="Dark Theme"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'system' ? 'bg-emerald-700 text-white shadow' : 'text-slate-400'
                  }`}
                  title="System Theme"
                >
                  <Laptop className="w-4 h-4" />
                </button>
              </div>

            </div>
          </header>

          {/* Router Outlet for admin subpages */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
};
