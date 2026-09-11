import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  RefreshCw,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react';

const CATEGORIES = [
  'เครื่องเขียน',
  'อุปกรณ์สำนักงาน',
  'กระดาษและเอกสาร',
  'อุปกรณ์ไอที',
  'อุปกรณ์ไฟฟ้า',
  'ของใช้สำนักงานทั่วไป'
];

const PRESET_IMAGES = [
  { name: 'เครื่องเขียน', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60' },
  { name: 'กระดาษ A4', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60' },
  { name: 'เมาส์/ไอที', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60' },
  { name: 'คีย์บอร์ด', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' },
  { name: 'แฟ้มเอกสาร', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60' },
  { name: 'ถ่าน/ไฟฟ้า', url: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=500&auto=format&fit=crop&q=60' },
];

export default function AdminInventory({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem, 
  loading 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'เครื่องเขียน',
    stock: 20,
    unit: 'ชิ้น',
    minStock: 5,
    description: '',
    imageUrl: PRESET_IMAGES[0].url
  });

  // Filter items
  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const lowStockCount = items.filter(i => i.stock <= (i.minStock || 5)).length;
  const outOfStockCount = items.filter(i => i.stock <= 0).length;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'เครื่องเขียน',
      stock: 20,
      unit: 'ชิ้น',
      minStock: 5,
      description: '',
      imageUrl: PRESET_IMAGES[0].url
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      minStock: item.minStock || 5,
      description: item.description || '',
      imageUrl: item.imageUrl || PRESET_IMAGES[0].url
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      onUpdateItem(editingItem.id, formData);
    } else {
      onAddItem(formData);
    }

    setIsAddModalOpen(false);
  };

  // Quick stock adjustment (+5, +10, -1)
  const handleQuickAdjust = (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    onUpdateItem(item.id, { stock: newStock });
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <span>จัดการรายการอุปกรณ์และสต็อกสินค้า</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            พี่น้ำสามารถแอดรายการอุปกรณ์ใหม่ ปรับยอดคงเหลือ หรือแก้ไขข้อมูลได้ที่นี่
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>แอดรายการอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">จำนวนรายการอุปกรณ์ทั้งหมด</span>
            <div className="text-xl font-bold text-slate-900">{items.length} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">อุปกรณ์ที่สต็อกเหลือน้อย</span>
            <div className="text-xl font-bold text-amber-600">{lowStockCount} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">อุปกรณ์ที่สต็อกหมด (0 ชิ้น)</span>
            <div className="text-xl font-bold text-rose-600">{outOfStockCount} รายการ</div>
          </div>
        </div>
      </div>

      {/* Search & Category filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารายการอุปกรณ์ที่ต้องการจัดการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">หมวดหมู่:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ทั้งหมด">ทั้งหมด ({items.length})</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-4">รูป & ชื่ออุปกรณ์</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4 text-center">คงเหลือในระบบ</th>
                <th className="py-3.5 px-4 text-center">ปรับสต็อกด่วน</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredItems.map((item) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = !isOutOfStock && item.stock <= (item.minStock || 5);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Item Image & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.imageUrl || PRESET_IMAGES[0].url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0 border border-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{item.description || 'รหัส: ' + item.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Remaining Stock with Status */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-base text-slate-900">
                          {item.stock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">หมดสต็อก</span>
                        ) : isLowStock ? (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">สต็อกเหลือน้อย</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">ปกติ</span>
                        )}
                      </div>
                    </td>

                    {/* Quick Restock Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded border border-slate-200 text-xs transition-colors"
                          title="ลด 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, +5)}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded border border-slate-200 text-xs transition-colors"
                          title="เติมสต็อก +5"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, +10)}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded border border-slate-200 text-xs transition-colors"
                          title="เติมสต็อก +10"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    {/* Edit / Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="แก้ไขรายละเอียด"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการลบรายการ "${item.name}" หรือไม่?`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <span>{editingItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'แอดรายการอุปกรณ์ใหม่ (พี่น้ำ)'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ชื่ออุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปากกาลูกลื่นสีแดง, กระดาษการ์ดขาว A4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">หมวดหมู่</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ด้าม, รีม, ตัว, ชิ้น"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Stock & Min Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">จำนวนสต็อกเริ่มต้น</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">เตือนเมื่อสต็อกต่ำกว่า</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">รายละเอียดสินค้า</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ยี่ห้อ คุณสมบัติ หรือคำแนะนำการใช้งาน"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Image URL & Preset Selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">รูปภาพสินค้า</label>
                <input
                  type="url"
                  placeholder="URL รูปภาพ (หรือเลือกจากรูปตัวอย่างด้านล่าง)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 mb-2"
                />

                <span className="text-[11px] text-slate-400 block mb-1.5">หรือคลิกเลือกภาพตัวอย่างด่วน:</span>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-square group ${
                        formData.imageUrl === p.url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-slate-200'
                      }`}
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-900/40 text-white text-[9px] flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มอุปกรณ์เข้าระบบ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
