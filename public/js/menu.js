// Menu view handler

const Menu = {
  // Store menu items data
  menuItems: [],
  
  // Initialize menu view
  async init(container) {
    // Render menu view template
    UI.renderTemplate('menu-view-template', container);
    
    // Set up filter handler
    document.getElementById('menu-category-filter').addEventListener('change', () => {
      this.renderMenu();
    });
    
    // Set up add item button handler
    const addItemBtn = document.getElementById('add-menu-item-btn');
    if (addItemBtn) {
      addItemBtn.addEventListener('click', () => {
        this.showAddItemForm();
      });
    }
    
    // Load menu data
    await this.loadMenu();
  },
  
  // Load menu data from API
  async loadMenu() {
    try {
      UI.showLoading('#menu-grid');
      
      // Fetch menu items from API
      this.menuItems = await API.menu.getAll();
      
      // Render menu
      this.renderMenu();
    } catch (error) {
      console.error('Error loading menu:', error);
      UI.showError('#menu-grid', 'Error al cargar el menú');
    }
  },
  
  // Render menu items
  renderMenu() {
    const container = document.getElementById('menu-grid');
    const categoryFilter = document.getElementById('menu-category-filter').value;
    
    // Apply category filter
    let filteredItems = [...this.menuItems];
    if (categoryFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Show message if no items
    if (filteredItems.length === 0) {
      UI.showEmptyState(container, 'No hay items en esta categoría');
      return;
    }
    
    // Sort items by name
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
    
    // Render each menu item
    filteredItems.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'menu-card card card-clickable';
      
      const availabilityClass = item.isAvailable ? 'available' : 'unavailable';
      const availabilityText = item.isAvailable ? 'Disponible' : 'No disponible';
      
      itemCard.innerHTML = `
        <div class="card-img-container">
          <img src="${item.image || '/img/default-dish.jpg'}" alt="${item.name}" class="card-img">
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.description || 'Sin descripción'}</p>
        </div>
        <div class="card-footer">
          <span class="menu-item-price">$${Utils.formatCurrency(item.price)}</span>
          <span class="menu-item-availability ${availabilityClass}">${availabilityText}</span>
        </div>
      `;
      
      // Add click handler
      itemCard.addEventListener('click', () => {
        this.showItemDetail(item._id);
      });
      
      container.appendChild(itemCard);
    });
  },
  
  // Show menu item detail
  async showItemDetail(itemId) {
    try {
      // Fetch item details
      const item = await API.menu.getById(itemId);
      
      // Create modal content from template
      const detailContent = UI.renderTemplate('menu-item-detail-template', null);
      
      // Fill template with data
      detailContent.getElementById('menu-item-name').textContent = item.name;
      detailContent.getElementById('menu-item-description').textContent = item.description || 'Sin descripción';
      detailContent.getElementById('menu-item-price').textContent = Utils.formatCurrency(item.price);
      detailContent.getElementById('menu-item-category').textContent = Utils.getCategoryName(item.category);
      detailContent.getElementById('menu-item-prep-time').textContent = item.preparationTime || 15;
      detailContent.getElementById('menu-item-img').src = item.image || '/img/default-dish.jpg';
      
      const availabilityToggle = detailContent.getElementById('menu-item-available');
      availabilityToggle.checked = item.isAvailable;
      
      // Set up toggle availability handler
      if (Auth.isAdmin() || Auth.isChef()) {
        availabilityToggle.addEventListener('change', () => {
          this.toggleItemAvailability(item._id, availabilityToggle.checked);
        });
      } else {
        availabilityToggle.disabled = true;
      }
      
      // Set up action button handlers
      const editBtn = detailContent.getElementById('edit-menu-item-btn');
      const deleteBtn = detailContent.getElementById('delete-menu-item-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          UI.closeModal();
          this.showEditItemForm(item);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          UI.closeModal();
          this.deleteItem(item._id);
        });
      }
      
      // Show modal
      UI.showModal(item.name, detailContent);
    } catch (error) {
      console.error('Error showing menu item detail:', error);
      UI.showNotification('Error al cargar detalles del item', 'error');
    }
  },
  
  // Toggle menu item availability
  async toggleItemAvailability(itemId, isAvailable) {
    try {
      await API.menu.toggleAvailability(itemId, isAvailable);
      
      // Update local data
      const item = this.menuItems.find(i => i._id === itemId);
      if (item) {
        item.isAvailable = isAvailable;
      }
      
      // Show success message
      const status = isAvailable ? 'disponible' : 'no disponible';
      UI.showNotification(`Item marcado como ${status}`, 'success');
    } catch (error) {
      console.error('Error toggling item availability:', error);
      UI.showNotification('Error al cambiar disponibilidad', 'error');
      
      // Reset toggle
      const availabilityToggle = document.getElementById('menu-item-available');
      if (availabilityToggle) {
        availabilityToggle.checked = !isAvailable;
      }
    }
  },
  
  // Show form to add a new menu item
  showAddItemForm() {
    // Render form template
    const formContent = UI.renderTemplate('menu-item-form-template', null);
    
    // Set form title
    formContent.getElementById('form-title').textContent = 'Agregar Item al Menú';
    
    // Set up form submission handler
    formContent.getElementById('menu-item-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // Get form data
        const formData = new FormData(e.target);
        const itemData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          category: formData.get('category'),
          preparationTime: parseInt(formData.get('preparationTime')),
          isAvailable: formData.get('isAvailable') === 'on',
          image: formData.get('image') || undefined
        };
        
        // Create menu item
        await API.menu.create(itemData);
        
        // Close modal
        UI.closeModal();
        
        // Reload menu
        await this.loadMenu();
        
        // Show success message
        UI.showNotification('Item agregado correctamente', 'success');
      } catch (error) {
        console.error('Error adding menu item:', error);
        UI.showNotification('Error al agregar item', 'error');
      }
    });
    
    // Set up cancel button handler
    formContent.getElementById('cancel-form-btn').addEventListener('click', () => {
      UI.closeModal();
    });
    
    // Show modal
    UI.showModal('Agregar Item al Menú', formContent);
  },
  
  // Show form to edit a menu item
  showEditItemForm(item) {
    // Render form template
    const formContent = UI.renderTemplate('menu-item-form-template', null);
    
    // Set form title
    formContent.getElementById('form-title').textContent = 'Editar Item del Menú';
    
    // Fill form with item data
    formContent.getElementById('item-name').value = item.name;
    formContent.getElementById('item-description').value = item.description || '';
    formContent.getElementById('item-price').value = item.price;
    formContent.getElementById('item-category').value = item.category;
    formContent.getElementById('item-image').value = item.image || '';
    formContent.getElementById('item-prep-time').value = item.preparationTime || 15;
    formContent.getElementById('item-available').checked = item.isAvailable;
    
    // Set up form submission handler
    formContent.getElementById('menu-item-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // Get form data
        const formData = new FormData(e.target);
        const itemData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          category: formData.get('category'),
          preparationTime: parseInt(formData.get('preparationTime')),
          isAvailable: formData.get('isAvailable') === 'on',
          image: formData.get('image') || undefined
        };
        
        // Update menu item
        await API.menu.update(item._id, itemData);
        
        // Close modal
        UI.closeModal();
        
        // Reload menu
        await this.loadMenu();
        
        // Show success message
        UI.showNotification('Item actualizado correctamente', 'success');
      } catch (error) {
        console.error('Error updating menu item:', error);
        UI.showNotification('Error al actualizar item', 'error');
      }
    });
    
    // Set up cancel button handler
    formContent.getElementById('cancel-form-btn').addEventListener('click', () => {
      UI.closeModal();
    });
    
    // Show modal
    UI.showModal('Editar Item del Menú', formContent);
  },
  
  // Delete a menu item
  deleteItem(itemId) {
    UI.confirm('¿Está seguro que desea eliminar este item?', async () => {
      try {
        await API.menu.delete(itemId);
        
        // Reload menu
        await this.loadMenu();
        
        // Show success message
        UI.showNotification('Item eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        UI.showNotification('Error al eliminar item', 'error');
      }
    });
  }
};

// Export Menu module
window.Menu = Menu;