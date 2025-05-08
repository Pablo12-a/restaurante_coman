// API service for making requests to the backend

const API = {
  // Base URL for API requests
  baseUrl: '/api',
  
  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default options
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin' // Include cookies in request
    };
    
    // Merge options
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = new Error(errorData?.message || 'API request failed');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      // Parse JSON response
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },
  
  // Auth endpoints
  auth: {
    login(credentials) {
      return API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    
    logout() {
      return API.request('/auth/logout', {
        method: 'POST'
      });
    },
    
    getCurrentUser() {
      return API.request('/auth/me');
    },
    
    getUsers() {
      return API.request('/auth/users');
    },
    
    createUser(userData) {
      return API.request('/auth/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    }
  },
  
  // Menu endpoints
  menu: {
    getAll() {
      return API.request('/menu');
    },
    
    getByCategory(category) {
      return API.request(`/menu/category/${category}`);
    },
    
    getById(id) {
      return API.request(`/menu/${id}`);
    },
    
    create(itemData) {
      return API.request('/menu', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
    },
    
    update(id, itemData) {
      return API.request(`/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      });
    },
    
    delete(id) {
      return API.request(`/menu/${id}`, {
        method: 'DELETE'
      });
    },
    
    toggleAvailability(id, isAvailable) {
      return API.request(`/menu/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable })
      });
    }
  },
  
  // Tables endpoints
  tables: {
    getAll() {
      return API.request('/tables');
    },
    
    getById(id) {
      return API.request(`/tables/${id}`);
    },
    
    create(tableData) {
      return API.request('/tables', {
        method: 'POST',
        body: JSON.stringify(tableData)
      });
    },
    
    update(id, tableData) {
      return API.request(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tableData)
      });
    },
    
    delete(id) {
      return API.request(`/tables/${id}`, {
        method: 'DELETE'
      });
    },
    
    updateStatus(id, status) {
      return API.request(`/tables/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    
    getOrders(id) {
      return API.request(`/tables/${id}/orders`);
    }
  },
  
  // Orders endpoints
  orders: {
    getAll(filters = {}) {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.table) queryParams.append('table', filters.table);
      
      const query = queryParams.toString();
      return API.request(`/orders${query ? `?${query}` : ''}`);
    },
    
    getById(id) {
      return API.request(`/orders/${id}`);
    },
    
    create(orderData) {
      return API.request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    
    updateStatus(id, status) {
      return API.request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    
    updateItemStatus(orderId, itemId, status) {
      return API.request(`/orders/${orderId}/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    
    addItems(orderId, items) {
      return API.request(`/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
    },
    
    deleteItem(orderId, itemId) {
      return API.request(`/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
      });
    },
    
    getKitchenOrders() {
      return API.request('/orders/kitchen/active');
    }
  }
};

// Export API service
window.API = API;