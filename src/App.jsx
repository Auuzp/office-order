import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductCatalog from './components/ProductCatalog';
import CartModal from './components/CartModal';
import OrderTracking from './components/OrderTracking';
import AdminApproval from './components/AdminApproval';
import AdminInventory from './components/AdminInventory';
import { api, onUnauthorized } from './services/api';
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
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Products, Orders, and Departments (loaded from localStorage cache on first render, then synced via Cloud API)
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

  // Cloud Sync & Network State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  // PIN Login Modal for Approver Mode (Admin)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Toast System
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem('office_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('office_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('office_departments_v2', JSON.stringify(departments));
  }, [departments]);

  // Fetch Cloud Data from Central Server
  const fetchCloudData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [cloudItems, cloudOrders] = await Promise.all([
        api.getItems(),
        api.getOrders()
      ]);
      if (cloudItems && Array.isArray(cloudItems) && cloudItems.length > 0) {
        setProducts(cloudItems);
      }
      if (cloudOrders && Array.isArray(cloudOrders)) {
        setOrders(cloudOrders);
      }
      setIsOnline(true);
    } catch (err) {
      console.warn('Central server sync status:', err.message);
      setIsOnline(false);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Initial fetch, session validation, and real-time polling loop
  useEffect(() => {
    fetchCloudData(false);

    // Validate if current user has an active server admin session
    api.checkSession().then((res) => {
      if (res && res.authenticated && res.role === 'ADMIN') {
        setCurrentRole('ADMIN');
      } else {
        setCurrentRole('EMPLOYEE');
      }
    });

    // Auto-revert to Employee when any protected API returns 401
    const unsubscribeAuth = onUnauthorized(() => {
      setCurrentRole('EMPLOYEE');
      showToast('เซสชันหมดอายุหรือไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่', 'error');
    });

    const interval = setInterval(() => {
      fetchCloudData(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      unsubscribeAuth();
    };
  }, []);

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

  // Submit Requisition (Syncs directly to Central API)
  const handleSubmitRequisition = async (payload) => {
    setIsSubmitting(true);
    try {
      const serverOrder = await api.createOrder({
        requesterName: payload.requesterName,
        company: payload.company,
        department: payload.department,
        departmentId: payload.departmentId,
        reason: payload.reason,
        priority: payload.priority,
        reasonDetail: payload.reasonDetail,
        totalCost: payload.totalCost,
        items: payload.items
      });

      setOrders((prev) => [serverOrder, ...prev.filter(o => o.id !== serverOrder.id)]);
      setCartItems([]);
      setIsCartModalOpen(false);
      setActiveTab('tracking');
      showToast(`ส่งคำขอเบิก ${serverOrder.id} สำเร็จแล้ว! ซิงค์ขึ้นระบบกลางเรียบร้อย`, 'success');
      fetchCloudData(true);
    } catch (err) {
      console.warn('API submission failed, using local queue:', err);
      const newId = `REQ-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;
      const fallbackOrder = {
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

      setOrders((prev) => [fallbackOrder, ...prev]);
      setCartItems([]);
      setIsCartModalOpen(false);
      setActiveTab('tracking');
      showToast(`ส่งคำขอเบิก ${newId} สำเร็จแล้ว (บันทึกข้อมูลเรียบร้อย)`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve Requisition (Syncs to Central API and updates stock)
  const handleApproveOrder = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Check stock locally first
    let shortageItem = null;
    order.items.forEach((reqItem) => {
      const prod = products.find((p) => p.id === reqItem.itemId || p.name === reqItem.itemName);
      if (prod && prod.stock < reqItem.quantity) {
        shortageItem = prod;
      }
    });

    if (shortageItem) {
      showToast(`ไม่สามารถอนุมัติได้: "${shortageItem.name}" เหลือในสต็อกเพียง ${shortageItem.stock}`, 'error');
      return;
    }

    try {
      const res = await api.approveOrder(orderId);
      if (res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      }
      if (res.items) {
        setProducts(res.items);
      } else {
        fetchCloudData(true);
      }
      showToast(`อนุมัติคำขอ ${orderId} สำเร็จ (ตัดสต็อกและซิงค์ระบบกลางเรียบร้อย)`, 'success');
    } catch (err) {
      console.error('API approve failed:', err);
      showToast(err.message || `ไม่สามารถอนุมัติคำขอ ${orderId} ได้`, 'error');
    }
  };

  // Mark as Shipping
  const handleShippingOrder = async (orderId) => {
    try {
      const updatedOrder = await api.shipOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? (updatedOrder || { ...o, status: 'SHIPPING' }) : o))
      );
      showToast(`อัปเดตคำขอ ${orderId} เป็น "กำลังจัดส่ง" แล้ว`, 'info');
    } catch (err) {
      console.error('API shipping failed:', err);
      showToast(err.message || `ไม่สามารถอัปเดตสถานะคำขอ ${orderId} ได้`, 'error');
    }
  };

  // Reject Requisition
  const handleRejectOrder = async (orderId, reason) => {
    try {
      const updatedOrder = await api.rejectOrder(orderId, reason);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? (updatedOrder || { ...o, status: 'REJECTED', rejectReason: reason }) : o))
      );
      showToast(`ปฏิเสธคำขอ ${orderId} เรียบร้อยแล้ว`, 'info');
    } catch (err) {
      console.error('API reject failed:', err);
      showToast(err.message || `ไม่สามารถปฏิเสธคำขอ ${orderId} ได้`, 'error');
    }
  };

  // Switch Role
  const handleRoleToggleClick = async () => {
    if (currentRole === 'EMPLOYEE') {
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    } else {
      try {
        await api.logout();
      } catch (err) {
        console.warn('Logout error:', err.message);
      }
      setCurrentRole('EMPLOYEE');
      setActiveTab('dashboard');
      showToast('ออกจากระบบผู้ดูแลระบบ กลับสู่โหมดพนักงานทั่วไป');
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const trimmed = pinInput.trim();
    if (!trimmed) {
      setPinError('กรุณากรอกรหัส PIN');
      return;
    }

    try {
      await api.login(trimmed);
      setCurrentRole('ADMIN');
      setIsPinModalOpen(false);
      setActiveTab('tracking');
      showToast('เข้าสู่โหมดผู้ดูแลระบบ (Admin) เรียบร้อยแล้ว', 'success');
    } catch (err) {
      setPinError(err.message || 'รหัส PIN ไม่ถูกต้อง');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartModalOpen(true)}
        currentRole={currentRole}
        onSwitchRole={handleRoleToggleClick}
        currentDepartment={currentDepartment}
        onSelectDepartment={setCurrentDepartment}
        departments={departments}
        onQuickSearch={() => setActiveTab('catalog')}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          cartCount={totalCartCount}
          pendingCount={pendingCount}
          currentRole={currentRole}
          currentDepartment={currentDepartment}
          departments={departments}
          onNewRequisitionClick={() => setActiveTab('catalog')}
        />

        {/* Center/Right Dynamic Content */}
        <main className="flex-1 min-w-0">
          
          {/* View 1: Dashboard */}
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

          {/* View 2: Catalog */}
          {activeTab === 'catalog' && (
            <ProductCatalog
              products={products}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
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
              onRefresh={() => {
                fetchCloudData(false);
                showToast('รีเฟรชและซิงค์ข้อมูลล่าสุดจากระบบกลางเรียบร้อยแล้ว');
              }}
            />
          )}

          {/* View 4: Admin Approval */}
          {activeTab === 'admin-approvals' && (
            <AdminApproval
              orders={orders}
              items={products}
              onApproveOrder={handleApproveOrder}
              onRejectOrder={handleRejectOrder}
              loading={isSyncing}
            />
          )}

          {/* View 5: Admin Inventory Management */}
          {activeTab === 'admin-inventory' && (
            <AdminInventory
              items={products}
              onAddItem={async (newItem) => {
                try {
                  const created = await api.createItem(newItem);
                  setProducts((prev) => [created, ...prev]);
                  showToast(`เพิ่มอุปกรณ์ "${newItem.name}" เรียบร้อยแล้ว`);
                  fetchCloudData(true);
                } catch (err) {
                  console.error('API createItem failed:', err);
                  showToast(err.message || 'ไม่สามารถเพิ่มอุปกรณ์ได้', 'error');
                }
              }}
              onUpdateItem={async (id, updateData) => {
                try {
                  const updated = await api.updateItem(id, updateData);
                  setProducts((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
                  );
                  showToast('อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว');
                  fetchCloudData(true);
                } catch (err) {
                  console.error('API updateItem failed:', err);
                  showToast(err.message || 'ไม่สามารถอัปเดตข้อมูลอุปกรณ์ได้', 'error');
                }
              }}
              onDeleteItem={async (id) => {
                try {
                  await api.deleteItem(id);
                  setProducts((prev) => prev.filter((item) => item.id !== id));
                  showToast('ลบรายการอุปกรณ์เรียบร้อยแล้ว');
                  fetchCloudData(true);
                } catch (err) {
                  console.error('API deleteItem failed:', err);
                  showToast(err.message || 'ไม่สามารถลบรายการอุปกรณ์ได้', 'error');
                }
              }}
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
                เข้าสู่โหมดผู้ดูแลระบบ (Admin)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กรุณาใส่รหัส PIN เพื่อตรวจสอบและจัดการระบบเบิกอุปกรณ์
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                maxLength={20}
                placeholder="ใส่รหัส PIN ผู้ดูแลระบบ"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-xl tracking-widest py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              {pinError && (
                <span className="text-xs text-rose-600 font-medium block">{pinError}</span>
              )}

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
          <span>ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงาน • Illuspace (Thailand) Co., Ltd. | Live Lighting Co., Ltd. | True Innovation Tech Co., Ltd.</span>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>เชื่อมต่อระบบคลาวด์กลาง (Real-time Sync)</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
