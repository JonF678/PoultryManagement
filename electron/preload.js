const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    importCSVFile: () => ipcRenderer.invoke('import-csv-file'),
    exportDataFile: (data, fileName) => ipcRenderer.invoke('export-data-file', data, fileName),
    createBackup: (data) => ipcRenderer.invoke('create-backup', data),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    
    // Menu actions
    onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
    removeMenuActionListener: () => ipcRenderer.removeAllListeners('menu-action'),
    
    // Platform info
    platform: process.platform
});

// Desktop-specific enhancements
window.addEventListener('DOMContentLoaded', () => {
    // Add desktop class to body for desktop-specific styling
    document.body.classList.add('electron-app');
    
    // Enhance existing functionality with desktop features
    enhanceWithDesktopFeatures();
});

function enhanceWithDesktopFeatures() {
    // Listen for menu actions
    window.electronAPI.onMenuAction((event, action) => {
        switch (action) {
            case 'import-csv':
                handleDesktopImport();
                break;
            case 'export-data':
                handleDesktopExport();
                break;
            case 'create-backup':
                handleDesktopBackup();
                break;
            case 'export-charts':
                handleDesktopChartExport();
                break;
        }
    });
}

async function handleDesktopImport() {
    try {
        const result = await window.electronAPI.importCSVFile();
        if (result.success) {
            // Trigger the existing CSV import functionality
            if (window.csvHandler && window.csvHandler.parseCSV) {
                const data = window.csvHandler.parseCSV(result.content);
                // Process the imported data
                console.log('Desktop import successful:', result.fileName);
                
                // Show success notification
                window.electronAPI.showNotification(
                    'Import Successful', 
                    `Successfully imported ${result.fileName}`
                );
            }
        }
    } catch (error) {
        console.error('Desktop import failed:', error);
    }
}

async function handleDesktopExport() {
    try {
        // Get all data from the existing app
        if (window.db) {
            const cycles = await window.db.getAll('cycles');
            const cages = await window.db.getAll('cages');
            const productionLogs = await window.db.getAll('productionLogs');
            const feedLogs = await window.db.getAll('feedLogs');
            const sales = await window.db.getAll('sales') || [];
            const expenses = await window.db.getAll('expenses') || [];
            const vaccinations = await window.db.getAll('vaccinations') || [];

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

            const data = JSON.stringify(exportData, null, 2);
            const fileName = `poultry-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const result = await window.electronAPI.exportDataFile(data, fileName);
            if (result.success) {
                window.electronAPI.showNotification(
                    'Export Successful', 
                    `Data exported to ${result.filePath}`
                );
            }
        }
    } catch (error) {
        console.error('Desktop export failed:', error);
    }
}

async function handleDesktopBackup() {
    try {
        // Similar to export but specifically for backups
        if (window.db) {
            const cycles = await window.db.getAll('cycles');
            const cages = await window.db.getAll('cages');
            const productionLogs = await window.db.getAll('productionLogs');
            const feedLogs = await window.db.getAll('feedLogs');
            const sales = await window.db.getAll('sales') || [];
            const expenses = await window.db.getAll('expenses') || [];
            const vaccinations = await window.db.getAll('vaccinations') || [];

            const backupData = {
                cycles,
                cages,
                productionLogs,
                feedLogs,
                sales,
                expenses,
                vaccinations,
                backupDate: new Date().toISOString(),
                version: '1.0',
                type: 'automatic_backup'
            };

            const data = JSON.stringify(backupData, null, 2);
            
            const result = await window.electronAPI.createBackup(data);
            if (result.success) {
                window.electronAPI.showNotification(
                    'Backup Created', 
                    `Backup saved to ${result.filePath}`
                );
            }
        }
    } catch (error) {
        console.error('Desktop backup failed:', error);
    }
}

async function handleDesktopChartExport() {
    // This would capture charts and export as PDF
    console.log('Chart export requested - this could be enhanced to generate PDF reports');
}