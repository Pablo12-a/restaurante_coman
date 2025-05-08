// Main application entry point

// App namespace
const App = {
  // Current view
  currentView: null,
  
  // View handlers
  viewHandlers: {
    tables: Tables,
    orders: Orders,
    menu: Menu,
    kitchen: Kitchen,
    reports: Reports,
    users: Users
  },
  
  // Initialize app
  async init() {
    try {
      // Initialize UI helpers
      UI.init();
      
      // Check if user is authenticated
      const isAuthenticated = await Auth.init();
      
      if (isAuthenticated) {
        this.showDashboard();
      } else {
        this.showLogin();
      }
      
      // Set up initial datetime display
      Utils.updateDateTimeDisplay();
    } catch (error) {
      console.error('App initialization error:', error);
      this.showLogin();
    }
  },
  
  // Show login screen
  showLogin() {
    const appContainer = document.getElementById('app');
    UI.renderTemplate('login-template', appContainer);
    
    // Set up login form handler
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = loginForm.username.value;
      const password = loginForm.password.value;
      
      if (!username || !password) {
        loginError.textContent = 'Por favor ingrese usuario y contraseña';
        return;
      }
      
      try {
        loginError.textContent = '';
        loginForm.querySelector('button').disabled = true;
        
        await Auth.login(username, password);
        this.showDashboard();
      } catch (error) {
        loginError.textContent = error.message || 'Error al iniciar sesión';
        loginForm.querySelector('button').disabled = false;
      }
    });
    
    // Set logo placeholder
    document.getElementById('logo-placeholder').src = this.getLogoUrl();
  },
  
  // Show main dashboard
  showDashboard() {
    const appContainer = document.getElementById('app');
    UI.renderTemplate('dashboard-template', appContainer);
    
    // Update UI elements based on user role
    Auth.updateUIByRole();
    
    // Set logo placeholder
    document.getElementById('sidebar-logo-placeholder').src = this.getLogoUrl();
    
    // Set up navigation handlers
    document.querySelectorAll('.main-nav a[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = link.getAttribute('data-view');
        this.showView(viewName);
        
        // Update active link
        document.querySelectorAll('.main-nav a').forEach(navLink => {
          navLink.classList.remove('active');
        });
        link.classList.add('active');
        
        // On mobile, close sidebar after navigation
        if (Utils.isMobileDevice()) {
          UI.toggleSidebar();
        }
      });
    });
    
    // Set up logout handler
    document.getElementById('logout-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      
      UI.confirm('¿Está seguro que desea cerrar sesión?', async () => {
        await Auth.logout();
        this.showLogin();
      });
    });
    
    // Initialize timer to update date/time
    setInterval(() => {
      Utils.updateDateTimeDisplay();
    }, 60000);
    
    // Show initial view (tables)
    this.showView('tables');
    document.querySelector('.main-nav a[data-view="tables"]').classList.add('active');
  },
  
  // Show a specific view
  showView(viewName) {
    // Skip if already on this view
    if (this.currentView === viewName) return;
    
    // Get view container
    const viewContainer = document.querySelector('.view-container');
    
    // Update current view
    this.currentView = viewName;
    
    // Update view title
    const viewTitles = {
      tables: 'Mesas',
      orders: 'Órdenes',
      menu: 'Menú',
      kitchen: 'Cocina',
      reports: 'Reportes',
      users: 'Usuarios'
    };
    
    UI.setViewTitle(viewTitles[viewName] || viewName);
    
    // Check if view handler exists
    if (this.viewHandlers[viewName]) {
      UI.showLoading(viewContainer);
      
      // Initialize and render view
      this.viewHandlers[viewName].init(viewContainer);
    } else {
      UI.showError(viewContainer, `Vista no implementada: ${viewName}`);
    }
  },
  
  // Get logo URL (placeholder or actual logo)
  getLogoUrl() {
    // Check if logo exists, otherwise use a placeholder
    const logoUrl = '/img/logo.png';
    const placeholderUrl = 'https://via.placeholder.com/120x120?text=Los+Compaitos';
    
    // For demo purposes, use placeholder
    return placeholderUrl;
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});