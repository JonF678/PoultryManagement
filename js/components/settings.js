const settings = {
    init() {
        this.render();
        this.attachEventListeners();
        this.loadCurrentSettings();
    },

    render() {
        const content = `
            <div class="settings-page">
                <div class="page-header">
                    <h2><i class="fas fa-cog me-2"></i>Settings</h2>
                    <p class="text-muted">Manage your application preferences and security settings</p>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <!-- Security Settings -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-shield-alt me-2"></i>Security Settings
                                </h5>
                            </div>
                            <div class="card-body">
                                <form id="passwordForm">
                                    <div class="mb-3">
                                        <label for="currentPassword" class="form-label">Current Admin Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-lock"></i>
                                            </span>
                                            <input type="password" 
                                                   id="currentPassword" 
                                                   class="form-control" 
                                                   placeholder="Enter current password"
                                                   required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="newPassword" class="form-label">New Admin Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-key"></i>
                                            </span>
                                            <input type="password" 
                                                   id="newPassword" 
                                                   class="form-control" 
                                                   placeholder="Enter new password (min 6 characters)"
                                                   minlength="6"
                                                   required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="confirmPassword" class="form-label">Confirm New Password</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-key"></i>
                                            </span>
                                            <input type="password" 
                                                   id="confirmPassword" 
                                                   class="form-control" 
                                                   placeholder="Confirm new password"
                                                   required>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save me-2"></i>Change Password
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Application Settings -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-sliders-h me-2"></i>Application Settings
                                </h5>
                            </div>
                            <div class="card-body">
                                <form id="appSettingsForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="currency" class="form-label">Default Currency</label>
                                                <select id="currency" class="form-select">
                                                    <option value="GHS">Ghanaian Cedi (₵)</option>
                                                    <option value="USD">US Dollar ($)</option>
                                                    <option value="GBP">British Pound (£)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="defaultEggWeight" class="form-label">Default Egg Weight (grams)</label>
                                                <input type="number" 
                                                       id="defaultEggWeight" 
                                                       class="form-control" 
                                                       min="40" 
                                                       max="80" 
                                                       value="60">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="theme" class="form-label">Theme</label>
                                                <select id="theme" class="form-select">
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <div class="form-check mt-4">
                                                    <input type="checkbox" 
                                                           class="form-check-input" 
                                                           id="enableNotifications">
                                                    <label class="form-check-label" for="enableNotifications">
                                                        Enable Notifications
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-success">
                                        <i class="fas fa-save me-2"></i>Save Settings
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Data Management -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-database me-2"></i>Data Management
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Backup Data</h6>
                                        <p class="text-muted small">Export all your data for backup purposes</p>
                                        <button type="button" class="btn btn-outline-primary" id="exportDataBtn">
                                            <i class="fas fa-download me-2"></i>Export All Data
                                        </button>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Clear Data</h6>
                                        <p class="text-muted small">Remove all application data (cannot be undone)</p>
                                        <button type="button" class="btn btn-outline-danger" id="clearDataBtn">
                                            <i class="fas fa-trash-alt me-2"></i>Clear All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <!-- App Information -->
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-info-circle me-2"></i>Application Info
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <strong>Version:</strong> 1.0.0
                                </div>
                                <div class="mb-3">
                                    <strong>Last Backup:</strong> 
                                    <span id="lastBackupDate">Never</span>
                                </div>
                                <div class="mb-3">
                                    <strong>Storage Used:</strong> 
                                    <span id="storageUsed">Calculating...</span>
                                </div>
                                <div class="mb-3">
                                    <strong>Total Records:</strong> 
                                    <span id="totalRecords">Loading...</span>
                                </div>
                                
                                <hr>
                                
                                <div class="d-grid">
                                    <button type="button" class="btn btn-outline-secondary" id="refreshStatsBtn">
                                        <i class="fas fa-sync-alt me-2"></i>Refresh Stats
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    },

    attachEventListeners() {
        // Password change form
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordChange();
        });

        // App settings form
        document.getElementById('appSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAppSettingsChange();
        });

        // Data management buttons
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.confirmClearData();
        });

        document.getElementById('refreshStatsBtn').addEventListener('click', () => {
            this.loadAppStats();
        });
    },

    loadCurrentSettings() {
        const settings = JSON.parse(localStorage.getItem('poultrySettings') || '{}');
        
        // Load app settings
        document.getElementById('currency').value = settings.currency || 'GHS';
        document.getElementById('defaultEggWeight').value = settings.defaultEggWeight || 60;
        document.getElementById('theme').value = settings.theme || 'light';
        document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;

        // Load app stats
        this.loadAppStats();
    },

    async loadAppStats() {
        try {
            // Get storage usage estimate
            const storageEstimate = await navigator.storage.estimate();
            const storageUsed = this.formatBytes(storageEstimate.usage || 0);
            document.getElementById('storageUsed').textContent = storageUsed;

            // Get record counts
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            const feedLogs = await db.getAll('feedLogs');
            
            const totalRecords = cycles.length + cages.length + productionLogs.length + feedLogs.length;
            document.getElementById('totalRecords').textContent = totalRecords.toLocaleString();

            // Get last backup date
            const lastBackup = localStorage.getItem('lastAutoBackup');
            if (lastBackup) {
                const backupDate = new Date(parseInt(lastBackup)).toLocaleDateString();
                document.getElementById('lastBackupDate').textContent = backupDate;
            }
        } catch (error) {
            console.error('Error loading app stats:', error);
        }
    },

    handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate current password
        if (!auth.validatePassword(currentPassword)) {
            this.showToast('Current password is incorrect', 'error');
            return;
        }

        // Validate new password
        if (newPassword.length < 6) {
            this.showToast('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showToast('New passwords do not match', 'error');
            return;
        }

        // Change password
        if (auth.changePassword(newPassword)) {
            this.showToast('Password changed successfully', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            this.showToast('Failed to change password', 'error');
        }
    },

    handleAppSettingsChange() {
        const newSettings = {
            currency: document.getElementById('currency').value,
            defaultEggWeight: parseInt(document.getElementById('defaultEggWeight').value),
            theme: document.getElementById('theme').value,
            enableNotifications: document.getElementById('enableNotifications').checked
        };

        localStorage.setItem('poultrySettings', JSON.stringify(newSettings));
        this.showToast('Settings saved successfully', 'success');
    },

    async exportAllData() {
        try {
            // Get all data
            const cycles = await db.getAll('cycles');
            const cages = await db.getAll('cages');
            const productionLogs = await db.getAll('productionLogs');
            const feedLogs = await db.getAll('feedLogs');
            const sales = await db.getAll('sales') || [];
            const expenses = await db.getAll('expenses') || [];
            const vaccinations = await db.getAll('vaccinations') || [];

            const exportData = {
                cycles,
                cages,
                productionLogs,
                feedLogs,
                sales,
                expenses,
                vaccinations,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            // Create and download file
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `poultry-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export data', 'error');
        }
    },

    confirmClearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (confirm('This will permanently delete all cycles, cages, production logs, and other data. Continue?')) {
                this.clearAllData();
            }
        }
    },

    async clearAllData() {
        try {
            // Clear all object stores
            await db.clear('cycles');
            await db.clear('cages');
            await db.clear('productionLogs');
            await db.clear('feedLogs');
            await db.clear('sales');
            await db.clear('expenses');
            await db.clear('vaccinations');

            // Clear localStorage
            localStorage.removeItem('autoBackup');
            localStorage.removeItem('lastAutoBackup');

            this.showToast('All data cleared successfully', 'success');
            this.loadAppStats();
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showToast('Failed to clear data', 'error');
        }
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showToast(message, type = 'info') {
        // Try to use the app's toast method first
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
            return;
        }

        // Fallback to Bootstrap toast implementation
        const toast = document.getElementById('toast');
        if (toast) {
            const toastBody = toast.querySelector('.toast-body');
            if (toastBody) {
                toastBody.textContent = message;
                
                const icon = toast.querySelector('.fas');
                if (icon) {
                    icon.className = type === 'success' ? 'fas fa-check-circle text-success me-2' : 
                                    type === 'error' ? 'fas fa-exclamation-circle text-danger me-2' : 
                                    type === 'warning' ? 'fas fa-exclamation-triangle text-warning me-2' :
                                    'fas fa-info-circle text-primary me-2';
                }
                
                // Show the toast using Bootstrap
                if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                    const bsToast = new bootstrap.Toast(toast);
                    bsToast.show();
                } else {
                    // Fallback for when Bootstrap isn't available
                    toast.style.display = 'block';
                    setTimeout(() => {
                        toast.style.display = 'none';
                    }, 3000);
                }
                return;
            }
        }

        // Ultimate fallback - just use alert for important messages
        if (type === 'error' || type === 'success') {
            alert(`${type.toUpperCase()}: ${message}`);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
};