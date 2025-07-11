// Debug script to help identify analytics issues
class AnalyticsDebugger {
    static async debugAnalytics() {
        console.log('=== Analytics Debug Information ===');
        
        try {
            // Check if database is initialized
            console.log('1. Checking database initialization...');
            if (!db) {
                console.error('Database object not found');
                return;
            }
            
            if (!db.db) {
                console.error('Database connection not established');
                return;
            }
            
            console.log('✓ Database initialized successfully');
            
            // Check object stores
            console.log('2. Checking object stores...');
            const storeNames = Array.from(db.db.objectStoreNames);
            console.log('Available stores:', storeNames);
            
            const requiredStores = ['cycles', 'cages', 'productionLogs', 'feedLogs', 'sales', 'expenses'];
            const missingStores = requiredStores.filter(store => !storeNames.includes(store));
            
            if (missingStores.length > 0) {
                console.error('Missing required stores:', missingStores);
                return;
            }
            
            console.log('✓ All required stores present');
            
            // Check data availability
            console.log('3. Checking data availability...');
            for (const storeName of requiredStores) {
                try {
                    const data = await db.getAll(storeName);
                    console.log(`${storeName}: ${data.length} records`);
                } catch (error) {
                    console.error(`Error accessing ${storeName}:`, error);
                }
            }
            
            // Try to initialize analytics
            console.log('4. Testing analytics initialization...');
            const testAnalytics = new Analytics();
            await testAnalytics.init();
            
            console.log('✓ Analytics initialized successfully');
            
        } catch (error) {
            console.error('Analytics debug error:', error);
            console.error('Stack trace:', error.stack);
        }
    }
    
    static async clearDatabase() {
        console.log('Clearing database for fresh start...');
        try {
            if (db && db.db) {
                db.db.close();
            }
            
            // Delete the database
            const deleteRequest = indexedDB.deleteDatabase('PoultryManagementDB');
            
            deleteRequest.onsuccess = () => {
                console.log('Database cleared successfully');
                console.log('Please refresh the page to reinitialize with fresh data');
            };
            
            deleteRequest.onerror = (error) => {
                console.error('Error clearing database:', error);
            };
            
        } catch (error) {
            console.error('Error clearing database:', error);
        }
    }
}

// Make debug functions available globally
window.debugAnalytics = AnalyticsDebugger.debugAnalytics;
window.clearDatabase = AnalyticsDebugger.clearDatabase;