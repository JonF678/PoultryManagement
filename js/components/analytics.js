class Analytics {
    constructor() {
        this.cycle = null;
        this.cages = [];
        this.productionLogs = [];
        this.feedLogs = [];
        this.currentFilter = 'all';
        this.dateRange = 30; // days
    }

    async init(cycleId = null) {
        try {
            if (cycleId) {
                this.cycle = await db.get('cycles', parseInt(cycleId));
                this.cages = await db.getByIndex('cages', 'cycleId', parseInt(cycleId));
                this.productionLogs = await db.getByIndex('productionLogs', 'cycleId', parseInt(cycleId));
                this.feedLogs = await db.getByIndex('feedLogs', 'cycleId', parseInt(cycleId));
            } else {
                // Load all data for overall analytics
                this.cycle = null;
                this.cages = await db.getAll('cages');
                this.productionLogs = await db.getAll('productionLogs');
                this.feedLogs = await db.getAll('feedLogs');
            }

            this.render();
            this.loadAnalytics();
        } catch (error) {
            console.error('Error initializing analytics:', error);
            this.renderError();
        }
    }

    render() {
        const content = `
            <div class="analytics fade-in">
                ${this.renderHeader()}
                ${this.renderFilters()}
                ${this.renderKPIs()}
                ${this.renderCharts()}
                ${this.renderTables()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Analytics Dashboard</h2>
                    <p class="text-muted mb-0">
                        ${this.cycle ? `Cycle: ${this.cycle.name}` : 'All Cycles Overview'}
                    </p>
                </div>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="analytics.exportData()">
                        <i class="fas fa-download me-2"></i>Export Data
                    </button>
                    ${this.cycle ? `
                        <button class="btn btn-outline-secondary" onclick="router.navigate('cage-manager', {cycleId: ${this.cycle.id}})">
                            <i class="fas fa-arrow-left me-2"></i>Back to Cages
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderFilters() {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <label for="dateRange" class="form-label">Date Range</label>
                            <select class="form-select" id="dateRange" onchange="analytics.updateDateRange(this.value)">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                                <option value="all">All time</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="cageFilter" class="form-label">Cage Filter</label>
                            <select class="form-select" id="cageFilter" onchange="analytics.updateCageFilter(this.value)">
                                <option value="all">All Cages</option>
                                ${this.cages.map(cage => `<option value="${cage.id}">${cage.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="metricType" class="form-label">Primary Metric</label>
                            <select class="form-select" id="metricType" onchange="analytics.updateMetricType(this.value)">
                                <option value="production">Egg Production</option>
                                <option value="efficiency">Laying Efficiency</option>
                                <option value="feed">Feed Consumption</option>
                                <option value="mortality">Mortality Rate</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-primary mt-4" onclick="analytics.refreshAnalytics()">
                                <i class="fas fa-sync-alt me-2"></i>Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderKPIs() {
        return `
            <div class="row mb-4" id="kpi-cards">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-primary" id="total-production">-</div>
                            <div class="stats-label">Total Production</div>
                            <small class="text-muted" id="production-trend">-</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-success" id="avg-laying-rate">-</div>
                            <div class="stats-label">Avg Laying Rate</div>
                            <small class="text-muted" id="laying-trend">-</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-warning" id="feed-efficiency">-</div>
                            <div class="stats-label">Feed Efficiency</div>
                            <small class="text-muted" id="feed-trend">-</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-info" id="avg-egg-weight">-</div>
                            <div class="stats-label">Avg Egg Weight</div>
                            <small class="text-muted" id="weight-trend">-</small>
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
                            <h6 class="mb-0">Production Trends</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="productionTrendChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Cage Performance</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="cagePerformanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Feed Consumption</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="feedChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Efficiency Metrics</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="efficiencyChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTables() {
        return `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Top Performing Cages</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Cage</th>
                                            <th>Total Eggs</th>
                                            <th>Laying Rate</th>
                                            <th>Feed Efficiency</th>
                                            <th>Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody id="performance-table">
                                        <!-- Data will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Quick Insights</h6>
                        </div>
                        <div class="card-body">
                            <div id="insights-list">
                                <!-- Insights will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderError() {
        const content = `
            <div class="text-center mt-5">
                <i class="fas fa-chart-line text-muted" style="font-size: 3rem;"></i>
                <h4 class="mt-3">Analytics Unavailable</h4>
                <p class="text-muted">Unable to load analytics data. Please try again.</p>
                <button class="btn btn-primary" onclick="analytics.init()">
                    <i class="fas fa-sync-alt me-2"></i>Retry
                </button>
            </div>
        `;
        document.getElementById('app-content').innerHTML = content;
    }

    async loadAnalytics() {
        this.loadKPIs();
        this.loadCharts();
        this.loadPerformanceTable();
        this.loadInsights();
    }

    loadKPIs() {
        const filteredLogs = this.getFilteredLogs();
        const filteredFeedLogs = this.getFilteredFeedLogs();

        // Total production
        const totalProduction = filteredLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        document.getElementById('total-production').textContent = totalProduction.toLocaleString();

        // Average laying rate
        const totalBirds = this.cages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
        const avgLayingRate = totalBirds > 0 ? 
            Calculations.calculateLayingPercentage(totalProduction, totalBirds, filteredLogs.length || 1) : 0;
        document.getElementById('avg-laying-rate').textContent = `${avgLayingRate.toFixed(1)}%`;

        // Feed efficiency
        const totalFeed = filteredFeedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const feedEfficiency = Calculations.calculateFeedEfficiency(totalProduction, totalFeed);
        document.getElementById('feed-efficiency').textContent = feedEfficiency.toFixed(2);

        // Average egg weight
        const logsWithWeight = filteredLogs.filter(log => log.avgEggWeight > 0);
        const avgEggWeight = logsWithWeight.length > 0 ?
            logsWithWeight.reduce((sum, log) => sum + log.avgEggWeight, 0) / logsWithWeight.length : 0;
        document.getElementById('avg-egg-weight').textContent = `${avgEggWeight.toFixed(1)}g`;
    }

    loadCharts() {
        this.loadProductionTrendChart();
        this.loadCagePerformanceChart();
        this.loadFeedChart();
        this.loadEfficiencyChart();
    }

    loadProductionTrendChart() {
        const filteredLogs = this.getFilteredLogs();
        const groupedData = Calculations.groupDataByPeriod(filteredLogs, 'week');
        
        const labels = Object.keys(groupedData).sort();
        const productionData = labels.map(week => {
            const weekLogs = groupedData[week];
            return weekLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        });

        const layingData = labels.map(week => {
            const weekLogs = groupedData[week];
            const totalEggs = weekLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
            const avgBirds = this.cages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
            return avgBirds > 0 ? Calculations.calculateLayingPercentage(totalEggs, avgBirds, 7) : 0;
        });

        const chartData = {
            labels: labels.map(label => new Date(label).toLocaleDateString()),
            datasets: [
                {
                    label: 'Weekly Production',
                    data: productionData,
                    color: '#2563eb',
                    fill: true
                },
                {
                    label: 'Laying Rate %',
                    data: layingData,
                    color: '#10b981',
                    fill: false
                }
            ]
        };

        setTimeout(() => {
            chartManager.createLineChart('productionTrendChart', chartData);
        }, 100);
    }

    loadCagePerformanceChart() {
        const cagePerformance = this.cages.map(cage => {
            const cageLogs = this.productionLogs.filter(log => log.cageId === cage.id);
            const totalEggs = cageLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
            const avgLayingRate = cage.currentBirds > 0 ?
                Calculations.calculateLayingPercentage(totalEggs, cage.currentBirds, cageLogs.length || 1) : 0;
            
            return {
                name: cage.name,
                performance: avgLayingRate
            };
        });

        cagePerformance.sort((a, b) => b.performance - a.performance);

        const chartData = {
            labels: cagePerformance.map(cage => cage.name),
            datasets: [{
                label: 'Laying Rate %',
                data: cagePerformance.map(cage => cage.performance),
                color: '#8b5cf6'
            }]
        };

        setTimeout(() => {
            chartManager.createBarChart('cagePerformanceChart', chartData);
        }, 100);
    }

    loadFeedChart() {
        const filteredFeedLogs = this.getFilteredFeedLogs();
        const groupedFeedData = Calculations.groupDataByPeriod(filteredFeedLogs, 'week');
        
        const labels = Object.keys(groupedFeedData).sort();
        const feedData = labels.map(week => {
            const weekLogs = groupedFeedData[week];
            return weekLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        });

        const chartData = {
            labels: labels.map(label => new Date(label).toLocaleDateString()),
            datasets: [{
                label: 'Weekly Feed (kg)',
                data: feedData,
                color: '#f59e0b'
            }]
        };

        setTimeout(() => {
            chartManager.createBarChart('feedChart', chartData);
        }, 100);
    }

    loadEfficiencyChart() {
        const recentLogs = this.getFilteredLogs().slice(-30);
        
        const efficiencyData = recentLogs.map(log => {
            const feedLog = this.feedLogs.find(f => f.date === log.date && f.cageId === log.cageId);
            const feedAmount = feedLog?.amount || 0;
            return Calculations.calculateFeedEfficiency(log.eggsCollected || 0, feedAmount);
        });

        const movingAvg = Calculations.calculateMovingAverage(efficiencyData, 7);

        const chartData = {
            labels: recentLogs.slice(-movingAvg.length).map(log => new Date(log.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Daily Efficiency',
                    data: efficiencyData.slice(-movingAvg.length),
                    color: '#06b6d4',
                    fill: false
                },
                {
                    label: '7-Day Average',
                    data: movingAvg,
                    color: '#ef4444',
                    fill: false
                }
            ]
        };

        setTimeout(() => {
            chartManager.createLineChart('efficiencyChart', chartData);
        }, 100);
    }

    loadPerformanceTable() {
        const cageStats = this.cages.map(cage => {
            const cageLogs = this.productionLogs.filter(log => log.cageId === cage.id);
            const cageFeedLogs = this.feedLogs.filter(log => log.cageId === cage.id);
            
            const totalEggs = cageLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
            const totalFeed = cageFeedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
            
            const layingRate = cage.currentBirds > 0 ?
                Calculations.calculateLayingPercentage(totalEggs, cage.currentBirds, cageLogs.length || 1) : 0;
            const feedEfficiency = Calculations.calculateFeedEfficiency(totalEggs, totalFeed);
            
            const performanceScore = layingRate * 0.6 + (feedEfficiency * 10) * 0.4;
            
            return {
                cage,
                totalEggs,
                layingRate,
                feedEfficiency,
                performanceScore
            };
        });

        cageStats.sort((a, b) => b.performanceScore - a.performanceScore);

        const tableBody = document.getElementById('performance-table');
        tableBody.innerHTML = cageStats.map(stat => `
            <tr onclick="router.navigate('cage-detail', {id: ${stat.cage.id}})" style="cursor: pointer;">
                <td><strong>${stat.cage.name}</strong></td>
                <td>${stat.totalEggs.toLocaleString()}</td>
                <td>
                    <span class="badge bg-${stat.layingRate > 80 ? 'success' : stat.layingRate > 60 ? 'warning' : 'danger'}">
                        ${stat.layingRate.toFixed(1)}%
                    </span>
                </td>
                <td>${stat.feedEfficiency.toFixed(2)}</td>
                <td>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-primary" style="width: ${Math.min(100, stat.performanceScore)}%"></div>
                    </div>
                    <small class="text-muted">${stat.performanceScore.toFixed(0)}/100</small>
                </td>
            </tr>
        `).join('');
    }

    loadInsights() {
        const insights = this.generateInsights();
        const insightsList = document.getElementById('insights-list');
        
        insightsList.innerHTML = insights.map(insight => `
            <div class="alert alert-${insight.type} alert-dismissible">
                <i class="fas ${insight.icon} me-2"></i>
                <strong>${insight.title}</strong><br>
                <small>${insight.description}</small>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];
        
        // Calculate overall metrics
        const totalProduction = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const totalBirds = this.cages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
        const avgLayingRate = totalBirds > 0 ?
            Calculations.calculateLayingPercentage(totalProduction, totalBirds, this.productionLogs.length || 1) : 0;

        // Performance insights
        if (avgLayingRate > 85) {
            insights.push({
                type: 'success',
                icon: 'fa-thumbs-up',
                title: 'Excellent Performance',
                description: 'Your laying rate is above 85%, indicating excellent flock health and management.'
            });
        } else if (avgLayingRate < 60) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'Below Average Performance',
                description: 'Consider reviewing feeding schedules, health management, or environmental conditions.'
            });
        }

        // Feed efficiency insights
        const totalFeed = this.feedLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
        const feedEfficiency = Calculations.calculateFeedEfficiency(totalProduction, totalFeed);
        
        if (feedEfficiency < 0.5) {
            insights.push({
                type: 'info',
                icon: 'fa-info-circle',
                title: 'Feed Efficiency Alert',
                description: 'Feed conversion ratio could be improved. Consider adjusting feed quality or quantity.'
            });
        }

        // Trend insights
        const recentLogs = this.productionLogs.slice(-7);
        const previousLogs = this.productionLogs.slice(-14, -7);
        
        if (recentLogs.length > 0 && previousLogs.length > 0) {
            const recentAvg = recentLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0) / recentLogs.length;
            const previousAvg = previousLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0) / previousLogs.length;
            
            if (recentAvg > previousAvg * 1.1) {
                insights.push({
                    type: 'success',
                    icon: 'fa-trending-up',
                    title: 'Production Increasing',
                    description: 'Production has increased by more than 10% compared to the previous week.'
                });
            } else if (recentAvg < previousAvg * 0.9) {
                insights.push({
                    type: 'warning',
                    icon: 'fa-trending-down',
                    title: 'Production Declining',
                    description: 'Production has decreased by more than 10% compared to the previous week.'
                });
            }
        }

        return insights.slice(0, 4); // Limit to 4 insights
    }

    getFilteredLogs() {
        let logs = [...this.productionLogs];
        
        // Filter by date range
        if (this.dateRange !== 'all') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(this.dateRange));
            logs = logs.filter(log => new Date(log.date) >= cutoffDate);
        }
        
        // Filter by cage
        if (this.currentFilter !== 'all') {
            logs = logs.filter(log => log.cageId === parseInt(this.currentFilter));
        }
        
        return logs;
    }

    getFilteredFeedLogs() {
        let logs = [...this.feedLogs];
        
        // Filter by date range
        if (this.dateRange !== 'all') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(this.dateRange));
            logs = logs.filter(log => new Date(log.date) >= cutoffDate);
        }
        
        // Filter by cage
        if (this.currentFilter !== 'all') {
            logs = logs.filter(log => log.cageId === parseInt(this.currentFilter));
        }
        
        return logs;
    }

    updateDateRange(days) {
        this.dateRange = days;
        this.refreshAnalytics();
    }

    updateCageFilter(cageId) {
        this.currentFilter = cageId;
        this.refreshAnalytics();
    }

    updateMetricType(type) {
        this.metricType = type;
        this.refreshAnalytics();
    }

    refreshAnalytics() {
        this.loadAnalytics();
    }

    async exportData() {
        try {
            const exportData = {
                cycle: this.cycle,
                cages: this.cages,
                productionLogs: this.productionLogs,
                feedLogs: this.feedLogs,
                summary: {
                    totalProduction: this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0),
                    totalFeed: this.feedLogs.reduce((sum, log) => sum + (log.amount || 0), 0),
                    avgLayingRate: this.calculateOverallLayingRate(),
                    exportDate: new Date().toISOString()
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `analytics-export-${this.cycle?.name || 'all-cycles'}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('Analytics data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting analytics data:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }

    calculateOverallLayingRate() {
        const totalProduction = this.productionLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);
        const totalBirds = this.cages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);
        return totalBirds > 0 ? Calculations.calculateLayingPercentage(totalProduction, totalBirds, this.productionLogs.length || 1) : 0;
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

// Global analytics instance
const analytics = new Analytics();