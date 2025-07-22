class Database {
    constructor() {
        this.dbName = 'PoultryManagementDB';
        this.version = 4;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                console.log('Database upgrade needed');

                // Create cycles object store
                if (!this.db.objectStoreNames.contains('cycles')) {
                    const cycleStore = this.db.createObjectStore('cycles', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    cycleStore.createIndex('name', 'name', { unique: false });
                    cycleStore.createIndex('status', 'status', { unique: false });
                    cycleStore.createIndex('startDate', 'startDate', { unique: false });
                }

                // Create cages object store
                if (!this.db.objectStoreNames.contains('cages')) {
                    const cageStore = this.db.createObjectStore('cages', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    cageStore.createIndex('cycleId', 'cycleId', { unique: false });
                    cageStore.createIndex('name', 'name', { unique: false });
                }

                // Create production logs object store
                if (!this.db.objectStoreNames.contains('productionLogs')) {
                    const prodStore = this.db.createObjectStore('productionLogs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    prodStore.createIndex('cageId', 'cageId', { unique: false });
                    prodStore.createIndex('date', 'date', { unique: false });
                    prodStore.createIndex('cycleId', 'cycleId', { unique: false });
                }

                // Create sales object store
                if (!this.db.objectStoreNames.contains('sales')) {
                    const salesStore = this.db.createObjectStore('sales', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    salesStore.createIndex('cycleId', 'cycleId', { unique: false });
                    salesStore.createIndex('date', 'date', { unique: false });
                }

                // Create expenses object store
                if (!this.db.objectStoreNames.contains('expenses')) {
                    const expenseStore = this.db.createObjectStore('expenses', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    expenseStore.createIndex('cycleId', 'cycleId', { unique: false });
                    expenseStore.createIndex('date', 'date', { unique: false });
                    expenseStore.createIndex('category', 'category', { unique: false });
                }

                // Create vaccination records object store
                if (!this.db.objectStoreNames.contains('vaccinations')) {
                    const vaccinationStore = this.db.createObjectStore('vaccinations', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    vaccinationStore.createIndex('cycleId', 'cycleId', { unique: false });
                    vaccinationStore.createIndex('date', 'date', { unique: false });
                }

                // Create feed logs object store
                if (!this.db.objectStoreNames.contains('feedLogs')) {
                    const feedStore = this.db.createObjectStore('feedLogs', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    feedStore.createIndex('cageId', 'cageId', { unique: false });
                    feedStore.createIndex('date', 'date', { unique: false });
                    feedStore.createIndex('cycleId', 'cycleId', { unique: false });
                }
            };
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByDateRange(storeName, startDate, endDate, indexName = 'date') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.bound(startDate, endDate);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Feed logs methods
    async addFeedLog(feedLog) {
        return this.add('feedLogs', feedLog);
    }

    async getFeedLogs(cycleId = null) {
        if (cycleId) {
            return this.getByIndex('feedLogs', 'cycleId', cycleId);
        }
        return this.getAll('feedLogs');
    }

    async updateFeedLog(feedLog) {
        return this.update('feedLogs', feedLog);
    }

    async deleteFeedLog(id) {
        return this.delete('feedLogs', id);
    }

    // Sales methods
    async addSale(sale) {
        return this.add('sales', sale);
    }

    async getSales(cycleId = null) {
        if (cycleId) {
            return this.getByIndex('sales', 'cycleId', cycleId);
        }
        return this.getAll('sales');
    }

    // Expense methods
    async addExpense(expense) {
        return this.add('expenses', expense);
    }

    async getExpenses(cycleId = null) {
        if (cycleId) {
            return this.getByIndex('expenses', 'cycleId', cycleId);
        }
        return this.getAll('expenses');
    }

    // Production log methods
    async addProductionLog(log) {
        return this.add('productionLogs', log);
    }

    async getProductionLogs(cycleId = null) {
        if (cycleId) {
            return this.getByIndex('productionLogs', 'cycleId', cycleId);
        }
        return this.getAll('productionLogs');
    }

    // Convenience methods for CSV handler
    async getAllCycles() {
        return this.getAll('cycles');
    }

    async getAllCages() {
        return this.getAll('cages');
    }
}

// Global database instance
const db = new Database();