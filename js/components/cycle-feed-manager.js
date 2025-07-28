class CycleFeedManager {
    constructor() {
        this.cycle = null;
        this.feedLogs = [];
        this.birdsSoldLogs = [];
    }

    async init(cycleId) {
        try {
            this.cycle = await db.get('cycles', parseInt(cycleId));
            if (!this.cycle) {
                throw new Error('Cycle not found');
            }

            // Load feed logs for this cycle
            this.feedLogs = await db.getByIndex('feedLogs', 'cycleId', this.cycle.id);
            
            // Load birds sold logs (from production logs)
            const allProductionLogs = await db.getByIndex('productionLogs', 'cycleId', this.cycle.id);
            this.birdsSoldLogs = allProductionLogs.filter(log => log.birdsSold > 0);
            
            // Sort logs by date (newest first)
            this.feedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.birdsSoldLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.render();
        } catch (error) {
            console.error('Error initializing cycle feed manager:', error);
            this.renderError();
        }
    }

    render() {
        const content = `
            <div class="cycle-feed-manager fade-in">
                ${this.renderHeader()}
                ${this.renderTabs()}
                ${this.renderTabContent()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Cycle Feed & Birds Management</h2>
                    <p class="text-muted mb-0">
                        ${this.cycle?.name || 'Unknown Cycle'} • 
                        Feed consumption and birds sold for entire flock
                    </p>
                </div>
                <div>
                    <button class="btn btn-outline-secondary" onclick="router.navigate('cycles')">
                        <i class="fas fa-arrow-left me-2"></i>Back to Cycles
                    </button>
                </div>
            </div>
        `;
    }

    renderTabs() {
        return `
            <ul class="nav nav-tabs" id="managementTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="feed-tab" data-bs-toggle="tab" data-bs-target="#feed-panel" type="button" role="tab">
                        <i class="fas fa-wheat-awn me-2"></i>Feed Management
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="birds-tab" data-bs-toggle="tab" data-bs-target="#birds-panel" type="button" role="tab">
                        <i class="fas fa-dove me-2"></i>Birds Sold
                    </button>
                </li>
            </ul>
        `;
    }

    renderTabContent() {
        return `
            <div class="tab-content" id="managementTabContent">
                <div class="tab-pane fade show active" id="feed-panel" role="tabpanel">
                    ${this.renderFeedManagement()}
                </div>
                <div class="tab-pane fade" id="birds-panel" role="tabpanel">
                    ${this.renderBirdsManagement()}
                </div>
            </div>
        `;
    }

    renderFeedManagement() {
        const today = new Date().toISOString().split('T')[0];
        const todayFeed = this.feedLogs.find(log => log.date === today);

        return `
            <div class="mt-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Daily Feed Entry</h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Cycle-Level Feed:</strong> Enter total feed consumed by the entire flock for the day.
                        </div>
                        <form id="feedForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="feedDate" class="form-label">Date</label>
                                        <input type="date" class="form-control" id="feedDate" value="${today}" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="feedAmount" class="form-label">Feed Amount (kg)</label>
                                        <input type="number" class="form-control" id="feedAmount" step="0.1" min="0" 
                                               value="${todayFeed?.amount || ''}" required>
                                        <small class="text-muted">Total feed consumed by entire flock</small>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="feedCost" class="form-label">Feed Cost (₵)</label>
                                        <input type="number" class="form-control" id="feedCost" step="0.01" min="0" 
                                               value="${todayFeed?.cost || ''}">
                                        <small class="text-muted">Cost of feed for this day</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="mb-3">
                                        <label for="feedNotes" class="form-label">Notes</label>
                                        <textarea class="form-control" id="feedNotes" rows="2" 
                                                  placeholder="Feed type, supplier, observations...">${todayFeed?.notes || ''}</textarea>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i>${todayFeed ? 'Update' : 'Save'} Feed Data
                            </button>
                        </form>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Feed History</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount (kg)</th>
                                        <th>Cost (₵)</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.feedLogs.slice(0, 20).map(log => this.renderFeedLogRow(log)).join('')}
                                </tbody>
                            </table>
                        </div>
                        ${this.feedLogs.length === 0 ? '<div class="p-4 text-center text-muted">No feed data yet</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderBirdsManagement() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="mt-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Birds Sold Entry</h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Cycle-Level Birds Sold:</strong> Enter total birds sold from the entire flock for the day.
                        </div>
                        <form id="birdsForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="birdsDate" class="form-label">Date</label>
                                        <input type="date" class="form-control" id="birdsDate" value="${today}" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="birdsCount" class="form-label">Number of Birds</label>
                                        <input type="number" class="form-control" id="birdsCount" min="0" required>
                                        <small class="text-muted">Total birds sold from entire flock</small>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="birdsPrice" class="form-label">Price per Bird (₵)</label>
                                        <input type="number" class="form-control" id="birdsPrice" step="0.01" min="0">
                                        <small class="text-muted">Selling price per bird</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="birdsCustomer" class="form-label">Customer</label>
                                        <input type="text" class="form-control" id="birdsCustomer" 
                                               placeholder="Customer name or company">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="birdsNotes" class="form-label">Notes</label>
                                        <textarea class="form-control" id="birdsNotes" rows="2" 
                                                  placeholder="Reason for sale, observations..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-2"></i>Save Birds Sold Data
                            </button>
                        </form>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Birds Sold History</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Birds Sold</th>
                                        <th>Price per Bird</th>
                                        <th>Total Value</th>
                                        <th>Customer</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.birdsSoldLogs.slice(0, 20).map(log => this.renderBirdsLogRow(log)).join('')}
                                </tbody>
                            </table>
                        </div>
                        ${this.birdsSoldLogs.length === 0 ? '<div class="p-4 text-center text-muted">No birds sold data yet</div>' : ''}
                    </div>
                </div>
            </div>
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
                <td>${log.amount} kg</td>
                <td>${log.cost ? '₵' + log.cost.toFixed(2) : '-'}</td>
                <td>${log.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="cycleFeedManager.deleteFeedLog(${log.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    renderBirdsLogRow(log) {
        const date = new Date(log.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        const totalValue = (log.birdsSold || 0) * (log.birdPrice || 0);
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${log.birdsSold || 0}</td>
                <td>${log.birdPrice ? '₵' + log.birdPrice.toFixed(2) : '-'}</td>
                <td>${totalValue ? '₵' + totalValue.toFixed(2) : '-'}</td>
                <td>${log.customer || '-'}</td>
                <td>${log.notes || '-'}</td>
            </tr>
        `;
    }

    renderError() {
        document.getElementById('app-content').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading cycle feed manager. Please try again.
            </div>
        `;
    }

    async handleFeedSubmit(event) {
        event.preventDefault();
        
        const feedData = {
            cycleId: this.cycle.id,
            date: document.getElementById('feedDate').value,
            amount: parseFloat(document.getElementById('feedAmount').value) || 0,
            cost: parseFloat(document.getElementById('feedCost').value) || 0,
            notes: document.getElementById('feedNotes').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            const existingLog = this.feedLogs.find(log => log.date === feedData.date);
            
            if (existingLog) {
                feedData.id = existingLog.id;
                feedData.createdAt = existingLog.createdAt;
                await db.update('feedLogs', feedData);
            } else {
                feedData.createdAt = new Date().toISOString();
                await db.add('feedLogs', feedData);
            }

            this.showToast('Feed data saved successfully!', 'success');
            await this.init(this.cycle.id);
        } catch (error) {
            console.error('Error saving feed data:', error);
            this.showToast('Error saving feed data. Please try again.', 'error');
        }
    }

    async handleBirdsSubmit(event) {
        event.preventDefault();
        
        const birdsData = {
            cycleId: this.cycle.id,
            date: document.getElementById('birdsDate').value,
            birdsSold: parseInt(document.getElementById('birdsCount').value) || 0,
            birdPrice: parseFloat(document.getElementById('birdsPrice').value) || 0,
            customer: document.getElementById('birdsCustomer').value.trim(),
            notes: document.getElementById('birdsNotes').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            // This will be stored as a special production log entry
            const existingLog = await db.getByIndex('productionLogs', 'date', birdsData.date);
            const flockBirdsLog = existingLog.find(log => log.cycleId === this.cycle.id && log.birdsSold > 0);
            
            if (flockBirdsLog) {
                // Update existing birds sold log
                flockBirdsLog.birdsSold = birdsData.birdsSold;
                flockBirdsLog.birdPrice = birdsData.birdPrice;
                flockBirdsLog.customer = birdsData.customer;
                flockBirdsLog.notes = birdsData.notes;
                flockBirdsLog.updatedAt = new Date().toISOString();
                await db.update('productionLogs', flockBirdsLog);
            } else {
                // Create new birds sold log
                const newLog = {
                    ...birdsData,
                    cageId: 0, // Cycle-level entry
                    flockAge: 0,
                    openingBirds: 0,
                    mortality: 0,
                    eggsProduced: 0,
                    eggsCollected: 0,
                    closingBirds: 0,
                    currentFeed: 0,
                    createdAt: new Date().toISOString()
                };
                await db.add('productionLogs', newLog);
            }

            this.showToast('Birds sold data saved successfully!', 'success');
            await this.init(this.cycle.id);
        } catch (error) {
            console.error('Error saving birds sold data:', error);
            this.showToast('Error saving birds sold data. Please try again.', 'error');
        }
    }

    async deleteFeedLog(logId) {
        if (confirm('Are you sure you want to delete this feed log?')) {
            try {
                await db.delete('feedLogs', logId);
                this.showToast('Feed log deleted successfully!', 'success');
                await this.init(this.cycle.id);
            } catch (error) {
                console.error('Error deleting feed log:', error);
                this.showToast('Error deleting feed log. Please try again.', 'error');
            }
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.getElementById('toast-container') || document.body;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Global instance
const cycleFeedManager = new CycleFeedManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'feedForm') {
            cycleFeedManager.handleFeedSubmit(e);
        } else if (e.target.id === 'birdsForm') {
            cycleFeedManager.handleBirdsSubmit(e);
        }
    });
});