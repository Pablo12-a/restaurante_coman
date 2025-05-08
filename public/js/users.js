// Users view handler

const Users = {
  // Store users data
  users: [],
  
  // Initialize users view
  async init(container) {
    // Check if user is admin
    if (!Auth.isAdmin()) {
      UI.showError(container, 'No tiene permisos para gestionar usuarios');
      return;
    }
    
    // Render users view template
    UI.renderTemplate('users-view-template', container);
    
    // Set up add user button handler
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.showAddUserForm();
    });
    
    // Load users data
    await this.loadUsers();
  },
  
  // Load users data from API
  async loadUsers() {
    try {
      UI.showLoading('#users-list');
      
      // Fetch users from API
      this.users = await API.auth.getUsers();
      
      // Render users
      this.renderUsers();
    } catch (error) {
      console.error('Error loading users:', error);
      UI.showError('#users-list', 'Error al cargar usuarios');
    }
  },
  
  // Render users list
  renderUsers() {
    const container = document.getElementById('users-list');
    
    // Clear container
    container.innerHTML = '';
    
    // Sort users by role
    this.users.sort((a, b) => {
      const roleOrder = { 'admin': 1, 'chef': 2, 'waiter': 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
    
    // Create table for users
    const usersTable = document.createElement('table');
    usersTable.className = 'users-table';
    
    usersTable.innerHTML = `
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Creado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Users will be added here -->
      </tbody>
    `;
    
    const tbody = usersTable.querySelector('tbody');
    
    // Render each user
    this.users.forEach(user => {
      const tr = document.createElement('tr');
      
      // Get role text
      const roleText = this.getRoleName(user.role);
      const createdAt = user.createdAt ? Utils.formatDate(user.createdAt) : 'N/A';
      
      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.username}</td>
        <td><span class="role-badge ${user.role}">${roleText}</span></td>
        <td>${createdAt}</td>
        <td class="actions">
          <button class="btn btn-sm btn-primary edit-user" data-id="${user._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-user" data-id="${user._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      // Add event listeners
      tr.querySelector('.edit-user').addEventListener('click', () => {
        this.showEditUserForm(user);
      });
      
      tr.querySelector('.delete-user').addEventListener('click', () => {
        this.confirmDeleteUser(user);
      });
      
      tbody.appendChild(tr);
    });
    
    container.appendChild(usersTable);
  },
  
  // Show form to add a new user
  showAddUserForm() {
    // Render form template
    const formContent = UI.renderTemplate('user-form-template', null);
    
    // Set form title
    formContent.getElementById('user-form-title').textContent = 'Agregar Usuario';
    
    // Set up form submission handler
    formContent.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // Get form data
        const formData = new FormData(e.target);
        const userData = {
          name: formData.get('name'),
          username: formData.get('username'),
          password: formData.get('password'),
          role: formData.get('role')
        };
        
        // Create user
        await API.auth.createUser(userData);
        
        // Close modal
        UI.closeModal();
        
        // Reload users
        await this.loadUsers();
        
        // Show success message
        UI.showNotification('Usuario creado correctamente', 'success');
      } catch (error) {
        console.error('Error creating user:', error);
        UI.showNotification('Error al crear usuario', 'error');
      }
    });
    
    // Set up cancel button handler
    formContent.getElementById('cancel-user-form-btn').addEventListener('click', () => {
      UI.closeModal();
    });
    
    // Show modal
    UI.showModal('Agregar Usuario', formContent);
  },
  
  // Show form to edit a user
  showEditUserForm(user) {
    // Render form template
    const formContent = UI.renderTemplate('user-form-template', null);
    
    // Set form title
    formContent.getElementById('user-form-title').textContent = 'Editar Usuario';
    
    // Fill form with user data
    formContent.getElementById('user-name').value = user.name;
    formContent.getElementById('user-username').value = user.username;
    formContent.getElementById('user-role').value = user.role;
    
    // Make password optional for edit
    formContent.getElementById('user-password').required = false;
    formContent.querySelector('label[for="user-password"]').textContent = 'Contraseña (dejar en blanco para no cambiar)';
    
    // Set up form submission handler
    formContent.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        // Get form data
        const formData = new FormData(e.target);
        const userData = {
          name: formData.get('name'),
          username: formData.get('username'),
          role: formData.get('role')
        };
        
        // Only include password if provided
        const password = formData.get('password');
        if (password) {
          userData.password = password;
        }
        
        // Update user (API endpoint to be implemented)
        // await API.auth.updateUser(user._id, userData);
        
        UI.showNotification('La actualización de usuarios no está implementada aún', 'warning');
        
        // Close modal
        UI.closeModal();
      } catch (error) {
        console.error('Error updating user:', error);
        UI.showNotification('Error al actualizar usuario', 'error');
      }
    });
    
    // Set up cancel button handler
    formContent.getElementById('cancel-user-form-btn').addEventListener('click', () => {
      UI.closeModal();
    });
    
    // Show modal
    UI.showModal('Editar Usuario', formContent);
  },
  
  // Confirm user deletion
  confirmDeleteUser(user) {
    // Don't allow deletion of own account
    if (user._id === Auth.currentUser.id) {
      UI.showNotification('No puede eliminar su propia cuenta', 'warning');
      return;
    }
    
    UI.confirm(`¿Está seguro que desea eliminar al usuario "${user.name}"?`, async () => {
      try {
        // Delete user (API endpoint to be implemented)
        // await API.auth.deleteUser(user._id);
        
        UI.showNotification('La eliminación de usuarios no está implementada aún', 'warning');
        
        // Reload users
        // await this.loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        UI.showNotification('Error al eliminar usuario', 'error');
      }
    });
  },
  
  // Get readable role name
  getRoleName(role) {
    const roleMap = {
      'admin': 'Administrador',
      'waiter': 'Mesero',
      'chef': 'Cocinero'
    };
    
    return roleMap[role] || role;
  }
};

// Export Users module
window.Users = Users;