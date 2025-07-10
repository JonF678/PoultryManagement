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

        return `
            <div class="production-form">
                <h5><i class="fas fa-plus-circle me-2"></i>Log Production Data</h5>
                <form id="productionForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="logDate" class="form-label">Date</label>
                                <input type="date" class="form-control" id="logDate" value="${today}" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="eggsCollected" class="form-label">Eggs Collected</label>
                                <input type="number" class="form-control" id="eggsCollected" min="0" 
                                       value="${todayLog?.eggsCollected || ''}" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="feedConsumed" class="form-label">Feed Consumed (kg)</label>
                                <input type="number" class="form-control" id="feedConsumed" step="0.1" min="0" 
                                       value="${this.getTodayFeedLog()?.amount || ''}">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="mortality" class="form-label">Mortality</label>
                                <input type="number" class="form-control" id="mortality" min="0" 
                                       value="${todayLog?.mortality || ''}">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="avgEggWeight" class="form-label">Avg Egg Weight (g)</label>
                                <input type="number" class="form-control" id="avgEggWeight" step="0.1" min="0" 
                                       value="${todayLog?.avgEggWeight || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="mb-3">
                                <label for="notes" class="form-label">Notes</label>
                                <textarea class="form-control" id="notes" rows="2" 
                                          placeholder="Any observations or notes...">${todayLog?.notes || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i>${todayLog ? 'Update' : 'Save'} Production Data
                    </button>
                </form>
            </div>
        `;
    }

    renderStats() {
        const totalEggs = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const totalFeed = this.feedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const totalMortality = this.productionLogs.reduce((sum, log) => sum + (log.mortality || 0), 0);
        
        const recentLogs = this.productionLogs.slice(0, 7);
        const avgDailyProduction = recentLogs.length ? 
            recentLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0) / recentLogs.length : 0;
        
        const layingPercentage = this.cage.currentBirds ? 
            Calculations.calculateLayingPercentage(avgDailyProduction, this.cage.currentBirds) : 0;

        return `
            <div class="quick-stats">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-primary">${totalEggs.toLocaleString()}</div>
                        <div class="stats-label">Total Eggs</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-success">${layingPercentage.toFixed(1)}%</div>
                        <div class="stats-label">Laying Rate</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-warning">${totalFeed.toFixed(1)} kg</div>
                        <div class="stats-label">Total Feed</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-danger">${totalMortality}</div>
                        <div class="stats-label">Mortality</div>
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
                <td>${log.cost ? '$' + log.cost.toFixed(2) : '-'}</td>
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
        
        const formData = {
            cageId: this.cage.id,
            cycleId: this.cage.cycleId,
            date: document.getElementById('logDate').value,
            eggsCollected: parseInt(document.getElementById('eggsCollected').value) || 0,
            mortality: parseInt(document.getElementById('mortality').value) || 0,
            avgEggWeight: parseFloat(document.getElementById('avgEggWeight').value) || null,
            notes: document.getElementById('notes').value,
            updatedAt: new Date().toISOString()
        };

        const feedAmount = parseFloat(document.getElementById('feedConsumed').value);

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

            // Handle feed log
            if (feedAmount > 0) {
                const existingFeedLog = this.feedLogs.find(log => log.date === formData.date);
                const feedData = {
                    cageId: this.cage.id,
                    cycleId: this.cage.cycleId,
                    date: formData.date,
                    amount: feedAmount,
                    updatedAt: new Date().toISOString()
                };

                if (existingFeedLog) {
                    feedData.id = existingFeedLog.id;
                    feedData.createdAt = existingFeedLog.createdAt;
                    await db.update('feedLogs', feedData);
                } else {
                    feedData.createdAt = new Date().toISOString();
                    await db.add('feedLogs', feedData);
                }
            }

            // Update cage totals
            await this.updateCageTotals();

            this.showToast('Production data saved successfully!', 'success');
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