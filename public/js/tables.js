// Tables view handler

const Tables = {
  // Store active tables data
  tablesData: [],
  
  // Initialize tables view
  async init(container) {
    // Render tables view template
    UI.renderTemplate('tables-view-template', container);
    
    // Set up filter handlers
    document.getElementById('table-filter').addEventListener('change', () => {
      this.renderTables();
    });
    
    document.getElementById('location-filter').addEventListener('change', () => {
      this.renderTables();
    });
    
    // Set up add table button handler
    const addTableBtn = document.getElementById('add-table-btn');
    if (addTableBtn) {
      addTableBtn.addEventListener('click', () => {
        this.showAddTableForm();
      });
    }
    
    // Load tables data
    await this.loadTables();
  },
  
  // Load tables data from API
  async loadTables() {
    try {
      UI.showLoading('#tables-container');
      
      // Fetch tables from API
      this.tablesData = await API.tables.getAll();
      
      // Render tables
      this.renderTables();
    } catch (error) {
      console.error('Error loading tables:', error);
      UI.showError('#tables-container', 'Error al cargar las mesas');
    }
  },
  
  // Render tables based on filters
  renderTables() {
    const container = document.getElementById('tables-container');
    const statusFilter = document.getElementById('table-filter').value;
    const locationFilter = document.getElementById('location-filter').value;
    
    // Apply filters
    let filteredTables = [...this.tablesData];
    
    if (statusFilter !== 'all') {
      filteredTables = filteredTables.filter(table => table.status === statusFilter);
    }
    
    if (locationFilter !== 'all') {
      filteredTables = filteredTables.filter(table => table.location === locationFilter);
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Show message if no tables
    if (filteredTables.length === 0) {
      UI.showEmptyState(container, 'No hay mesas que coincidan con los filtros');
      return;
    }
    
    // Sort tables by number
    filteredTables.sort((a, b) => a.number - b.number);
    
    // Render each table
    filteredTables.forEach(table => {
      const tableCard = document.createElement('div');
      tableCard.className = `table-card card-clickable ${table.status}`;
      tableCard.innerHTML = `
        <div class="table-number">${table.number}</div>
        <div class="table-seats">${table.seats} asientos</div>
        <div class="table-status">${Utils.getTableStatusName(table.status)}</div>
      `;
      
      // Add click handler
      tableCard.addEventListener('click', () => {
        this.showTableDetail(table._id);
      });
      
      container.appendChild(tableCard);
    });
  },
  
  // Show table detail view
  async showTableDetail(tableId) {
    try {
      // Fetch table details
      const table = await API.tables.getById(tableId);
      
      // Create modal content from template
      const detailContent = UI.renderTemplate('table-detail-template', null);
      
      // Fill template with data
      detailContent.getElementById('table-number').textContent = table.number;
      detailContent.getElementById('table-status').textContent = Utils.getTableStatusName(table.status);
      detailContent.getElementById('table-status').className = `status-badge ${table.status}`;
      detailContent.getElementById('table-seats').textContent = table.seats;
      detailContent.getElementById('table-location').textContent = this.getLocationName(table.location);
      
      // Set up action button handlers
      const newOrderBtn = detailContent.getElementById('new-order-btn');
      const changeStatusBtn = detailContent.getElementById('change-status-btn');
      
      // Only enable new order for available/occupied tables
      if (table.status !== 'available' && table.status !== 'occupied') {
        newOrderBtn.disabled = true;
      }
      
      newOrderBtn.addEventListener('click', () => {
        UI.closeModal();
        this.showNewOrderForm(table);
      });
      
      changeStatusBtn.addEventListener('click', () => {
        this.showChangeStatusForm(table);
      });
      
      // Show modal
      UI.showModal(`Mesa ${table.number}`, detailContent);
      
      // Load active orders for this table
      this.loadTableOrders(tableId);
    } catch (error) {
      console.error('Error showing table detail:', error);
      UI.showNotification('Error al cargar detalles de la mesa', 'error');
    }
  },
  
  // Load active orders for a table
  async loadTableOrders(tableId) {
    try {
      const ordersContainer = document.getElementById('orders-list');
      UI.showLoading(ordersContainer);
      
      // Fetch orders from API
      const orders = await API.tables.getOrders(tableId);
      
      // Check if we have orders
      if (orders.length === 0) {
        UI.showEmptyState(ordersContainer, 'No hay órdenes activas');
        return;
      }
      
      // Clear container
      ordersContainer.innerHTML = '';
      
      // Render each order
      orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
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
            <span class="time">${Utils.formatTime(order.createdAt)}</span>
          </div>
          <div class="order-meta">
            <span>Mesero: ${order.waiter ? order.waiter.name : 'N/A'}</span>
            <span>Items: ${order.items.length}</span>
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
          UI.closeModal();
          Orders.showOrderDetail(order._id);
        });
        
        ordersContainer.appendChild(orderCard);
      });
    } catch (error) {
      console.error('Error loading table orders:', error);
      UI.showError('#orders-list', 'Error al cargar órdenes');
    }
  },
  
  // Show form to add a new table
  showAddTableForm() {
    UI.prompt('Agregar Nueva Mesa', [
      { name: 'number', label: 'Número de Mesa', type: 'number', required: true },
      { name: 'seats', label: 'Número de Asientos', type: 'number', required: true, value: 4 },
      { 
        name: 'location', 
        label: 'Ubicación', 
        type: 'select', 
        required: true,
        value: 'inside',
        options: [
          { value: 'inside', label: 'Interior' },
          { value: 'outside', label: 'Terraza' },
          { value: 'bar', label: 'Barra' },
          { value: 'private', label: 'Privado' }
        ]
      }
    ], async (formData) => {
      try {
        // Create table
        await API.tables.create({
          number: parseInt(formData.number),
          seats: parseInt(formData.seats),
          location: formData.location,
          status: 'available'
        });
        
        // Reload tables
        await this.loadTables();
        
        UI.showNotification('Mesa agregada correctamente', 'success');
      } catch (error) {
        console.error('Error adding table:', error);
        UI.showNotification('Error al agregar mesa', 'error');
      }
    });
  },
  
  // Show form to change table status
  showChangeStatusForm(table) {
    UI.prompt('Cambiar Estado de Mesa', [
      { 
        name: 'status', 
        label: 'Estado', 
        type: 'select', 
        required: true,
        value: table.status,
        options: [
          { value: 'available', label: 'Disponible' },
          { value: 'occupied', label: 'Ocupada' },
          { value: 'reserved', label: 'Reservada' },
          { value: 'cleaning', label: 'Limpieza' }
        ]
      }
    ], async (formData) => {
      try {
        // Update table status
        await API.tables.updateStatus(table._id, formData.status);
        
        // Update status in modal
        const statusBadge = document.getElementById('table-status');
        if (statusBadge) {
          statusBadge.textContent = Utils.getTableStatusName(formData.status);
          statusBadge.className = `status-badge ${formData.status}`;
        }
        
        // Enable/disable new order button based on status
        const newOrderBtn = document.getElementById('new-order-btn');
        if (newOrderBtn) {
          newOrderBtn.disabled = (formData.status !== 'available' && formData.status !== 'occupied');
        }
        
        // Reload table orders if status changed to occupied
        if (formData.status === 'occupied') {
          this.loadTableOrders(table._id);
        }
        
        // Reload tables list
        await this.loadTables();
        
        UI.showNotification('Estado de mesa actualizado', 'success');
      } catch (error) {
        console.error('Error updating table status:', error);
        UI.showNotification('Error al actualizar estado de mesa', 'error');
      }
    });
  },
  
  // Show new order form for a table
  showNewOrderForm(table) {
    // Change view to orders with this table selected
    App.showView('orders');
    
    // Tell orders module to create a new order for this table
    setTimeout(() => {
      Orders.createNewOrder(table);
    }, 100);
  },
  
  // Get readable location name
  getLocationName(location) {
    const locationMap = {
      'inside': 'Interior',
      'outside': 'Terraza',
      'bar': 'Barra',
      'private': 'Privado'
    };
    
    return locationMap[location] || location;
  }
};

// Export Tables module
window.Tables = Tables;