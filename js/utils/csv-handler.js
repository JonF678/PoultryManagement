/**
 * CSV Import/Export Handler for Poultry Management System
 * Handles bidirectional CSV data transfer with Excel compatibility
 */

class CSVHandler {
    constructor() {
        this.db = null;
    }

    async init(database) {
        this.db = database;
    }

    // Parse CSV text to array of objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    // Parse a single CSV line handling quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
            } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    // Convert array of objects to CSV
    arrayToCSV(data, headers) {
        if (!data || data.length === 0) return '';

        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] || '';
                // Escape values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    // Export production logs to CSV
    async exportProductionLogs(cycleId = null) {
        const productionLogs = await this.db.getProductionLogs(cycleId);
        const cages = await this.db.getAllCages();
        const cycles = await this.db.getAllCycles();

        // Create lookup maps
        const cageMap = {};
        cages.forEach(cage => cageMap[cage.id] = cage.name);
        const cycleMap = {};
        cycles.forEach(cycle => cycleMap[cycle.id] = cycle.name || `Cycle ${cycle.id}`);

        const headers = [
            'Date', 'Cycle', 'Cage', 'Flock_Age_Days', 'Opening_Birds', 
            'Mortality', 'Birds_Sold', 'Eggs_Produced', 'Closing_Birds', 
            'Production_Percentage', 'Notes'
        ];

        const csvData = productionLogs.map(log => ({
            'Date': log.date,
            'Cycle': cycleMap[log.cycleId] || log.cycleId,
            'Cage': cageMap[log.cageId] || log.cageId,
            'Flock_Age_Days': log.flockAgeDays || '',
            'Opening_Birds': log.openingBirds || '',
            'Mortality': log.mortality || 0,
            'Birds_Sold': log.birdsSold || 0,
            'Eggs_Produced': log.eggsProduced || 0,
            'Closing_Birds': log.closingBirds || '',
            'Production_Percentage': log.productionPercentage || '',
            'Notes': log.notes || ''
        }));

        return this.arrayToCSV(csvData, headers);
    }

    // Export sales data to CSV
    async exportSales(cycleId = null) {
        const sales = await this.db.getSales(cycleId);
        const cycles = await this.db.getAllCycles();
        
        const cycleMap = {};
        cycles.forEach(cycle => cycleMap[cycle.id] = cycle.name || `Cycle ${cycle.id}`);

        const headers = [
            'Date', 'Cycle', 'Sale_Type', 'Customer', 'Crates', 'Price_Per_Crate', 
            'Bird_Quantity', 'Price_Per_Bird', 'Weight_Kg', 'Total_Amount', 
            'Payment_Method', 'Notes'
        ];

        const csvData = sales.map(sale => ({
            'Date': sale.date,
            'Cycle': cycleMap[sale.cycleId] || sale.cycleId,
            'Sale_Type': sale.saleType || 'egg',
            'Customer': sale.customer || '',
            'Crates': sale.crates || '',
            'Price_Per_Crate': sale.pricePerCrate || '',
            'Bird_Quantity': sale.birdQuantity || '',
            'Price_Per_Bird': sale.pricePerBird || '',
            'Weight_Kg': sale.weight || '',
            'Total_Amount': sale.amount || 0,
            'Payment_Method': sale.paymentMethod || '',
            'Notes': sale.notes || ''
        }));

        return this.arrayToCSV(csvData, headers);
    }

    // Export expenses to CSV
    async exportExpenses(cycleId = null) {
        const expenses = await this.db.getExpenses(cycleId);
        const cycles = await this.db.getAllCycles();
        
        const cycleMap = {};
        cycles.forEach(cycle => cycleMap[cycle.id] = cycle.name || `Cycle ${cycle.id}`);

        const headers = [
            'Date', 'Cycle', 'Category', 'Description', 'Amount', 
            'Payment_Method', 'Notes'
        ];

        const csvData = expenses.map(expense => ({
            'Date': expense.date,
            'Cycle': cycleMap[expense.cycleId] || expense.cycleId,
            'Category': expense.category || '',
            'Description': expense.description || '',
            'Amount': expense.amount || 0,
            'Payment_Method': expense.paymentMethod || '',
            'Notes': expense.notes || ''
        }));

        return this.arrayToCSV(csvData, headers);
    }

    // Export feed logs to CSV
    async exportFeedLogs(cycleId = null) {
        const feedLogs = await this.db.getFeedLogs(cycleId);
        const cycles = await this.db.getAllCycles();
        
        const cycleMap = {};
        cycles.forEach(cycle => cycleMap[cycle.id] = cycle.name || `Cycle ${cycle.id}`);

        const headers = [
            'Date', 'Cycle', 'Feed_Consumed_Kg', 'Feed_Cost', 'Notes'
        ];

        const csvData = feedLogs.map(log => ({
            'Date': log.date,
            'Cycle': cycleMap[log.cycleId] || log.cycleId,
            'Feed_Consumed_Kg': log.amount || 0,
            'Feed_Cost': log.cost || 0,
            'Notes': log.notes || ''
        }));

        return this.arrayToCSV(csvData, headers);
    }

    // Import production logs from CSV
    async importProductionLogs(csvText) {
        const data = this.parseCSV(csvText);
        const cycles = await this.db.getAllCycles();
        const cages = await this.db.getAllCages();

        // Create lookup maps and track new items
        const cycleMap = {};
        cycles.forEach(cycle => {
            cycleMap[cycle.name] = cycle.id;
            cycleMap[cycle.id] = cycle.id;
        });
        
        const cageMap = {};
        cages.forEach(cage => {
            cageMap[cage.name] = cage.id;
            cageMap[cage.id] = cage.id;
        });

        const results = { success: 0, errors: [], newCycles: 0, newCages: 0 };

        for (const row of data) {
            try {
                const cycleName = row.Cycle || row.cycleId;
                const cageName = row.Cage || row.cageId;
                
                // Get or create cycle
                let cycleId = cycleMap[cycleName];
                if (!cycleId) {
                    const newCycle = {
                        name: cycleName,
                        startDate: row.Date || new Date().toISOString().split('T')[0],
                        endDate: null,
                        status: 'active',
                        notes: `Auto-created from CSV import`,
                        createdAt: new Date().toISOString()
                    };
                    cycleId = await this.db.add('cycles', newCycle);
                    cycleMap[cycleName] = cycleId;
                    results.newCycles++;
                }

                // Get or create cage
                let cageId = cageMap[cageName];
                if (!cageId) {
                    const newCage = {
                        name: cageName,
                        cycleId: cycleId,
                        capacity: 500, // Default capacity
                        currentBirds: parseInt(row.Opening_Birds || row.openingBirds) || 0,
                        breed: 'Mixed',
                        status: 'active',
                        notes: `Auto-created from CSV import`,
                        createdAt: new Date().toISOString()
                    };
                    cageId = await this.db.add('cages', newCage);
                    cageMap[cageName] = cageId;
                    results.newCages++;
                }

                const productionLog = {
                    cycleId: cycleId,
                    cageId: cageId,
                    date: row.Date || row.date,
                    flockAgeDays: parseInt(row.Flock_Age_Days || row.flockAgeDays) || 0,
                    openingBirds: parseInt(row.Opening_Birds || row.openingBirds) || 0,
                    mortality: parseInt(row.Mortality || row.mortality) || 0,
                    birdsSold: parseInt(row.Birds_Sold || row.birdsSold) || 0,
                    eggsProduced: parseInt(row.Eggs_Produced || row.eggsProduced) || 0,
                    closingBirds: parseInt(row.Closing_Birds || row.closingBirds) || 0,
                    productionPercentage: parseFloat(row.Production_Percentage || row.productionPercentage) || 0,
                    notes: row.Notes || row.notes || '',
                    createdAt: new Date().toISOString()
                };

                await this.db.addProductionLog(productionLog);
                results.success++;
            } catch (error) {
                results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
            }
        }

        return results;
    }

    // Import sales from CSV
    async importSales(csvText) {
        const data = this.parseCSV(csvText);
        const cycles = await this.db.getAllCycles();

        const cycleMap = {};
        cycles.forEach(cycle => {
            cycleMap[cycle.name] = cycle.id;
            cycleMap[cycle.id] = cycle.id;
        });

        const results = { success: 0, errors: [], newCycles: 0 };

        for (const row of data) {
            try {
                const cycleName = row.Cycle || row.cycleId;
                
                // Get or create cycle
                let cycleId = cycleMap[cycleName];
                if (!cycleId) {
                    const newCycle = {
                        name: cycleName,
                        startDate: row.Date || new Date().toISOString().split('T')[0],
                        endDate: null,
                        status: 'active',
                        notes: `Auto-created from CSV import`,
                        createdAt: new Date().toISOString()
                    };
                    cycleId = await this.db.add('cycles', newCycle);
                    cycleMap[cycleName] = cycleId;
                    results.newCycles++;
                }

                const sale = {
                    cycleId: cycleId,
                    date: row.Date || row.date,
                    saleType: row.Sale_Type || row.saleType || 'egg',
                    customer: row.Customer || row.customer || '',
                    amount: parseFloat(row.Total_Amount || row.amount) || 0,
                    paymentMethod: row.Payment_Method || row.paymentMethod || 'cash',
                    notes: row.Notes || row.notes || '',
                    createdAt: new Date().toISOString()
                };

                // Add type-specific fields
                if (sale.saleType === 'egg') {
                    sale.crates = parseInt(row.Crates || row.crates) || 0;
                    sale.pricePerCrate = parseFloat(row.Price_Per_Crate || row.pricePerCrate) || 0;
                } else if (sale.saleType === 'bird') {
                    sale.birdQuantity = parseInt(row.Bird_Quantity || row.birdQuantity) || 0;
                    sale.pricePerBird = parseFloat(row.Price_Per_Bird || row.pricePerBird) || 0;
                    sale.weight = parseFloat(row.Weight_Kg || row.weight) || 0;
                }

                await this.db.addSale(sale);
                results.success++;
            } catch (error) {
                results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
            }
        }

        return results;
    }

    // Import expenses from CSV
    async importExpenses(csvText) {
        const data = this.parseCSV(csvText);
        const cycles = await this.db.getAllCycles();

        const cycleMap = {};
        cycles.forEach(cycle => {
            cycleMap[cycle.name] = cycle.id;
            cycleMap[cycle.id] = cycle.id;
        });

        const results = { success: 0, errors: [], newCycles: 0 };

        for (const row of data) {
            try {
                const cycleName = row.Cycle || row.cycleId;
                
                // Get or create cycle
                let cycleId = cycleMap[cycleName];
                if (!cycleId) {
                    const newCycle = {
                        name: cycleName,
                        startDate: row.Date || new Date().toISOString().split('T')[0],
                        endDate: null,
                        status: 'active',
                        notes: `Auto-created from CSV import`,
                        createdAt: new Date().toISOString()
                    };
                    cycleId = await this.db.add('cycles', newCycle);
                    cycleMap[cycleName] = cycleId;
                    results.newCycles++;
                }

                const expense = {
                    cycleId: cycleId,
                    date: row.Date || row.date,
                    category: row.Category || row.category || 'other',
                    description: row.Description || row.description || '',
                    amount: parseFloat(row.Amount || row.amount) || 0,
                    paymentMethod: row.Payment_Method || row.paymentMethod || 'cash',
                    notes: row.Notes || row.notes || '',
                    createdAt: new Date().toISOString()
                };

                await this.db.addExpense(expense);
                results.success++;
            } catch (error) {
                results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
            }
        }

        return results;
    }

    // Import feed logs from CSV
    async importFeedLogs(csvText) {
        const data = this.parseCSV(csvText);
        const cycles = await this.db.getAllCycles();

        const cycleMap = {};
        cycles.forEach(cycle => {
            cycleMap[cycle.name] = cycle.id;
            cycleMap[cycle.id] = cycle.id;
        });

        const results = { success: 0, errors: [], newCycles: 0 };

        for (const row of data) {
            try {
                const cycleName = row.Cycle || row.cycleId;
                
                // Get or create cycle
                let cycleId = cycleMap[cycleName];
                if (!cycleId) {
                    const newCycle = {
                        name: cycleName,
                        startDate: row.Date || new Date().toISOString().split('T')[0],
                        endDate: null,
                        status: 'active',
                        notes: `Auto-created from CSV import`,
                        createdAt: new Date().toISOString()
                    };
                    cycleId = await this.db.add('cycles', newCycle);
                    cycleMap[cycleName] = cycleId;
                    results.newCycles++;
                }

                const feedLog = {
                    cycleId: cycleId,
                    date: row.Date || row.date,
                    amount: parseFloat(row.Feed_Consumed_Kg || row.feedConsumed || row.amount) || 0,
                    cost: parseFloat(row.Feed_Cost || row.feedCost || row.cost) || 0,
                    notes: row.Notes || row.notes || '',
                    createdAt: new Date().toISOString()
                };

                await this.db.addFeedLog(feedLog);
                results.success++;
            } catch (error) {
                results.errors.push(`Row ${data.indexOf(row) + 2}: ${error.message}`);
            }
        }

        return results;
    }

    // Download CSV file
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Create import template files
    getProductionLogTemplate() {
        const headers = [
            'Date', 'Cycle', 'Cage', 'Flock_Age_Days', 'Opening_Birds', 
            'Mortality', 'Birds_Sold', 'Eggs_Produced', 'Closing_Birds', 
            'Production_Percentage', 'Notes'
        ];
        
        const sampleRow = [
            '2025-07-21', 'Cycle 1', 'Cage A1', '150', '100', 
            '1', '0', '85', '99', '85.0', 'Normal production day'
        ];

        return [headers.join(','), sampleRow.join(',')].join('\n');
    }

    getSalesTemplate() {
        const headers = [
            'Date', 'Cycle', 'Sale_Type', 'Customer', 'Crates', 'Price_Per_Crate', 
            'Bird_Quantity', 'Price_Per_Bird', 'Weight_Kg', 'Total_Amount', 
            'Payment_Method', 'Notes'
        ];
        
        const sampleRow = [
            '2025-07-21', 'Cycle 1', 'egg', 'Local Market', '10', '40.00', 
            '', '', '', '400.00', 'cash', 'Weekly egg sale'
        ];

        return [headers.join(','), sampleRow.join(',')].join('\n');
    }

    getExpensesTemplate() {
        const headers = [
            'Date', 'Cycle', 'Category', 'Description', 'Amount', 
            'Payment_Method', 'Notes'
        ];
        
        const sampleRow = [
            '2025-07-21', 'Cycle 1', 'feed', 'Layer feed 50kg', '150.00', 
            'cash', 'Weekly feed purchase'
        ];

        return [headers.join(','), sampleRow.join(',')].join('\n');
    }

    getFeedLogTemplate() {
        const headers = [
            'Date', 'Cycle', 'Feed_Consumed_Kg', 'Feed_Cost', 'Notes'
        ];
        
        const sampleRow = [
            '2025-07-21', 'Cycle 1', '25.5', '85.00', 'Daily feed consumption'
        ];

        return [headers.join(','), sampleRow.join(',')].join('\n');
    }
}

// Export the class
window.CSVHandler = CSVHandler;