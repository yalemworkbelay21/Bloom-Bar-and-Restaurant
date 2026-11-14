import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import AiChat from '../AiChat';
import { useLanguage } from '../../context/LanguageContext';

const titles = {
  '/': 'Dashboard',
  '/materials': 'Raw Materials',
  '/products': 'Sales Products & Recipes',
  '/analytics': 'Analytics & Performance',
  '/transactions': 'Stock Movements',
  '/transactions/cash-grv': 'Cash GRV Entries',
  '/transactions/credit-grv': 'Credit GRV Entries',
  '/transactions/fresh-bazaar': 'Fresh Bazaar Entries',
  '/transactions/pos-adjustment': '+ve Adjustment Entries',
  '/transactions/disposal': 'Goods Disposal Entries',
  '/transactions/neg-adjustment': '−ve Adjustment Entries',
  '/sales-import': 'Sales & POS Import',
  '/purchases': 'Purchases',
  '/suppliers': 'Suppliers Directory',
  '/reports': 'Reports & Analytics',
  '/reports/summary': 'Overview Summary Report',
  '/reports/stock-balance': 'Stock Balance Sheet',
  '/reports/inventory-count': 'Inventory Count',
  '/reports/daily': 'Daily Movement Report',
  '/reports/cash-grv': 'Cash GRV Report',
  '/reports/credit-grv': 'Credit GRV Report',
  '/reports/fresh-bazaar': 'Fresh Bazaar Report',
  '/reports/pos-adjustment': '+ve Adjustment Report',
  '/reports/disposal': 'Goods Disposal Report',
  '/reports/neg-adjustment': '−ve Adjustment Report',
  '/reports/stock-levels': 'Stock Levels Report',
  '/reports/purchases': 'Purchases Report',
  '/users': 'Staff Accounts',
  '/employees': 'Employee Management',
  '/consumption': 'Consumption Management',
  '/settings': 'System Settings',
  '/profile': 'User Profile',
  '/recycle-bin': 'Recycle Bin',
  '/stock-requests': 'Stock Issue & Request',
  '/pos': 'Point of Sale (POS)',
  '/captain-order': 'Captain Order',
  '/cash-sales': 'Cash Sales',
};

const routeTitleKeys = {
  '/': 'nav.dashboard',
  '/materials': 'nav.rawMaterials',
  '/products': 'nav.productsRecipes',
  '/analytics': 'nav.analyticsPl',
  '/transactions': 'nav.stockMovements',
  '/transactions/cash-grv': 'nav.cashGrv',
  '/transactions/credit-grv': 'nav.creditGrv',
  '/transactions/fresh-bazaar': 'nav.freshBazaar',
  '/transactions/pos-adjustment': 'nav.posAdjustment',
  '/transactions/disposal': 'nav.disposal',
  '/transactions/neg-adjustment': 'nav.negAdjustment',
  '/sales-import': 'nav.importSales',
  '/purchases': 'nav.purchaseHistory',
  '/suppliers': 'nav.suppliers',
  '/reports': 'nav.reports',
  '/reports/summary': 'nav.overviewSummary',
  '/reports/stock-balance': 'nav.stockBalanceSheet',
  '/reports/inventory-count': 'nav.inventoryCount',
  '/reports/daily': 'nav.dailyReport',
  '/reports/cash-grv': 'nav.cashGrvReport',
  '/reports/credit-grv': 'nav.creditGrvReport',
  '/reports/fresh-bazaar': 'nav.freshBazaarReport',
  '/reports/pos-adjustment': 'nav.posAdjReport',
  '/reports/disposal': 'nav.disposalReport',
  '/reports/neg-adjustment': 'nav.negAdjReport',
  '/reports/stock-levels': 'nav.stockLevels',
  '/reports/purchases': 'nav.purchaseHistory',
  '/users': 'nav.staffAccounts',
  '/employees': 'nav.employeesDirectory',
  '/consumption': 'nav.consumption',
  '/settings': 'nav.settings',
  '/profile': 'topbar.profile',
  '/recycle-bin': 'nav.recycleBin',
  '/stock-requests': 'nav.stockIssueRequest',
  '/pos': 'nav.posOrdering',
  '/captain-order': 'nav.captainOrder',
  '/cash-sales': 'nav.cashSales',
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);  // desktop collapse
  const location = useLocation();
  const { t } = useLanguage();
  const isPos = location.pathname === '/pos';
  const isDashboard = location.pathname === '/';
  const key = routeTitleKeys[location.pathname];
  const title = key ? t(key, titles[location.pathname]) : (titles[location.pathname] || 'Bloom Bar & Restaurant');

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        onExpand={() => setSidebarCollapsed(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar: hidden on mobile when viewing the mobile-optimized Dashboard or POS */}
        <div className={(isDashboard || isPos) ? 'hidden lg:block' : 'block'}>
          <Topbar
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCollapse={() => setSidebarCollapsed(c => !c)}
            title={title}
          />
        </div>
        {isPos ? (
          <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#f8fafc] pb-16 lg:pb-0">
            <Outlet />
          </main>
        ) : (
          <main
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 flex flex-col justify-between pb-24 lg:pb-6"
            style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f8faff 50%, #ffffff 100%)' }}
          >
            <div>
              <Outlet />
            </div>
            <footer className="mt-12 pt-6 border-t border-ink-100 hidden lg:flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400 pb-2">
              <p>© 2026 Bloom Bar and Restaurant   CaféHotel Management System · All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span>Developed By <strong className="text-ink-700 font-semibold">Mega Tech Teams</strong></span>
              </div>
            </footer>
          </main>
        )}
      </div>

      {/* Fixed Mobile Bottom Navigation (Home, Orders, Inventory, Finance, More) */}
      <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />

      {/* AI Chat — floats over every page */}
      <AiChat />
    </div>
  );
};

export default DashboardLayout;
