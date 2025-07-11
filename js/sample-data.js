// Sample Data Generator for Poultry Management PWA
class SampleDataGenerator {
    constructor() {
        this.currentDate = new Date();
        this.cycleStartDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 3, 1);
    }

    async generateSampleData() {
        try {
            // Check if data already exists
            const existingCycles = await db.getAll('cycles');
            if (existingCycles.length > 0) {
                console.log('Sample data already exists');
                return;
            }

            console.log('Generating sample data...');
            
            // Generate cycles
            const cycles = await this.generateCycles();
            
            // Generate cages for each cycle
            const cages = await this.generateCages(cycles);
            
            // Generate production logs
            await this.generateProductionLogs(cycles, cages);
            
            // Generate feed logs
            await this.generateFeedLogs(cycles, cages);
            
            // Generate sales
            await this.generateSales(cycles);
            
            // Generate expenses
            await this.generateExpenses(cycles);
            
            // Generate vaccinations
            await this.generateVaccinations(cycles);
            
            console.log('Sample data generated successfully!');
            
        } catch (error) {
            console.error('Error generating sample data:', error);
        }
    }

    async generateCycles() {
        const cycles = [
            {
                id: Date.now(),
                name: 'Batch 2024-A',
                startDate: this.cycleStartDate.toISOString().split('T')[0],
                endDate: null,
                status: 'active',
                notes: 'First batch of 2024 - Rhode Island Red breed',
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                name: 'Batch 2024-B',
                startDate: new Date(this.cycleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: null,
                status: 'active',
                notes: 'Second batch - Leghorn breed',
                createdAt: new Date().toISOString()
            }
        ];

        for (const cycle of cycles) {
            await db.add('cycles', cycle);
        }
        
        return cycles;
    }

    async generateCages(cycles) {
        const cages = [];
        
        for (const cycle of cycles) {
            const cageCount = 4; // 4 cages per cycle
            
            for (let i = 1; i <= cageCount; i++) {
                const cage = {
                    id: Date.now() + cycles.indexOf(cycle) * 10 + i,
                    name: `Cage ${cycle.name.split('-')[1]}-${i}`,
                    cycleId: cycle.id,
                    capacity: 500,
                    currentBirds: 480 - Math.floor(Math.random() * 20), // Some mortality
                    breed: cycle.name.includes('2024-A') ? 'Rhode Island Red' : 'Leghorn',
                    status: 'active',
                    notes: `Cage ${i} for ${cycle.name}`,
                    createdAt: new Date().toISOString()
                };
                
                cages.push(cage);
                await db.add('cages', cage);
            }
        }
        
        return cages;
    }

    async generateProductionLogs(cycles, cages) {
        const today = new Date();
        const daysToGenerate = 90; // Generate 3 months of data
        
        for (const cage of cages) {
            const cycle = cycles.find(c => c.id === cage.cycleId);
            const cycleStart = new Date(cycle.startDate);
            
            for (let day = 0; day < daysToGenerate; day++) {
                const logDate = new Date(cycleStart.getTime() + day * 24 * 60 * 60 * 1000);
                
                if (logDate > today) break;
                
                const flockAge = Math.floor((logDate - cycleStart) / (24 * 60 * 60 * 1000)) + 1;
                const baseProduction = this.calculateBaseProduction(flockAge, cage.currentBirds);
                
                // Add some random variation
                const variation = (Math.random() - 0.5) * 0.2;
                const eggsProduced = Math.max(0, Math.floor(baseProduction * (1 + variation)));
                
                const mortality = Math.random() < 0.02 ? Math.floor(Math.random() * 3) : 0;
                
                const productionLog = {
                    id: Date.now() + cage.id * 1000 + day,
                    cageId: cage.id,
                    cycleId: cage.cycleId,
                    date: logDate.toISOString().split('T')[0],
                    flockAge: flockAge,
                    openingBirds: cage.currentBirds,
                    mortality: mortality,
                    birdsSold: 0,
                    eggsProduced: eggsProduced,
                    eggsCollected: eggsProduced,
                    currentFeed: this.calculateFeedConsumption(cage.currentBirds, flockAge),
                    notes: day % 7 === 0 ? 'Weekly health check completed' : '',
                    createdAt: logDate.toISOString()
                };
                
                await db.add('productionLogs', productionLog);
            }
        }
    }

    async generateFeedLogs(cycles, cages) {
        const today = new Date();
        const daysToGenerate = 90;
        
        for (const cage of cages) {
            const cycle = cycles.find(c => c.id === cage.cycleId);
            const cycleStart = new Date(cycle.startDate);
            
            // Generate feed logs every 3 days
            for (let day = 0; day < daysToGenerate; day += 3) {
                const logDate = new Date(cycleStart.getTime() + day * 24 * 60 * 60 * 1000);
                
                if (logDate > today) break;
                
                const flockAge = Math.floor((logDate - cycleStart) / (24 * 60 * 60 * 1000)) + 1;
                const feedAmount = this.calculateFeedConsumption(cage.currentBirds, flockAge) * 3; // 3 days worth
                const feedCost = feedAmount * 2.5; // ₵2.5 per kg
                
                const feedLog = {
                    id: Date.now() + cage.id * 2000 + day,
                    cageId: cage.id,
                    cycleId: cage.cycleId,
                    date: logDate.toISOString().split('T')[0],
                    amount: feedAmount,
                    cost: feedCost,
                    feedType: 'Layer Feed',
                    supplier: 'Ghana Feed Mills',
                    createdAt: logDate.toISOString()
                };
                
                await db.add('feedLogs', feedLog);
            }
        }
    }

    async generateSales(cycles) {
        const today = new Date();
        const salesData = [
            { customer: 'Kumasi Market', pricePerCrate: 35, paymentMethod: 'cash' },
            { customer: 'Accra Wholesaler', pricePerCrate: 38, paymentMethod: 'mobile_money' },
            { customer: 'Tamale Distributor', pricePerCrate: 36, paymentMethod: 'bank_transfer' },
            { customer: 'Local Retailers', pricePerCrate: 40, paymentMethod: 'cash' }
        ];
        
        for (const cycle of cycles) {
            const cycleStart = new Date(cycle.startDate);
            
            // Generate sales every 5 days
            for (let day = 10; day < 90; day += 5) {
                const saleDate = new Date(cycleStart.getTime() + day * 24 * 60 * 60 * 1000);
                
                if (saleDate > today) break;
                
                const customer = salesData[Math.floor(Math.random() * salesData.length)];
                const crates = Math.floor(Math.random() * 20) + 10; // 10-30 crates
                const totalAmount = crates * customer.pricePerCrate;
                
                const sale = {
                    id: Date.now() + cycle.id * 3000 + day,
                    cycleId: cycle.id,
                    date: saleDate.toISOString().split('T')[0],
                    customer: customer.customer,
                    crates: crates,
                    pricePerCrate: customer.pricePerCrate,
                    amount: totalAmount,
                    paymentMethod: customer.paymentMethod,
                    notes: `Sale to ${customer.customer}`,
                    createdAt: saleDate.toISOString()
                };
                
                await db.add('sales', sale);
            }
        }
    }

    async generateExpenses(cycles) {
        const today = new Date();
        const expenseCategories = [
            { category: 'feed', description: 'Feed purchase', amount: 500 },
            { category: 'medication', description: 'Vitamins and supplements', amount: 80 },
            { category: 'labor', description: 'Farm worker wages', amount: 300 },
            { category: 'utilities', description: 'Electricity bill', amount: 120 },
            { category: 'maintenance', description: 'Cage repairs', amount: 150 },
            { category: 'other', description: 'Miscellaneous expenses', amount: 50 }
        ];
        
        for (const cycle of cycles) {
            const cycleStart = new Date(cycle.startDate);
            
            // Generate expenses weekly
            for (let week = 0; week < 12; week++) {
                const expenseDate = new Date(cycleStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
                
                if (expenseDate > today) break;
                
                // Generate 1-3 expenses per week
                const expenseCount = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < expenseCount; i++) {
                    const expenseType = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
                    const amount = expenseType.amount * (0.8 + Math.random() * 0.4); // ±20% variation
                    
                    const expense = {
                        id: Date.now() + cycle.id * 4000 + week * 10 + i,
                        cycleId: cycle.id,
                        date: expenseDate.toISOString().split('T')[0],
                        category: expenseType.category,
                        description: expenseType.description,
                        amount: Math.round(amount * 100) / 100,
                        paymentMethod: Math.random() < 0.6 ? 'cash' : 'mobile_money',
                        notes: `Weekly ${expenseType.category} expense`,
                        createdAt: expenseDate.toISOString()
                    };
                    
                    await db.add('expenses', expense);
                }
            }
        }
    }

    async generateVaccinations(cycles) {
        const vaccinationSchedule = [
            { age: 1, vaccine: 'Marek\'s Disease', method: 'injection' },
            { age: 7, vaccine: 'Newcastle Disease', method: 'drinking_water' },
            { age: 14, vaccine: 'Infectious Bronchitis', method: 'spray' },
            { age: 21, vaccine: 'Gumboro Disease', method: 'drinking_water' },
            { age: 35, vaccine: 'Fowl Pox', method: 'wing_web' },
            { age: 42, vaccine: 'Newcastle Disease Booster', method: 'drinking_water' },
            { age: 56, vaccine: 'Infectious Bronchitis Booster', method: 'spray' },
            { age: 70, vaccine: 'Newcastle Disease Booster', method: 'drinking_water' }
        ];
        
        for (const cycle of cycles) {
            const cycleStart = new Date(cycle.startDate);
            
            for (const vaccination of vaccinationSchedule) {
                const vaccinationDate = new Date(cycleStart.getTime() + vaccination.age * 24 * 60 * 60 * 1000);
                
                if (vaccinationDate > new Date()) break;
                
                const vaccinationRecord = {
                    id: Date.now() + cycle.id * 5000 + vaccination.age,
                    cycleId: cycle.id,
                    date: vaccinationDate.toISOString().split('T')[0],
                    flockAge: vaccination.age,
                    vaccine: vaccination.vaccine,
                    method: vaccination.method,
                    dosage: '1 dose per bird',
                    notes: `Routine vaccination as per schedule`,
                    createdAt: vaccinationDate.toISOString()
                };
                
                await db.add('vaccinations', vaccinationRecord);
            }
        }
    }

    calculateBaseProduction(flockAge, birdCount) {
        // Production curve based on layer bird development
        if (flockAge < 18) return 0; // Pre-lay period
        if (flockAge < 25) return birdCount * 0.3; // Ramp up
        if (flockAge < 35) return birdCount * 0.7; // Building up
        if (flockAge < 65) return birdCount * 0.85; // Peak production
        if (flockAge < 85) return birdCount * 0.75; // Gradual decline
        return birdCount * 0.6; // Later production
    }

    calculateFeedConsumption(birdCount, flockAge) {
        // Feed consumption in kg per day
        const baseConsumption = 0.12; // kg per bird per day
        
        if (flockAge < 18) return birdCount * baseConsumption * 0.8;
        if (flockAge < 25) return birdCount * baseConsumption * 0.9;
        if (flockAge < 65) return birdCount * baseConsumption;
        return birdCount * baseConsumption * 0.95;
    }
}

// Global instance for sample data generation
const sampleDataGenerator = new SampleDataGenerator();