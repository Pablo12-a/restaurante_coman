// UI helper functions and components

const UI = {
  // Templates
  templates: {},

  // Initialize UI helpers
  init() {
    // Load all templates
    document.querySelectorAll('template').forEach(template => {
      this.templates[template.id] = template;
    });
    
    // Setup modal close handler
    document.addEventListener('click', event => {
      if (event.target.classList.contains('modal-overlay') || 
          event.target.classList.contains('modal-close')) {
        this.closeModal();
      }
    });
    
    // Setup mobile menu toggle
    document.addEventListener('click', event => {
      if (event.target.id === 'menu-toggle') {
        this.toggleSidebar();
      }
    });
  },
  
  // Render a template
  renderTemplate(templateId, container, data = {}) {
    const template = this.templates[templateId];
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }
    
    const clone = document.importNode(template.content, true);
    
    // Replace any placeholders with data
    if (data) {
      // Process text content replacements
      clone.querySelectorAll('[id]').forEach(el => {
        const id = el.id;
        if (data[id] !== undefined) {
          el.textContent = data[id];
        }
      });
      
      // Process attribute replacements
      clone.querySelectorAll('[data-attr]').forEach(el => {
        const attrs = el.dataset.attr.split(',');
        attrs.forEach(attr => {
          const [attrName, dataKey] = attr.split(':');
          if (data[dataKey] !== undefined) {
            el.setAttribute(attrName, data[dataKey]);
          }
        });
      });
    }
    
    // If container is provided, append the template
    if (container) {
      if (typeof container === 'string') {
        container = document.querySelector(container);
      }
      
      if (container) {
        container.innerHTML = '';
        container.appendChild(clone);
      }
    }
    
    return clone;
  },
  
  // Show a modal dialog
  showModal(title, content) {
    // Remove any existing modal
    this.closeModal();
    
    // Create modal from template
    const modalTemplate = this.templates['modal-template'];
    const modal = document.importNode(modalTemplate.content, true);
    
    // Set modal title
    modal.querySelector('.modal-title').textContent = title;
    
    // Set modal content
    const modalBody = modal.querySelector('.modal-body');
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else {
      modalBody.appendChild(content);
    }
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Return the modal element
    return document.querySelector('.modal');
  },
  
  // Close modal dialog
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  },
  
  // Show loading indicator
  showLoading(container, message = 'Cargando...') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
    }
  },
  
  // Show error message
  showError(container, message = 'Ha ocurrido un error') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>${message}</span>
        </div>
      `;
    }
  },
  
  // Show empty state message
  showEmptyState(container, message = 'No hay datos disponibles') {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (container) {
      container.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-inbox"></i>
          <p>${message}</p>
        </div>
      `;
    }
  },
  
  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-close after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, duration);
    }
    
    return notification;
  },
  
  // Get icon for notification type
  getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info':
      default: return 'fa-info-circle';
    }
  },
  
  // Toggle sidebar collapse
  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
  },
  
  // Set active view title
  setViewTitle(title) {
    const titleElement = document.querySelector('.view-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  },
  
  // Create a confirmation dialog
  confirm(message, okCallback, cancelCallback = null) {
    const content = document.createElement('div');
    content.className = 'confirm-dialog';
    content.innerHTML = `
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
        <button class="btn btn-primary" id="confirm-ok">Aceptar</button>
      </div>
    `;
    
    const modal = this.showModal('Confirmar', content);
    
    // Set up event handlers
    modal.querySelector('#confirm-ok').addEventListener('click', () => {
      this.closeModal();
      if (okCallback) okCallback();
    });
    
    modal.querySelector('#confirm-cancel').addEventListener('click', () => {
      this.closeModal();
      if (cancelCallback) cancelCallback();
    });
  },
  
  // Create a custom dialog with form inputs
  prompt(title, fields, submitCallback, cancelCallback = null) {
    const content = document.createElement('div');
    content.className = 'prompt-dialog';
    
    let fieldsHTML = '';
    fields.forEach(field => {
      const inputType = field.type || 'text';
      const required = field.required ? 'required' : '';
      const value = field.value !== undefined ? `value="${field.value}"` : '';
      
      if (inputType === 'select') {
        let options = '';
        if (field.options) {
          field.options.forEach(option => {
            const selected = option.value === field.value ? 'selected' : '';
            options += `<option value="${option.value}" ${selected}>${option.label}</option>`;
          });
        }
        
        fieldsHTML += `
          <div class="form-group">
            <label for="prompt-${field.name}">${field.label}</label>
            <select id="prompt-${field.name}" name="${field.name}" ${required}>
              ${options}
            </select>
          </div>
        `;
      } else if (inputType === 'textarea') {
        const textValue = field.value || '';
        fieldsHTML += `
          <div class="form-group">
            <label for="prompt-${field.name}">${field.label}</label>
            <textarea id="prompt-${field.name}" name="${field.name}" rows="${field.rows || 3}" ${required}>${textValue}</textarea>
          </div>
        `;
      } else {
        fieldsHTML += `
          <div class="form-group">
            <label for="prompt-${field.name}">${field.label}</label>
            <input type="${inputType}" id="prompt-${field.name}" name="${field.name}" ${value} ${required}>
          </div>
        `;
      }
    });
    
    content.innerHTML = `
      <form id="prompt-form">
        ${fieldsHTML}
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="prompt-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Aceptar</button>
        </div>
      </form>
    `;
    
    const modal = this.showModal(title, content);
    
    // Set up event handlers
    modal.querySelector('#prompt-form').addEventListener('submit', e => {
      e.preventDefault();
      
      // Get form data
      const formData = {};
      fields.forEach(field => {
        const input = modal.querySelector(`#prompt-${field.name}`);
        formData[field.name] = input.value;
      });
      
      this.closeModal();
      if (submitCallback) submitCallback(formData);
    });
    
    modal.querySelector('#prompt-cancel').addEventListener('click', () => {
      this.closeModal();
      if (cancelCallback) cancelCallback();
    });
  }
};

// Export UI service
window.UI = UI;