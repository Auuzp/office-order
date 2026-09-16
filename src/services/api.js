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

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP Error ${res.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
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
  }
};
