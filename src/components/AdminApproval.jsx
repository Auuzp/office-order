import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar,
  Package,
  MessageSquare,
  Check,
  X
} from 'lucide-react';

export default function AdminApproval({ 
  orders, 
  items, 
  onApproveOrder, 
  onRejectOrder, 
  loading 
}) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchStatus = activeSubTab === 'ALL' || order.status === activeSubTab;
    const matchCompany = selectedCompany === 'ALL' || order.company === selectedCompany;
    return matchStatus && matchCompany;
  });

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const approvedCount = orders.filter(o => o.status === 'APPROVED').length;
  const rejectedCount = orders.filter(o => o.status === 'REJECTED').length;

  const handleApprove = async (orderId) => {
    setActionLoadingId(orderId);
    await onApproveOrder(orderId);
    setActionLoadingId(null);
  };

  const handleOpenRejectModal = (orderId) => {
    setRejectingOrderId(orderId);
    setRejectReason('ขออภัย อุปกรณ์ในสต็อกไม่เพียงพอชั่วคราว');
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    setActionLoadingId(rejectingOrderId);
    await onRejectOrder(rejectingOrderId, rejectReason);
    setRejectingOrderId(null);
    setRejectReason('');
    setActionLoadingId(null);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    return new Date(isoStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner for Admin Approvals */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>โหมดผู้ดูแลระบบ / ผู้อนุมัติ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            ระบบอนุมัติคำสั่งซื้ออุปกรณ์ (พี่น้ำ)
          </h1>
          <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
            ตรวจสอบความถูกต้องของคำขอเบิกจากพนักงานบริษัท Illu, LL, และ True เมื่อพี่น้ำกด "อนุมัติ" ระบบจะทำการตัดยอดสต็อกคงเหลือในระบบทันที
          </p>
        </div>
      </div>

      {/* Status Tab Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Sub Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('PENDING')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>รออนุมัติ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeSubTab === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('APPROVED')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>อนุมัติแล้ว</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeSubTab === 'APPROVED' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('REJECTED')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSubTab === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>ปฏิเสธ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeSubTab === 'REJECTED' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 ${
              activeSubTab === 'ALL' ? 'bg-slate-200 font-bold text-slate-900' : ''
            }`}
          >
            ทั้งหมด ({orders.length})
          </button>
        </div>

        {/* Company Filter */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <span className="text-xs font-semibold text-slate-500">กรองบริษัท:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['ALL', 'Illu', 'LL', 'True'].map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompany(comp)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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
      </div>

      {/* Orders List for Approval */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            {activeSubTab === 'PENDING' ? 'ไม่มีคำสั่งซื้อที่รออนุมัติในขณะนี้' : 'ไม่พบรายการคำสั่งซื้อ'}
          </h3>
          <p className="text-sm text-slate-500">
            {activeSubTab === 'PENDING' 
              ? 'พี่น้ำได้ตรวจสอบและอนุมัติคำขอสั่งซื้อครบถ้วนทั้งหมดแล้วครับ' 
              : 'ลองเปลี่ยนตัวกรองบริษัทหรือสถานะอื่นๆ ดูนะครับ'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isApproved = order.status === 'APPROVED';
            const isRejected = order.status === 'REJECTED';
            const isLoading = actionLoadingId === order.id;

            // Check if all requested items are currently available in inventory
            let hasInsufficientStock = false;
            const stockChecks = order.items.map(reqItem => {
              const currentInv = items.find(i => i.id === reqItem.itemId);
              const currentStock = currentInv ? currentInv.stock : 0;
              const isShortage = currentStock < reqItem.quantity;
              if (isShortage) hasInsufficientStock = true;
              return {
                ...reqItem,
                currentStock,
                isShortage
              };
            });

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header of Order Card */}
                <div className="p-5 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-xs">
                      {order.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      order.company === 'Illu' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      order.company === 'LL' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      {order.company}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-700">
                      เหตุผล: <strong>{order.reason}</strong>
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>รอการอนุมัติจากพี่น้ำ</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>อนุมัติแล้ว (ตัดสต็อกแล้ว)</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" />
                        <span>ปฏิเสธคำสั่งซื้อ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block mb-0.5">ผู้ขอซื้อ:</span>
                      <span className="font-semibold text-slate-800 text-sm flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{order.requesterName}</span>
                      </span>
                      {order.department && (
                        <span className="text-slate-500 block">แผนก: {order.department}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">วันที่ส่งคำขอ:</span>
                      <span className="font-medium text-slate-700 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDate(order.createdAt)}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">รายละเอียดเหตุผล:</span>
                      <span className="text-slate-700 italic">
                        {order.reasonDetail || '- ไม่มีระบุเพิ่มเติม -'}
                      </span>
                    </div>
                  </div>

                  {/* Requested Items with Live Stock Verification */}
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center space-x-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                      <span>รายการอุปกรณ์ที่ขอซื้อและสต็อกคงเหลือปัจจุบัน:</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {stockChecks.map((item, idx) => (
                        <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                          <div className="flex-1 pr-3">
                            <span className="font-medium text-slate-800 text-sm block">{item.itemName}</span>
                            <span className="text-slate-400 text-[11px]">รหัส: {item.itemId}</span>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-slate-500 text-[11px] block">ขอยอด</span>
                              <span className="font-bold text-slate-900 text-sm">
                                {item.quantity} {item.unit}
                              </span>
                            </div>

                            <div className="text-right min-w-[5rem]">
                              <span className="text-slate-500 text-[11px] block">สต็อกปัจจุบัน</span>
                              {item.isShortage && isPending ? (
                                <span className="text-rose-600 font-bold text-xs flex items-center justify-end space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>เหลือเพียง {item.currentStock}</span>
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-xs">
                                  เหลือ {item.currentStock} {item.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning if shortage */}
                  {isPending && hasInsufficientStock && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>คำเตือน:</strong> มีอุปกรณ์บางรายการที่มีจำนวนในสต็อกคงเหลือน้อยกว่ายอดที่ขอซื้อ กรุณาเติมสต็อกก่อน หรือกดปฏิเสธคำขอ
                      </div>
                    </div>
                  )}

                  {/* Approval / Rejection Result Notes */}
                  {isApproved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>อนุมัติโดย <strong>{order.approvedBy || 'พี่น้ำ'}</strong> เมื่อ {formatDate(order.approvedAt)}</span>
                      </div>
                      <span className="text-emerald-600 font-medium">ตัดสต็อกสำเร็จ</span>
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div>ปฏิเสธโดย <strong>{order.rejectedBy || 'พี่น้ำ'}</strong> เมื่อ {formatDate(order.rejectedAt)}</div>
                        <div className="font-semibold mt-0.5">เหตุผล: {order.rejectReason || 'ไม่อนุมัติ'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons for Approver (Pee Nam) */}
                {isPending && (
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleOpenRejectModal(order.id)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ปฏิเสธคำขอ</span>
                    </button>

                    <button
                      onClick={() => handleApprove(order.id)}
                      disabled={isLoading || hasInsufficientStock}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isLoading ? 'กำลังบันทึก...' : 'อนุมัติคำสั่งซื้อ (ตัดสต็อก)'}</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Rejecting with Reason */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>ระบุเหตุผลในการไม่อนุมัติ</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คำสั่งซื้อรหัส: <strong className="font-mono text-slate-800">{rejectingOrderId}</strong> ข้อความนี้จะแสดงให้พนักงานทราบ
            </p>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-700">เหตุผลที่ไม่อนุมัติ:</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น สต็อกไม่พอ ขอเบิกซ้ำซ้อน ฯลฯ"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                ยืนยันปฏิเสธคำขอ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
