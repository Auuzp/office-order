import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  Menu, 
  Search, 
  ShieldCheck, 
  LogOut, 
  Building,
  Bell
} from 'lucide-react';

export default function Navbar({ 
  onToggleSidebar, 
  cartCount, 
  onOpenCart, 
  currentRole, 
  onSwitchRole, 
  currentDepartment, 
  onSelectDepartment, 
  departments,
  onQuickSearch
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
              title="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-tight">Office Supply</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                    Requisition
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงาน</p>
              </div>
            </div>
          </div>

          {/* Middle: Department Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>แผนก:</span>
            </div>
            <select
              value={currentDepartment}
              onChange={(e) => onSelectDepartment(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right Actions: Cart & Role Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* Cart Button with Counter Badge */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-2xs group"
              title="ดูตะกร้าเบิกสินค้า"
            >
              <ShoppingCart className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden sm:inline">ตะกร้าเบิก</span>
              {cartCount > 0 ? (
                <span className="flex items-center justify-center px-1.5 min-w-[20px] h-5 text-[11px] font-bold rounded-full bg-blue-600 text-white animate-soft-pulse">
                  {cartCount}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">(0)</span>
              )}
            </button>

            {/* Role Switcher Pill (Employee vs Admin) */}
            {currentRole === 'EMPLOYEE' ? (
              <button
                onClick={onSwitchRole}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">สลับไป</span>
                <span className="font-semibold text-indigo-700">โหมด Admin</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 py-1 px-3 rounded-full">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span className="text-xs font-bold text-indigo-900">โหมดผู้ดูแลระบบ (Admin)</span>
                <button
                  onClick={onSwitchRole}
                  className="p-1 hover:bg-indigo-200 rounded-full text-indigo-600 transition-colors ml-1"
                  title="กลับสู่โหมดพนักงาน"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
