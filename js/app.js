class PoultryApp {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.router = null;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Show loading screen
            this.showLoadingScreen();

            // Initialize database
            await this.initDatabase();

            // Register service worker
            await this.registerServiceWorker();

            // Initialize components
            this.initializeComponents();

            // Hide loading screen
            this.hideLoadingScreen();

            this.initialized = true;
            console.log('Poultry Management App initialized successfully');

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showErrorScreen(error.message);
        }
    }

    async initDatabase() {
        try {
            await db.init();
            this.db = db;
            console.log('Database initialized successfully');
            
            // Generate sample data if this is the first run
            await sampleDataGenerator.generateSampleData();
            
            // Debug analytics if needed
            console.log('Running analytics debug check...');
            setTimeout(() => {
                if (window.debugAnalytics) {
                    window.debugAnalytics();
                }
            }, 1000);
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw new Error('Failed to initialize database. Please refresh the page.');
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
                // Continue without service worker
            }
        }
    }

    initializeComponents() {
        // Router is already initialized in router.js
        // Additional app-level initialization can go here
        
        // Set up global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showToast('An unexpected error occurred. Please refresh the page if problems persist.', 'error');
        });

        // Set up unhandled promise rejection handling
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showToast('An unexpected error occurred. Please refresh the page if problems persist.', 'error');
            e.preventDefault();
        });

        // Initialize app settings
        this.initializeSettings();

        // Set up periodic data backup
        this.setupPeriodicBackup();
    }

    initializeSettings() {
        const defaultSettings = {
            defaultEggWeight: 60,
            currency: 'GHS',
            enableNotifications: true,
            theme: 'light',
            language: 'en'
        };

        const savedSettings = localStorage.getItem('poultrySettings');
        if (!savedSettings) {
            localStorage.setItem('poultrySettings', JSON.stringify(defaultSettings));
        }
    }

    setupPeriodicBackup() {
        // Create backup every 24 hours
        setInterval(() => {
            this.createAutoBackup();
        }, 24 * 60 * 60 * 1000);

        // Create backup on app start if last backup is older than 7 days
        const lastBackup = localStorage.getItem('lastAutoBackup');
        if (!lastBackup || (Date.now() - parseInt(lastBackup)) > 7 * 24 * 60 * 60 * 1000) {
            setTimeout(() => this.createAutoBackup(), 5000);
        }
    }

    async createAutoBackup() {
        try {
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            const feedLogs = await db.getAll('feedLogs');

            const backupData = {
                cycles,
                cages,
                productionLogs,
                feedLogs,
                backupDate: new Date().toISOString(),
                version: '1.0'
            };

            // Store in localStorage (with size limit)
            const backupJson = JSON.stringify(backupData);
            if (backupJson.length < 5000000) { // 5MB limit
                localStorage.setItem('autoBackup', backupJson);
                localStorage.setItem('lastAutoBackup', Date.now().toString());
                console.log('Auto backup created successfully');
            }
        } catch (error) {
            console.warn('Auto backup failed:', error);
        }
    }

    showLoadingScreen() {
        const loadingHtml = `
            <div class="loading-overlay" id="app-loading">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5>Loading Poultry Manager</h5>
                    <p class="text-muted">Initializing database and components...</p>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHtml);
    }

    hideLoadingScreen() {
        const loading = document.getElementById('app-loading');
        if (loading) {
            loading.remove();
        }
    }

    showErrorScreen(message) {
        const errorHtml = `
            <div class="loading-overlay" id="app-error">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-danger mb-3" style="font-size: 3rem;"></i>
                    <h4>Application Error</h4>
                    <p class="text-muted mb-4">${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Reload Application
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHtml);
    }

    showUpdateNotification() {
        const notification = `
            <div class="alert alert-info alert-dismissible position-fixed top-0 end-0 m-3" style="z-index: 9999;">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Update Available!</strong> A new version is ready.
                <button type="button" class="btn btn-sm btn-outline-primary ms-2" onclick="location.reload()">
                    Update Now
                </button>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notification);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
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

    // Utility methods
    formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    formatCurrency(amount, currency = null) {
        // Get user's preferred currency from settings, default to GHS
        if (!currency) {
            const settings = JSON.parse(localStorage.getItem('poultrySettings') || '{}');
            currency = settings.currency || 'GHS';
        }
        
        // Currency symbol mapping
        const currencySymbols = {
            'GHS': '₵',
            'USD': '$',
            'GBP': '£'
        };
        
        // Use simple format with currency symbol for better compatibility
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
    }

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Data validation methods
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    }

    validateDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Performance monitoring
    startPerformanceTimer(label) {
        console.time(label);
    }

    endPerformanceTimer(label) {
        console.timeEnd(label);
    }

    // Memory management
    cleanup() {
        // Clean up any event listeners, timers, etc.
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        
        // Destroy charts
        if (window.chartManager) {
            chartManager.destroyAllCharts();
        }
    }
}

// Global app instance
const app = new PoultryApp();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Handle app installation prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    const installBanner = document.createElement('div');
    installBanner.className = 'alert alert-info alert-dismissible position-fixed bottom-0 end-0 m-3';
    installBanner.style.zIndex = '9999';
    installBanner.innerHTML = `
        <i class="fas fa-mobile-alt me-2"></i>
        <strong>Install App:</strong> Add to your home screen for a better experience.
        <button type="button" class="btn btn-sm btn-outline-primary ms-2" onclick="installApp()">
            Install
        </button>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(installBanner);
});

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log('Install prompt result:', result);
        deferredPrompt = null;
        
        // Remove install banner
        const banner = document.querySelector('.alert');
        if (banner) banner.remove();
    }
}

// Export for global access
window.PoultryApp = PoultryApp;
window.app = app;