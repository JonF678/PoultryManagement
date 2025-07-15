class CageDetail {
    constructor() {
        this.cage = null;
        this.cycle = null;
        this.productionLogs = [];
        this.feedLogs = [];
    }

    async init(cageId) {
        try {
            this.cage = await db.get('cages', parseInt(cageId));
            if (!this.cage) {
                throw new Error('Cage not found');
            }

            this.cycle = await db.get('cycles', this.cage.cycleId);
            this.productionLogs = await db.getByIndex('productionLogs', 'cageId', this.cage.id);
            this.feedLogs = await db.getByIndex('feedLogs', 'cageId', this.cage.id);
            
            // Sort logs by date (newest first)
            this.productionLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.feedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.render();
        } catch (error) {
            console.error('Error initializing cage detail:', error);
            this.renderError();
        }
    }

    render() {
        const content = `
            <div class="cage-detail fade-in">
                ${this.renderHeader()}
                ${this.renderProductionForm()}
                ${this.renderStats()}
                ${this.renderCharts()}
                ${this.renderLogs()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
        this.renderCharts();
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>${this.cage.name}</h2>
                    <p class="text-muted mb-0">
                        ${this.cycle?.name || 'Unknown Cycle'} • 
                        ${this.cage.currentBirds} birds • 
                        <span class="badge ${this.getStatusBadgeClass(this.cage.status)}">${this.cage.status}</span>
                    </p>
                </div>
                <div>
                    <button class="btn btn-outline-secondary me-2" onclick="router.navigate('cage-manager', {cycleId: ${this.cage.cycleId}})">
                        <i class="fas fa-arrow-left me-2"></i>Back
                    </button>
                    <button class="btn btn-outline-primary" onclick="cageDetail.showCageSettings()">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderProductionForm() {
        const today = new Date().toISOString().split('T')[0];
        const todayLog = this.productionLogs.find(log => log.date === today);
        
        // Auto-calculate flock age from cycle start date
        const flockAge = this.calculateFlockAge(today);
        
        // Auto-calculate opening birds from previous day's closing stock
        const openingBirds = this.getOpeningBirds(today);

        return `
            <div class="production-form">
                <h5><i class="fas fa-plus-circle me-2"></i>Daily Production Entry - ${this.cage.name}</h5>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Cage-Level Entry:</strong> Only mortality and eggs produced are recorded per cage. 
                    Feed consumption and birds sold are tracked at the cycle level.
                    <a href="#" onclick="router.navigate('cycle-feed', {cycleId: ${this.cage.cycleId}})" class="alert-link ms-2">
                        <i class="fas fa-wheat-awn me-1"></i>Manage Feed & Birds Sold
                    </a>
                </div>
                <form id="productionForm">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="logDate" class="form-label">Date</label>
                                <input type="date" class="form-control" id="logDate" value="${today}" required>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="flockAge" class="form-label">Flock Age (days)</label>
                                <input type="number" class="form-control" id="flockAge" min="1" 
                                       value="${flockAge}" readonly>
                                <small class="text-muted">Auto-calculated from cycle start date</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="openingBirds" class="form-label">Opening Birds</label>
                                <input type="number" class="form-control" id="openingBirds" min="0" 
                                       value="${openingBirds}" readonly>
                                <small class="text-muted">Auto-calculated from previous day</small>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="mortality" class="form-label">Mortality</label>
                                <input type="number" class="form-control" id="mortality" min="0" 
                                       value="${todayLog?.mortality || ''}" required>
                                <small class="text-muted">Number of birds that died</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="eggsProduced" class="form-label">Eggs Produced</label>
                                <input type="number" class="form-control" id="eggsProduced" min="0" 
                                       value="${todayLog?.eggsProduced || ''}" required>
                                <small class="text-muted">Number of eggs collected from this cage</small>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="mb-3">
                                <label for="notes" class="form-label">Notes</label>
                                <textarea class="form-control" id="notes" rows="2" 
                                          placeholder="Any observations or notes for this cage...">${todayLog?.notes || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i>${todayLog ? 'Update' : 'Save'} Daily Data
                    </button>
                </form>
            </div>
        `;
    }

    renderStats() {
        const calculations = this.calculateDetailedMetrics();

        return `
            <div class="detailed-metrics mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Calculated Metrics</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-4">
                                <h6 class="text-primary">Age & Birds</h6>
                                <div class="mb-2">
                                    <span class="fw-bold">${calculations.ageInDays}</span> days 
                                    (<span class="fw-bold">${calculations.ageInWeeks}</span> weeks)
                                </div>
                                <div class="mb-2">
                                    Closing Balance: <span class="fw-bold">${calculations.closingBirds}</span>
                                </div>
                                <div class="mb-2">
                                    Cum Mortality: <span class="fw-bold">${calculations.cumMortality}</span> 
                                    (<span class="fw-bold">${calculations.cumMortalityPercent}%</span>)
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <h6 class="text-success">Production</h6>
                                <div class="mb-2">
                                    Current Production: <span class="fw-bold">${calculations.currentProductionPercent}%</span>
                                </div>
                                <div class="mb-2">
                                    Cum Production: <span class="fw-bold">${calculations.cumProductionTrays}</span> trays
                                </div>
                                <div class="mb-2">
                                    Hen House Production: <span class="fw-bold">${calculations.henHouseProduction}</span> eggs/bird
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <h6 class="text-warning">Feed Efficiency</h6>
                                <div class="mb-2">
                                    Current Feed/Bird: <span class="fw-bold">${calculations.currentFeedPerBird}</span> kg
                                </div>
                                <div class="mb-2">
                                    Cum Feed/Bird: <span class="fw-bold">${calculations.cumFeedPerBird}</span> kg
                                </div>
                                <div class="mb-2">
                                    Current Feed/Egg: <span class="fw-bold">${calculations.currentFeedPerEgg}</span> g
                                </div>
                                <div class="mb-2">
                                    Cum Feed/Egg: <span class="fw-bold">${calculations.cumFeedPerEgg}</span> g
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCharts() {
        return `
            <div class="row mb-4">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Production Trend</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="productionChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Performance Overview</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="performanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLogs() {
        return `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Production History</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Eggs</th>
                                            <th>Laying %</th>
                                            <th>Mortality</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.productionLogs.slice(0, 10).map(log => this.renderProductionLogRow(log)).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${this.productionLogs.length === 0 ? '<div class="p-4 text-center text-muted">No production data yet</div>' : ''}
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Feed History</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount (kg)</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.feedLogs.slice(0, 10).map(log => this.renderFeedLogRow(log)).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${this.feedLogs.length === 0 ? '<div class="p-4 text-center text-muted">No feed data yet</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductionLogRow(log) {
        const layingPercentage = Calculations.calculateLayingPercentage(
            log.eggsCollected || 0, 
            this.cage.currentBirds
        );

        return `
            <tr>
                <td>${new Date(log.date).toLocaleDateString()}</td>
                <td><strong>${log.eggsCollected || 0}</strong></td>
                <td><span class="badge bg-${layingPercentage > 80 ? 'success' : layingPercentage > 60 ? 'warning' : 'danger'}">${layingPercentage.toFixed(1)}%</span></td>
                <td>${log.mortality || 0}</td>
                <td><small class="text-muted">${log.notes || '-'}</small></td>
            </tr>
        `;
    }

    renderFeedLogRow(log) {
        return `
            <tr>
                <td>${new Date(log.date).toLocaleDateString()}</td>
                <td>${log.amount || 0}</td>
                <td>${log.cost ? '₵' + log.cost.toFixed(2) : '-'}</td>
            </tr>
        `;
    }

    renderError() {
        const content = `
            <div class="text-center mt-5">
                <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <h4 class="mt-3">Cage Not Found</h4>
                <p class="text-muted">The requested cage could not be found.</p>
                <button class="btn btn-primary" onclick="router.navigate('cycles')">
                    <i class="fas fa-arrow-left me-2"></i>Back to Cycles
                </button>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
    }

    async renderProductionChart() {
        const recentLogs = this.productionLogs.slice(0, 30).reverse();
        
        const chartData = {
            labels: recentLogs.map(log => new Date(log.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Eggs Collected',
                    data: recentLogs.map(log => log.eggsCollected || 0),
                    color: '#2563eb',
                    fill: true
                },
                {
                    label: 'Laying %',
                    data: recentLogs.map(log => 
                        Calculations.calculateLayingPercentage(log.eggsCollected || 0, this.cage.currentBirds)
                    ),
                    color: '#10b981',
                    fill: false
                }
            ]
        };

        setTimeout(() => {
            chartManager.createLineChart('productionChart', chartData, {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            });
        }, 100);
    }

    async renderPerformanceChart() {
        const totalEggs = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const avgLayingRate = this.productionLogs.length ? 
            this.productionLogs.reduce((sum, log) => 
                sum + Calculations.calculateLayingPercentage(log.eggsCollected || 0, this.cage.currentBirds), 0
            ) / this.productionLogs.length : 0;

        const performanceLevel = avgLayingRate > 80 ? 'Excellent' : 
                               avgLayingRate > 60 ? 'Good' : 
                               avgLayingRate > 40 ? 'Average' : 'Below Average';

        const chartData = {
            labels: ['Excellent', 'Good', 'Average', 'Below Average'],
            values: [
                performanceLevel === 'Excellent' ? 1 : 0,
                performanceLevel === 'Good' ? 1 : 0,
                performanceLevel === 'Average' ? 1 : 0,
                performanceLevel === 'Below Average' ? 1 : 0
            ]
        };

        setTimeout(() => {
            chartManager.createDoughnutChart('performanceChart', chartData);
        }, 100);
    }

    getTodayFeedLog() {
        const today = new Date().toISOString().split('T')[0];
        return this.feedLogs.find(log => log.date === today);
    }

    getStatusBadgeClass(status) {
        const classes = {
            'active': 'bg-success',
            'maintenance': 'bg-warning',
            'inactive': 'bg-secondary',
            'cleaning': 'bg-info'
        };
        return classes[status] || 'bg-secondary';
    }

    async handleProductionSubmit(event) {
        event.preventDefault();
        
        const date = document.getElementById('logDate').value;
        const flockAge = parseInt(document.getElementById('flockAge').value);
        const openingBirds = parseInt(document.getElementById('openingBirds').value);
        const mortality = parseInt(document.getElementById('mortality').value) || 0;
        const eggsProduced = parseInt(document.getElementById('eggsProduced').value) || 0;
        const notes = document.getElementById('notes').value;
        
        const formData = {
            cageId: this.cage.id,
            cycleId: this.cage.cycleId,
            date: date,
            flockAge: flockAge,
            openingBirds: openingBirds,
            mortality: mortality,
            birdsSold: 0, // Birds sold tracked at cycle level
            eggsProduced: eggsProduced,
            eggsCollected: eggsProduced,
            closingBirds: openingBirds - mortality,
            currentFeed: 0, // Feed tracked at cycle level
            notes: notes,
            updatedAt: new Date().toISOString()
        };

        try {
            // Check if log exists for this date
            const existingLog = this.productionLogs.find(log => log.date === formData.date);
            
            if (existingLog) {
                formData.id = existingLog.id;
                formData.createdAt = existingLog.createdAt;
                await db.update('productionLogs', formData);
            } else {
                formData.createdAt = new Date().toISOString();
                await db.add('productionLogs', formData);
            }

            // Update cage current birds count
            this.cage.currentBirds = formData.closingBirds;
            this.cage.updatedAt = new Date().toISOString();
            await db.update('cages', this.cage);

            this.showToast('Daily production data saved successfully!', 'success');
            await this.init(this.cage.id); // Refresh the view
        } catch (error) {
            console.error('Error saving production data:', error);
            this.showToast('Error saving data. Please try again.', 'error');
        }
    }

    async updateCageTotals() {
        const totalEggs = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const totalFeed = this.feedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const totalMortality = this.productionLogs.reduce((sum, log) => sum + (log.mortality || 0), 0);

        this.cage.totalEggs = totalEggs;
        this.cage.totalFeed = totalFeed;
        this.cage.mortality = totalMortality;
        this.cage.currentBirds = Math.max(0, (this.cage.currentBirds || 0) - totalMortality);
        this.cage.updatedAt = new Date().toISOString();

        await db.update('cages', this.cage);
    }

    calculateFlockAge(date) {
        if (!this.cycle || !this.cycle.startDate) return 1;
        const startDate = new Date(this.cycle.startDate);
        const currentDate = new Date(date);
        const diffTime = Math.abs(currentDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getOpeningBirds(date) {
        // Get the previous day's closing birds
        const currentDate = new Date(date);
        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        // Find the previous day's log
        const previousLog = this.productionLogs.find(log => log.date === previousDateStr);
        
        if (previousLog) {
            return previousLog.closingBirds || previousLog.openingBirds;
        }
        
        // If no previous log, use cage's current birds
        return this.cage.currentBirds || 0;
    }

    calculateDetailedMetrics() {
        const logs = this.productionLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestLog = logs[logs.length - 1];
        
        if (!latestLog) {
            return {
                ageInDays: 0,
                ageInWeeks: 0,
                closingBirds: this.cage.currentBirds || 0,
                cumMortality: 0,
                cumMortalityPercent: 0,
                currentProductionPercent: 0,
                cumProductionTrays: 0,
                henHouseProduction: 0,
                currentFeedPerBird: 0,
                cumFeedPerBird: 0,
                currentFeedPerEgg: 0,
                cumFeedPerEgg: 0
            };
        }

        const ageInDays = latestLog.flockAge || this.calculateFlockAge(latestLog.date);
        const ageInWeeks = Math.floor(ageInDays / 7);
        
        // Calculate cumulative mortality
        const cumMortality = logs.reduce((sum, log) => sum + (log.mortality || 0), 0);
        const initialBirds = logs[0]?.openingBirds || this.cage.currentBirds;
        const cumMortalityPercent = initialBirds > 0 ? (cumMortality / initialBirds * 100) : 0;
        
        // Calculate production metrics
        const cumProductionTrays = logs.reduce((sum, log) => sum + (log.eggsTrays || 0), 0);
        const cumProductionEggs = cumProductionTrays * 30;
        
        // Current production percentage (latest day)
        const currentProductionPercent = latestLog.openingBirds > 0 ? 
            ((latestLog.eggsTrays * 30) / latestLog.openingBirds * 100) : 0;
        
        // Hen house production (eggs per bird from 19th week - 133 days)
        const layingStartAge = 133; // 19 weeks
        const layingLogs = logs.filter(log => (log.flockAge || 0) >= layingStartAge);
        const layingEggs = layingLogs.reduce((sum, log) => sum + ((log.eggsTrays || 0) * 30), 0);
        const avgBirdsInLayingPeriod = layingLogs.length > 0 ? 
            layingLogs.reduce((sum, log) => sum + (log.openingBirds || 0), 0) / layingLogs.length : 0;
        const henHouseProduction = avgBirdsInLayingPeriod > 0 ? layingEggs / avgBirdsInLayingPeriod : 0;
        
        // Feed calculations
        const cumFeed = this.feedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const currentFeedPerBird = latestLog.openingBirds > 0 ? 
            (latestLog.currentFeed / latestLog.openingBirds) : 0;
        const cumFeedPerBird = avgBirdsInLayingPeriod > 0 ? (cumFeed / avgBirdsInLayingPeriod) : 0;
        
        const currentFeedPerEgg = (latestLog.eggsTrays * 30) > 0 ? 
            (latestLog.currentFeed * 1000) / (latestLog.eggsTrays * 30) : 0; // grams
        const cumFeedPerEgg = cumProductionEggs > 0 ? 
            (cumFeed * 1000) / cumProductionEggs : 0; // grams

        return {
            ageInDays: ageInDays,
            ageInWeeks: ageInWeeks,
            closingBirds: latestLog.closingBirds || latestLog.openingBirds,
            cumMortality: cumMortality,
            cumMortalityPercent: cumMortalityPercent.toFixed(2),
            currentProductionPercent: currentProductionPercent.toFixed(1),
            cumProductionTrays: cumProductionTrays.toFixed(1),
            henHouseProduction: henHouseProduction.toFixed(1),
            currentFeedPerBird: currentFeedPerBird.toFixed(2),
            cumFeedPerBird: cumFeedPerBird.toFixed(2),
            currentFeedPerEgg: currentFeedPerEgg.toFixed(1),
            cumFeedPerEgg: cumFeedPerEgg.toFixed(1)
        };
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastBody = toast.querySelector('.toast-body');
        
        toastBody.textContent = message;
        
        const icon = toast.querySelector('.fas');
        icon.className = type === 'success' ? 'fas fa-check-circle text-success me-2' : 
                        type === 'error' ? 'fas fa-exclamation-circle text-danger me-2' : 
                        'fas fa-info-circle text-primary me-2';
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Global cage detail instance
const cageDetail = new CageDetail();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'productionForm') {
            cageDetail.handleProductionSubmit(e);
        }
    });
});