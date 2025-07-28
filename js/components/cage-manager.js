class CageManager {
    constructor() {
        this.currentCycle = null;
        this.cages = [];
    }

    async init(cycleId) {
        this.currentCycle = await db.get('cycles', cycleId);
        this.cages = await db.getByIndex('cages', 'cycleId', cycleId);
        this.render();
    }

    render() {
        const content = `
            <div class="cage-manager fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Cage Management</h2>
                        <p class="text-muted mb-0">Cycle: ${this.currentCycle?.name || 'Unknown'}</p>
                    </div>
                    <button class="btn btn-primary" onclick="cageManager.showAddCageModal()">
                        <i class="fas fa-plus me-2"></i>Add Cage
                    </button>
                </div>

                <div class="row" id="cages-grid">
                    ${this.renderCages()}
                </div>

                ${this.cages.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    }

    renderCages() {
        return this.cages.map(cage => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card cage-item h-100" onclick="router.navigate('cage-detail', {id: ${cage.id}})">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${cage.name}</h5>
                            <span class="badge ${this.getStatusBadgeClass(cage.status)}">${cage.status}</span>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="stats-value text-primary">${cage.currentBirds || 0}</div>
                                <div class="stats-label">Birds</div>
                            </div>
                            <div class="col-6">
                                <div class="stats-value text-success">${cage.totalEggs || 0}</div>
                                <div class="stats-label">Total Eggs</div>
                            </div>
                        </div>

                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                Created: ${this.formatDate(cage.createdAt)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderEmptyState() {
        return `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-archive"></i>
                    <h4>No Cages Yet</h4>
                    <p>Start by adding your first cage to begin tracking production.</p>
                    <button class="btn btn-primary" onclick="cageManager.showAddCageModal()">
                        <i class="fas fa-plus me-2"></i>Add First Cage
                    </button>
                </div>
            </div>
        `;
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

    showAddCageModal() {
        const modal = `
            <div class="modal fade" id="addCageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Cage</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="addCageForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="cageName" class="form-label">Cage Name</label>
                                    <input type="text" class="form-control" id="cageName" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="cageCapacity" class="form-label">Capacity (birds)</label>
                                    <input type="number" class="form-control" id="cageCapacity" min="1" required>
                                </div>

                                <div class="mb-3">
                                    <label for="initialBirds" class="form-label">Initial Bird Count</label>
                                    <input type="number" class="form-control" id="initialBirds" min="0" required>
                                </div>

                                <div class="mb-3">
                                    <label for="cageType" class="form-label">Cage Type</label>
                                    <select class="form-select" id="cageType" required>
                                        <option value="">Select type...</option>
                                        <option value="layer">Layer Cage</option>
                                        <option value="broiler">Broiler Cage</option>
                                        <option value="breeder">Breeder Cage</option>
                                        <option value="growing">Growing Cage</option>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label for="cageLocation" class="form-label">Location</label>
                                    <input type="text" class="form-control" id="cageLocation" placeholder="e.g., Building A, Section 1">
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Cage</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modal;
        const modalElement = new bootstrap.Modal(document.getElementById('addCageModal'));
        modalElement.show();

        document.getElementById('addCageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCage();
            modalElement.hide();
        });
    }

    async handleAddCage() {
        const formData = {
            name: document.getElementById('cageName').value,
            capacity: parseInt(document.getElementById('cageCapacity').value),
            currentBirds: parseInt(document.getElementById('initialBirds').value),
            type: document.getElementById('cageType').value,
            location: document.getElementById('cageLocation').value,
            cycleId: this.currentCycle.id,
            status: 'active',
            totalEggs: 0,
            totalFeed: 0,
            mortality: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await db.add('cages', formData);
            this.showToast('Cage added successfully!', 'success');
            await this.init(this.currentCycle.id); // Refresh the view
        } catch (error) {
            console.error('Error adding cage:', error);
            this.showToast('Error adding cage. Please try again.', 'error');
        }
    }

    async deleteCage(cageId) {
        if (!confirm('Are you sure you want to delete this cage? All associated data will be lost.')) {
            return;
        }

        try {
            // Delete cage and all associated logs
            await db.delete('cages', cageId);
            
            const productionLogs = await db.getByIndex('productionLogs', 'cageId', cageId);
            const feedLogs = await db.getByIndex('feedLogs', 'cageId', cageId);
            
            for (const log of productionLogs) {
                await db.delete('productionLogs', log.id);
            }
            
            for (const log of feedLogs) {
                await db.delete('feedLogs', log.id);
            }

            this.showToast('Cage deleted successfully!', 'success');
            await this.init(this.currentCycle.id); // Refresh the view
        } catch (error) {
            console.error('Error deleting cage:', error);
            this.showToast('Error deleting cage. Please try again.', 'error');
        }
    }

    async updateCageStatus(cageId, newStatus) {
        try {
            const cage = await db.get('cages', cageId);
            cage.status = newStatus;
            cage.updatedAt = new Date().toISOString();
            
            await db.update('cages', cage);
            this.showToast('Cage status updated!', 'success');
            await this.init(this.currentCycle.id); // Refresh the view
        } catch (error) {
            console.error('Error updating cage status:', error);
            this.showToast('Error updating cage status. Please try again.', 'error');
        }
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
        
        // Update icon based on type
        const icon = toast.querySelector('.fas');
        icon.className = type === 'success' ? 'fas fa-check-circle text-success me-2' : 
                        type === 'error' ? 'fas fa-exclamation-circle text-danger me-2' : 
                        'fas fa-info-circle text-primary me-2';
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    async searchCages(query) {
        const filtered = this.cages.filter(cage => 
            cage.name.toLowerCase().includes(query.toLowerCase()) ||
            cage.location?.toLowerCase().includes(query.toLowerCase()) ||
            cage.type.toLowerCase().includes(query.toLowerCase())
        );
        
        document.getElementById('cages-grid').innerHTML = 
            filtered.map(cage => this.renderCageCard(cage)).join('');
    }

    async exportCageData() {
        try {
            const cageData = this.cages.map(cage => ({
                name: cage.name,
                type: cage.type,
                capacity: cage.capacity,
                currentBirds: cage.currentBirds,
                status: cage.status,
                location: cage.location,
                totalEggs: cage.totalEggs,
                totalFeed: cage.totalFeed,
                mortality: cage.mortality,
                createdAt: cage.createdAt
            }));

            const dataStr = JSON.stringify(cageData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `cage-data-${this.currentCycle.name}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('Cage data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting cage data:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }
}

// Global cage manager instance
const cageManager = new CageManager();