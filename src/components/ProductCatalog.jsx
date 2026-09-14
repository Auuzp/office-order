import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Boxes, 
  ShoppingCart, 
  CheckCircle2, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import ProductCard from './ProductCard';
import { CATEGORIES } from '../data/mockData';

export default function ProductCatalog({ 
  products, 
  onAddToCart, 
  cartItems, 
  onOpenCart 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular'); // popular | price-asc | price-desc | stock

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q);

        const matchesCategory = selectedCategory === 'ทั้งหมด' || product.category === selectedCategory;
        const matchesStock = inStockOnly ? product.stock > 0 : true;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>แคตตาล็อกอุปกรณ์สำนักงาน</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เลือกอุปกรณ์ที่ต้องการใช้ในงานสำนักงาน เครื่องเขียน อุปกรณ์ไอที และผลิตภัณฑ์ทำความสะอาด
          </p>
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={onOpenCart}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-center"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>เปิดตะกร้าเบิก ({totalCartCount} ชิ้น)</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาอุปกรณ์ เช่น กระดาษ, เมาส์, สเปรย์ทำความสะอาด, ปากกา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="popular">เรียงตาม: ยอดฮิต</option>
              <option value="price-asc">ราคา: ต่ำ &rarr; สูง</option>
              <option value="price-desc">ราคา: สูง &rarr; ต่ำ</option>
              <option value="stock">จำนวนคงเหลือในสต็อก</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 flex-wrap">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* In stock toggle */}
          <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>เฉพาะที่มีของพร้อมเบิก</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          แสดง <strong>{filteredProducts.length}</strong> รายการ
          {selectedCategory !== 'ทั้งหมด' && ` ในหมวดหมู่ "${selectedCategory}"`}
        </span>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่พบอุปกรณ์ที่ค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อุปกรณ์อื่นดูนะครับ
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ทั้งหมด'); setInStockOnly(false); }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            แสดงสินค้าทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const cartItem = cartItems.find((c) => c.id === product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                cartItem={cartItem}
                onAddToCart={onAddToCart}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
