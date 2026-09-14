import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Clock, 
  Building2, 
  User, 
  Calendar, 
  Package, 
  Coins, 
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { COMPANIES, getFullCompanyName, getCompanyBadgeClass } from '../data/mockData';

export default function OrderTracking({ 
  orders, 
  currentRole, 
  onApproveOrder, 
  onShippingOrder, 
  onRejectOrder,
  onRefresh
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [rejectPromptId, setRejectPromptId] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        order.id.toLowerCase().includes(q) ||
        order.requesterName.toLowerCase().includes(q) ||
        (order.department && order.department.toLowerCase().includes(q)) ||
        order.items.some((i) => i.itemName.toLowerCase().includes(q));

      const matchStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
      const matchCompany = selectedCompany === 'ALL' || 
        order.company === selectedCompany ||
        (selectedCompany.includes('Illuspace') && (order.company === 'Illu' || order.company?.includes('Illuspace'))) ||
        (selectedCompany.includes('Live Lighting') && (order.company === 'LL' || order.company?.includes('Live Lighting'))) ||
        (selectedCompany.includes('True Innovation') && (order.company === 'True' || order.company?.includes('True')));

      return matchSearch && matchStatus && matchCompany;
    });
  }, [orders, searchQuery, selectedStatus, selectedCompany]);


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

  const handleOpenReject = (orderId) => {
    setRejectPromptId(orderId);
    setRejectReasonInput('อุปกรณ์ในสต็อกไม่เพียงพอ หรือขอเบิกซ้ำซ้อน');
  };

  const handleConfirmReject = () => {
    if (rejectPromptId && onRejectOrder) {
      onRejectOrder(rejectPromptId, rejectReasonInput);
      setRejectPromptId(null);
      if (selectedOrderDetails?.id === rejectPromptId) {
        setSelectedOrderDetails(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <span>ระบบติดตามสถานะคำขอเบิกอุปกรณ์</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบความคืบหน้าคำขอเบิก (รออนุมัติ &rarr; อนุมัติแล้ว &rarr; กำลังจัดส่ง &rarr; ปฏิเสธ)
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors self-start sm:self-center"
        >
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสคำขอ เช่น REQ-2026-001, ชื่อผู้ขอ, หรือชื่ออุปกรณ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">บริษัท:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'ทั้งหมด' },
                { id: 'Illuspace (Thailand) Co., Ltd.', label: 'Illuspace' },
                { id: 'Live Lighting Co., Ltd.', label: 'Live Lighting' },
                { id: 'True Innovation Tech Co., Ltd.', label: 'True Innovation' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCompany === c.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'PENDING', label: 'รออนุมัติ' },
            { id: 'APPROVED', label: 'อนุมัติแล้ว' },
            { id: 'SHIPPING', label: 'กำลังจัดส่ง' },
            { id: 'REJECTED', label: 'ปฏิเสธ' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
              {st.id !== 'ALL' && (
                <span className="ml-1.5 opacity-80 text-[10px]">
                  ({orders.filter((o) => o.status === st.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3.5 px-4">รหัสคำขอ</th>
                <th className="py-3.5 px-4">ผู้ขอเบิก</th>
                <th className="py-3.5 px-4">บริษัท / แผนก</th>
                <th className="py-3.5 px-4">รายการที่ขอ</th>
                <th className="py-3.5 px-4">เหตุผล</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">ยอดรวม</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">ไม่พบประวัติคำขอเบิก</p>
                    <p className="text-xs text-slate-400">ลองเปลี่ยนตัวกรองค้นหาดูนะครับ</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{order.id}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(order.createdAt)}</div>
                      </td>

                      {/* Requester */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.requesterName}</div>
                        {order.priority && order.priority !== 'ปกติ' && (
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            order.priority === 'ด่วนมาก' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.priority}
                          </span>
                        )}
                      </td>

                      {/* Company & Department */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getCompanyBadgeClass(order.company)}`}>
                          {getFullCompanyName(order.company)}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={order.department}>
                          {order.department}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {order.items[0]?.itemName}
                          {order.items.length > 1 && (
                            <span className="text-slate-400 text-[11px] ml-1">
                              และอีก {order.items.length - 1} รายการ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          รวมทั้งหมด {itemsCount} ชิ้น
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {order.reason}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={order.status} size="sm" />
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ฿{(order.totalCost || 0).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approver quick buttons if in admin mode */}
                          {currentRole === 'ADMIN' && order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onApproveOrder(order.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs"
                                title="อนุมัติและตัดสต็อก"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleOpenReject(order.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px]"
                                title="ปฏิเสธคำขอ"
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          )}

                          {currentRole === 'ADMIN' && order.status === 'APPROVED' && onShippingOrder && (
                            <button
                              onClick={() => onShippingOrder(order.id)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] shadow-2xs"
                              title="อัปเดตเป็นกำลังจัดส่ง"
                            >
                              จัดส่ง
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-sm text-slate-900">{selectedOrderDetails.id}</span>
                <span className="text-xs text-slate-400 block">{formatDate(selectedOrderDetails.createdAt)}</span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status and Info Banner */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-2">
                <StatusBadge status={selectedOrderDetails.status} size="md" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                ยอดประเมิน: ฿{(selectedOrderDetails.totalCost || 0).toLocaleString()}
              </span>
            </div>

            {/* Requester Profile Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl">
              <div>
                <span className="text-slate-400 block">ผู้ขอเบิก:</span>
                <strong className="text-slate-800">{selectedOrderDetails.requesterName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">บริษัท / แผนก:</span>
                <strong className="text-slate-800">{getFullCompanyName(selectedOrderDetails.company)} - {selectedOrderDetails.department}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">เหตุผล:</span>
                <strong className="text-slate-800">{selectedOrderDetails.reason}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">ความเร่งด่วน:</span>
                <strong className="text-slate-800">{selectedOrderDetails.priority || 'ปกติ'}</strong>
              </div>
            </div>

            {selectedOrderDetails.reasonDetail && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">รายละเอียดเพิ่มเติม:</span>
                <span>{selectedOrderDetails.reasonDetail}</span>
              </div>
            )}

            {/* Items Table */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">รายการอุปกรณ์:</span>
              <div className="space-y-1.5">
                {selectedOrderDetails.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <span className="font-medium text-slate-800">{it.itemName}</span>
                    <span className="font-bold text-blue-700">{it.quantity} {it.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approver Remarks if any */}
            {selectedOrderDetails.approvedBy && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div>ผู้อนุมัติ: <strong>{selectedOrderDetails.approvedBy}</strong> ({formatDate(selectedOrderDetails.approvedAt)})</div>
              </div>
            )}

            {selectedOrderDetails.rejectReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <div>เหตุผลที่ปฏิเสธ: <strong>{selectedOrderDetails.rejectReason}</strong></div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ปิด
              </button>

              {currentRole === 'ADMIN' && selectedOrderDetails.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      onApproveOrder(selectedOrderDetails.id);
                      setSelectedOrderDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                  >
                    อนุมัติคำสั่งซื้อ
                  </button>
                  <button
                    onClick={() => handleOpenReject(selectedOrderDetails.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
                  >
                    ปฏิเสธคำขอ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Prompt */}
      {rejectPromptId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 text-rose-600">
              <XCircle className="w-4 h-4" />
              <span>ระบุเหตุผลในการปฏิเสธคำขอ</span>
            </h3>
            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setRejectPromptId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
