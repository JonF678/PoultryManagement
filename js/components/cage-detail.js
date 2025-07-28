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
            this.feedLogs = await db.getByIndex('feedLogs', 'cycleId', this.cage.cycleId);
            
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
        this.loadMetrics();
        
        // Load the actual charts after a small delay to ensure DOM is ready
        setTimeout(() => {
            this.renderProductionChart();
            this.renderPerformanceChart();
        }, 200);
    }

    async loadMetrics() {
        try {
            const calculations = await this.calculateDetailedMetrics();
            
            const metricsContent = `
                <div class="row">
                    <div class="col-lg-4">
                        <h6 class="text-primary">Age & Birds</h6>
                        <div class="mb-2">
                            <span class="fw-bold">${calculations.ageInDays}</span> days 
                            (<span class="fw-bold">${calculations.ageInWeeks}</span> weeks)
                        </div>
                        <div class="mb-2">
                            Current Flock: <span class="fw-bold">${calculations.closingBirds.toLocaleString()}</span>
                        </div>
                        <div class="mb-2">
                            Cum Mortality: <span class="fw-bold">${calculations.cumMortality.toLocaleString()}</span> 
                            (<span class="fw-bold">${calculations.cumMortalityPercent}%</span>)
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <h6 class="text-success">Production</h6>
                        <div class="mb-2">
                            Current Production: <span class="fw-bold">${calculations.currentProductionPercent}%</span>
                        </div>
                        <div class="mb-2">
                            Cum Production: <span class="fw-bold">${calculations.cumProductionEggs.toLocaleString()}</span> eggs
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
            `;
            
            document.getElementById('metrics-content').innerHTML = metricsContent;
        } catch (error) {
            console.error('Error loading metrics:', error);
            document.getElementById('metrics-content').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error loading flock metrics. Please try again.
                </div>
            `;
        }
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
        return `
            <div class="detailed-metrics mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Flock-Level Metrics</h6>
                        <small class="text-muted">Calculated for entire flock across all cages</small>
                    </div>
                    <div class="card-body">
                        <div id="metrics-content">
                            <div class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading metrics...</span>
                                </div>
                                <small class="d-block mt-2 text-muted">Calculating flock metrics...</small>
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
                            <h6 class="mb-0">Feed History (Cycle Level)</h6>
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
                            ${this.feedLogs.length === 0 ? '<div class="p-4 text-center text-muted">No cycle feed data yet. <br><small>Feed is managed at cycle level for entire flock.</small></div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductionLogRow(log) {
        const eggs = log.eggsCollected || log.eggsProduced || 0;
        const layingPercentage = Calculations.calculateLayingPercentage(
            eggs, 
            this.cage.currentBirds
        );

        const date = new Date(log.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${eggs}</strong></td>
                <td><span class="badge bg-${layingPercentage > 80 ? 'success' : layingPercentage > 60 ? 'warning' : 'danger'}">${layingPercentage.toFixed(1)}%</span></td>
                <td>${log.mortality || 0}</td>
                <td><small class="text-muted">${log.notes || '-'}</small></td>
            </tr>
        `;
    }

    renderFeedLogRow(log) {
        const date = new Date(log.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${log.feedConsumed || log.amount || 0}</td>
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
        if (this.productionLogs.length === 0) {
            document.getElementById('productionChart').parentElement.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-chart-line fa-3x mb-3"></i>
                    <p>No production data available yet.</p>
                    <small>Start logging daily production to see trends.</small>
                </div>
            `;
            return;
        }

        const recentLogs = this.productionLogs.slice(-30); // Last 30 entries
        
        const chartData = {
            labels: recentLogs.map(log => {
                const date = new Date(log.date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Eggs Collected',
                    data: recentLogs.map(log => log.eggsCollected || log.eggsProduced || 0),
                    color: '#2563eb',
                    fill: true
                },
                {
                    label: 'Laying %',
                    data: recentLogs.map(log => 
                        Calculations.calculateLayingPercentage(log.eggsCollected || log.eggsProduced || 0, this.cage.currentBirds)
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
        if (this.productionLogs.length === 0) {
            document.getElementById('performanceChart').parentElement.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-chart-pie fa-3x mb-3"></i>
                    <p>No performance data available yet.</p>
                    <small>Start logging production to see performance overview.</small>
                </div>
            `;
            return;
        }

        const totalEggs = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const avgLayingRate = this.productionLogs.length ? 
            this.productionLogs.reduce((sum, log) => 
                sum + Calculations.calculateLayingPercentage(log.eggsCollected || 0, this.cage.currentBirds), 0
            ) / this.productionLogs.length : 0;

        // Calculate performance metrics for the doughnut chart
        const excellent = avgLayingRate > 80 ? avgLayingRate : 0;
        const good = avgLayingRate > 60 && avgLayingRate <= 80 ? avgLayingRate : 0;
        const average = avgLayingRate > 40 && avgLayingRate <= 60 ? avgLayingRate : 0;
        const belowAvg = avgLayingRate <= 40 ? avgLayingRate : 0;

        const chartData = {
            labels: ['Performance Rating'],
            datasets: [{
                label: 'Performance Level',
                data: [avgLayingRate, 100 - avgLayingRate],
                backgroundColor: [
                    avgLayingRate > 80 ? '#10b981' : 
                    avgLayingRate > 60 ? '#f59e0b' : 
                    avgLayingRate > 40 ? '#f97316' : '#ef4444',
                    '#e5e7eb'
                ],
                borderWidth: 0
            }]
        };

        setTimeout(() => {
            chartManager.createDoughnutChart('performanceChart', chartData, {
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Laying Rate: ${avgLayingRate.toFixed(1)}%`;
                            }
                        }
                    }
                }
            });
            
            // Add performance text overlay
            const canvas = document.getElementById('performanceChart');
            const container = canvas.parentElement;
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                pointer-events: none;
            `;
            overlay.innerHTML = `
                <div style="font-size: 18px; font-weight: bold; color: ${
                    avgLayingRate > 80 ? '#10b981' : 
                    avgLayingRate > 60 ? '#f59e0b' : 
                    avgLayingRate > 40 ? '#f97316' : '#ef4444'
                }">
                    ${avgLayingRate.toFixed(1)}%
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    ${avgLayingRate > 80 ? 'Excellent' : 
                      avgLayingRate > 60 ? 'Good' : 
                      avgLayingRate > 40 ? 'Average' : 'Below Average'}
                </div>
            `;
            container.style.position = 'relative';
            container.appendChild(overlay);
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

    async calculateDetailedMetrics() {
        // Get all production logs for the entire cycle (all cages)
        const allProductionLogs = await db.getByIndex('productionLogs', 'cycleId', this.cage.cycleId);
        const allFeedLogs = await db.getByIndex('feedLogs', 'cycleId', this.cage.cycleId);
        
        const logs = allProductionLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
        const today = new Date().toISOString().split('T')[0];
        
        if (logs.length === 0) {
            return {
                ageInDays: 0,
                ageInWeeks: 0,
                closingBirds: 0,
                cumMortality: 0,
                cumMortalityPercent: 0,
                currentProductionPercent: 0,
                cumProductionEggs: 0,
                henHouseProduction: 0,
                currentFeedPerBird: 0,
                cumFeedPerBird: 0,
                currentFeedPerEgg: 0,
                cumFeedPerEgg: 0
            };
        }

        // Calculate flock age from cycle start date
        const ageInDays = this.calculateFlockAge(today);
        const ageInWeeks = Math.floor(ageInDays / 7);
        
        // Get all cages for this cycle to calculate total flock size
        const allCages = await db.getByIndex('cages', 'cycleId', this.cage.cycleId);
        const totalFlockSize = allCages.reduce((sum, cage) => sum + (cage.initialBirds || 0), 0);
        const currentFlockSize = allCages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
        
        // Calculate cumulative mortality for entire flock
        const cumMortality = logs.reduce((sum, log) => sum + (log.mortality || 0), 0);
        const cumMortalityPercent = totalFlockSize > 0 ? (cumMortality / totalFlockSize * 100) : 0;
        
        // Calculate production metrics for entire flock
        const cumProductionEggs = logs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        
        // Current production percentage (today's total eggs vs current flock size)
        const todayLogs = logs.filter(log => log.date === today);
        const todayEggs = todayLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const currentProductionPercent = currentFlockSize > 0 ? (todayEggs / currentFlockSize * 100) : 0;
        
        // Hen house production (eggs per bird from 19th week - 133 days)
        const layingStartAge = 133; // 19 weeks
        const layingLogs = logs.filter(log => (log.flockAge || 0) >= layingStartAge);
        const layingEggs = layingLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const layingDays = layingLogs.length > 0 ? 
            Math.max(1, Math.floor(layingLogs.length / allCages.length)) : 0;
        const avgBirdsInLayingPeriod = layingDays > 0 ? 
            layingLogs.reduce((sum, log) => sum + (log.openingBirds || 0), 0) / layingLogs.length : 0;
        const henHouseProduction = avgBirdsInLayingPeriod > 0 ? layingEggs / avgBirdsInLayingPeriod : 0;
        
        // Feed calculations for entire flock
        const cumFeed = allFeedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const todayFeed = allFeedLogs.filter(log => log.date === today)
            .reduce((sum, log) => sum + (log.amount || 0), 0);
        
        const currentFeedPerBird = currentFlockSize > 0 ? (todayFeed / currentFlockSize) : 0;
        const cumFeedPerBird = totalFlockSize > 0 ? (cumFeed / totalFlockSize) : 0;
        
        const currentFeedPerEgg = todayEggs > 0 ? (todayFeed * 1000) / todayEggs : 0; // grams
        const cumFeedPerEgg = cumProductionEggs > 0 ? (cumFeed * 1000) / cumProductionEggs : 0; // grams

        return {
            ageInDays: ageInDays,
            ageInWeeks: ageInWeeks,
            closingBirds: currentFlockSize,
            cumMortality: cumMortality,
            cumMortalityPercent: cumMortalityPercent.toFixed(2),
            currentProductionPercent: currentProductionPercent.toFixed(1),
            cumProductionEggs: cumProductionEggs,
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