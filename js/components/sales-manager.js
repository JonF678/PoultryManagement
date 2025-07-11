class SalesManager {
    constructor() {
        this.cycle = null;
        this.salesRecords = [];
    }

    async init(cycleId) {
        this.cycle = await db.get('cycles', parseInt(cycleId));
        this.salesRecords = await db.getByIndex('sales', 'cycleId', parseInt(cycleId));
        this.salesRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.render();
    }

    render() {
        const content = `
            <div class="sales-manager fade-in">
                ${this.renderHeader()}
                ${this.renderSalesForm()}
                ${this.renderSalesSummary()}
                ${this.renderSalesHistory()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Sales Management</h2>
                    <p class="text-muted mb-0">Cycle: ${this.cycle?.name || 'Unknown'}</p>
                </div>
                <button class="btn btn-outline-secondary" onclick="router.navigate('analytics', {cycleId: ${this.cycle?.id}})">
                    <i class="fas fa-arrow-left me-2"></i>Back to Analytics
                </button>
            </div>
        `;
    }

    renderSalesForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-shopping-cart me-2"></i>Record Egg Sales</h5>
                </div>
                <div class="card-body">
                    <form id="salesForm">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="saleDate" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="saleDate" value="${today}" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="customerName" class="form-label">Customer Name</label>
                                    <input type="text" class="form-control" id="customerName" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="cratesQuantity" class="form-label">Crates Sold</label>
                                    <input type="number" class="form-control" id="cratesQuantity" min="1" step="0.1" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="pricePerCrate" class="form-label">Price per Crate</label>
                                    <input type="number" class="form-control" id="pricePerCrate" step="0.01" min="0" required>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="eggsPerCrate" class="form-label">Eggs per Crate</label>
                                    <input type="number" class="form-control" id="eggsPerCrate" value="30" min="1" required>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="paymentMethod" class="form-label">Payment Method</label>
                                    <select class="form-select" id="paymentMethod" required>
                                        <option value="">Select method...</option>
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="check">Check</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="totalAmount" class="form-label">Total Amount</label>
                                    <input type="number" class="form-control" id="totalAmount" step="0.01" readonly>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label for="salesNotes" class="form-label">Notes</label>
                                    <textarea class="form-control" id="salesNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-2"></i>Record Sale
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderSalesSummary() {
        const totalSales = this.salesRecords.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const totalCrates = this.salesRecords.reduce((sum, sale) => sum + (sale.cratesQuantity || 0), 0);
        const totalEggsSold = this.salesRecords.reduce((sum, sale) => sum + (sale.totalEggs || 0), 0);
        const avgPricePerCrate = totalCrates > 0 ? totalSales / totalCrates : 0;

        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-success">₵${totalSales.toFixed(2)}</div>
                            <div class="stats-label">Total Sales</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-primary">${totalCrates.toFixed(1)}</div>
                            <div class="stats-label">Crates Sold</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-info">${totalEggsSold.toLocaleString()}</div>
                            <div class="stats-label">Eggs Sold</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-warning">₵${avgPricePerCrate.toFixed(2)}</div>
                            <div class="stats-label">Avg Price/Crate</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSalesHistory() {
        if (this.salesRecords.length === 0) {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-shopping-cart"></i>
                            <h4>No Sales Records</h4>
                            <p>Start recording your egg sales to track revenue.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Sales History</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Crates</th>
                                    <th>Price/Crate</th>
                                    <th>Total Amount</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.salesRecords.map(sale => this.renderSalesRow(sale)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderSalesRow(sale) {
        return `
            <tr>
                <td>${new Date(sale.date).toLocaleDateString()}</td>
                <td><strong>${sale.customer || sale.customerName}</strong></td>
                <td>${sale.crates || sale.cratesQuantity}</td>
                <td>₵${sale.pricePerCrate.toFixed(2)}</td>
                <td><strong>₵${sale.amount.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${this.getPaymentBadgeClass(sale.paymentMethod)}">${sale.paymentMethod}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-danger" onclick="salesManager.deleteSale(${sale.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getPaymentBadgeClass(method) {
        const classes = {
            'cash': 'bg-success',
            'bank': 'bg-primary',
            'check': 'bg-info',
            'credit': 'bg-warning'
        };
        return classes[method] || 'bg-secondary';
    }

    async handleSalesSubmit(event) {
        event.preventDefault();

        const crates = parseFloat(document.getElementById('cratesQuantity').value);
        const pricePerCrate = parseFloat(document.getElementById('pricePerCrate').value);
        const amount = crates * pricePerCrate;
        
        const formData = {
            cycleId: this.cycle.id,
            date: document.getElementById('saleDate').value,
            customer: document.getElementById('customerName').value,
            crates: crates,
            pricePerCrate: pricePerCrate,
            amount: amount,
            paymentMethod: document.getElementById('paymentMethod').value,
            notes: document.getElementById('salesNotes').value,
            createdAt: new Date().toISOString()
        };

        try {
            await db.add('sales', formData);
            this.showToast('Sale recorded successfully!', 'success');
            
            // Reset form
            document.getElementById('salesForm').reset();
            document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('eggsPerCrate').value = 30;
            
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error recording sale:', error);
            this.showToast('Error recording sale. Please try again.', 'error');
        }
    }

    async deleteSale(saleId) {
        if (!confirm('Are you sure you want to delete this sale record?')) {
            return;
        }

        try {
            await db.delete('sales', saleId);
            this.showToast('Sale deleted successfully!', 'success');
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error deleting sale:', error);
            this.showToast('Error deleting sale. Please try again.', 'error');
        }
    }

    calculateTotal() {
        const crates = parseFloat(document.getElementById('cratesQuantity').value) || 0;
        const pricePerCrate = parseFloat(document.getElementById('pricePerCrate').value) || 0;
        const total = crates * pricePerCrate;
        document.getElementById('totalAmount').value = total.toFixed(2);
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

// Global sales manager instance
const salesManager = new SalesManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'salesForm') {
            salesManager.handleSalesSubmit(e);
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'cratesQuantity' || e.target.id === 'pricePerCrate') {
            salesManager.calculateTotal();
        }
    });
});