class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultColors = [
            '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
    }

    createLineChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: '#e2e8f0'
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: true,
                        color: '#e2e8f0'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        const config = {
            type: 'line',
            data: this.formatLineData(data),
            options: { ...defaultOptions, ...options }
        };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    createBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e2e8f0'
                    }
                }
            }
        };

        const config = {
            type: 'bar',
            data: this.formatBarData(data),
            options: { ...defaultOptions, ...options }
        };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    createDoughnutChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            },
            cutout: '60%'
        };

        const config = {
            type: 'doughnut',
            data: this.formatDoughnutData(data),
            options: { ...defaultOptions, ...options }
        };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    formatLineData(data) {
        return {
            labels: data.labels || [],
            datasets: data.datasets?.map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                borderColor: dataset.color || this.defaultColors[index % this.defaultColors.length],
                backgroundColor: dataset.backgroundColor || this.hexToRgba(dataset.color || this.defaultColors[index % this.defaultColors.length], 0.1),
                borderWidth: 2,
                fill: dataset.fill || false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: dataset.yAxisID // Preserve yAxisID for dual axis charts
            })) || []
        };
    }

    formatBarData(data) {
        return {
            labels: data.labels || [],
            datasets: data.datasets?.map((dataset, index) => ({
                label: dataset.label || `Dataset ${index + 1}`,
                data: dataset.data || [],
                backgroundColor: dataset.color || this.defaultColors[index % this.defaultColors.length],
                borderColor: dataset.color || this.defaultColors[index % this.defaultColors.length],
                borderWidth: 1,
                borderRadius: 4
            })) || []
        };
    }

    formatDoughnutData(data) {
        return {
            labels: data.labels || [],
            datasets: [{
                data: data.values || [],
                backgroundColor: data.colors || this.defaultColors.slice(0, data.values?.length || 0),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }

    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        if (chart.config.type === 'doughnut') {
            chart.data = this.formatDoughnutData(newData);
        } else if (chart.config.type === 'bar') {
            chart.data = this.formatBarData(newData);
        } else {
            chart.data = this.formatLineData(newData);
        }

        chart.update();
    }

    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }

    hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
            : hex;
    }

    createProductionChart(containerId, productionData) {
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${containerId}`;
        canvas.style.maxHeight = '300px';
        
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(canvas);

        const chartData = {
            labels: productionData.map(d => {
                // Use Calculations.formatDate if available, otherwise use dd/mm/yyyy format
                if (typeof Calculations !== 'undefined' && Calculations.formatDate) {
                    return Calculations.formatDate(d.date);
                }
                const date = new Date(d.date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Eggs Collected',
                    data: productionData.map(d => d.eggsCollected || 0),
                    color: '#2563eb',
                    fill: true
                },
                {
                    label: 'Laying %',
                    data: productionData.map(d => d.layingPercentage || 0),
                    color: '#10b981',
                    fill: false
                }
            ]
        };

        return this.createLineChart(canvas.id, chartData, {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        });
    }

    createFeedChart(containerId, feedData) {
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${containerId}`;
        canvas.style.maxHeight = '300px';
        
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(canvas);

        const chartData = {
            labels: feedData.map(d => {
                // Use Calculations.formatDate if available, otherwise use dd/mm/yyyy format
                if (typeof Calculations !== 'undefined' && Calculations.formatDate) {
                    return Calculations.formatDate(d.date);
                }
                const date = new Date(d.date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Feed Consumed (kg)',
                    data: feedData.map(d => d.amount || 0),
                    color: '#f59e0b'
                }
            ]
        };

        return this.createBarChart(canvas.id, chartData);
    }

    createPerformanceChart(containerId, performanceData) {
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${containerId}`;
        canvas.style.maxHeight = '300px';
        
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(canvas);

        const chartData = {
            labels: ['Excellent', 'Good', 'Average', 'Below Average'],
            values: performanceData.values || [0, 0, 0, 0],
            colors: ['#10b981', '#84cc16', '#f59e0b', '#ef4444']
        };

        return this.createDoughnutChart(canvas.id, chartData);
    }

    createTrendChart(containerId, trendData, title = 'Trend Analysis') {
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${containerId}`;
        canvas.style.maxHeight = '300px';
        
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(canvas);

        const chartData = {
            labels: trendData.labels || [],
            datasets: trendData.datasets || []
        };

        return this.createLineChart(canvas.id, chartData, {
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        });
    }
}

// Global chart manager instance
const chartManager = new ChartManager();