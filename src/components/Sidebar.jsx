import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  ClipboardList, 
  ShieldCheck, 
  PlusCircle, 
  X 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  cartCount, 
  pendingCount,
  currentRole,
  currentDepartment,
  departments,
  onNewRequisitionClick
}) {
  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ดสรุป', icon: LayoutDashboard },
    { id: 'catalog', label: 'แคตตาล็อกอุปกรณ์', icon: Boxes },
    { id: 'cart', label: 'ตะกร้าเบิกสินค้า', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { id: 'tracking', label: 'ติดตามสถานะคำขอ', icon: ClipboardList, badge: pendingCount > 0 ? `${pendingCount} รออนุมัติ` : null, badgeColor: 'bg-amber-100 text-amber-800' },
  ];

  if (currentRole === 'ADMIN') {
    navItems.push(
      {
        id: 'admin-approvals',
        label: 'ระบบอนุมัติคำสั่งซื้อ (Admin)',
        icon: ShieldCheck,
        badge: pendingCount > 0 ? pendingCount : null,
        badgeColor: 'bg-rose-500 text-white animate-soft-pulse'
      },
      {
        id: 'admin-inventory',
        label: 'จัดการรายการอุปกรณ์ (Admin)',
        icon: Boxes
      }
    );
  }

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-lg lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                OS
              </div>
              <span className="font-bold text-slate-800 text-sm tracking-tight">เมนูระบบเบิกอุปกรณ์</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button: New Requisition */}
          <div className="p-4">
            <button
              onClick={onNewRequisitionClick}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างคำขอเบิกสินค้าใหม่</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-blue-100 text-blue-800'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: System Status */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs text-center space-y-1">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ระบบพร้อมใช้งาน</span>
            </div>
            <p className="text-[11px] text-slate-400">Office Requisition System</p>
          </div>
        </div>
      </aside>
    </>
  );
}
