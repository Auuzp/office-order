import React from 'react';
import { 
  Clock, 
  Sparkles, 
  PackageCheck, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  Boxes, 
  Building2, 
  ShoppingCart,
  Calendar,
  User
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Dashboard({ 
  orders, 
  products, 
  departments, 
  currentDepartment, 
  onNewRequisitionClick,
  onNavigateToCatalog,
  onNavigateToTracking,
  onAddToCart,
  cartItems
}) {
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const approvedOrders = orders.filter(o => o.status === 'APPROVED');
  
  // Find popular supplies
  const popularProducts = products.filter(p => p.isPopular).slice(0, 4);

  // Recent 4 orders
  const recentOrders = [...orders].slice(0, 4);

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Hero Corporate Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงานองค์กร</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              สวัสดีครับ ยินดีต้อนรับสู่ระบบเบิกอุปกรณ์
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              ขอเบิกอุปกรณ์สำนักงานสำหรับเครือ Illuspace (Thailand) Co., Ltd., Live Lighting Co., Ltd. และ True Innovation Tech Co., Ltd. ตรวจสอบและติดตามสถานะคำขอได้อย่างสะดวกรวดเร็ว
            </p>
          </div>

          {/* Quick Action Button: สร้างคำขอเบิกสินค้าใหม่ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={onNewRequisitionClick}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างคำขอเบิกสินค้าใหม่</span>
            </button>

            <button
              onClick={onNavigateToCatalog}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Boxes className="w-4 h-4" />
              <span>ดูแคตตาล็อกสินค้า</span>
            </button>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Key Metrics Overview (4 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: คำขอที่รออนุมัติ */}
        <div 
          onClick={onNavigateToTracking}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">คำขอที่รออนุมัติ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {pendingOrders.length} <span className="text-xs font-medium text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>รอผู้ดูแลระบบ (Admin) ตรวจสอบและอนุมัติ</span>
          </div>
        </div>

        {/* Metric 2: อุปกรณ์ยอดฮิต */}
        <div 
          onClick={onNavigateToCatalog}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">อุปกรณ์ยอดฮิต</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 line-clamp-1" title={popularProducts[0]?.name}>
            {popularProducts[0]?.name || 'กระดาษ A4'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ยอดขอเบิกสูงสุดประจำเดือน
          </div>
        </div>

        {/* Metric 3: รายการอุปกรณ์พร้อมเบิก */}
        <div 
          onClick={onNavigateToCatalog}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700 truncate">รายการอุปกรณ์พร้อมเบิก</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {products.length} <span className="text-xs font-medium text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ครอบคลุมทุกหมวดหมู่พร้อมส่งมอบ
          </div>
        </div>

        {/* Metric 4: อนุมัติสำเร็จ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">คำขอที่อนุมัติแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {approvedOrders.length} <span className="text-xs font-medium text-slate-400">รายการ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ตัดสต็อกและพร้อมรับอุปกรณ์
          </div>
        </div>

      </div>

      {/* 3. Section: อุปกรณ์ยอดฮิต (Top Requested Supplies) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>อุปกรณ์ยอดฮิตประจำสำนักงาน</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รายการอุปกรณ์ที่มีการขอเบิกบ่อยที่สุด สามารถกดเพิ่มลงตะกร้าได้ทันที
            </p>
          </div>
          <button
            onClick={onNavigateToCatalog}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularProducts.map((p) => {
            const inCart = cartItems.find(c => c.id === p.id);
            return (
              <div 
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-1" title={p.name}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    คงเหลือ: <strong className="text-emerald-700">{p.stock}</strong> {p.unit}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-900">฿{p.price}</span>
                  <button
                    onClick={() => onAddToCart(p, 1)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>{inCart ? `เพิ่มอีก (${inCart.quantity})` : '+ เบิก'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Section: Recent Requisitions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>คำขอเบิกล่าสุด</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามสถานะคำขอเบิกล่าสุดของพนักงานในองค์กร
            </p>
          </div>
          <button
            onClick={onNavigateToTracking}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>ดูประวัติทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-3 px-3">รหัสคำขอ</th>
                <th className="py-3 px-3">ผู้ขอเบิก</th>
                <th className="py-3 px-3">บริษัท / แผนก</th>
                <th className="py-3 px-3">เหตุผล</th>
                <th className="py-3 px-3">สถานะ</th>
                <th className="py-3 px-3 text-right">ยอดประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {order.id}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {order.requesterName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700">{order.company}</span>
                    <span className="text-slate-400 block text-[11px]">{order.department}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {order.reason}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ฿{(order.totalCost || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
