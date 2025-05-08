// Reports view handler

const Reports = {
  // Initialize reports view
  async init(container) {
    // Check if user is admin
    if (!Auth.isAdmin()) {
      UI.showError(container, 'No tiene permisos para acceder a los reportes');
      return;
    }
    
    // Render reports view template
    UI.renderTemplate('reports-view-template', container);
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('report-end-date').value = this.formatDateForInput(today);
    document.getElementById('report-start-date').value = this.formatDateForInput(thirtyDaysAgo);
    
    // Set up generate report button handler
    document.getElementById('generate-report-btn').addEventListener('click', () => {
      this.generateReport();
    });
    
    // Set up report type change handler
    document.getElementById('report-type').addEventListener('change', () => {
      this.generateReport();
    });
    
    // Generate initial report
    this.generateReport();
  },
  
  // Generate report based on selected type and date range
  async generateReport() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    if (!startDate || !endDate) {
      UI.showNotification('Por favor seleccione un rango de fechas', 'warning');
      return;
    }
    
    const container = document.getElementById('report-container');
    UI.showLoading(container);
    
    try {
      // Fetch orders within date range
      const orders = await this.fetchOrdersByDateRange(startDate, endDate);
      
      switch (reportType) {
        case 'sales':
          this.renderSalesReport(container, orders, startDate, endDate);
          break;
        case 'items':
          this.renderItemsReport(container, orders, startDate, endDate);
          break;
        case 'waiters':
          this.renderWaitersReport(container, orders, startDate, endDate);
          break;
        case 'tables':
          this.renderTablesReport(container, orders, startDate, endDate);
          break;
        default:
          UI.showError(container, 'Tipo de reporte no válido');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      UI.showError(container, 'Error al generar reporte');
    }
  },
  
  // Fetch orders by date range
  async fetchOrdersByDateRange(startDate, endDate) {
    try {
      // Convert date strings to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      // Fetch all orders
      const allOrders = await API.orders.getAll();
      
      // Filter orders by date range
      return allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Error al obtener órdenes');
    }
  },
  
  // Render sales report
  renderSalesReport(container, orders, startDate, endDate) {
    // Calculate total sales
    const totalSales = orders.reduce((total, order) => {
      return total + (order.status !== 'cancelled' ? order.totalAmount : 0);
    }, 0);
    
    // Count completed and cancelled orders
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Group sales by date
    const salesByDate = {};
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      const date = Utils.formatDate(order.createdAt);
      salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
    });
    
    // Create date array for chart
    const dates = Object.keys(salesByDate).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    // Prepare report HTML
    let reportHTML = `
      <div class="report-header">
        <h2>Reporte de Ventas</h2>
        <p>Periodo: ${Utils.formatDate(startDate)} al ${Utils.formatDate(endDate)}</p>
      </div>
      
      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-value">$${Utils.formatCurrency(totalSales)}</div>
          <div class="summary-label">Ventas totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${orders.length}</div>
          <div class="summary-label">Órdenes totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${completedOrders}</div>
          <div class="summary-label">Órdenes completadas</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${cancelledOrders}</div>
          <div class="summary-label">Órdenes canceladas</div>
        </div>
      </div>
      
      <div class="report-chart">
        <h3>Ventas por Día</h3>
        <div class="sales-chart">
          <!-- Chart would be rendered here with a real chart library -->
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ventas</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    dates.forEach(date => {
      reportHTML += `
        <tr>
          <td>${date}</td>
          <td>$${Utils.formatCurrency(salesByDate[date])}</td>
        </tr>
      `;
    });
    
    reportHTML += `
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="report-actions">
        <button class="btn btn-primary" id="print-report-btn">
          <i class="fas fa-print"></i> Imprimir Reporte
        </button>
      </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
    
    // Setup print report handler
    document.getElementById('print-report-btn').addEventListener('click', () => {
      this.printReport('sales', orders, startDate, endDate);
    });
  },
  
  // Render popular items report
  renderItemsReport(container, orders, startDate, endDate) {
    // Count item popularity
    const itemsCount = {};
    const itemsRevenue = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      order.items.forEach(item => {
        const itemName = item.name;
        itemsCount[itemName] = (itemsCount[itemName] || 0) + item.quantity;
        itemsRevenue[itemName] = (itemsRevenue[itemName] || 0) + (item.price * item.quantity);
      });
    });
    
    // Convert to array and sort by count
    const itemsArray = Object.keys(itemsCount).map(name => ({
      name,
      count: itemsCount[name],
      revenue: itemsRevenue[name]
    }));
    
    // Sort by count descending
    itemsArray.sort((a, b) => b.count - a.count);
    
    // Prepare report HTML
    let reportHTML = `
      <div class="report-header">
        <h2>Reporte de Items Populares</h2>
        <p>Periodo: ${Utils.formatDate(startDate)} al ${Utils.formatDate(endDate)}</p>
      </div>
      
      <div class="report-chart">
        <h3>Items por Popularidad</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    itemsArray.forEach(item => {
      reportHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.count}</td>
          <td>$${Utils.formatCurrency(item.revenue)}</td>
        </tr>
      `;
    });
    
    reportHTML += `
          </tbody>
        </table>
      </div>
      
      <div class="report-actions">
        <button class="btn btn-primary" id="print-report-btn">
          <i class="fas fa-print"></i> Imprimir Reporte
        </button>
      </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
    
    // Setup print report handler
    document.getElementById('print-report-btn').addEventListener('click', () => {
      this.printReport('items', orders, startDate, endDate);
    });
  },
  
  // Render waiters performance report
  renderWaitersReport(container, orders, startDate, endDate) {
    // Group orders by waiter
    const waiterOrders = {};
    const waiterSales = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      let waiterName = 'N/A';
      let waiterId = null;
      
      if (order.waiter) {
        if (typeof order.waiter === 'object') {
          waiterName = order.waiter.name;
          waiterId = order.waiter._id;
        } else {
          waiterId = order.waiter;
          waiterName = `Mesero #${waiterId}`;
        }
      }
      
      // Create waiter key
      const waiterKey = waiterId || 'unknown';
      
      // Initialize arrays if needed
      if (!waiterOrders[waiterKey]) {
        waiterOrders[waiterKey] = {
          name: waiterName,
          count: 0,
          totalSales: 0
        };
      }
      
      // Add order to count
      waiterOrders[waiterKey].count++;
      waiterOrders[waiterKey].totalSales += order.totalAmount;
    });
    
    // Convert to array and sort by sales
    const waitersArray = Object.values(waiterOrders);
    waitersArray.sort((a, b) => b.totalSales - a.totalSales);
    
    // Prepare report HTML
    let reportHTML = `
      <div class="report-header">
        <h2>Reporte de Desempeño de Meseros</h2>
        <p>Periodo: ${Utils.formatDate(startDate)} al ${Utils.formatDate(endDate)}</p>
      </div>
      
      <div class="report-chart">
        <h3>Meseros por Ventas</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mesero</th>
              <th>Órdenes</th>
              <th>Ventas Totales</th>
              <th>Promedio por Orden</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    waitersArray.forEach(waiter => {
      const avgSale = waiter.count > 0 ? waiter.totalSales / waiter.count : 0;
      
      reportHTML += `
        <tr>
          <td>${waiter.name}</td>
          <td>${waiter.count}</td>
          <td>$${Utils.formatCurrency(waiter.totalSales)}</td>
          <td>$${Utils.formatCurrency(avgSale)}</td>
        </tr>
      `;
    });
    
    reportHTML += `
          </tbody>
        </table>
      </div>
      
      <div class="report-actions">
        <button class="btn btn-primary" id="print-report-btn">
          <i class="fas fa-print"></i> Imprimir Reporte
        </button>
      </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
    
    // Setup print report handler
    document.getElementById('print-report-btn').addEventListener('click', () => {
      this.printReport('waiters', orders, startDate, endDate);
    });
  },
  
  // Render tables usage report
  renderTablesReport(container, orders, startDate, endDate) {
    // Group orders by table
    const tableOrders = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      let tableNumber = order.tableNumber || 'N/A';
      let tableId = null;
      
      if (order.table) {
        if (typeof order.table === 'object') {
          tableNumber = order.table.number;
          tableId = order.table._id;
        } else {
          tableId = order.table;
          tableNumber = `Mesa #${tableNumber}`;
        }
      }
      
      // Create table key
      const tableKey = tableId || 'unknown';
      
      // Initialize arrays if needed
      if (!tableOrders[tableKey]) {
        tableOrders[tableKey] = {
          number: tableNumber,
          count: 0,
          totalSales: 0
        };
      }
      
      // Add order to count
      tableOrders[tableKey].count++;
      tableOrders[tableKey].totalSales += order.totalAmount;
    });
    
    // Convert to array and sort by usage count
    const tablesArray = Object.values(tableOrders);
    tablesArray.sort((a, b) => b.count - a.count);
    
    // Prepare report HTML
    let reportHTML = `
      <div class="report-header">
        <h2>Reporte de Uso de Mesas</h2>
        <p>Periodo: ${Utils.formatDate(startDate)} al ${Utils.formatDate(endDate)}</p>
      </div>
      
      <div class="report-chart">
        <h3>Mesas por Uso</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Órdenes</th>
              <th>Ventas Totales</th>
              <th>Promedio por Orden</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    tablesArray.forEach(table => {
      const avgSale = table.count > 0 ? table.totalSales / table.count : 0;
      
      reportHTML += `
        <tr>
          <td>${table.number}</td>
          <td>${table.count}</td>
          <td>$${Utils.formatCurrency(table.totalSales)}</td>
          <td>$${Utils.formatCurrency(avgSale)}</td>
        </tr>
      `;
    });
    
    reportHTML += `
          </tbody>
        </table>
      </div>
      
      <div class="report-actions">
        <button class="btn btn-primary" id="print-report-btn">
          <i class="fas fa-print"></i> Imprimir Reporte
        </button>
      </div>
    `;
    
    // Set report HTML
    container.innerHTML = reportHTML;
    
    // Setup print report handler
    document.getElementById('print-report-btn').addEventListener('click', () => {
      this.printReport('tables', orders, startDate, endDate);
    });
  },
  
  // Print report
  printReport(reportType, orders, startDate, endDate) {
    // Create report title
    let reportTitle = '';
    switch (reportType) {
      case 'sales': reportTitle = 'Reporte de Ventas'; break;
      case 'items': reportTitle = 'Reporte de Items Populares'; break;
      case 'waiters': reportTitle = 'Reporte de Desempeño de Meseros'; break;
      case 'tables': reportTitle = 'Reporte de Uso de Mesas'; break;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Write basic HTML
    printWindow.document.write(`
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1, h2, h3 { text-align: center; }
          .report-header { text-align: center; margin-bottom: 20px; }
          .report-summary { display: flex; justify-content: space-around; margin-bottom: 20px; }
          .summary-card { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .summary-value { font-size: 24px; font-weight: bold; }
          .summary-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Los Compaitos</h1>
          <h2>${reportTitle}</h2>
          <p>Periodo: ${Utils.formatDate(startDate)} al ${Utils.formatDate(endDate)}</p>
        </div>
    `);
    
    // Add report content based on type
    switch (reportType) {
      case 'sales':
        this.printSalesReport(printWindow, orders);
        break;
      case 'items':
        this.printItemsReport(printWindow, orders);
        break;
      case 'waiters':
        this.printWaitersReport(printWindow, orders);
        break;
      case 'tables':
        this.printTablesReport(printWindow, orders);
        break;
    }
    
    // Add footer and close HTML
    printWindow.document.write(`
        <div class="footer">
          <p>Generado el ${Utils.formatDateTime(new Date())}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Print after content is loaded
    printWindow.onload = function() {
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  },
  
  // Print sales report content
  printSalesReport(printWindow, orders) {
    // Calculate total sales
    const totalSales = orders.reduce((total, order) => {
      return total + (order.status !== 'cancelled' ? order.totalAmount : 0);
    }, 0);
    
    // Count completed and cancelled orders
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Group sales by date
    const salesByDate = {};
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      const date = Utils.formatDate(order.createdAt);
      salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
    });
    
    // Create date array for table
    const dates = Object.keys(salesByDate).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    // Write summary
    printWindow.document.write(`
      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-value">$${Utils.formatCurrency(totalSales)}</div>
          <div class="summary-label">Ventas totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${orders.length}</div>
          <div class="summary-label">Órdenes totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${completedOrders}</div>
          <div class="summary-label">Órdenes completadas</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${cancelledOrders}</div>
          <div class="summary-label">Órdenes canceladas</div>
        </div>
      </div>
      
      <h3>Ventas por Día</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ventas</th>
          </tr>
        </thead>
        <tbody>
    `);
    
    // Add table rows
    dates.forEach(date => {
      printWindow.document.write(`
        <tr>
          <td>${date}</td>
          <td>$${Utils.formatCurrency(salesByDate[date])}</td>
        </tr>
      `);
    });
    
    printWindow.document.write('</tbody></table>');
  },
  
  // Print items report content
  printItemsReport(printWindow, orders) {
    // Count item popularity
    const itemsCount = {};
    const itemsRevenue = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      order.items.forEach(item => {
        const itemName = item.name;
        itemsCount[itemName] = (itemsCount[itemName] || 0) + item.quantity;
        itemsRevenue[itemName] = (itemsRevenue[itemName] || 0) + (item.price * item.quantity);
      });
    });
    
    // Convert to array and sort by count
    const itemsArray = Object.keys(itemsCount).map(name => ({
      name,
      count: itemsCount[name],
      revenue: itemsRevenue[name]
    }));
    
    // Sort by count descending
    itemsArray.sort((a, b) => b.count - a.count);
    
    // Write table
    printWindow.document.write(`
      <h3>Items por Popularidad</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Cantidad</th>
            <th>Ingresos</th>
          </tr>
        </thead>
        <tbody>
    `);
    
    // Add table rows
    itemsArray.forEach(item => {
      printWindow.document.write(`
        <tr>
          <td>${item.name}</td>
          <td>${item.count}</td>
          <td>$${Utils.formatCurrency(item.revenue)}</td>
        </tr>
      `);
    });
    
    printWindow.document.write('</tbody></table>');
  },
  
  // Print waiters report content
  printWaitersReport(printWindow, orders) {
    // Group orders by waiter
    const waiterOrders = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      let waiterName = 'N/A';
      let waiterId = null;
      
      if (order.waiter) {
        if (typeof order.waiter === 'object') {
          waiterName = order.waiter.name;
          waiterId = order.waiter._id;
        } else {
          waiterId = order.waiter;
          waiterName = `Mesero #${waiterId}`;
        }
      }
      
      // Create waiter key
      const waiterKey = waiterId || 'unknown';
      
      // Initialize arrays if needed
      if (!waiterOrders[waiterKey]) {
        waiterOrders[waiterKey] = {
          name: waiterName,
          count: 0,
          totalSales: 0
        };
      }
      
      // Add order to count
      waiterOrders[waiterKey].count++;
      waiterOrders[waiterKey].totalSales += order.totalAmount;
    });
    
    // Convert to array and sort by sales
    const waitersArray = Object.values(waiterOrders);
    waitersArray.sort((a, b) => b.totalSales - a.totalSales);
    
    // Write table
    printWindow.document.write(`
      <h3>Meseros por Ventas</h3>
      <table>
        <thead>
          <tr>
            <th>Mesero</th>
            <th>Órdenes</th>
            <th>Ventas Totales</th>
            <th>Promedio por Orden</th>
          </tr>
        </thead>
        <tbody>
    `);
    
    // Add table rows
    waitersArray.forEach(waiter => {
      const avgSale = waiter.count > 0 ? waiter.totalSales / waiter.count : 0;
      
      printWindow.document.write(`
        <tr>
          <td>${waiter.name}</td>
          <td>${waiter.count}</td>
          <td>$${Utils.formatCurrency(waiter.totalSales)}</td>
          <td>$${Utils.formatCurrency(avgSale)}</td>
        </tr>
      `);
    });
    
    printWindow.document.write('</tbody></table>');
  },
  
  // Print tables report content
  printTablesReport(printWindow, orders) {
    // Group orders by table
    const tableOrders = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      let tableNumber = order.tableNumber || 'N/A';
      let tableId = null;
      
      if (order.table) {
        if (typeof order.table === 'object') {
          tableNumber = order.table.number;
          tableId = order.table._id;
        } else {
          tableId = order.table;
          tableNumber = `Mesa #${tableNumber}`;
        }
      }
      
      // Create table key
      const tableKey = tableId || 'unknown';
      
      // Initialize arrays if needed
      if (!tableOrders[tableKey]) {
        tableOrders[tableKey] = {
          number: tableNumber,
          count: 0,
          totalSales: 0
        };
      }
      
      // Add order to count
      tableOrders[tableKey].count++;
      tableOrders[tableKey].totalSales += order.totalAmount;
    });
    
    // Convert to array and sort by usage count
    const tablesArray = Object.values(tableOrders);
    tablesArray.sort((a, b) => b.count - a.count);
    
    // Write table
    printWindow.document.write(`
      <h3>Mesas por Uso</h3>
      <table>
        <thead>
          <tr>
            <th>Mesa</th>
            <th>Órdenes</th>
            <th>Ventas Totales</th>
            <th>Promedio por Orden</th>
          </tr>
        </thead>
        <tbody>
    `);
    
    // Add table rows
    tablesArray.forEach(table => {
      const avgSale = table.count > 0 ? table.totalSales / table.count : 0;
      
      printWindow.document.write(`
        <tr>
          <td>${table.number}</td>
          <td>${table.count}</td>
          <td>$${Utils.formatCurrency(table.totalSales)}</td>
          <td>$${Utils.formatCurrency(avgSale)}</td>
        </tr>
      `);
    });
    
    printWindow.document.write('</tbody></table>');
  },
  
  // Format date for input field
  formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }
};

// Export Reports module
window.Reports = Reports;