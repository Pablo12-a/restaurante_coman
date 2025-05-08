// Utility functions for the application

const Utils = {
  // Format currency
  formatCurrency(amount) {
    return amount.toFixed(2);
  },
  
  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  // Format time
  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Format date and time
  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Get current date and time
  getCurrentDateTime() {
    return new Date().toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Calculate order total
  calculateOrderTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },
  
  // Generate a short ID (for temporary local IDs)
  generateShortId() {
    return Math.random().toString(36).substr(2, 9);
  },
  
  // Debounce function to limit how often a function can be called
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },
  
  // Save data to local storage
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  // Load data from local storage
  loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  },
  
  // Create a backup copy of data
  createBackup(name, data) {
    return this.saveToLocalStorage(`backup_${name}_${Date.now()}`, data);
  },
  
  // Update UI datetime display
  updateDateTimeDisplay() {
    const dateTimeElement = document.getElementById('date-time');
    if (dateTimeElement) {
      dateTimeElement.textContent = this.getCurrentDateTime();
    }
  },
  
  // Check if we're on a mobile device
  isMobileDevice() {
    return window.innerWidth < 768;
  },
  
  // Get readable category name
  getCategoryName(category) {
    const categoryMap = {
      'appetizers': 'Entradas',
      'main': 'Platos Principales',
      'sides': 'Guarniciones',
      'desserts': 'Postres',
      'drinks': 'Bebidas'
    };
    
    return categoryMap[category] || category;
  },
  
  // Get readable table status
  getTableStatusName(status) {
    const statusMap = {
      'available': 'Disponible',
      'occupied': 'Ocupada',
      'reserved': 'Reservada',
      'cleaning': 'Limpieza'
    };
    
    return statusMap[status] || status;
  },
  
  // Get readable order status
  getOrderStatusName(status) {
    const statusMap = {
      'active': 'Activa',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    
    return statusMap[status] || status;
  },
  
  // Get readable order item status
  getOrderItemStatusName(status) {
    const statusMap = {
      'pending': 'Pendiente',
      'preparing': 'Preparando',
      'ready': 'Listo',
      'delivered': 'Entregado'
    };
    
    return statusMap[status] || status;
  }
};

// Start datetime updater
setInterval(() => Utils.updateDateTimeDisplay(), 60000);

// Export Utils service
window.Utils = Utils;