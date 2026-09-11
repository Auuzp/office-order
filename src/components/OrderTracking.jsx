import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  User, 
  Calendar,
  AlertCircle,
  Package
} from 'lucide-react';

export default function OrderTracking({ orders, loading, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        order.requesterName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        (order.department && order.department.toLowerCase().includes(q)) ||
        order.items.some(i => i.itemName.toLowerCase().includes(q));

      const matchCompany = selectedCompany === 'ALL' || order.company === selectedCompany;
      const matchStatus = selectedStatus === 'ALL' || order.status === selectedStatus;

      return matchSearch && matchCompany && matchStatus;
    });
  }, [orders, searchQuery, selectedCompany, selectedStatus]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompanyBadge = (comp) => {
    switch (comp) {
      case 'Illu':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Illu</span>;
      case 'LL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">LL</span>;
      case 'True':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">True</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{comp}</span>;
    }
  };

  const getReasonBadge = (reason) => {
    let color = 'bg-slate-100 text-slate-700';
    if (reason === 'พนักงานใหม่') color = 'bg-teal-100 text-teal-800 border border-teal-200';
    if (reason === 'ชำรุด') color = 'bg-amber-100 text-amber-800 border border-amber-200';
    if (reason === 'สูญหาย') color = 'bg-orange-100 text-orange-800 border border-orange-200';
    if (reason === 'ไม่เคยได้รับ') color = 'bg-indigo-100 text-indigo-800 border border-indigo-200';

    return <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${color}`}>{reason}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <span>ติดตามคำขอสั่งซื้ออุปกรณ์</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบสถานะการอนุมัติคำสั่งซื้อของพนักงาน (รอพี่น้ำอนุมัติ / อนุมัติแล้ว / ปฏิเสธ)
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อผู้ขอ, รหัสคำขอ, หรือชื่ออุปกรณ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Company filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">บริษัท:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['ALL', 'Illu', 'LL', 'True'].map((comp) => (
                <button
                  key={comp}
                  onClick={() => setSelectedCompany(comp)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedCompany === comp
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {comp === 'ALL' ? 'ทั้งหมด' : comp}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">สถานะ:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'ALL', label: 'ทั้งหมด' },
                { id: 'PENDING', label: 'รออนุมัติ' },
                { id: 'APPROVED', label: 'อนุมัติแล้ว' },
                { id: 'REJECTED', label: 'ปฏิเสธ' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedStatus === st.id
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">ไม่พบประวัติคำสั่งซื้อ</h3>
          <p className="text-sm text-slate-500">
            ยังไม่มีคำสั่งซื้อที่ตรงกับเงื่อนไขที่เลือก สามารถกดขอเบิกอุปกรณ์ได้จากหน้ารายการอุปกรณ์
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isApproved = order.status === 'APPROVED';
            const isRejected = order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Top Row: ID, Company, Reason, and Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-slate-900 px-2 py-1 rounded bg-slate-100">
                      {order.id}
                    </span>
                    {getCompanyBadge(order.company)}
                    {getReasonBadge(order.reason)}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-soft-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>รอพี่น้ำอนุมัติ</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อนุมัติแล้ว (ตัดสต็อกแล้ว)</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>ไม่อนุมัติ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Requester Info & Reason Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{order.requesterName}</span>
                      {order.department && (
                        <span className="text-slate-500 text-xs">({order.department})</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>วันที่ขอ: {formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600">
                    <div className="font-medium text-slate-700 mb-0.5">เหตุผลการขอเบิก:</div>
                    <div>
                      {order.reasonDetail ? order.reasonDetail : `ขอเบิกเนื่องจาก: ${order.reason}`}
                    </div>
                    {isRejected && order.rejectReason && (
                      <div className="mt-1 text-rose-600 font-medium">
                        * เหตุผลที่ไม่อนุมัติ: {order.rejectReason}
                      </div>
                    )}
                    {isApproved && (
                      <div className="mt-1 text-emerald-700 font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>อนุมัติโดย: {order.approvedBy || 'พี่น้ำ'} ({formatDate(order.approvedAt)})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Ordered Items Table */}
                <div className="mt-2 pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>รายการอุปกรณ์ที่ขอ ({order.items.length} รายการ):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800 truncate pr-2" title={item.itemName}>
                          {item.itemName}
                        </span>
                        <span className="font-bold text-emerald-700 whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
