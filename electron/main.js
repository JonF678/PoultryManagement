const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

class PoultryApp {
    constructor() {
        this.mainWindow = null;
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    async initialize() {
        // Set up app event handlers
        app.whenReady().then(() => this.createMainWindow());
        app.on('window-all-closed', () => this.handleWindowsClosed());
        app.on('activate', () => this.handleActivate());

        // Set up IPC handlers for desktop features
        this.setupIpcHandlers();
    }

    createMainWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            icon: path.join(__dirname, '..', 'icons', 'icon-512.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'default',
            show: false // Don't show until ready
        });

        // Load the PWA
        const startUrl = this.isDevelopment 
            ? 'http://localhost:5000' 
            : `file://${path.join(__dirname, '..', 'index.html')}`;
        
        this.mainWindow.loadURL(startUrl);

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Open DevTools in development
            if (this.isDevelopment) {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Set up menu
        this.createMenu();

        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Import CSV Data',
                        accelerator: 'CmdOrCtrl+I',
                        click: () => this.handleImportCSV()
                    },
                    {
                        label: 'Export All Data',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => this.handleExportData()
                    },
                    { type: 'separator' },
                    {
                        label: 'Create Backup',
                        accelerator: 'CmdOrCtrl+B',
                        click: () => this.handleCreateBackup()
                    },
                    { type: 'separator' },
                    {
                        role: 'quit'
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Analytics',
                submenu: [
                    {
                        label: 'Print Production Report',
                        accelerator: 'CmdOrCtrl+P',
                        click: () => this.handlePrintReport()
                    },
                    {
                        label: 'Export Charts as PDF',
                        click: () => this.handleExportCharts()
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Poultry Manager',
                        click: () => this.showAbout()
                    },
                    {
                        label: 'Open Data Folder',
                        click: () => this.openDataFolder()
                    }
                ]
            }
        ];

        // macOS specific menu adjustments
        if (process.platform === 'darwin') {
            template.unshift({
                label: app.getName(),
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            });
        }

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupIpcHandlers() {
        // Handle file imports
        ipcMain.handle('import-csv-file', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                    { name: 'CSV Files', extensions: ['csv'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return { success: true, content, fileName: path.basename(filePath) };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'No file selected' };
        });

        // Handle file exports
        ipcMain.handle('export-data-file', async (event, data, fileName) => {
            const result = await dialog.showSaveDialog(this.mainWindow, {
                defaultPath: fileName,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'CSV Files', extensions: ['csv'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled) {
                try {
                    fs.writeFileSync(result.filePath, data);
                    return { success: true, filePath: result.filePath };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'Save canceled' };
        });

        // Handle backup creation
        ipcMain.handle('create-backup', async (event, data) => {
            const today = new Date().toISOString().split('T')[0];
            const defaultName = `poultry-backup-${today}.json`;
            
            const result = await dialog.showSaveDialog(this.mainWindow, {
                defaultPath: defaultName,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled) {
                try {
                    fs.writeFileSync(result.filePath, data);
                    return { success: true, filePath: result.filePath };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'Backup canceled' };
        });

        // Handle notifications
        ipcMain.handle('show-notification', (event, title, body) => {
            new Notification(title, { body }).show();
        });
    }

    async handleImportCSV() {
        this.mainWindow.webContents.send('menu-action', 'import-csv');
    }

    async handleExportData() {
        this.mainWindow.webContents.send('menu-action', 'export-data');
    }

    async handleCreateBackup() {
        this.mainWindow.webContents.send('menu-action', 'create-backup');
    }

    async handlePrintReport() {
        this.mainWindow.webContents.print({
            silent: false,
            printBackground: true,
            margins: {
                marginType: 'minimum'
            }
        });
    }

    async handleExportCharts() {
        this.mainWindow.webContents.send('menu-action', 'export-charts');
    }

    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Poultry Manager',
            message: 'Poultry Management System',
            detail: 'Version 1.0.0\n\nA comprehensive desktop application for managing poultry farms with production tracking, analytics, and reporting capabilities.',
            buttons: ['OK']
        });
    }

    openDataFolder() {
        const userDataPath = app.getPath('userData');
        shell.openPath(userDataPath);
    }

    handleWindowsClosed() {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    handleActivate() {
        if (BrowserWindow.getAllWindows().length === 0) {
            this.createMainWindow();
        }
    }
}

// Initialize the app
const poultryApp = new PoultryApp();
poultryApp.initialize();