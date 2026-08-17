import React, { Component, useState, useEffect, createContext, useContext, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, LayoutDashboard, Pill, LogOut, User as UserIcon, Bell, ChevronLeft, ChevronRight, Menu, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';
import { api } from './services/api';

const Chatbot = lazy(() => import('./components/Chatbot'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Medications = lazy(() => import('./pages/Medications'));
const Settings = lazy(() => import('./pages/Settings'));
const DrugLookup = lazy(() => import('./pages/DrugLookup'));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="text-sm font-medium text-sky-600">Loading...</p>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: unknown }> {
  state: { hasError: boolean; error?: unknown };

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log to console or a monitoring service
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="bg-white border border-red-100 rounded-2xl p-6 max-w-lg text-center">
            <h3 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-600 mb-4">The page failed to load due to a runtime error.</p>
            <pre className="text-xs text-left overflow-auto max-h-48 bg-gray-50 p-3 rounded">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  elderlyMode: boolean;
  setElderlyMode: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider ');
  return context;
};

function Layout({ children }: { children: ReactNode }) {
  const { user, logout, elderlyMode, highContrast, sidebarOpen, setSidebarOpen } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/medications', icon: Pill, label: 'Medications' },
    { path: '/drug-lookup', icon: Search, label: 'Drug Info' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${highContrast ? 'high-contrast' : ''} ${elderlyMode ? 'elderly-mode' : ''}`}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              {user && (
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Menu size={20} />
                </button>
              )}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
                  <Pill size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-900">MedGuide</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-600 transition-colors">Login</Link>
                  <Link to="/register" className="px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-md shadow-sky-100">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow relative overflow-hidden">
        {/* Sidebar / Toggle Bar Section */}
        <AnimatePresence>
          {user && sidebarOpen && (
            <>
              {/* Mobile Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
              />
              
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-[60] flex flex-col p-4 shadow-xl md:shadow-none"
              >
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                          isActive 
                            ? 'bg-sky-50 text-sky-600 shadow-sm shadow-sky-50' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-sky-600'
                        }`}
                      >
                        <item.icon size={20} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className={`flex-grow transition-all duration-300 ${user && sidebarOpen ? 'md:ml-64' : ''}`}>
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={<RouteFallback />}>
                  {children}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2026 MedGuide. Your health, our priority.</p>
        </div>
      </footer>

      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [elderlyMode, setElderlyMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      api.medicines.list().then(meds => {
        meds.forEach((med: any) => {
          if (med.reminder_time === currentTime) {
            const todayDay = now.getDay().toString();
            const scheduledDays = med.days_of_week ? med.days_of_week.split(',') : ['0','1','2','3','4','5','6'];

            if (scheduledDays.includes(todayDay)) {
              // Check if already notified today for this med
              const lastNotified = localStorage.getItem(`notified_${med.id}`);
              const today = now.toISOString().split('T')[0];

              if (lastNotified !== today) {
                if (Notification.permission === 'granted') {
                  new Notification(`Medication Reminder: ${med.name}`, {
                    body: `It's time for your ${med.dosage} dose.`,
                    icon: '/vite.svg'
                  });
                  localStorage.setItem(`notified_${med.id}`, today);
                }
              }
            }
          }
        });
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sky-600 font-medium">Loading MedGuide...</p>
      </div>
    </div>
  );

  return (
    <AppContext.Provider value={{ user, setUser, elderlyMode, setElderlyMode, highContrast, setHighContrast, sidebarOpen, setSidebarOpen, logout }}>
      <Router>
        <Layout>
          <Suspense fallback={<RouteFallback />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
                <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/medications" element={user ? <Medications /> : <Navigate to="/login" />} />
                <Route path="/drug-lookup" element={user ? <DrugLookup /> : <Navigate to="/login" />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
}
