class CycleOverview {
    constructor() {
        this.cycles = [];
        this.activeCycle = null;
    }

    async init() {
        this.cycles = await db.getAll('cycles');
        this.activeCycle = this.cycles.find(cycle => cycle.status === 'active');
        this.render();
    }

    render() {
        const content = `
            <div class="cycle-overview fade-in">
                ${this.renderHeader()}
                ${this.renderQuickStats()}
                ${this.renderCyclesList()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
        this.loadQuickStats();
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Production Cycles</h2>
                    <p class="text-muted mb-0">Manage your poultry production cycles</p>
                </div>
                <button class="btn btn-primary" onclick="cycleOverview.showCreateCycleModal()">
                    <i class="fas fa-plus me-2"></i>New Cycle
                </button>
            </div>
        `;
    }

    renderQuickStats() {
        return `
            <div class="quick-stats mb-4">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-primary" id="total-cycles">-</div>
                        <div class="stats-label">Total Cycles</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-success" id="active-cages">-</div>
                        <div class="stats-label">Active Cages</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-warning" id="total-birds">-</div>
                        <div class="stats-label">Total Birds</div>
                    </div>
                </div>
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <div class="stats-value text-info" id="daily-production">-</div>
                        <div class="stats-label">Today's Eggs</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCyclesList() {
        if (this.cycles.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Production Cycles</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Cycle Name</th>
                                    <th>Status</th>
                                    <th>Start Date</th>
                                    <th>Duration</th>
                                    <th>Cages</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.cycles.map(cycle => this.renderCycleRow(cycle)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderCycleRow(cycle) {
        const duration = this.calculateDuration(cycle.startDate, cycle.endDate);
        
        return `
            <tr onclick="cycleOverview.selectCycle(${cycle.id})" style="cursor: pointer;">
                <td>
                    <strong>${cycle.name}</strong>
                    ${cycle.description ? `<br><small class="text-muted">${cycle.description}</small>` : ''}
                </td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(cycle.status)}">${cycle.status}</span>
                </td>
                <td>${this.formatDate(cycle.startDate)}</td>
                <td>${duration}</td>
                <td>
                    <span class="badge bg-secondary" id="cages-count-${cycle.id}">-</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="event.stopPropagation(); router.navigate('cage-manager', {cycleId: ${cycle.id}})" 
                                title="Manage Cages">
                            <i class="fas fa-archive"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="event.stopPropagation(); router.navigate('cycle-feed', {cycleId: ${cycle.id}})" 
                                title="Manage Feed & Birds Sold">
                            <i class="fas fa-wheat-awn"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="event.stopPropagation(); cycleOverview.viewCycleAnalytics(${cycle.id})" 
                                title="View Analytics">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="event.stopPropagation(); cycleOverview.deleteCycle(${cycle.id})" 
                                title="Delete Cycle">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <h4>No Production Cycles</h4>
                <p>Create your first production cycle to start managing your poultry farm.</p>
                <button class="btn btn-primary" onclick="cycleOverview.showCreateCycleModal()">
                    <i class="fas fa-plus me-2"></i>Create First Cycle
                </button>
            </div>
        `;
    }

    async loadQuickStats() {
        try {
            // Total cycles
            document.getElementById('total-cycles').textContent = this.cycles.length;

            // Active cages and total birds
            const allCages = await db.getAll('cages');
            const activeCages = allCages.filter(cage => cage.status === 'active');
            const totalBirds = allCages.reduce((sum, cage) => sum + (cage.currentBirds || 0), 0);

            document.getElementById('active-cages').textContent = activeCages.length;
            document.getElementById('total-birds').textContent = totalBirds.toLocaleString();

            // Today's production
            const today = new Date().toISOString().split('T')[0];
            const todayLogs = await db.getByIndex('productionLogs', 'date', today);
            const dailyProduction = todayLogs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0);

            document.getElementById('daily-production').textContent = dailyProduction.toLocaleString();

            // Load cage counts for each cycle
            for (const cycle of this.cycles) {
                const cycleCages = await db.getByIndex('cages', 'cycleId', cycle.id);
                const countElement = document.getElementById(`cages-count-${cycle.id}`);
                if (countElement) {
                    countElement.textContent = cycleCages.length;
                }
            }
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
            return `${diffDays} days`;
        } else if (diffDays < 30) {
            return `${Math.floor(diffDays / 7)} weeks`;
        } else {
            return `${Math.floor(diffDays / 30)} months`;
        }
    }

    getStatusBadgeClass(status) {
        const classes = {
            'active': 'bg-success',
            'completed': 'bg-secondary',
            'planned': 'bg-warning'
        };
        return classes[status] || 'bg-secondary';
    }

    showCreateCycleModal() {
        const modal = `
            <div class="modal fade" id="createCycleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create New Production Cycle</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="createCycleForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="cycleName" class="form-label">Cycle Name</label>
                                            <input type="text" class="form-control" id="cycleName" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="cycleType" class="form-label">Cycle Type</label>
                                            <select class="form-select" id="cycleType" required>
                                                <option value="">Select type...</option>
                                                <option value="layer">Layer Production</option>
                                                <option value="broiler">Broiler Production</option>
                                                <option value="breeder">Breeder Production</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="cycleDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="cycleDescription" rows="3"></textarea>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="startDate" class="form-label">Start Date</label>
                                            <input type="date" class="form-control" id="startDate" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="plannedDuration" class="form-label">Planned Duration (weeks)</label>
                                            <input type="number" class="form-control" id="plannedDuration" min="1" required>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="expectedBirds" class="form-label">Expected Total Birds</label>
                                            <input type="number" class="form-control" id="expectedBirds" min="1">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="targetProduction" class="form-label">Target Daily Production</label>
                                            <input type="number" class="form-control" id="targetProduction" min="0">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create Cycle</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modal;
        const modalElement = new bootstrap.Modal(document.getElementById('createCycleModal'));
        modalElement.show();

