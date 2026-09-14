import React, { useState, useRef } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  CheckCircle2, 
  X, 
  Save,
  Layers,
  FolderOpen
} from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const PRESET_IMAGES = [
  { name: 'เครื่องเขียน', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60' },
  { name: 'กระดาษ A4', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60' },
  { name: 'เมาส์/ไอที', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60' },
  { name: 'คีย์บอร์ด', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' },
  { name: 'ทำความสะอาด', url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60' },
  { name: 'อุปกรณ์ไฟฟ้า', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60' },
];

export default function AdminInventory({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states (ตัดสต็อกเริ่มต้นและเตือนสต็อกต่ำออกตามโจทย์ข้อ 3)
  const [formData, setFormData] = useState({
    name: '',
    category: 'เครื่องเขียน',
    unit: 'ชิ้น',
    price: 50,
    description: '',
    imageUrl: PRESET_IMAGES[0].url
  });

  // Image Upload Type: 'upload' | 'url'
  const [imageUploadType, setImageUploadType] = useState('upload');
  const fileInputRef = useRef(null);

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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'เครื่องเขียน',
      unit: 'ชิ้น',
      price: 50,
      description: '',
      imageUrl: PRESET_IMAGES[0].url
    });
    setImageUploadType('upload');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: item.price || 50,
      description: item.description || '',
      imageUrl: item.imageUrl || PRESET_IMAGES[0].url
    });
    setImageUploadType(item.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    setIsAddModalOpen(true);
  };

  // Handle local image file upload (Base64)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      onUpdateItem(editingItem.id, formData);
    } else {
      onAddItem({
        ...formData,
        stock: 99, // default available stock in system
        isPopular: false
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <span>ระบบจัดการรายการอุปกรณ์สำนักงาน (Admin Management)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ผู้ดูแลระบบสามารถเพิ่มรายการอุปกรณ์ใหม่ อัปโหลดรูปภาพ และแก้ไขรายละเอียดอุปกรณ์ในระบบ
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">จำนวนอุปกรณ์ทั้งหมด</span>
            <div className="text-xl font-bold text-slate-900">{items.length} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">หมวดหมู่อุปกรณ์</span>
            <div className="text-xl font-bold text-blue-600">5 หมวดหมู่</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500">สถานะแคตตาล็อก</span>
            <div className="text-xl font-bold text-emerald-600">พร้อมเปิดให้เบิก</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์ที่ต้องการจัดการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">หมวดหมู่:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ทั้งหมด">ทั้งหมด ({items.length})</option>
              {CATEGORIES.filter(c => c !== 'ทั้งหมด').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table (ตัดคอลัมน์จำนวนคงเหลือและปุ่มปรับสต็อกออกทั้งหมดตามโจทย์ข้อ 4) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3.5 px-4">รูป & ชื่ออุปกรณ์</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4">หน่วยนับ</th>
                <th className="py-3.5 px-4">ราคาประเมิน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Item Image & Title */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.imageUrl || PRESET_IMAGES[0].url}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        onError={(e) => {
                          e.target.src = PRESET_IMAGES[0].url;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.description || 'รหัส: ' + item.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {item.unit}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ฿{(item.price || 0).toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                      เปิดให้เบิก
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="แก้ไขข้อมูลอุปกรณ์"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal (ตัดช่องสต็อกออก + เพิ่มอัปโหลดรูปภาพด้วยตนเองตามโจทย์ข้อ 3) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <span>{editingItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มรายการอุปกรณ์ใหม่ (Admin)'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* Item Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่ออุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปากกาไวท์บอร์ดสีน้ำเงิน, แฟ้มสันกว้าง A4"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมวดหมู่อุปกรณ์</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.filter(c => c !== 'ทั้งหมด').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ด้าม, รีม, ตัว, ชิ้น, ม้วน"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Estimated Price */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">ราคาประเมินต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">รายละเอียดคุณสมบัติ</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ยี่ห้อ ขนาด คุณสมบัติเฉพาะ หรือคำแนะนำการใช้งาน"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Image Upload Feature (รองรับอัปโหลดจากเครื่อง และ/หรือ ใส่ URL) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  รูปภาพสินค้า (อัปโหลดจากเครื่อง หรือใส่ URL)
                </label>

                {/* Upload Mode Selector Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setImageUploadType('upload')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                      imageUploadType === 'upload'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดไฟล์จากเครื่อง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadType('url')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                      imageUploadType === 'url'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>ใส่ URL รูปภาพ</span>
                  </button>
                </div>

                {/* Option 1: Local File Upload */}
                {imageUploadType === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
                      <span className="text-xs font-bold text-slate-800 block">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่องคอมพิวเตอร์</span>
                      <span className="text-[11px] text-slate-400">รองรับไฟล์ PNG, JPG, WEBP (ไม่เกิน 5 MB)</span>
                    </div>
                  </div>
                )}

                {/* Option 2: Image URL */}
                {imageUploadType === 'url' && (
                  <div>
                    <input
                      type="url"
                      placeholder="วาง URL รูปภาพสินค้า เช่น https://..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Image Preview Box */}
                {formData.imageUrl && (
                  <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">ตัวอย่างรูปภาพที่เลือก</span>
                      <span className="text-[11px] text-slate-400 truncate block">พร้อมใช้งานในแคตตาล็อก</span>
                    </div>
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">หรือเลือกจากรูปภาพมาตรฐาน:</span>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_IMAGES.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                        className={`relative rounded-xl overflow-hidden border-2 aspect-square group ${
                          formData.imageUrl === p.url ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-slate-200'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
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
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
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
