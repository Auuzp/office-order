import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Trash2, 
  AlertCircle, 
  Building2, 
  User, 
  HelpCircle, 
  Package, 
  Plus, 
  Minus,
  CheckCircle2
} from 'lucide-react';

const COMPANIES = [
  { id: 'Illu', name: 'Illu', color: 'border-blue-500 bg-blue-50 text-blue-700 ring-blue-500' },
  { id: 'LL', name: 'LL', color: 'border-purple-500 bg-purple-50 text-purple-700 ring-purple-500' },
  { id: 'True', name: 'True', color: 'border-rose-500 bg-rose-50 text-rose-700 ring-rose-500' },
];

const REASONS = [
  { id: 'ชำรุด', title: 'ชำรุด', desc: 'อุปกรณ์เดิมเสียหาย ไม่สามารถใช้งานได้' },
  { id: 'สูญหาย', title: 'สูญหาย', desc: 'อุปกรณ์หายหรือไม่พบ' },
  { id: 'ไม่เคยได้รับ', title: 'ไม่เคยได้รับ', desc: 'ยังไม่เคยได้รับอุปกรณ์ชิ้นนี้มาก่อน' },
  { id: 'พนักงานใหม่', title: 'พนักงานใหม่', desc: 'สำหรับพนักงานเข้าใหม่หรือเริ่มงาน' },
];

export default function OrderModal({ 
  isOpen, 
  onClose, 
  itemsToOrder, 
  onUpdateQuantity, 
  onRemoveItem, 
  onSubmitOrder,
  isSubmitting 
}) {
  const [company, setCompany] = useState('Illu');
  const [requesterName, setRequesterName] = useState('');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('ชำรุด');
  const [reasonDetail, setReasonDetail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (itemsToOrder.length === 0) {
      setErrorMessage('กรุณาเลือกอุปกรณ์ที่ต้องการสั่งซื้ออย่างน้อย 1 รายการ');
      return;
    }

    if (!requesterName.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ขอซื้อ');
      return;
    }

    // Check quantity validity
    for (const item of itemsToOrder) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMessage(`จำนวนของ ${item.itemName || item.name} ต้องมากกว่า 0`);
        return;
      }
      if (item.quantity > item.stock) {
        setErrorMessage(`อุปกรณ์ "${item.itemName || item.name}" ขอเกินจำนวนคงเหลือ (${item.quantity} > ${item.stock})`);
        return;
      }
    }

    const payload = {
      requesterName: requesterName.trim(),
      company,
      department: department.trim(),
      reason,
      reasonDetail: reasonDetail.trim(),
      items: itemsToOrder.map(i => ({
        itemId: i.itemId || i.id,
        itemName: i.itemName || i.name,
        quantity: parseInt(i.quantity, 10),
        unit: i.unit
      }))
    };

    onSubmitOrder(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">แบบฟอร์มขอสั่งซื้ออุปกรณ์สำนักงาน</h2>
              <p className="text-xs text-slate-500">กรอกรายละเอียดคำขอเพื่อส่งให้พี่น้ำอนุมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: รายการอุปกรณ์และจำนวนที่ซื้อ (Items & Quantity) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>1. รายการอุปกรณ์และจำนวนที่ซื้อ ({itemsToOrder.length} รายการ)</span>
              </label>
              <span className="text-xs text-slate-400">ตรวจสอบจำนวนไม่ให้เกินสต็อก</span>
            </div>

            {itemsToOrder.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                ยังไม่มีรายการอุปกรณ์ที่เลือก กรุณาเลือกจากหน้ารายการอุปกรณ์
              </div>
            ) : (
              <div className="space-y-2.5">
                {itemsToOrder.map((item) => {
                  const itemId = item.itemId || item.id;
                  const itemName = item.itemName || item.name;
                  const isOverStock = item.quantity > item.stock;

                  return (
                    <div
                      key={itemId}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isOverStock ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm truncate" title={itemName}>
                          {itemName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>คงเหลือในสต็อก: <strong className="text-emerald-700">{item.stock}</strong> {item.unit}</span>
                          {isOverStock && (
                            <span className="text-rose-600 font-semibold">* สั่งเกินจำนวนคงเหลือ!</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, Math.max(1, item.quantity - 1))}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateQuantity(itemId, isNaN(val) ? 1 : val);
                            }}
                            className="w-14 text-center text-sm font-semibold text-slate-800 focus:outline-none py-1"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, Math.min(item.stock, item.quantity + 1))}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-500 font-medium min-w-[2rem]">{item.unit}</span>

                        {onRemoveItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveItem(itemId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors ml-1"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: บริษัทของ User (Illu / LL / True) */}
          <div>
            <label className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>2. บริษัทของ User (สังกัดบริษัท) <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {COMPANIES.map((comp) => {
                const isSelected = company === comp.id;
                return (
                  <button
                    type="button"
                    key={comp.id}
                    onClick={() => setCompany(comp.id)}
                    className={`py-3 px-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? `${comp.color} shadow-sm ring-2 font-bold`
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="text-base tracking-wide">{comp.name}</span>
                    <span className="text-[11px] opacity-75">
                      {comp.id === 'Illu' && 'บริษัท อิลลู'}
                      {comp.id === 'LL' && 'บริษัท แอลแอล'}
                      {comp.id === 'True' && 'บริษัท ทรู'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: ผู้ขอซื้อ (Requester) */}
          <div>
            <label className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>3. ผู้ขอซื้อ (ชื่อ-นามสกุล / แผนก) <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="ระบุชื่อ-นามสกุล พนักงาน (เช่น สมคิด มีสุข)"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="แผนก / ตำแหน่ง (เช่น บัญชี, IT, การตลาด)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: เหตุผลที่ขอซื้อ (Reason) */}
          <div>
            <label className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>4. เหตุผลที่ขอซื้อ <span className="text-rose-500">*</span></span>
            </label>

            {/* Predefined reason pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {REASONS.map((r) => {
                const isSelected = reason === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`py-2 px-3 rounded-lg border text-center transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r.title}
                  </button>
                );
              })}
            </div>

            {/* Reason description / additional note */}
            <div>
              <textarea
                rows={2}
                placeholder="ระบุรายละเอียดเหตุผลเพิ่มเติม (เช่น อุปกรณ์เดิมใช้งานไม่ได้, วันที่เริ่มงาน, เลขรหัสทรัพย์สินเดิม ฯลฯ)"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Notice before submit */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-800 text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-ping"></span>
            <span>เมื่อกดส่งคำขอ คำสั่งซื้อจะส่งไปยัง **พี่น้ำ** เพื่อตรวจสอบและอนุมัติตัดสต็อกต่อไป</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || itemsToOrder.length === 0}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <span>กำลังส่งคำขอ...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ยืนยันส่งคำสั่งซื้อ</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