        // Set default start date to today
        document.getElementById('startDate').valueAsDate = new Date();

        document.getElementById('createCycleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateCycle();
            modalElement.hide();
        });
    }

    async handleCreateCycle() {
        const formData = {
            name: document.getElementById('cycleName').value,
            type: document.getElementById('cycleType').value,
            description: document.getElementById('cycleDescription').value,
            startDate: document.getElementById('startDate').value,
            plannedDuration: parseInt(document.getElementById('plannedDuration').value),
            expectedBirds: parseInt(document.getElementById('expectedBirds').value) || 0,
            targetProduction: parseInt(document.getElementById('targetProduction').value) || 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Set other cycles to completed if this is being set as active
            if (formData.status === 'active') {
                for (const cycle of this.cycles) {
                    if (cycle.status === 'active') {
                        cycle.status = 'completed';
                        cycle.endDate = new Date().toISOString();
                        await db.update('cycles', cycle);
                    }
                }
            }

            await db.add('cycles', formData);
            this.showToast('Production cycle created successfully!', 'success');
            await this.init(); // Refresh the view
        } catch (error) {
            console.error('Error creating cycle:', error);
            this.showToast('Error creating cycle. Please try again.', 'error');
        }
    }

    async deleteCycle(cycleId) {
        if (!confirm('Are you sure you want to delete this cycle? All associated data will be lost.')) {
            return;
        }

        try {
            // Delete cycle and all associated data
            await db.delete('cycles', cycleId);
            
            const cages = await db.getByIndex('cages', 'cycleId', cycleId);
            const productionLogs = await db.getByIndex('productionLogs', 'cycleId', cycleId);
            const feedLogs = await db.getByIndex('feedLogs', 'cycleId', cycleId);
            
            for (const cage of cages) {
                await db.delete('cages', cage.id);
            }
            
            for (const log of productionLogs) {
                await db.delete('productionLogs', log.id);
            }
            
            for (const log of feedLogs) {
                await db.delete('feedLogs', log.id);
            }

            this.showToast('Cycle deleted successfully!', 'success');
            await this.init(); // Refresh the view
        } catch (error) {
            console.error('Error deleting cycle:', error);
            this.showToast('Error deleting cycle. Please try again.', 'error');
        }
    }

    selectCycle(cycleId) {
        router.navigate('cage-manager', { cycleId });
    }

    viewCycleAnalytics(cycleId) {
        router.navigate('analytics', { cycleId });
    }

    formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
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

// Global cycle overview instance
const cycleOverview = new CycleOverview();