import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  MapPin,
  FileText,
  Boxes,
  Receipt,
  BarChart3,
  Home,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inbounds', label: 'Inbounds', icon: Truck },
  { to: '/entities', label: 'Entities', icon: Users },
  { to: '/materials', label: 'Materials', icon: Package },
  { to: '/yard-locations', label: 'Yard Locations', icon: MapPin },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/purchase-orders', label: 'Purchase Invoices', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/inbounds': 'Inbounds',
  '/inbounds/weigh-in': 'New Inbound',
  '/entities': 'Entities',
  '/entities/new': 'New Entity',
  '/materials': 'Materials',
  '/materials/new': 'New Material',
  '/yard-locations': 'Yard Locations',
  '/yard-locations/new': 'New Location',
  '/contracts': 'Contracts',
  '/contracts/new': 'New Contract',
  '/inventory': 'Inventory',
  '/purchase-orders': 'Purchase Invoices',
  '/purchase-orders/generate': 'Generate Purchase Invoice',
  '/reports': 'Reports',
};

function getSection(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  const base = '/' + segments[0];
  return PAGE_TITLES[base] || segments[0];
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = location.pathname;
  const section = getSection(pathname);
  const pageTitle = PAGE_TITLES[pathname] || section || 'Page';
  const isSubPage = pathname !== '/' && pathname.split('/').filter(Boolean).length > 1;

  return (
    <div className="min-h-screen flex bg-grey-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] bg-[rgb(11,43,81)] text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center gap-2.5 px-3 border-b border-white/10 overflow-hidden">
          <img src="/360-Symbol.png" alt="Evreka 360" className="w-12 h-12 object-contain shrink-0" />
          <div className="leading-none min-w-0">
            <div className="text-2xl font-bold tracking-tight lowercase truncate">evreka</div>
            <div className="text-xl font-semibold -mt-0.5 tracking-tight">360</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-green-500 bg-green-500/[0.12] border-l-[3px] border-green-500 font-semibold'
                    : 'text-grey-400 hover:text-white hover:bg-white/[0.08] border-l-[3px] border-transparent'
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-grey-400 text-[11px] mb-2">v1.60.4</div>
          <div className="text-white text-sm font-semibold truncate">{user?.name}</div>
          <div className="text-grey-400 text-xs truncate">{user?.role}</div>
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-1.5 text-[13px] text-grey-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-grey-200 flex items-center justify-between px-6 shrink-0">
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-grey-500 hover:text-grey-700"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <nav className="flex items-center gap-1 text-sm">
              <Home size={16} className="text-grey-500" />
              {section && section !== 'Dashboard' && (
                <>
                  <ChevronRight size={14} className="text-grey-400" />
                  <span className={isSubPage ? 'text-grey-500' : 'text-grey-700 font-medium'}>{section}</span>
                </>
              )}
              {isSubPage && (
                <>
                  <ChevronRight size={14} className="text-grey-400" />
                  <span className="text-grey-700 font-medium">{pageTitle}</span>
                </>
              )}
              {!isSubPage && pathname === '/' && (
                <>
                  <ChevronRight size={14} className="text-grey-400" />
                  <span className="text-grey-700 font-medium">Dashboard</span>
                </>
              )}
            </nav>
          </div>

          {/* Right: facility selector */}
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex h-9 px-3 rounded-lg border border-grey-300 bg-white items-center gap-2 text-sm font-medium text-grey-700 hover:bg-grey-50">
              <span>Amsterdam Scrap Terminal (+01:00)</span>
              <ChevronDown size={16} className="text-grey-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
