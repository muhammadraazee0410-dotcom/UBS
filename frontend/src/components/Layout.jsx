import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Globe,
  Building2,
  Receipt,
  History,
  MapPin,
  Users,
  Terminal,
  Database,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/international-transfer', label: 'International Transfer', icon: Globe },
  { path: '/domestic-transfer', label: 'Domestic Transfer', icon: Building2 },
  { path: '/bill-payment', label: 'Bill Payment', icon: Receipt },
  { path: '/transactions', label: 'Transaction History', icon: History },
  { path: '/tracking', label: 'Payment Tracking', icon: MapPin },
  { path: '/beneficiaries', label: 'Beneficiaries', icon: Users },
  { path: '/console', label: 'Server Console', icon: Terminal },
  { path: '/database', label: 'Database', icon: Database },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-swiss-bg flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-swiss-bg-paper border-r border-white/10 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-swiss-red rounded-sm flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="font-heading font-black text-sm text-white tracking-tight">UBS AG</h1>
                  <p className="text-[10px] text-swiss-text-muted uppercase tracking-widest">Admin Portal</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-swiss-text-secondary hover:text-white hover:bg-white/5"
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.path.slice(1)}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all group ${
                      isActive
                        ? 'bg-swiss-red text-white'
                        : 'text-swiss-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    {sidebarOpen && (
                      <>
                        <span className="font-body text-sm flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-swiss-bg-subtle flex items-center justify-center">
                    <span className="text-xs font-mono text-swiss-text-secondary">
                      {user?.full_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{user?.full_name}</p>
                    <p className="text-xs text-swiss-text-muted">{user?.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-swiss-text-secondary hover:text-swiss-red hover:bg-white/5"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-full text-swiss-text-secondary hover:text-swiss-red hover:bg-white/5"
                data-testid="logout-btn-collapsed"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
