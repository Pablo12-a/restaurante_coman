// Kitchen view handler
// For chef interface to manage order preparation

const Kitchen = {
  // Store active kitchen orders
  orders: [],
  
  // Timer for auto-refresh
  refreshTimer: null,
  
  // Initialize kitchen view
  async init(container) {
    // Render kitchen view template
    UI.renderTemplate('kitchen-view-template', container);
    
    // Load active kitchen orders
    await this.loadOrders();
    
    // Set up auto-refresh every 30 seconds
    this.refreshTimer = setInterval(() => {
      this.loadOrders();
    }, 30000);
  },
  
  // Load active kitchen orders
  async loadOrders() {
    try {
      UI.showLoading('#kitchen-orders');
      
      // Fetch kitchen orders from API
      this.orders = await API.orders.getKitchenOrders();
      
      // Render orders
      this.renderOrders();
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
      UI.showError('#kitchen-orders', 'Error al cargar órdenes de cocina');
    }
  },
  
  // Render kitchen orders
  renderOrders() {
    const container = document.getElementById('kitchen-orders');
    
    // Clear container
    container.innerHTML = '';
    
    // Show message if no orders
    if (this.orders.length === 0) {
      UI.showEmptyState(container, 'No hay órdenes pendientes de preparación');
      return;
    }
    
    // Group items by order
    this.orders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'kitchen-order-card';
      
      // Get table number
      let tableNumber = order.tableNumber || 'N/A';
      if (order.table && typeof order.table === 'object') {
        tableNumber = order.table.number;
      }
      
      // Get waiter name
      let waiterName = 'N/A';
      if (order.waiter && typeof order.waiter === 'object') {
        waiterName = order.waiter.name;
      }
      
      // Create header
      orderCard.innerHTML = `
        <div class="kitchen-order-header">
          <h3>Mesa ${tableNumber} - Orden #${order._id.substring(order._id.length - 6)}</h3>
          <div class="kitchen-order-meta">
            <span>Mesero: ${waiterName}</span>
            <span>Hora: ${Utils.formatTime(order.createdAt)}</span>
          </div>
        </div>
        <div class="kitchen-order-items">
          <!-- Items will be added here -->
        </div>
      `;
      
      const itemsContainer = orderCard.querySelector('.kitchen-order-items');
      
      // Filter and sort items by status and time
      const pendingItems = order.items.filter(item => 
        item.status === 'pending' || item.status === 'preparing'
      );
      
      pendingItems.sort((a, b) => {
        // Sort by status (pending first, then preparing)
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
        // Then by creation time
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });
      
      // Add items to container
      pendingItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `kitchen-item ${item.status}`;
        
        // Status options
        const statusOptions = `
          <select class="item-status-select" data-order-id="${order._id}" data-item-id="${item._id}">
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pendiente</option>
            <option value="preparing" ${item.status === 'preparing' ? 'selected' : ''}>Preparando</option>
            <option value="ready" ${item.status === 'ready' ? 'selected' : ''}>Listo</option>
          </select>
        `;
        
        itemElement.innerHTML = `
          <div class="item-details">
            <span class="item-quantity">x${item.quantity}</span>
            <span class="item-name">${item.name}</span>
            <span class="item-notes">${item.notes || ''}</span>
          </div>
          <div class="item-actions">
            ${statusOptions}
          </div>
        `;
        
        // Add event listener for status change
        itemElement.querySelector('.item-status-select').addEventListener('change', (e) => {
          this.updateItemStatus(
            order._id,
            item._id,
            e.target.value
          );
        });
        
        itemsContainer.appendChild(itemElement);
      });
      
      container.appendChild(orderCard);
    });
  },
  
  // Update item status
  async updateItemStatus(orderId, itemId, status) {
    try {
      await API.orders.updateItemStatus(orderId, itemId, status);
      
      // Update local data
      const order = this.orders.find(o => o._id === orderId);
      if (order) {
        const item = order.items.find(i => i._id === itemId);
        if (item) {
          item.status = status;
        }
      }
      
      // Refresh orders if item is marked as ready
      if (status === 'ready') {
        await this.loadOrders();
      }
      
      // Show success message
      const statusText = Utils.getOrderItemStatusName(status);
      UI.showNotification(`Item marcado como: ${statusText}`, 'success');
    } catch (error) {
      console.error('Error updating item status:', error);
      UI.showNotification('Error al actualizar estado del item', 'error');
      
      // Reset select
      const select = document.querySelector(`select[data-order-id="${orderId}"][data-item-id="${itemId}"]`);
      if (select) {
        // Find current status in orders data
        const order = this.orders.find(o => o._id === orderId);
        if (order) {
          const item = order.items.find(i => i._id === itemId);
          if (item) {
            select.value = item.status;
          }
        }
      }
    }
  },
  
  // Clean up on view change
  cleanup() {
    // Clear auto-refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
};

// Export Kitchen module
window.Kitchen = Kitchen;