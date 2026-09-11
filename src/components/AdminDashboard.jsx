import React from 'react';
import { 
  BarChart3, 
  Download, 
  Building2, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Boxes,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard({ orders, items, stats }) {
  // Compute breakdown by company
  const companyStats = {
    Illu: { count: 0, totalItems: 0 },
    LL: { count: 0, totalItems: 0 },
    True: { count: 0, totalItems: 0 }
  };

  orders.forEach(o => {
    if (companyStats[o.company]) {
      companyStats[o.company].count++;
      const itemsQty = o.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
      companyStats[o.company].totalItems += itemsQty;
    }
  });

  // Compute breakdown by reason
  const reasonStats = {
    'ชำรุด': 0,
    'สูญหาย': 0,
    'ไม่เคยได้รับ': 0,
    'พนักงานใหม่': 0
  };

  orders.forEach(o => {
    if (reasonStats[o.reason] !== undefined) {
      reasonStats[o.reason]++;
    }
  });

  const lowStockItems = items.filter(i => i.stock <= (i.minStock || 5));

  // Export orders to CSV with UTF-8 BOM so Excel opens Thai correctly
  const exportToCSV = () => {
    const headers = [
      'รหัสคำขอ',
      'วันเวลาที่ขอ',
      'ชื่อผู้ขอซื้อ',
      'บริษัท',
      'แผนก',
      'เหตุผล',
      'รายละเอียดเหตุผล',
      'สถานะ',
      'ผู้อนุมัติ',
      'วันเวลาที่อนุมัติ',
      'รายการอุปกรณ์ที่ขอ'
    ];

    const rows = orders.map(o => {
      const itemsSummary = o.items.map(i => `${i.itemName} (${i.quantity} ${i.unit})`).join('; ');
      return [
        o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleString('th-TH') : '',
        o.requesterName,
        o.company,
        o.department || '',
        o.reason,
        (o.reasonDetail || '').replace(/"/g, '""'),
        o.status === 'APPROVED' ? 'อนุมัติแล้ว' : o.status === 'REJECTED' ? 'ปฏิเสธ' : 'รออนุมัติ',
        o.approvedBy || o.rejectedBy || '',
        o.approvedAt ? new Date(o.approvedAt).toLocaleString('th-TH') : '',
        itemsSummary.replace(/"/g, '""')
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Office_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>แดชบอร์ดสรุปภาพรวมคำสั่งซื้อและอุปกรณ์</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            สถิติการสั่งซื้อของบริษัท Illu, LL, True และวิเคราะห์รายการเบิก
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ดาวน์โหลดรายงาน Excel (CSV)</span>
        </button>
      </div>

      {/* KPI 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">คำสั่งซื้อทั้งหมด</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
          <div className="text-xs text-slate-400 mt-1">รายการคำขอทั้งหมดในระบบ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold">รอพี่น้ำอนุมัติ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {orders.filter(o => o.status === 'PENDING').length}
          </div>
          <div className="text-xs text-amber-600/80 mt-1">คำขอที่ต้องดำเนินการตรวจสอบ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold">อนุมัติเรียบร้อย</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {orders.filter(o => o.status === 'APPROVED').length}
          </div>
          <div className="text-xs text-emerald-600/80 mt-1">ตัดสต็อกอุปกรณ์แล้ว</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold">สต็อกใกล้หมด</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{lowStockItems.length}</div>
          <div className="text-xs text-rose-600/80 mt-1">รายการอุปกรณ์ที่ควรสั่งซื้อเพิ่ม</div>
        </div>
      </div>

      {/* Breakdown: By Company & By Reason */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Company Requisition Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>สรุปยอดคำสั่งซื้อตามบริษัท (Illu / LL / True)</span>
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { id: 'Illu', name: 'บริษัท Illu (อิลลู)', color: 'bg-blue-500', barBg: 'bg-blue-100', stats: companyStats.Illu },
              { id: 'LL', name: 'บริษัท LL (แอลแอล)', color: 'bg-purple-500', barBg: 'bg-purple-100', stats: companyStats.LL },
              { id: 'True', name: 'บริษัท True (ทรู)', color: 'bg-rose-500', barBg: 'bg-rose-100', stats: companyStats.True }
            ].map(comp => {
              const pct = orders.length > 0 ? Math.round((comp.stats.count / orders.length) * 100) : 0;

              return (
                <div key={comp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">{comp.name}</span>
                    <span className="font-semibold text-slate-600">
                      {comp.stats.count} คำขอ ({comp.stats.totalItems} ชิ้น) • {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${comp.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>สัดส่วนเหตุผลการขอเบิกอุปกรณ์</span>
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'ชำรุด', desc: 'อุปกรณ์เดิมเสียหาย', count: reasonStats['ชำรุด'], color: 'bg-amber-500' },
              { label: 'สูญหาย', desc: 'อุปกรณ์หายหรือไม่พบ', count: reasonStats['สูญหาย'], color: 'bg-orange-500' },
              { label: 'ไม่เคยได้รับ', desc: 'ยังไม่เคยได้รับอุปกรณ์', count: reasonStats['ไม่เคยได้รับ'], color: 'bg-indigo-500' },
              { label: 'พนักงานใหม่', desc: 'สำหรับพนักงานเข้าใหม่', count: reasonStats['พนักงานใหม่'], color: 'bg-teal-500' }
            ].map(r => {
              const pct = orders.length > 0 ? Math.round((r.count / orders.length) * 100) : 0;

              return (
                <div key={r.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">{r.label} <span className="font-normal text-slate-400">({r.desc})</span></span>
                    <span className="font-semibold text-slate-600">{r.count} คำขอ • {pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${r.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Low Stock Watchlist */}
      {lowStockItems.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>รายการอุปกรณ์ที่สต็อกเหลือน้อย (ต้องสั่งซื้อเติมเข้าสำนักงาน)</span>
            </h3>
            <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-bold border border-rose-200">
              {lowStockItems.length} รายการ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-xs truncate max-w-[180px]">{item.name}</div>
                  <div className="text-[11px] text-slate-500">หมวดหมู่: {item.category}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-700 block">
                    เหลือ {item.stock} {item.unit}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    เตือนเมื่อ &le; {item.minStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
