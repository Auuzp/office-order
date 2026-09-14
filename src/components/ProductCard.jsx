import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, cartItem }) {
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.minStock || 5);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (quantity > 0 && quantity <= product.stock) {
      onAddToCart(product, quantity);
      setQuantity(1); // reset local selector back to 1
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden relative">
      {/* Top Image & Status Badges */}
      <div>
        <div className="relative h-44 bg-slate-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60';
            }}
          />

          {/* Category Tag */}
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/90 backdrop-blur-md text-slate-700 shadow-xs">
            {product.category}
          </span>

          {/* Popular Tag */}
          {product.isPopular && (
            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500 text-white shadow-xs flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>ยอดฮิต</span>
            </span>
          )}

          {/* Stock Availability Badge */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs flex items-center space-x-1">
                <XCircle className="w-3 h-3" />
                <span>สินค้าหมด</span>
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-white shadow-xs flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>เหลือ {product.stock} {product.unit}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white shadow-xs">
                คงเหลือ {product.stock} {product.unit}
              </span>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-1 group-hover:text-blue-600 transition-colors" title={product.name}>
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400">
              ราคาประมาณ: <strong className="text-slate-700 font-semibold">฿{product.price.toLocaleString()}</strong> / {product.unit}
            </span>
            {inCartQty > 0 && (
              <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md text-[11px] flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>ในตะกร้า {inCartQty} {product.unit}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions: Quantity Selector & Add Button */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2">
        <div className="flex items-center justify-between gap-2 pt-3">
          {/* Stepper */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg shadow-2xs">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              disabled={isOutOfStock}
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) setQuantity(1);
                else setQuantity(Math.min(product.stock, val));
              }}
              className="w-10 text-center text-xs font-semibold text-slate-800 bg-transparent focus:outline-none py-1"
            />
            <button
              type="button"
              disabled={isOutOfStock || quantity >= product.stock}
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold shadow-xs transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/20'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>เพิ่มลงตะกร้า</span>
          </button>
        </div>
      </div>
    </div>
  );
}
