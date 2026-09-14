import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  Building2, 
  User, 
  HelpCircle, 
  AlertCircle, 
  ShoppingCart, 
  CheckCircle2, 
  Coins,
  Flame,
  FileText
} from 'lucide-react';
import { COMPANIES, DEPARTMENTS, REQUISITION_REASONS } from '../data/mockData';

export default function CartModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onSubmitRequisition,
  currentDepartment,
  departments,
  isSubmitting 
}) {
  const [requesterName, setRequesterName] = useState('');
  const [company, setCompany] = useState('Illu');
  const [selectedDeptId, setSelectedDeptId] = useState(currentDepartment || 'IT');
  const [reason, setReason] = useState('ชำรุด');
  const [priority, setPriority] = useState('ปกติ');
  const [reasonDetail, setReasonDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate estimated total cost
  const totalCost = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const activeDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const remainingBudget = activeDept ? activeDept.totalBudget - activeDept.spentBudget : 0;
  const isOverBudget = totalCost > remainingBudget;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('กรุณาเลือกอุปกรณ์ใส่ตะกร้าอย่างน้อย 1 รายการ');
      return;
    }

    if (!requesterName.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุล ผู้ขอเบิก');
      return;
    }

    // Check stock validation
    for (const item of cartItems) {
      if (item.quantity <= 0) {
        setErrorMsg(`จำนวนของ ${item.name} ต้องมากกว่า 0`);
        return;
      }
      if (item.quantity > item.stock) {
        setErrorMsg(`"${item.name}" มีจำนวนในสต็อกคงเหลือเพียง ${item.stock} ${item.unit} (คุณสั่ง: ${item.quantity})`);
        return;
      }
    }

    const payload = {
      requesterName: requesterName.trim(),
      company,
      departmentId: selectedDeptId,
      department: activeDept.name,
      reason,
      priority,
      reasonDetail: reasonDetail.trim(),
      totalCost,
      items: cartItems.map(i => ({
        itemId: i.id,
        itemName: i.name,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price
      }))
    };

    onSubmitRequisition(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ตะกร้าและแบบฟอร์มส่งคำขอเบิกอุปกรณ์
              </h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบรายการอุปกรณ์ ระบุข้อมูลผู้ขอ และส่งคำขอเพื่อรออนุมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Items Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. รายการอุปกรณ์ในตะกร้า */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                <span>รายการอุปกรณ์ที่เลือก ({cartItems.length} รายการ, รวม {totalItemsCount} ชิ้น)</span>
              </label>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs text-rose-500 hover:text-rose-700 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างตะกร้า</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs sm:text-sm font-medium">ยังไม่มีรายการอุปกรณ์ในตะกร้า</p>
                <p className="text-xs text-slate-400">กรุณาเลือกอุปกรณ์จากหน้าแคตตาล็อกสินค้า</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const isOver = item.quantity > item.stock;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isOver ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>ราคาประเมิน: <strong>฿{item.price}</strong>/{item.unit}</span>
                          <span className="text-slate-300">•</span>
                          <span>คงเหลือในคลัง: <strong className="text-emerald-600">{item.stock}</strong> {item.unit}</span>
                          {isOver && (
                            <span className="text-rose-600 font-bold">* เบิกเกินสต็อก!</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Selector & Remove */}
                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
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
                              onUpdateQuantity(item.id, isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            className="w-12 text-center text-xs font-bold text-slate-800 py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-medium text-slate-600 min-w-[36px]">
                          {item.unit}
                        </span>

                        <span className="text-xs font-bold text-slate-900 min-w-[60px] text-right">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. ข้อมูลบริษัทและแผนก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* บริษัทของ User */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                <span>บริษัทของ User <span className="text-rose-500">*</span></span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COMPANIES.map((c) => {
                  const isSelected = company === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCompany(c.id)}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {c.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* แผนก */}
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>แผนกที่ขอเบิก <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (งบเหลือ ฿{(d.totalBudget - d.spentBudget).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. ผู้ขอเบิก & ระดับความเร่งด่วน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>ชื่อ-นามสกุล ผู้ขอซื้อ/เบิก <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย สุขเกษม (รหัสพนักงาน/โต๊ะทำงาน)"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>ระดับความเร่งด่วน</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['ปกติ', 'เร่งด่วน', 'ด่วนมาก'].map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        isSelected
                          ? p === 'ด่วนมาก'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                            : p === 'เร่งด่วน'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                            : 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. เหตุผลที่ขอซื้อ */}
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>เหตุผลที่ขอซื้อ <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
              {REQUISITION_REASONS.map((r) => {
                const isSelected = reason === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`py-2 px-2 text-center text-xs font-semibold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r.title}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={2}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="ระบุรายละเอียดเหตุผลเพิ่มเติม เช่น เลขครุภัณฑ์เดิม, วัตถุประสงค์การใช้งาน..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Budget Summary Card */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-blue-50/50 border-blue-100'
          }`}>
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <Coins className="w-3.5 h-3.5 text-blue-600" />
                <span>สรุปการใช้งบประมาณ {activeDept.name}:</span>
              </span>
              <div className="text-slate-500">
                งบประมาณคงเหลือปัจจุบัน: <strong className="text-slate-800">฿{remainingBudget.toLocaleString()}</strong>
              </div>
              {isOverBudget && (
                <div className="text-rose-600 font-bold">
                  * ยอดเบิกเกินงบประมาณคงเหลือของแผนก!
                </div>
              )}
            </div>

            <div className="text-right self-end sm:self-center">
              <span className="text-[11px] text-slate-400 block">ยอดประเมินคำขอนี้</span>
              <span className="text-xl font-extrabold text-blue-700">
                ฿{totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันส่งคำขอเบิกสินค้า'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
