import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductCatalog from './components/ProductCatalog';
import CartModal from './components/CartModal';
import OrderTracking from './components/OrderTracking';
import AdminApproval from './components/AdminApproval';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  DEPARTMENTS 
} from './data/mockData';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  ShieldCheck 
} from 'lucide-react';

export default function App() {
  // Products, Orders, and Departments
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('office_products_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('office_orders_v2');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('office_departments_v2');
    return saved ? JSON.parse(saved) : DEPARTMENTS;
  });

  // Active Department
  const [currentDepartment, setCurrentDepartment] = useState('IT');

  // Navigation & Role
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | catalog | cart | tracking | admin-approvals
  const [currentRole, setCurrentRole] = useState('EMPLOYEE'); // EMPLOYEE | ADMIN
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cart & Modal
  const [cartItems, setCartItems] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PIN Login Modal for Approver Mode (พี่น้ำ)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Toast System
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('office_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('office_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('office_departments_v2', JSON.stringify(departments));
  }, [departments]);

  // Cart Operations
  const handleAddToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        showToast(`เพิ่ม "${product.name}" เป็น ${newQty} ${product.unit} ในตะกร้าแล้ว`);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        showToast(`เพิ่ม "${product.name}" (${quantity} ${product.unit}) ลงในตะกร้าแล้ว`);
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('ล้างรายการในตะกร้าเรียบร้อยแล้ว', 'info');
  };

  // Submit Requisition
  const handleSubmitRequisition = (payload) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newId = `REQ-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
      const newOrder = {
        id: newId,
        createdAt: new Date().toISOString(),
        requesterName: payload.requesterName,
        company: payload.company,
        department: payload.department,
        departmentId: payload.departmentId,
        reason: payload.reason,
        priority: payload.priority,
        reasonDetail: payload.reasonDetail,
        totalCost: payload.totalCost,
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        items: payload.items
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCartItems([]);
      setIsCartModalOpen(false);
      setIsSubmitting(false);
      setActiveTab('tracking');
      showToast(`ส่งคำขอเบิก ${newId} สำเร็จแล้ว! อยู่ระหว่างรอพี่น้ำอนุมัติ`, 'success');
    }, 500);
  };

  // Approve Requisition
  const handleApproveOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Check stock
    let shortageItem = null;
    order.items.forEach((reqItem) => {
      const prod = products.find((p) => p.id === reqItem.itemId);
      if (prod && prod.stock < reqItem.quantity) {
        shortageItem = prod;
      }
    });

    if (shortageItem) {
      showToast(`ไม่สามารถอนุมัติได้: "${shortageItem.name}" เหลือในสต็อกเพียง ${shortageItem.stock}`, 'error');
      return;
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const matched = order.items.find((i) => i.itemId === p.id);
        if (matched) {
          return { ...p, stock: Math.max(0, p.stock - matched.quantity) };
        }
        return p;
      })
    );

    // Deduct Department Budget
    if (order.totalCost && order.departmentId) {
      setDepartments((prev) =>
        prev.map((d) => {
          if (d.id === order.departmentId) {
            return { ...d, spentBudget: d.spentBudget + order.totalCost };
          }
          return d;
        })
      );
    }

    // Update order status
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'APPROVED',
              approvedBy: 'พี่น้ำ (ฝ่ายพัสดุ)',
              approvedAt: new Date().toISOString()
            }
          : o
      )
    );

    showToast(`อนุมัติคำขอ ${orderId} สำเร็จ (ตัดสต็อกและบันทึกงบเรียบร้อย)`, 'success');
  };

  // Mark as Shipping
  const handleShippingOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'SHIPPING' }
          : o
      )
    );
    showToast(`อัปเดตคำขอ ${orderId} เป็น "กำลังจัดส่ง" แล้ว`, 'info');
  };

  // Reject Requisition
  const handleRejectOrder = (orderId, reason) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'REJECTED',
              approvedBy: 'พี่น้ำ (ฝ่ายพัสดุ)',
              rejectReason: reason || 'ไม่อนุมัติ',
              approvedAt: new Date().toISOString()
            }
          : o
      )
    );
    showToast(`ปฏิเสธคำขอ ${orderId} เรียบร้อยแล้ว`, 'info');
  };

  // Switch Role
  const handleRoleToggleClick = () => {
    if (currentRole === 'EMPLOYEE') {
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    } else {
      setCurrentRole('EMPLOYEE');
      setActiveTab('dashboard');
      showToast('กลับสู่โหมดพนักงานทั่วไป');
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '') {
      setCurrentRole('ADMIN');
      setIsPinModalOpen(false);
      setActiveTab('tracking');
      showToast('เข้าสู่โหมดพี่น้ำ (ผู้อนุมัติ) เรียบร้อยแล้ว', 'success');
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง (รหัสเริ่มต้น: 1234)');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Corporate Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartModalOpen(true)}
        currentRole={currentRole}
        onSwitchRole={handleRoleToggleClick}
        currentDepartment={currentDepartment}
        onSelectDepartment={setCurrentDepartment}
        departments={departments}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex items-start">
        
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'cart') setIsCartModalOpen(true);
            else setActiveTab(tab);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          cartCount={totalCartCount}
          pendingCount={pendingCount}
          currentRole={currentRole}
          currentDepartment={currentDepartment}
          departments={departments}
          onNewRequisitionClick={() => setActiveTab('catalog')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">
          
          {/* View 1: Dashboard / Home */}
          {activeTab === 'dashboard' && (
            <Dashboard
              orders={orders}
              products={products}
              departments={departments}
              currentDepartment={currentDepartment}
              onNewRequisitionClick={() => setActiveTab('catalog')}
              onNavigateToCatalog={() => setActiveTab('catalog')}
              onNavigateToTracking={() => setActiveTab('tracking')}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
            />
          )}

          {/* View 2: Product Catalog */}
          {activeTab === 'catalog' && (
            <ProductCatalog
              products={products}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              onOpenCart={() => setIsCartModalOpen(true)}
            />
          )}

          {/* View 3: Tracking */}
          {activeTab === 'tracking' && (
            <OrderTracking
              orders={orders}
              currentRole={currentRole}
              onApproveOrder={handleApproveOrder}
              onShippingOrder={handleShippingOrder}
              onRejectOrder={handleRejectOrder}
              onRefresh={() => showToast('รีเฟรชข้อมูลล่าสุดเรียบร้อยแล้ว')}
            />
          )}

          {/* View 4: Admin Approval */}
          {activeTab === 'admin-approvals' && (
            <AdminApproval
              orders={orders}
              items={products}
              onApproveOrder={handleApproveOrder}
              onRejectOrder={handleRejectOrder}
              loading={false}
            />
          )}

        </main>
      </div>

      {/* Cart & Checkout Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSubmitRequisition={handleSubmitRequisition}
        currentDepartment={currentDepartment}
        departments={departments}
        isSubmitting={isSubmitting}
      />

      {/* Admin PIN Login Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                เข้าสู่โหมดพี่น้ำ (ผู้อนุมัติ)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กรุณาใส่รหัส PIN เพื่อตรวจสอบและอนุมัติคำขอเบิกอุปกรณ์
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                maxLength={6}
                placeholder="ใส่รหัส PIN (เริ่มต้น: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-xl tracking-widest py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {pinError && (
                <span className="text-xs text-rose-600 font-medium block">{pinError}</span>
              )}
              <div className="text-[11px] text-slate-400">
                รหัสผ่านเริ่มต้นคือ: <strong>1234</strong>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl text-xs sm:text-sm animate-in slide-in-from-bottom-4 border border-slate-700">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-0.5 text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงาน • เครือ Illu / LL / True</span>
          <span>พัฒนาด้วย React 18, Vite และ Tailwind CSS</span>
        </div>
      </footer>

    </div>
  );
}
