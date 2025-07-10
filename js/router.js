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
            'analytics': {
                component: 'analytics',
                title: 'Analytics Dashboard'
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

    navigate(route, params = {}, updateHistory = true) {
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
        this.loadComponent(routeConfig.component, params);
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

    loadComponent(componentName, params) {
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
                case 'analytics':
                    analytics.init(params.cycleId ? parseInt(params.cycleId) : null);
                    break;
                case 'settings':
                    this.loadSettings();
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

    loadSettings() {
        const content = `
            <div class="settings fade-in">
                <h2>Settings</h2>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Application Settings</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="defaultEggWeight" class="form-label">Default Egg Weight (g)</label>
                                    <input type="number" class="form-control" id="defaultEggWeight" value="60">
                                </div>
                                <div class="mb-3">
                                    <label for="currency" class="form-label">Currency</label>
                                    <select class="form-select" id="currency">
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="enableNotifications" checked>
                                    <label class="form-check-label" for="enableNotifications">
                                        Enable Notifications
                                    </label>
                                </div>
                                <button class="btn btn-primary" onclick="router.saveSettings()">Save Settings</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Data Management</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">Export Data</label>
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-outline-primary" onclick="router.exportAllData()">
                                            <i class="fas fa-download me-2"></i>Export All Data
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="router.exportCycles()">
                                            <i class="fas fa-layer-group me-2"></i>Export Cycles
                                        </button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Import Data</label>
                                    <input type="file" class="form-control" id="importFile" accept=".json">
                                    <button class="btn btn-outline-success mt-2" onclick="router.importData()">
                                        <i class="fas fa-upload me-2"></i>Import Data
                                    </button>
                                </div>
                                <hr>
                                <div class="mb-3">
                                    <label class="form-label text-danger">Danger Zone</label>
                                    <button class="btn btn-outline-danger d-block" onclick="router.clearAllData()">
                                        <i class="fas fa-trash me-2"></i>Clear All Data
                                    </button>
                                    <small class="text-muted">This action cannot be undone</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
        this.loadSettingsValues();
    }

    loadSettingsValues() {
        // Load saved settings from localStorage
        const settings = JSON.parse(localStorage.getItem('poultrySettings') || '{}');
        
        if (settings.defaultEggWeight) {
            document.getElementById('defaultEggWeight').value = settings.defaultEggWeight;
        }
        if (settings.currency) {
            document.getElementById('currency').value = settings.currency;
        }
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

            const exportData = {
                cycles,
                cages,
                productionLogs,
                feedLogs,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            this.downloadJson(exportData, 'poultry-management-full-export');
            this.showToast('All data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }

    async exportCycles() {
        try {
            const cycles = await db.getAll('cycles');
            this.downloadJson(cycles, 'poultry-cycles-export');
            this.showToast('Cycles exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting cycles:', error);
            this.showToast('Error exporting cycles. Please try again.', 'error');
        }
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
            await db.clear('cycles');
            await db.clear('cages');
            await db.clear('productionLogs');
            await db.clear('feedLogs');
            
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
        document.getElementById('app-content').innerHTML = content;
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