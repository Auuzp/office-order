import React from 'react';
import { 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  ShieldCheck, 
  UserCheck, 
  BarChart3, 
  Boxes, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  setCurrentRole, 
  activeTab, 
  setActiveTab, 
  cartCount, 
  openCartModal,
  pendingApprovalCount,
  onAdminLoginClick
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(currentRole === 'ADMIN' ? 'admin-approvals' : 'catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-800 tracking-tight">Office Supply</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  ระบบสั่งซื้ออุปกรณ์
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                เครือ Illu • LL • True
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentRole === 'EMPLOYEE' ? (
              <>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>รายการอุปกรณ์</span>
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'tracking'
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>ติดตามคำขอของฉัน</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('admin-approvals')}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-approvals'
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>รออนุมัติ (พี่น้ำ)</span>
                  {pendingApprovalCount > 0 && (
                    <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-soft-pulse">
                      {pendingApprovalCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('admin-inventory')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-inventory'
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>จัดการสินค้า & สต็อก</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-dashboard')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>สรุปภาพรวม & รายงาน</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Cart & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Cart Button (Always accessible or when items in cart) */}
            <button
              onClick={openCartModal}
              className="relative flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 shadow-sm"
              title="ดูรายการที่เลือกเพื่อขอเบิก"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium hidden sm:inline">คำขอเบิก</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-emerald-600 text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            {currentRole === 'EMPLOYEE' ? (
              <button
                onClick={onAdminLoginClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">เข้าสู่โหมด</span>
                <span className="font-semibold text-indigo-700">พี่น้ำ (ผู้อนุมัติ)</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 bg-indigo-50 border border-indigo-200 py-1 px-2.5 rounded-full">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span className="text-xs font-semibold text-indigo-900">พี่น้ำ (Admin)</span>
                <button
                  onClick={() => {
                    setCurrentRole('EMPLOYEE');
                    setActiveTab('catalog');
                  }}
                  className="ml-1 p-1 hover:bg-indigo-200 rounded-full text-indigo-600 transition-colors"
                  title="กลับสู่โหมดพนักงาน"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto text-xs">
          {currentRole === 'EMPLOYEE' ? (
            <>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`py-1 px-2.5 rounded-md font-medium ${
                  activeTab === 'catalog' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
                }`}
              >
                รายการอุปกรณ์
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`py-1 px-2.5 rounded-md font-medium ${
                  activeTab === 'tracking' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
                }`}
              >
                ติดตามคำขอ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('admin-approvals')}
                className={`py-1 px-2.5 rounded-md font-medium ${
                  activeTab === 'admin-approvals' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'
                }`}
              >
                รออนุมัติ ({pendingApprovalCount})
              </button>
              <button
                onClick={() => setActiveTab('admin-inventory')}
                className={`py-1 px-2.5 rounded-md font-medium ${
                  activeTab === 'admin-inventory' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'
                }`}
              >
                จัดการสต็อก
              </button>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`py-1 px-2.5 rounded-md font-medium ${
                  activeTab === 'admin-dashboard' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600'
                }`}
              >
                สรุปภาพรวม
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
