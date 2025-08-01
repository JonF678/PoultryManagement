class Router {
    constructor() {
        this.routes = {
            'cycles': {
                component: 'cycleOverview',
                title: 'Production Cycles'
            },
            'cage-manager': {
                component: 'cageManager',
                title: 'Cage Management',
                requiresParam: 'cycleId'
            },
            'cage-detail': {
                component: 'cageDetail',
                title: 'Cage Details',
                requiresParam: 'id'
            },
            'cycle-feed': {
                component: 'cycleFeedManager',
                title: 'Cycle Feed & Birds',
                requiresParam: 'cycleId'
            },
            'analytics': {
                component: 'analytics',
                title: 'Analytics Dashboard'
            },
            'sales': {
                component: 'salesManager',
                title: 'Sales Management',
                requiresParam: 'cycleId'
            },
            'expenses': {
                component: 'expenseManager',
                title: 'Expense Management',
                requiresParam: 'cycleId'
            },
            'vaccinations': {
                component: 'vaccinationManager',
                title: 'Vaccination Records',
                requiresParam: 'cycleId'
            },
            'data-manager': {
                component: 'dataManager',
                title: 'Import/Export Data'
            },
            'settings': {
                component: 'settings',
                title: 'Settings'
            }
        };
        
        this.currentRoute = null;
        this.currentParams = {};
        
        this.init();
    }

    init() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const routeElement = e.target.closest('[data-route]');
            if (routeElement) {
                e.preventDefault();
                const route = routeElement.dataset.route;
                this.navigate(route);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });

        // Load initial route
        this.loadInitialRoute();
    }

    loadInitialRoute() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const [route, paramsString] = hash.split('?');
            const params = this.parseParams(paramsString);
            this.navigate(route, params, false);
        } else {
            this.navigate('cycles', {}, false);
        }
    }

    async navigate(route, params = {}, updateHistory = true) {
        const routeConfig = this.routes[route];
        
        if (!routeConfig) {
            console.error(`Route '${route}' not found`);
            this.navigate('cycles', {}, updateHistory);
            return;
        }

        // Check if required parameters are provided
        if (routeConfig.requiresParam && !params[routeConfig.requiresParam]) {
            console.error(`Route '${route}' requires parameter '${routeConfig.requiresParam}'`);
            this.navigate('cycles', {}, updateHistory);
            return;
        }

        this.currentRoute = route;
        this.currentParams = params;

        // Update URL
        if (updateHistory) {
            const url = this.buildUrl(route, params);
            history.pushState({ route, params }, routeConfig.title, url);
        }

        // Update page title
        document.title = `${routeConfig.title} - Poultry Manager`;

        // Update active navigation links
        this.updateActiveNav(route);

        // Load the component
        await this.loadComponent(routeConfig.component, params);
    }

    buildUrl(route, params) {
        let url = `#${route}`;
        const paramString = this.buildParamString(params);
        if (paramString) {
            url += `?${paramString}`;
        }
        return url;
    }

    buildParamString(params) {
        const paramPairs = Object.entries(params).map(([key, value]) => 
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        );
        return paramPairs.join('&');
    }

    parseParams(paramString) {
        const params = {};
        if (!paramString) return params;

        paramString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        });

        return params;
    }

    handlePopState(e) {
        if (e.state) {
            this.navigate(e.state.route, e.state.params, false);
        } else {
            this.loadInitialRoute();
        }
    }

    updateActiveNav(route) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route links
        document.querySelectorAll(`[data-route="${route}"]`).forEach(link => {
            link.classList.add('active');
        });
    }

    async loadComponent(componentName, params) {
        // Show loading spinner
        this.showLoading();

        try {
            switch (componentName) {
                case 'cycleOverview':
                    cycleOverview.init();
                    break;
                case 'cageManager':
                    if (params.cycleId) {
                        cageManager.init(parseInt(params.cycleId));
                    } else {
                        throw new Error('Cycle ID required for cage manager');
                    }
                    break;
                case 'cageDetail':
                    if (params.id) {
                        cageDetail.init(parseInt(params.id));
                    } else {
                        throw new Error('Cage ID required for cage detail');
                    }
                    break;
                case 'cycleFeedManager':
                    if (params.cycleId) {
                        cycleFeedManager.init(parseInt(params.cycleId));
                    } else {
                        throw new Error('Cycle ID required for cycle feed manager');
                    }
                    break;
                case 'analytics':
                    analytics.init(params.cycleId ? parseInt(params.cycleId) : null);
                    break;
                case 'salesManager':
                    if (params.cycleId) {
                        salesManager.init(parseInt(params.cycleId));
                    } else {
                        throw new Error('Cycle ID required for sales manager');
                    }
                    break;
                case 'expenseManager':
                    if (params.cycleId) {
                        expenseManager.init(parseInt(params.cycleId));
                    } else {
                        throw new Error('Cycle ID required for expense manager');
                    }
                    break;
                case 'vaccinationManager':
                    if (params.cycleId) {
                        await vaccinationManager.init(parseInt(params.cycleId));
                    } else {
                        // Redirect to cycles page if no cycle ID provided
                        console.warn('No cycle ID provided for vaccination manager, redirecting to cycles');
                        this.navigate('cycles', {}, true);
                        return;
                    }
                    break;
                case 'dataManager':
                    if (!dataManager.db) {
                        await dataManager.init(db);
                    }
                    const content = document.getElementById('app-content');
                    content.innerHTML = dataManager.render();
                    dataManager.loadCycleOptions();
                    break;
                case 'settings':
                    settings.init();
                    break;
                default:
                    throw new Error(`Component '${componentName}' not found`);
            }
        } catch (error) {
            console.error('Error loading component:', error);
            this.showError(error.message);
        } finally {
            // Hide loading spinner
            this.hideLoading();
        }
    }



    loadSettingsValues() {
        // Load saved settings from localStorage
        const settings = JSON.parse(localStorage.getItem('poultrySettings') || '{}');
        
        if (settings.defaultEggWeight) {
            document.getElementById('defaultEggWeight').value = settings.defaultEggWeight;
        }
        // Set currency with GHS as default
        document.getElementById('currency').value = settings.currency || 'GHS';
        
        if (settings.enableNotifications !== undefined) {
            document.getElementById('enableNotifications').checked = settings.enableNotifications;
        }
    }

    saveSettings() {
        const settings = {
            defaultEggWeight: parseFloat(document.getElementById('defaultEggWeight').value),
            currency: document.getElementById('currency').value,
            enableNotifications: document.getElementById('enableNotifications').checked,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('poultrySettings', JSON.stringify(settings));
        this.showToast('Settings saved successfully!', 'success');
    }

    async exportAllData() {
        try {
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            const feedLogs = await db.getAll('feedLogs');
            const sales = await db.getAll('sales');
            const expenses = await db.getAll('expenses');
            const vaccinations = await db.getAll('vaccinations');

            // Create a comprehensive CSV with all production data
            const allData = [];
            
            // Add production logs with related data
            for (const log of productionLogs) {
                const cycle = cycles.find(c => c.id === log.cycleId);
                const cage = cages.find(c => c.id === log.cageId);
                
                allData.push({
                    Type: 'Production',
                    Date: log.date,
                    Cycle: cycle ? cycle.name : 'Unknown',
                    Cage: cage ? cage.name : 'Unknown',
                    'Flock Age (Days)': log.flockAge || '',
                    'Opening Birds': log.openingBirds || '',
                    'Mortality': log.mortality || 0,
                    'Birds Sold': log.birdsSold || 0,
                    'Closing Birds': log.closingBirds || '',
                    'Eggs Collected': log.eggsCollected || 0,
                    'Production Rate (%)': log.productionRate || '',
                    'Cumulative Production': log.cumulativeProduction || '',
                    'Current Feed (kg)': log.currentFeed || '',
                    'Feed per Bird (kg)': log.feedPerBird || '',
                    'Feed per Egg (g)': log.feedPerEgg || '',
                    'Hen House Production': log.henHouseProduction || '',
                    'Cumulative Mortality': log.cumulativeMortality || '',
                    'Mortality Rate (%)': log.mortalityRate || '',
                    'Notes': log.notes || ''
                });
            }
            
            // Add sales data
            for (const sale of sales) {
                const cycle = cycles.find(c => c.id === sale.cycleId);
                
                allData.push({
                    Type: 'Sale',
                    Date: sale.date,
                    Cycle: cycle ? cycle.name : 'Unknown',
                    'Customer': sale.customer || '',
                    'Crates Sold': sale.crates || '',
                    'Price per Crate (₵)': sale.pricePerCrate || '',
                    'Total Amount (₵)': sale.amount || '',
                    'Payment Method': sale.paymentMethod || '',
                    'Notes': sale.notes || ''
                });
            }
            
            // Add expenses data
            for (const expense of expenses) {
                const cycle = cycles.find(c => c.id === expense.cycleId);
                
                allData.push({
                    Type: 'Expense',
                    Date: expense.date,
                    Cycle: cycle ? cycle.name : 'Unknown',
                    'Category': expense.category || '',
                    'Description': expense.description || '',
                    'Amount (₵)': expense.amount || '',
                    'Vendor': expense.vendor || '',
                    'Notes': expense.notes || ''
                });
            }

            this.downloadCsv(allData, 'poultry-management-complete-data');
            this.showToast('All data exported as CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }

    async exportCycles() {
        try {
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            const sales = await db.getAll('sales');
            const expenses = await db.getAll('expenses');
            
            // Create cycle summary data
            const cycleData = cycles.map(cycle => {
                const cycleCages = cages.filter(c => c.cycleId === cycle.id);
                const cycleLogs = productionLogs.filter(l => l.cycleId === cycle.id);
                const cycleSales = sales.filter(s => s.cycleId === cycle.id);
                const cycleExpenses = expenses.filter(e => e.cycleId === cycle.id);
                
                const totalEggs = cycleLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
                const totalRevenue = cycleSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
                const totalExpenses = cycleExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
                const profit = totalRevenue - totalExpenses;
                
                return {
                    'Cycle Name': cycle.name,
                    'Start Date': cycle.startDate,
                    'End Date': cycle.endDate || 'Active',
                    'Status': cycle.status,
                    'Total Birds': cycle.birdCount,
                    'Number of Cages': cycleCages.length,
                    'Total Eggs Produced': totalEggs,
                    'Total Revenue (₵)': totalRevenue.toFixed(2),
                    'Total Expenses (₵)': totalExpenses.toFixed(2),
                    'Profit (₵)': profit.toFixed(2),
                    'ROI (%)': totalExpenses > 0 ? ((profit / totalExpenses) * 100).toFixed(1) : '0',
                    'Notes': cycle.notes || ''
                };
            });
            
            this.downloadCsv(cycleData, 'poultry-cycles-summary');
            this.showToast('Cycles exported as CSV successfully!', 'success');
        } catch (error) {
            console.error('Error exporting cycles:', error);
            this.showToast('Error exporting cycles. Please try again.', 'error');
        }
    }

    async exportProductionData() {
        try {
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            
            const productionData = productionLogs.map(log => {
                const cycle = cycles.find(c => c.id === log.cycleId);
                const cage = cages.find(c => c.id === log.cageId);
                
                return {
                    'Date': log.date,
                    'Cycle': cycle ? cycle.name : 'Unknown',
                    'Cage': cage ? cage.name : 'Unknown',
                    'Flock Age (Days)': log.flockAge || '',
                    'Flock Age (Weeks)': log.flockAge ? Math.floor(log.flockAge / 7) : '',
                    'Opening Birds': log.openingBirds || '',
                    'Mortality': log.mortality || 0,
                    'Birds Sold': log.birdsSold || 0,
                    'Closing Birds': log.closingBirds || '',
                    'Eggs Collected': log.eggsCollected || 0,
                    'Production Rate (%)': log.productionRate || '',
                    'Cumulative Production': log.cumulativeProduction || '',
                    'Current Feed (kg)': log.currentFeed || '',
                    'Feed per Bird (kg)': log.feedPerBird || '',
                    'Feed per Egg (g)': log.feedPerEgg || '',
                    'Hen House Production': log.henHouseProduction || '',
                    'Cumulative Mortality': log.cumulativeMortality || '',
                    'Mortality Rate (%)': log.mortalityRate || '',
                    'Notes': log.notes || ''
                };
            });
            
            this.downloadCsv(productionData, 'production-data');
            this.showToast('Production data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting production data:', error);
            this.showToast('Error exporting production data. Please try again.', 'error');
        }
    }

    async exportSalesData() {
        try {
            const cycles = await db.getAll('cycles');
            const sales = await db.getAll('sales');
            
            const salesData = sales.map(sale => {
                const cycle = cycles.find(c => c.id === sale.cycleId);
                
                return {
                    'Date': sale.date,
                    'Cycle': cycle ? cycle.name : 'Unknown',
                    'Customer': sale.customer || '',
                    'Crates Sold': sale.crates || '',
                    'Price per Crate (₵)': sale.pricePerCrate || '',
                    'Total Amount (₵)': sale.amount || '',
                    'Payment Method': sale.paymentMethod || '',
                    'Notes': sale.notes || ''
                };
            });
            
            this.downloadCsv(salesData, 'sales-data');
            this.showToast('Sales data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting sales data:', error);
            this.showToast('Error exporting sales data. Please try again.', 'error');
        }
    }

    async exportExpenseData() {
        try {
            const cycles = await db.getAll('cycles');
            const expenses = await db.getAll('expenses');
            
            const expenseData = expenses.map(expense => {
                const cycle = cycles.find(c => c.id === expense.cycleId);
                
                return {
                    'Date': expense.date,
                    'Cycle': cycle ? cycle.name : 'Unknown',
                    'Category': expense.category || '',
                    'Description': expense.description || '',
                    'Amount (₵)': expense.amount || '',
                    'Vendor': expense.vendor || '',
                    'Notes': expense.notes || ''
                };
            });
            
            this.downloadCsv(expenseData, 'expense-data');
            this.showToast('Expense data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting expense data:', error);
            this.showToast('Error exporting expense data. Please try again.', 'error');
        }
    }

    downloadCsv(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('No data to export.', 'warning');
            return;
        }
        
        // Get all unique keys from all objects
        const allKeys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys);
        
        // Create CSV content
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(item => 
                headers.map(key => {
                    const value = item[key] || '';
                    // Escape commas and quotes in values
                    return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');
        
        const dataBlob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    downloadJson(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showToast('Please select a file to import.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.processImportData(data);
                this.showToast('Data imported successfully!', 'success');
                fileInput.value = '';
            } catch (error) {
                console.error('Error importing data:', error);
                this.showToast('Error importing data. Please check the file format.', 'error');
            }
        };

        reader.readAsText(file);
    }

    async processImportData(data) {
        // Validate data structure
        if (data.cycles && Array.isArray(data.cycles)) {
            for (const cycle of data.cycles) {
                await db.add('cycles', cycle);
            }
        }

        if (data.cages && Array.isArray(data.cages)) {
            for (const cage of data.cages) {
                await db.add('cages', cage);
            }
        }

        if (data.productionLogs && Array.isArray(data.productionLogs)) {
            for (const log of data.productionLogs) {
                await db.add('productionLogs', log);
            }
        }

        if (data.feedLogs && Array.isArray(data.feedLogs)) {
            for (const log of data.feedLogs) {
                await db.add('feedLogs', log);
            }
        }
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all cycles, cages, and production data. Are you absolutely sure?')) {
            return;
        }

        try {
            // Clear all object stores
            await db.clear('cycles');
            await db.clear('cages');
            await db.clear('productionLogs');
            await db.clear('feedLogs');
            await db.clear('sales');
            await db.clear('expenses');
            await db.clear('vaccinations');
            
            // Clear any cached analytics data and force refresh
            if (window.analytics && analytics.clearCache) {
                analytics.clearCache();
            }
            
            // Force analytics to reinitialize with empty data
            if (window.analytics) {
                analytics.init();
            }
            
            // Clear localStorage settings if needed (keep user preferences but clear data cache)
            localStorage.removeItem('analyticsCache');
            localStorage.removeItem('lastBackup');
            
            this.showToast('All data cleared successfully!', 'success');
            this.navigate('cycles');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showToast('Error clearing data. Please try again.', 'error');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('d-none');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('d-none');
        }
    }

    showError(message) {
        const content = `
            <div class="text-center mt-5">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <h4 class="mt-3">Error</h4>
                <p class="text-muted">${message}</p>
                <button class="btn btn-primary" onclick="router.navigate('cycles')">
                    <i class="fas fa-home me-2"></i>Go Home
                </button>
            </div>
        `;
        const contentElement = document.getElementById('app-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        } else {
            console.error('Content element not found, error:', message);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastBody = toast.querySelector('.toast-body');
        
        toastBody.textContent = message;
        
        const icon = toast.querySelector('.fas');
        icon.className = type === 'success' ? 'fas fa-check-circle text-success me-2' : 
                        type === 'error' ? 'fas fa-exclamation-circle text-danger me-2' : 
                        type === 'warning' ? 'fas fa-exclamation-triangle text-warning me-2' :
                        'fas fa-info-circle text-primary me-2';
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    goBack() {
        history.back();
    }

    refresh() {
        this.loadComponent(this.routes[this.currentRoute].component, this.currentParams);
    }
}

// Global router instance
const router = new Router();