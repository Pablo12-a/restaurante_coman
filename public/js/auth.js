// Authentication related functionality

const Auth = {
  // Current user data
  currentUser: null,
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  },
  
  // Check if user has specific role
  hasRole(role) {
    return this.isAuthenticated() && this.currentUser.role === role;
  },
  
  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  },
  
  // Check if user is chef
  isChef() {
    return this.hasRole('chef') || this.isAdmin();
  },
  
  // Initialize authentication state
  async init() {
    try {
      // Try to get current user
      const { user } = await API.auth.getCurrentUser();
      this.currentUser = user;
      return true;
    } catch (error) {
      // No authenticated user
      this.currentUser = null;
      return false;
    }
  },
  
  // Login user
  async login(username, password) {
    try {
      const { user } = await API.auth.login({ username, password });
      this.currentUser = user;
      return user;
    } catch (error) {
      throw new Error(error.data?.message || 'Login failed');
    }
  },
  
  // Logout user
  async logout() {
    try {
      await API.auth.logout();
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear current user even if API call fails
      this.currentUser = null;
    }
  },
  
  // Show or hide elements based on user role
  updateUIByRole() {
    // Hide admin-only elements for non-admins
    document.querySelectorAll('.admin-only').forEach(el => {
      if (this.isAdmin()) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
    
    // Hide chef-only elements for non-chefs
    document.querySelectorAll('.chef-only').forEach(el => {
      if (this.isChef()) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
    
    // Update user info in sidebar
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    
    if (userNameEl && this.currentUser) {
      userNameEl.textContent = this.currentUser.name;
    }
    
    if (userRoleEl && this.currentUser) {
      const roleMap = {
        admin: 'Administrador',
        waiter: 'Mesero',
        chef: 'Cocinero'
      };
      userRoleEl.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
    }
  }
};

// Export Auth service
window.Auth = Auth;