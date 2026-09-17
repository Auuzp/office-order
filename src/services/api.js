// Central API Service connecting Frontend to Backend
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If running on GitHub Pages (auuzp.github.io) or any external static host:
    if (window.location.hostname.includes('github.io')) {
      return 'https://office-order-app.onrender.com/api';
    }
  }
  // Localhost (proxied by Vite) or on Render (direct /api)
  return '/api';
};

export const API_BASE = getApiBaseUrl();

const SESSION_STORAGE_KEY = 'office_admin_session_token';

export const getSessionToken = () => {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setSessionToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage issues in restricted environments
  }
};

const authListeners = new Set();
export const onUnauthorized = (listener) => {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
};

function notifyUnauthorized() {
  setSessionToken(null);
  authListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in unauthorized listener:', e);
    }
  });
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getSessionToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { message: `HTTP Error ${res.status}` };
    }

    if (!res.ok) {
      if (res.status === 401) {
        notifyUnauthorized();
      }
      const err = new Error(data.message || `HTTP Error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Authentication
  async login(pin) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
    if (res.token) {
      setSessionToken(res.token);
    }
    return res;
  },

  async logout() {
    try {
      const res = await request('/auth/logout', {
        method: 'POST'
      });
      return res;
    } finally {
      setSessionToken(null);
    }
  },

  async checkSession() {
    try {
      const res = await request('/auth/session');
      if (!res.authenticated) {
        setSessionToken(null);
      }
      return res;
    } catch {
      setSessionToken(null);
      return { success: true, authenticated: false, role: 'EMPLOYEE' };
    }
  },

  // Items / Inventory
  async getItems() {
    const res = await request('/items');
    return res.data;
  },

  async createItem(item) {
    const res = await request('/items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return res.data;
  },

  async updateItem(id, updateData) {
    const res = await request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return res.data;
  },

  async deleteItem(id) {
    const res = await request(`/items/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  },

  // Orders
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/orders${query ? `?${query}` : ''}`;
    const res = await request(endpoint);
    return res.data;
  },

  async createOrder(orderData) {
    const res = await request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return res.data;
  },

  async approveOrder(id) {
    const res = await request(`/orders/${id}/approve`, {
      method: 'POST'
    });
    return res;
  },

  async rejectOrder(id, reason) {
    const res = await request(`/orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.data;
  },

  async shipOrder(id) {
    const res = await request(`/orders/${id}/shipping`, {
      method: 'POST'
    });
    return res.data;
  },

  // Employees
  async getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/employees${query ? `?${query}` : ''}`;
    const res = await request(endpoint);
    return res.data;
  },

  async createEmployee(employeeData) {
    const res = await request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
    return res.data;
  },

  async updateEmployee(id, updateData) {
    const res = await request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return res.data;
  },

  async deleteEmployee(id) {
    const res = await request(`/employees/${id}`, {
      method: 'DELETE'
    });
    return res.data;
  }
};
