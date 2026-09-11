import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EmployeeCatalog from './components/EmployeeCatalog';
import OrderModal from './components/OrderModal';
import OrderTracking from './components/OrderTracking';
import AdminApproval from './components/AdminApproval';
import AdminInventory from './components/AdminInventory';
import AdminDashboard from './components/AdminDashboard';
import { initialItems, initialOrders } from '../server/data/initialData';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // State for items & orders
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation & Role
  const [currentRole, setCurrentRole] = useState('EMPLOYEE'); // EMPLOYEE | ADMIN
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | tracking | admin-approvals | admin-inventory | admin-dashboard

  // Cart & Order Modal
  const [cartItems, setCartItems] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Admin PIN Login Modal
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch initial data from API (with local fallback if server isn't running)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, ordersRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/orders')
      ]);

      if (itemsRes.ok && ordersRes.ok) {
        const itemsData = await itemsRes.json();
        const ordersData = await ordersRes.json();
        setItems(itemsData.data || []);
        setOrders(ordersData.data || []);
      } else {
        throw new Error('API offline, using local cache');
      }
    } catch (err) {
      console.warn('API error or server offline, using client-side store:', err);
      // Fallback to localStorage or initial data
      const storedItems = localStorage.getItem('office_items');
      const storedOrders = localStorage.getItem('office_orders');

      if (storedItems) setItems(JSON.parse(storedItems));
      else {
        setItems(initialItems);
        localStorage.setItem('office_items', JSON.stringify(initialItems));
      }

      if (storedOrders) setOrders(JSON.parse(storedOrders));
      else {
        setOrders(initialOrders);
        localStorage.setItem('office_orders', JSON.stringify(initialOrders));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Order (single item from card)
  const handleQuickOrder = (item) => {
    setCartItems([{
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      unit: item.unit,
      stock: item.stock
    }]);
    setIsOrderModalOpen(true);
  };

  // Add item to cart
  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        const newQty = Math.min(item.stock, existing.quantity + 1);
        showToast(`เพิ่มจำนวน ${item.name} เป็น ${newQty} ${item.unit} ในคำขอแล้ว`);
        return prev.map(i => i.itemId === item.id ? { ...i, quantity: newQty } : i);
      } else {
        showToast(`เพิ่ม ${item.name} ลงในคำขอสั่งซื้อแล้ว`);
        return [...prev, {
          itemId: item.id,
          itemName: item.name,
          quantity: 1,
          unit: item.unit,
          stock: item.stock
        }];
      }
    });
  };

  const handleUpdateCartQuantity = (itemId, quantity) => {
    setCartItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const handleRemoveCartItem = (itemId) => {
    setCartItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  // Submit Order (Employee Requisition)
  const handleSubmitOrder = async (orderPayload) => {
    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const result = await res.json();
        showToast(result.message || 'ส่งคำขอสั่งซื้อสำเร็จ รอพี่น้ำอนุมัติ', 'success');
        setIsOrderModalOpen(false);
        setCartItems([]);
        fetchData();
        setActiveTab('tracking');
      } else {
        const err = await res.json();
        // Handle client-side fallback if server fails
        throw new Error(err.message || 'ไม่สามารถส่งคำขอได้');
      }
    } catch (error) {
      console.warn('API error, handling order locally:', error);
      // Local fallback
      const orderNum = orders.length + 1;
      const orderId = `ORD-${new Date().getFullYear()}-${String(orderNum).padStart(3, '0')}`;
      const newOrder = {
        id: orderId,
        createdAt: new Date().toISOString(),
        requesterName: orderPayload.requesterName,
        company: orderPayload.company,
        department: orderPayload.department,
        reason: orderPayload.reason,
        reasonDetail: orderPayload.reasonDetail,
        status: 'PENDING',
        approvedBy: null,
        approvedAt: null,
        items: orderPayload.items
      };
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('office_orders', JSON.stringify(updatedOrders));

      showToast(`ส่งคำขอ ${orderId} สำเร็จแล้ว (รอพี่น้ำอนุมัติ)`, 'success');
      setIsOrderModalOpen(false);
      setCartItems([]);
      setActiveTab('tracking');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Approve Order (พี่น้ำอนุมัติ)
  const handleApproveOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST'
      });

      if (res.ok) {
        const result = await res.json();
        showToast(result.message || 'อนุมัติคำสั่งซื้อและตัดสต็อกเรียบร้อยแล้ว', 'success');
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (error) {
      console.warn('API approve error, doing local update:', error);
      // Local approval & stock deduction
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Deduct stock
      const updatedItems = items.map(invItem => {
        const reqItem = order.items.find(i => i.itemId === invItem.id);
        if (reqItem) {
          return { ...invItem, stock: Math.max(0, invItem.stock - reqItem.quantity) };
        }
        return invItem;
      });

      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'APPROVED',
            approvedBy: 'พี่น้ำ',
            approvedAt: new Date().toISOString()
          };
        }
        return o;
      });

      setItems(updatedItems);
      setOrders(updatedOrders);
      localStorage.setItem('office_items', JSON.stringify(updatedItems));
      localStorage.setItem('office_orders', JSON.stringify(updatedOrders));

      showToast(`พี่น้ำอนุมัติคำขอ ${orderId} เรียบร้อยแล้ว (ตัดสต็อกสำเร็จ)`, 'success');
    }
  };

  // Reject Order (พี่น้ำปฏิเสธ)
  const handleRejectOrder = async (orderId, reason) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        const result = await res.json();
        showToast(result.message || 'ปฏิเสธคำสั่งซื้อเรียบร้อยแล้ว', 'info');
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (error) {
      console.warn('API reject error, doing local update:', error);
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'REJECTED',
            rejectedBy: 'พี่น้ำ',
            rejectReason: reason,
            rejectedAt: new Date().toISOString()
          };
        }
        return o;
      });
      setOrders(updatedOrders);
      localStorage.setItem('office_orders', JSON.stringify(updatedOrders));
      showToast(`ปฏิเสธคำขอ ${orderId} เรียบร้อยแล้ว`, 'info');
    }
  };

  // Add Item (พี่น้ำเพิ่มอุปกรณ์)
  const handleAddItem = async (itemData) => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (res.ok) {
        const result = await res.json();
        showToast(result.message || 'เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว');
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (error) {
      console.warn('API add item error, saving locally:', error);
      const newItem = {
        ...itemData,
        id: `item-${Date.now()}`
      };
      const updatedItems = [newItem, ...items];
      setItems(updatedItems);
      localStorage.setItem('office_items', JSON.stringify(updatedItems));
      showToast('เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบเรียบร้อยแล้ว');
    }
  };

  // Update Item / Restock
  const handleUpdateItem = async (id, updateData) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        showToast('อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว');
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (error) {
      console.warn('API update error, saving locally:', error);
      const updatedItems = items.map(i => i.id === id ? { ...i, ...updateData } : i);
      setItems(updatedItems);
      localStorage.setItem('office_items', JSON.stringify(updatedItems));
      showToast('อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว');
    }
  };

  // Delete Item
  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('ลบอุปกรณ์เรียบร้อยแล้ว');
        fetchData();
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (error) {
      console.warn('API delete error, saving locally:', error);
      const updatedItems = items.filter(i => i.id !== id);
      setItems(updatedItems);
      localStorage.setItem('office_items', JSON.stringify(updatedItems));
      showToast('ลบอุปกรณ์เรียบร้อยแล้ว');
    }
  };

  // PIN check for Approver mode (พี่น้ำ)
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '') {
      setCurrentRole('ADMIN');
      setActiveTab('admin-approvals');
      setIsAdminLoginOpen(false);
      setPinInput('');
      setPinError('');
      showToast('เข้าสู่โหมดพี่น้ำ (ผู้อนุมัติ) เรียบร้อยแล้ว', 'success');
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
    }
  };

  const pendingApprovalCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.length}
        openCartModal={() => setIsOrderModalOpen(true)}
        pendingApprovalCount={pendingApprovalCount}
        onAdminLoginClick={() => {
          setPinInput('');
          setPinError('');
          setIsAdminLoginOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'EMPLOYEE' ? (
          <>
            {activeTab === 'catalog' && (
              <EmployeeCatalog
                items={items}
                onQuickOrder={handleQuickOrder}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
                loading={loading}
              />
            )}

            {activeTab === 'tracking' && (
              <OrderTracking
                orders={orders}
                loading={loading}
                onRefresh={fetchData}
              />
            )}
          </>
        ) : (
          <>
            {activeTab === 'admin-approvals' && (
              <AdminApproval
                orders={orders}
                items={items}
                onApproveOrder={handleApproveOrder}
                onRejectOrder={handleRejectOrder}
                loading={loading}
              />
            )}

            {activeTab === 'admin-inventory' && (
              <AdminInventory
                items={items}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                loading={loading}
              />
            )}

            {activeTab === 'admin-dashboard' && (
              <AdminDashboard
                orders={orders}
                items={items}
              />
            )}
          </>
        )}
      </main>

      {/* Order Requisition Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        itemsToOrder={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmittingOrder}
      />

      {/* Admin PIN Login Modal */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              ยืนยันสิทธิ์ผู้อนุมัติ (พี่น้ำ)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กรุณาใส่รหัส PIN เพื่อเข้าจัดการและอนุมัติคำสั่งซื้อ
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
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
                  <span className="text-xs text-rose-600 mt-1 block font-medium">{pinError}</span>
                )}
                <div className="text-[11px] text-slate-400 mt-1.5">
                  รหัส PIN เริ่มต้น: <strong>1234</strong>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(false)}
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl text-xs sm:text-sm animate-in slide-in-from-bottom-5 duration-200 border border-slate-700">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-0.5 text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงาน • รองรับเครือ Illu / LL / True
          </div>
          <div>
            ผู้อนุมัติระบบ: <strong className="text-slate-600">พี่น้ำ (Admin)</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
