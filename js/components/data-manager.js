/**
 * Data Manager Component for CSV Import/Export
 * Provides user interface for importing and exporting farm data
 */

class DataManager {
    constructor() {
        this.csvHandler = new CSVHandler();
        this.db = null;
    }

    async init(database) {
        this.db = database;
        await this.csvHandler.init(database);
    }

    render() {
        return `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2><i class="fas fa-exchange-alt me-2"></i>Data Import/Export</h2>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <!-- Export Section -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0"><i class="fas fa-download me-2"></i>Export Data to CSV</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">Download your farm data as CSV files for use in Excel or other spreadsheet applications.</p>
                                
                                <!-- Cycle Selection for Export -->
                                <div class="mb-3">
                                    <label for="exportCycleSelect" class="form-label">Select Cycle (Optional)</label>
                                    <select id="exportCycleSelect" class="form-select">
                                        <option value="">All Cycles</option>
                                    </select>
                                    <small class="text-muted">Leave blank to export data from all cycles</small>
                                </div>

                                <div class="d-grid gap-2">
                                    <button class="btn btn-success" onclick="dataManager.exportData('production')">
                                        <i class="fas fa-egg me-2"></i>Export Production Logs
                                    </button>
                                    <button class="btn btn-success" onclick="dataManager.exportData('sales')">
                                        <i class="fas fa-shopping-cart me-2"></i>Export Sales Data
                                    </button>
                                    <button class="btn btn-success" onclick="dataManager.exportData('expenses')">
                                        <i class="fas fa-receipt me-2"></i>Export Expenses
                                    </button>
                                    <button class="btn btn-success" onclick="dataManager.exportData('feed')">
                                        <i class="fas fa-seedling me-2"></i>Export Feed Logs
                                    </button>
                                    <button class="btn btn-outline-success" onclick="dataManager.exportAllData()">
                                        <i class="fas fa-download me-2"></i>Export All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Import Section -->
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0"><i class="fas fa-upload me-2"></i>Import Data from CSV</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">Upload CSV files to import data into your farm management system.</p>
                                
                                <!-- File Upload -->
                                <div class="mb-3">
                                    <label for="csvFileInput" class="form-label">Select CSV File</label>
                                    <input type="file" id="csvFileInput" class="form-control" accept=".csv" onchange="dataManager.handleFileSelect()">
                                </div>

                                <!-- Import Type Selection -->
                                <div class="mb-3">
                                    <label for="importTypeSelect" class="form-label">Data Type</label>
                                    <select id="importTypeSelect" class="form-select">
                                        <option value="production">Production Logs</option>
                                        <option value="sales">Sales Data</option>
                                        <option value="expenses">Expenses</option>
                                        <option value="feed">Feed Logs</option>
                                    </select>
                                </div>

                                <div class="d-grid gap-2">
                                    <button id="importBtn" class="btn btn-primary" onclick="dataManager.importData()" disabled>
                                        <i class="fas fa-upload me-2"></i>Import Data
                                    </button>
                                </div>

                                <!-- Import Templates -->
                                <hr>
                                <h6>Download Templates</h6>
                                <div class="d-grid gap-1">
                                    <button class="btn btn-sm btn-outline-primary" onclick="dataManager.downloadTemplate('production')">
                                        <i class="fas fa-file-csv me-1"></i>Production Log Template
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="dataManager.downloadTemplate('sales')">
                                        <i class="fas fa-file-csv me-1"></i>Sales Template
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="dataManager.downloadTemplate('expenses')">
                                        <i class="fas fa-file-csv me-1"></i>Expenses Template
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="dataManager.downloadTemplate('feed')">
                                        <i class="fas fa-file-csv me-1"></i>Feed Log Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="row">
                    <div class="col-12">
                        <div id="importResults" class="alert alert-info d-none">
                            <h6>Import Results</h6>
                            <div id="importResultsContent"></div>
                        </div>
                    </div>
                </div>

                <!-- Instructions Section -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Instructions</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Exporting Data</h6>
                                        <ul class="list-unstyled">
                                            <li>• Export creates CSV files compatible with Excel</li>
                                            <li>• Select a specific cycle or export all data</li>
                                            <li>• Files include all necessary columns with proper formatting</li>
                                            <li>• Data can be edited in Excel and re-imported</li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Importing Data</h6>
                                        <ul class="list-unstyled">
                                            <li>• Use downloaded templates for correct format</li>
                                            <li>• Cycle and cage names must match existing records</li>
                                            <li>• Dates should be in YYYY-MM-DD format</li>
                                            <li>• Import will show success/error summary</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadCycleOptions() {
        const cycles = await this.db.getAll('cycles');
        const select = document.getElementById('exportCycleSelect');
        
        if (select) {
            // Clear existing options except "All Cycles"
            select.innerHTML = '<option value="">All Cycles</option>';
            
            cycles.forEach(cycle => {
                const option = document.createElement('option');
                option.value = cycle.id;
                option.textContent = cycle.name || `Cycle ${cycle.id}`;
                select.appendChild(option);
            });
        }
    }

    handleFileSelect() {
        const fileInput = document.getElementById('csvFileInput');
        const importBtn = document.getElementById('importBtn');
        
        if (fileInput.files.length > 0) {
            importBtn.disabled = false;
        } else {
            importBtn.disabled = true;
        }
    }

    async exportData(type) {
        try {
            const cycleSelect = document.getElementById('exportCycleSelect');
            const selectedCycleId = cycleSelect.value || null;
            
            let csvContent = '';
            let filename = '';
            const timestamp = new Date().toISOString().split('T')[0];

            switch (type) {
                case 'production':
                    csvContent = await this.csvHandler.exportProductionLogs(selectedCycleId);
                    filename = `production_logs_${timestamp}.csv`;
                    break;
                case 'sales':
                    csvContent = await this.csvHandler.exportSales(selectedCycleId);
                    filename = `sales_data_${timestamp}.csv`;
                    break;
                case 'expenses':
                    csvContent = await this.csvHandler.exportExpenses(selectedCycleId);
                    filename = `expenses_${timestamp}.csv`;
                    break;
                case 'feed':
                    csvContent = await this.csvHandler.exportFeedLogs(selectedCycleId);
                    filename = `feed_logs_${timestamp}.csv`;
                    break;
                default:
                    throw new Error('Invalid export type');
            }

            if (csvContent) {
                this.csvHandler.downloadCSV(csvContent, filename);
                this.showMessage(`${type} data exported successfully as ${filename}`, 'success');
            } else {
                this.showMessage(`No ${type} data found to export`, 'warning');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage(`Error exporting ${type} data: ${error.message}`, 'danger');
        }
    }

    async exportAllData() {
        try {
            const cycleSelect = document.getElementById('exportCycleSelect');
            const selectedCycleId = cycleSelect.value || null;
            const timestamp = new Date().toISOString().split('T')[0];

            const exports = [
                { type: 'production', method: 'exportProductionLogs', filename: `production_logs_${timestamp}.csv` },
                { type: 'sales', method: 'exportSales', filename: `sales_data_${timestamp}.csv` },
                { type: 'expenses', method: 'exportExpenses', filename: `expenses_${timestamp}.csv` },
                { type: 'feed', method: 'exportFeedLogs', filename: `feed_logs_${timestamp}.csv` }
            ];

            for (const exportConfig of exports) {
                const csvContent = await this.csvHandler[exportConfig.method](selectedCycleId);
                if (csvContent) {
                    this.csvHandler.downloadCSV(csvContent, exportConfig.filename);
                }
            }

            this.showMessage('All data exported successfully', 'success');
        } catch (error) {
            console.error('Export all error:', error);
            this.showMessage(`Error exporting all data: ${error.message}`, 'danger');
        }
    }

    async importData() {
        try {
            const fileInput = document.getElementById('csvFileInput');
            const typeSelect = document.getElementById('importTypeSelect');
            
            if (fileInput.files.length === 0) {
                this.showMessage('Please select a CSV file to import', 'warning');
                return;
            }

            const file = fileInput.files[0];
            const importType = typeSelect.value;
            
            const csvText = await this.readFileAsText(file);
            let results;

            switch (importType) {
                case 'production':
                    results = await this.csvHandler.importProductionLogs(csvText);
                    break;
                case 'sales':
                    results = await this.csvHandler.importSales(csvText);
                    break;
                case 'expenses':
                    results = await this.csvHandler.importExpenses(csvText);
                    break;
                case 'feed':
                    results = await this.csvHandler.importFeedLogs(csvText);
                    break;
                default:
                    throw new Error('Invalid import type');
            }

            this.showImportResults(results, importType);
            
            // Reset form
            fileInput.value = '';
            document.getElementById('importBtn').disabled = true;

        } catch (error) {
            console.error('Import error:', error);
            this.showMessage(`Error importing data: ${error.message}`, 'danger');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    downloadTemplate(type) {
        let content = '';
        let filename = '';

        switch (type) {
            case 'production':
                content = this.csvHandler.getProductionLogTemplate();
                filename = 'production_log_template.csv';
                break;
            case 'sales':
                content = this.csvHandler.getSalesTemplate();
                filename = 'sales_template.csv';
                break;
            case 'expenses':
                content = this.csvHandler.getExpensesTemplate();
                filename = 'expenses_template.csv';
                break;
            case 'feed':
                content = this.csvHandler.getFeedLogTemplate();
                filename = 'feed_log_template.csv';
                break;
            default:
                this.showMessage('Invalid template type', 'danger');
                return;
        }

        this.csvHandler.downloadCSV(content, filename);
        this.showMessage(`${type} template downloaded as ${filename}`, 'info');
    }

    showImportResults(results, type) {
        const resultsDiv = document.getElementById('importResults');
        const contentDiv = document.getElementById('importResultsContent');
        
        let html = `
            <div class="row">
                <div class="col-md-4">
                    <div class="text-success">
                        <strong>Successfully imported:</strong> ${results.success} ${type} records
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-info">
                        <strong>New cycles created:</strong> ${results.newCycles || 0}
                        ${results.newCages ? `<br><strong>New cages created:</strong> ${results.newCages}` : ''}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-danger">
                        <strong>Errors:</strong> ${results.errors.length}
                    </div>
                </div>
            </div>
        `;

        if (results.errors.length > 0) {
            html += `
                <div class="mt-2">
                    <strong>Error Details:</strong>
                    <ul class="mb-0">
                        ${results.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        contentDiv.innerHTML = html;
        resultsDiv.classList.remove('d-none');
        
        // Auto-hide after 10 seconds if no errors
        if (results.errors.length === 0) {
            setTimeout(() => {
                resultsDiv.classList.add('d-none');
            }, 10000);
        }
    }

    showMessage(message, type) {
        // Create a temporary alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Initialize global data manager
window.dataManager = new DataManager();