import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Minus, 
  ShoppingCart,
  Send,
  Sparkles,
  Info
} from 'lucide-react';

export default function EmployeeCatalog({ 
  items, 
  onQuickOrder, 
  onAddToCart,
  cartItems,
  loading 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category || 'อุปกรณ์ทั่วไป'));
    return ['ทั้งหมด', ...Array.from(set)];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Banner / Instructions */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ระบบเบิกอุปกรณ์สำนักงานออนไลน์</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            ขอเบิกอุปกรณ์สำนักงานสำหรับพนักงาน
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mb-4 leading-relaxed">
            เลือกรายการที่ต้องการ กรอกชื่อพนักงาน สังกัดบริษัท (Illuspace (Thailand) Co., Ltd. / Live Lighting Co., Ltd. / True Innovation Tech Co., Ltd.) และเหตุผล คำขอจะถูกส่งให้ Admin อนุมัติตามขั้นตอน
          </p>

          <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-white/20">
            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <span className="text-xs text-emerald-200 block">1. เลือกอุปกรณ์</span>
              <span className="text-xs font-semibold">เช็คสต็อกคงเหลือ</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <span className="text-xs text-emerald-200 block">2. กรอกฟอร์ม</span>
              <span className="text-xs font-semibold">เลือกบริษัท & เหตุผล</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <span className="text-xs text-emerald-200 block">3. รออนุมัติ</span>
              <span className="text-xs font-semibold">Admin ตรวจรับรอง</span>
            </div>
          </div>
        </div>

        {/* Decorative circle shapes in background */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 -mb-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่ออุปกรณ์, เช่น กระดาษ A4, ปากกา, เมาส์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-sm scrollbar-none">
          <span className="text-xs font-medium text-slate-400 flex items-center pr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> หมวดหมู่:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Summary Info Badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>พบอุปกรณ์ทั้งหมด <strong>{filteredItems.length}</strong> รายการ</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>มีของพร้อมเบิก</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>สต็อกเหลือน้อย</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>สินค้าหมด</span>
          </span>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-4 h-72 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">ไม่พบอุปกรณ์ที่ค้นหา</h3>
          <p className="text-sm text-slate-500 mb-4">ลองปรับคำค้นหาหรือเลือกดูหมวดหมู่อื่นดูนะครับ</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ทั้งหมด'); }}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            แสดงสินค้าทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const isLowStock = !isOutOfStock && item.stock <= (item.minStock || 5);
            const inCart = cartItems.find(c => c.itemId === item.id);

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isOutOfStock
                    ? 'border-slate-200 opacity-75'
                    : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Image Container with Stock Badge */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
                      }}
                    />
                    {/* Category pill */}
                    <span className="absolute top-2.5 left-2.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                      {item.category}
                    </span>

                    {/* Stock Status Badge (Real-time Stock Display) */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-md">
                          <XCircle className="w-3 h-3" />
                          <span>หมดชั่วคราว</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500 text-white shadow-md">
                          <AlertTriangle className="w-3 h-3" />
                          <span>เหลือ {item.stock} {item.unit}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 text-white shadow-md">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>คงเหลือ {item.stock} {item.unit}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1 mb-1" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 pt-0 border-t border-slate-50 mt-2">
                  <div className="flex items-center justify-between gap-2 pt-3">
                    {/* Stock Counter for User */}
                    <div className="text-xs text-slate-600">
                      หน่วย: <span className="font-medium text-slate-900">{item.unit}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                          ไม่สามารถขอได้
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onAddToCart(item)}
                            className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
                              inCart
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            title={inCart ? `อยู่ในรายการเบิกแล้ว (${inCart.quantity})` : 'เพิ่มลงรายการ'}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onQuickOrder(item)}
                            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>ขอเบิก</span>
                          </button>
                        </>
                      )}
                    </div>
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
