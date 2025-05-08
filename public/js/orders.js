// Orders view handler

const Orders = {
  // Store orders data
  ordersData: [],
  
  // Store menu items data
  menuItems: [],
  
  // Current new order data
  newOrder: null,
  
  // Initialize orders view
  async init(container) {
    // Render orders view template
    UI.renderTemplate('orders-view-template', container);
    
    // Set up filter handlers
    document.getElementById('orders-status-filter').addEventListener('change', () => {
      this.loadOrders();
    });
    
    document.getElementById('orders-date-filter').addEventListener('change', () => {
      this.loadOrders();
    });
    
    // Load orders data
    await this.loadOrders();
  },
  
  // Load orders data from API
  async loadOrders() {
    try {
      UI.showLoading('#main-orders-list');
      
      // Get filter values
      const statusFilter = document.getElementById('orders-status-filter').value;
      const dateFilter = document.getElementById('orders-date-filter').value;
      
      // Build filter object
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      // Fetch orders from API
      this.ordersData = await API.orders.getAll(filters);
      
      // Apply date filter if set
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        
        this.ordersData = this.ordersData.filter(order => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === filterDate.getTime();
        });
      }
      
      // Render orders
      this.renderOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
      UI.showError('#main-orders-list', 'Error al cargar órdenes');
    }
  },
  
  // Render orders list
  renderOrders() {
    const container = document.getElementById('main-orders-list');
    
    // Clear container
    container.innerHTML = '';
    
    // Show message if no orders
    if (this.ordersData.length === 0) {
      UI.showEmptyState(container, 'No hay órdenes que coincidan con los filtros');
      return;
    }
    
    // Sort orders by date (newest first)
    this.ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render each order
    this.ordersData.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = `order-card ${order.status}`;
      
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
      
      let itemsHTML = '';
      order.items.forEach(item => {
        itemsHTML += `
          <div class="item">
            <span class="item-name">${item.name}</span>
            <span class="item-quantity">x${item.quantity}</span>
            <span class="item-price">$${Utils.formatCurrency(item.price * item.quantity)}</span>
          </div>
        `;
      });
      
      orderCard.innerHTML = `
        <div class="order-header">
          <h4>Orden #${order._id.substring(order._id.length - 6)}</h4>
          <span class="status-badge ${order.status}">${Utils.getOrderStatusName(order.status)}</span>
        </div>
        <div class="order-meta">
          <span>Mesa: ${tableNumber}</span>
          <span>Mesero: ${waiterName}</span>
          <span>Fecha: ${Utils.formatDate(order.createdAt)}</span>
          <span>Hora: ${Utils.formatTime(order.createdAt)}</span>
        </div>
        <div class="order-items">
          ${itemsHTML}
        </div>
        <div class="order-total">
          Total: $${Utils.formatCurrency(order.totalAmount)}
        </div>
        <div class="order-actions">
          <button class="btn btn-primary btn-sm" data-order-id="${order._id}">
            Ver Detalles
          </button>
        </div>
      `;
      
      // Add click handler for view details button
      orderCard.querySelector('.order-actions button').addEventListener('click', () => {
        this.showOrderDetail(order._id);
      });
      
      container.appendChild(orderCard);
    });
  },
  
  // Show order detail view
  async showOrderDetail(orderId) {
    try {
      // Fetch order details
      const order = await API.orders.getById(orderId);
      
      // Render order detail template
      const container = document.querySelector('.view-container');
      UI.renderTemplate('order-detail-template', container);
      
      // Fill template with data
      document.getElementById('order-id').textContent = order._id.substring(order._id.length - 6);
      document.getElementById('order-status').textContent = Utils.getOrderStatusName(order.status);
      document.getElementById('order-status').className = `status-badge ${order.status}`;
      
      // Get table number
      let tableNumber = order.tableNumber || 'N/A';
      if (order.table && typeof order.table === 'object') {
        tableNumber = order.table.number;
      }
      document.getElementById('order-table').textContent = tableNumber;
      
      // Get waiter name
      let waiterName = 'N/A';
      if (order.waiter && typeof order.waiter === 'object') {
        waiterName = order.waiter.name;
      }
      document.getElementById('order-waiter').textContent = waiterName;
      
      document.getElementById('order-date').textContent = Utils.formatDate(order.createdAt);
      document.getElementById('order-time').textContent = Utils.formatTime(order.createdAt);
      
      // Render order items
      const itemsContainer = document.getElementById('detail-order-items');
      itemsContainer.innerHTML = '';
      
      order.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-notes">${item.notes || ''}</div>
          </div>
          <div class="item-status">
            <span class="status-badge ${item.status}">${Utils.getOrderItemStatusName(item.status)}</span>
          </div>
          <div class="item-quantity">x${item.quantity}</div>
          <div class="item-price">$${Utils.formatCurrency(item.price * item.quantity)}</div>
        `;
        
        itemsContainer.appendChild(itemElement);
      });
      
      // Set total amount
      document.getElementById('detail-order-total').textContent = Utils.formatCurrency(order.totalAmount);
      
      // Set up action buttons
      const cancelOrderBtn = document.getElementById('cancel-order-btn');
      const completeOrderBtn = document.getElementById('complete-order-btn');
      const addItemsBtn = document.getElementById('add-items-btn');
      const printOrderBtn = document.getElementById('print-order-btn');
      
      // Only show cancel/complete buttons for active orders
      if (order.status !== 'active') {
        cancelOrderBtn.style.display = 'none';
        completeOrderBtn.style.display = 'none';
        addItemsBtn.style.display = 'none';
      }
      
      // Setup event handlers
      cancelOrderBtn.addEventListener('click', () => {
        this.cancelOrder(order._id);
      });
      
      completeOrderBtn.addEventListener('click', () => {
        this.completeOrder(order._id);
      });
      
      addItemsBtn.addEventListener('click', () => {
        this.showAddItemsForm(order);
      });
      
      printOrderBtn.addEventListener('click', () => {
        this.printOrder(order);
      });
    } catch (error) {
      console.error('Error showing order detail:', error);
      UI.showError('.view-container', 'Error al cargar detalles de la orden');
    }
  },
  
  // Create a new order for a table
  async createNewOrder(table) {
    try {
      // Initialize new order
      this.newOrder = {
        tableId: table._id,
        tableNumber: table.number,
        items: []
      };
      
      // Load menu items if not already loaded
      if (this.menuItems.length === 0) {
        this.menuItems = await API.menu.getAll();
      }
      
      // Render new order form
      const container = document.querySelector('.view-container');
      const formContent = UI.renderTemplate('new-order-template', container);
      
      // Set table number
      document.getElementById('order-table-number').textContent = table.number;
      
      // Set up category filter buttons
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Update active button
          document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Filter menu items
          const category = btn.getAttribute('data-category');
          this.renderMenuItems(category);
        });
      });
      
      // Render all menu items initially
      this.renderMenuItems('all');
      
      // Set up action button handlers
      document.getElementById('cancel-order-btn').addEventListener('click', () => {
        this.cancelNewOrder();
      });
      
      document.getElementById('send-order-btn').addEventListener('click', () => {
        this.submitNewOrder();
      });
    } catch (error) {
      console.error('Error creating new order:', error);
      UI.showNotification('Error al crear nueva orden', 'error');
    }
  },
  
  // Render menu items for new order
  renderMenuItems(category) {
    const container = document.getElementById('menu-items');
    
    // Filter items by category
    let filteredItems = [...this.menuItems];
    if (category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Render each menu item
    filteredItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = `menu-item ${!item.isAvailable ? 'unavailable' : ''}`;
      itemElement.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-price">$${Utils.formatCurrency(item.price)}</div>
      `;
      
      // Add click handler
      if (item.isAvailable) {
        itemElement.addEventListener('click', () => {
          this.addItemToOrder(item);
        });
      }
      
      container.appendChild(itemElement);
    });
  },
  
  // Add item to the new order
  addItemToOrder(item) {
    // Show notes prompt
    UI.prompt('Agregar Item', [
      { name: 'quantity', label: 'Cantidad', type: 'number', value: 1, required: true },
      { name: 'notes', label: 'Notas', type: 'textarea' }
    ], (formData) => {
      // Create item with temporary ID
      const orderItem = {
        id: Utils.generateShortId(),
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: parseInt(formData.quantity),
        notes: formData.notes
      };
      
      // Add to order items
      this.newOrder.items.push(orderItem);
      
      // Update order items display
      this.renderOrderItems();
    });
  },
  
  // Render items in the new order
  renderOrderItems() {
    const container = document.getElementById('order-items');
    
    // Clear container
    container.innerHTML = '';
    
    // Show message if no items
    if (this.newOrder.items.length === 0) {
      container.innerHTML = '<div class="empty-message">No hay items en la orden</div>';
      document.getElementById('order-total').textContent = '0.00';
      return;
    }
    
    // Render each order item
    this.newOrder.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'order-item';
      itemElement.innerHTML = `
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-notes">${item.notes || ''}</div>
        </div>
        <div class="item-quantity">
          <button class="decrease-quantity" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="increase-quantity" data-id="${item.id}">+</button>
        </div>
        <div class="item-price">$${Utils.formatCurrency(item.price * item.quantity)}</div>
        <div class="item-remove" data-id="${item.id}">
          <i class="fas fa-times"></i>
        </div>
      `;
      
      // Add event handlers
      itemElement.querySelector('.decrease-quantity').addEventListener('click', () => {
        this.updateItemQuantity(item.id, -1);
      });
      
      itemElement.querySelector('.increase-quantity').addEventListener('click', () => {
        this.updateItemQuantity(item.id, 1);
      });
      
      itemElement.querySelector('.item-remove').addEventListener('click', () => {
        this.removeItemFromOrder(item.id);
      });
      
      container.appendChild(itemElement);
    });
    
    // Update total
    const total = this.newOrder.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    document.getElementById('order-total').textContent = Utils.formatCurrency(total);
  },
  
  // Update item quantity in the new order
  updateItemQuantity(itemId, change) {
    const item = this.newOrder.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + change);
      this.renderOrderItems();
    }
  },
  
  // Remove item from the new order
  removeItemFromOrder(itemId) {
    this.newOrder.items = this.newOrder.items.filter(i => i.id !== itemId);
    this.renderOrderItems();
  },
  
  // Cancel new order creation
  cancelNewOrder() {
    UI.confirm('¿Está seguro que desea cancelar la orden?', () => {
      this.newOrder = null;
      
      // Go back to tables view
      App.showView('tables');
    });
  },
  
  // Submit new order to API
  async submitNewOrder() {
    try {
      // Validate order
      if (this.newOrder.items.length === 0) {
        UI.showNotification('Agregue al menos un item a la orden', 'warning');
        return;
      }
      
      // Disable submit button
      document.getElementById('send-order-btn').disabled = true;
      
      // Transform items format for API
      const items = this.newOrder.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes
      }));
      
      // Create order via API
      await API.orders.create({
        tableId: this.newOrder.tableId,
        items
      });
      
      UI.showNotification('Orden enviada correctamente', 'success');
      
      // Reset new order
      this.newOrder = null;
      
      // Go back to tables view
      App.showView('tables');
    } catch (error) {
      console.error('Error submitting order:', error);
      UI.showNotification('Error al enviar la orden', 'error');
      
      // Re-enable submit button
      document.getElementById('send-order-btn').disabled = false;
    }
  },
  
  // Complete an order
  async completeOrder(orderId) {
    UI.confirm('¿Está seguro que desea completar esta orden?', async () => {
      try {
        await API.orders.updateStatus(orderId, 'completed');
        
        // Reload orders
        await this.loadOrders();
        
        // Show success message
        UI.showNotification('Orden completada correctamente', 'success');
        
        // Go back to orders list
        this.init(document.querySelector('.view-container'));
      } catch (error) {
        console.error('Error completing order:', error);
        UI.showNotification('Error al completar orden', 'error');
      }
    });
  },
  
  // Cancel an order
  async cancelOrder(orderId) {
    UI.confirm('¿Está seguro que desea cancelar esta orden?', async () => {
      try {
        await API.orders.updateStatus(orderId, 'cancelled');
        
        // Reload orders
        await this.loadOrders();
        
        // Show success message
        UI.showNotification('Orden cancelada correctamente', 'success');
        
        // Go back to orders list
        this.init(document.querySelector('.view-container'));
      } catch (error) {
        console.error('Error cancelling order:', error);
        UI.showNotification('Error al cancelar orden', 'error');
      }
    });
  },
  
  // Show form to add items to an existing order
  async showAddItemsForm(order) {
    try {
      // Initialize temporary order
      this.newOrder = {
        orderId: order._id,
        tableId: order.table,
        tableNumber: order.tableNumber || 'N/A',
        items: []
      };
      
      // Load menu items if not already loaded
      if (this.menuItems.length === 0) {
        this.menuItems = await API.menu.getAll();
      }
      
      // Create modal content from new order template
      const modalContent = UI.renderTemplate('new-order-template', null);
      
      // Set table number
      modalContent.getElementById('order-table-number').textContent = this.newOrder.tableNumber;
      
      // Set up category filter buttons
      modalContent.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Update active button
          modalContent.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Filter menu items
          const category = btn.getAttribute('data-category');
          this.renderMenuItemsForExistingOrder(category, modalContent);
        });
      });
      
      // Update buttons text
      modalContent.querySelector('#cancel-order-btn').textContent = 'Cancelar';
      modalContent.querySelector('#send-order-btn').textContent = 'Agregar Items';
      
      // Show modal
      UI.showModal(`Agregar Items a la Orden #${order._id.substring(order._id.length - 6)}`, modalContent);
      
      // Render all menu items initially
      this.renderMenuItemsForExistingOrder('all', modalContent);
      
      // Set up action button handlers
      modalContent.querySelector('#cancel-order-btn').addEventListener('click', () => {
        UI.closeModal();
        this.newOrder = null;
      });
      
      modalContent.querySelector('#send-order-btn').addEventListener('click', () => {
        this.submitAddItems();
      });
    } catch (error) {
      console.error('Error showing add items form:', error);
      UI.showNotification('Error al agregar items', 'error');
    }
  },
  
  // Render menu items for adding to existing order
  renderMenuItemsForExistingOrder(category, container) {
    const menuContainer = container.querySelector('#menu-items');
    
    // Filter items by category
    let filteredItems = [...this.menuItems];
    if (category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // Clear container
    menuContainer.innerHTML = '';
    
    // Render each menu item
    filteredItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = `menu-item ${!item.isAvailable ? 'unavailable' : ''}`;
      itemElement.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-price">$${Utils.formatCurrency(item.price)}</div>
      `;
      
      // Add click handler
      if (item.isAvailable) {
        itemElement.addEventListener('click', () => {
          this.addItemToExistingOrder(item, container);
        });
      }
      
      menuContainer.appendChild(itemElement);
    });
  },
  
  // Add item to existing order
  addItemToExistingOrder(item, container) {
    // Show notes prompt
    UI.prompt('Agregar Item', [
      { name: 'quantity', label: 'Cantidad', type: 'number', value: 1, required: true },
      { name: 'notes', label: 'Notas', type: 'textarea' }
    ], (formData) => {
      // Create item with temporary ID
      const orderItem = {
        id: Utils.generateShortId(),
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: parseInt(formData.quantity),
        notes: formData.notes
      };
      
      // Add to order items
      this.newOrder.items.push(orderItem);
      
      // Update order items display
      this.renderOrderItemsForExistingOrder(container);
    });
  },
  
  // Render items for adding to existing order
  renderOrderItemsForExistingOrder(container) {
    const itemsContainer = container.querySelector('#order-items');
    
    // Clear container
    itemsContainer.innerHTML = '';
    
    // Show message if no items
    if (this.newOrder.items.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-message">No hay items seleccionados</div>';
      container.querySelector('#order-total').textContent = '0.00';
      return;
    }
    
    // Render each order item
    this.newOrder.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'order-item';
      itemElement.innerHTML = `
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-notes">${item.notes || ''}</div>
        </div>
        <div class="item-quantity">
          <button class="decrease-quantity" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="increase-quantity" data-id="${item.id}">+</button>
        </div>
        <div class="item-price">$${Utils.formatCurrency(item.price * item.quantity)}</div>
        <div class="item-remove" data-id="${item.id}">
          <i class="fas fa-times"></i>
        </div>
      `;
      
      // Add event handlers
      itemElement.querySelector('.decrease-quantity').addEventListener('click', () => {
        this.updateItemQuantityForExistingOrder(item.id, -1, container);
      });
      
      itemElement.querySelector('.increase-quantity').addEventListener('click', () => {
        this.updateItemQuantityForExistingOrder(item.id, 1, container);
      });
      
      itemElement.querySelector('.item-remove').addEventListener('click', () => {
        this.removeItemFromExistingOrder(item.id, container);
      });
      
      itemsContainer.appendChild(itemElement);
    });
    
    // Update total
    const total = this.newOrder.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    container.querySelector('#order-total').textContent = Utils.formatCurrency(total);
  },
  
  // Update item quantity for adding to existing order
  updateItemQuantityForExistingOrder(itemId, change, container) {
    const item = this.newOrder.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + change);
      this.renderOrderItemsForExistingOrder(container);
    }
  },
  
  // Remove item from existing order
  removeItemFromExistingOrder(itemId, container) {
    this.newOrder.items = this.newOrder.items.filter(i => i.id !== itemId);
    this.renderOrderItemsForExistingOrder(container);
  },
  
  // Submit additional items to an existing order
  async submitAddItems() {
    try {
      // Validate new items
      if (this.newOrder.items.length === 0) {
        UI.showNotification('Agregue al menos un item', 'warning');
        return;
      }
      
      // Disable submit button
      const submitBtn = document.querySelector('#send-order-btn');
      submitBtn.disabled = true;
      
      // Transform items format for API
      const items = this.newOrder.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes
      }));
      
      // Add items to order via API
      await API.orders.addItems(this.newOrder.orderId, items);
      
      UI.showNotification('Items agregados correctamente', 'success');
      
      // Close modal
      UI.closeModal();
      
      // Reset new order
      this.newOrder = null;
      
      // Refresh order details
      this.showOrderDetail(this.newOrder.orderId);
    } catch (error) {
      console.error('Error adding items to order:', error);
      UI.showNotification('Error al agregar items', 'error');
      
      // Re-enable submit button
      const submitBtn = document.querySelector('#send-order-btn');
      if (submitBtn) submitBtn.disabled = false;
    }
  },
  
  // Print order
  printOrder(order) {
    // Create print window content
    let printContent = `
      <html>
      <head>
        <title>Orden #${order._id.substring(order._id.length - 6)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Los Compaitos</h1>
          <p>Orden #${order._id.substring(order._id.length - 6)}</p>
        </div>
        
        <div class="info">
          <p><strong>Mesa:</strong> ${order.tableNumber || 'N/A'}</p>
          <p><strong>Fecha:</strong> ${Utils.formatDate(order.createdAt)}</p>
          <p><strong>Hora:</strong> ${Utils.formatTime(order.createdAt)}</p>
          <p><strong>Mesero:</strong> ${order.waiter && order.waiter.name ? order.waiter.name : 'N/A'}</p>
        </div>
        
        <table class="items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add items to print content
    order.items.forEach(item => {
      printContent += `
        <tr>
          <td>${item.name}${item.notes ? '<br><small>' + item.notes + '</small>' : ''}</td>
          <td>${item.quantity}</td>
          <td>$${Utils.formatCurrency(item.price)}</td>
          <td>$${Utils.formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `;
    });
    
    // Add total and footer
    printContent += `
          </tbody>
        </table>
        
        <div class="total">
          <p>Total: $${Utils.formatCurrency(order.totalAmount)}</p>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su visita!</p>
        </div>
      </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Print after content is loaded
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  }
};

// Export Orders module
window.Orders = Orders;