class SalesManager {
    constructor() {
        this.cycle = null;
        this.salesRecords = [];
        this.allSalesRecords = [];
        this.currentSaleTypeFilter = 'all';
    }

    getUserCurrency() {
        const settings = JSON.parse(localStorage.getItem('poultrySettings') || '{}');
        return settings.currency || 'GHS';
    }

    formatCurrency(amount) {
        const currency = this.getUserCurrency();
        const currencySymbols = {
            'GHS': '₵',
            'USD': '$',
            'GBP': '£'
        };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
    }

    async init(cycleId) {
        this.cycle = await db.get('cycles', parseInt(cycleId));
        this.allSalesRecords = await db.getByIndex('sales', 'cycleId', parseInt(cycleId));
        this.allSalesRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.applyFilters();
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
        
        // Add event listeners for form submissions
        document.getElementById('eggSalesForm').addEventListener('submit', (e) => this.handleEggSalesSubmit(e));
        document.getElementById('birdSalesForm').addEventListener('submit', (e) => this.handleBirdSalesSubmit(e));
        
        // Add automatic calculation for egg sales
        document.getElementById('cratesQuantity').addEventListener('input', this.calculateEggTotal.bind(this));
        document.getElementById('pricePerCrate').addEventListener('input', this.calculateEggTotal.bind(this));
        
        // Add automatic calculation for bird sales
        document.getElementById('birdsQuantity').addEventListener('input', this.calculateBirdTotal.bind(this));
        document.getElementById('pricePerBird').addEventListener('input', this.calculateBirdTotal.bind(this));
        
        // Add filter event listener
        document.getElementById('salesTypeFilter').addEventListener('change', (e) => this.filterBySaleType(e.target.value));
    }

    applyFilters() {
        this.salesRecords = this.allSalesRecords.filter(sale => {
            const saleType = sale.saleType || 'eggs';
            if (this.currentSaleTypeFilter === 'all') {
                return true;
            }
            return saleType === this.currentSaleTypeFilter;
        });
    }

    filterBySaleType(saleType) {
        this.currentSaleTypeFilter = saleType;
        this.applyFilters();
        this.render();
    }

    clearFilters() {
        this.currentSaleTypeFilter = 'all';
        this.applyFilters();
        this.render();
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
            
            <!-- Filter Section -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <label for="salesTypeFilter" class="form-label">Filter by Sale Type</label>
                            <select class="form-select" id="salesTypeFilter">
                                <option value="all" ${this.currentSaleTypeFilter === 'all' ? 'selected' : ''}>All Sales</option>
                                <option value="eggs" ${this.currentSaleTypeFilter === 'eggs' ? 'selected' : ''}>Egg Sales</option>
                                <option value="birds" ${this.currentSaleTypeFilter === 'birds' ? 'selected' : ''}>Bird Sales</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex gap-3 mt-4">
                                <div class="text-center">
                                    <div class="fw-bold text-primary">${this.salesRecords.length}</div>
                                    <small class="text-muted">Records</small>
                                </div>
                                <div class="text-center">
                                    <div class="fw-bold text-success">${this.formatCurrency(this.salesRecords.reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0))}</div>
                                    <small class="text-muted">Total</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 text-end">
                            <button class="btn btn-outline-secondary btn-sm" onclick="salesManager.clearFilters()">
                                <i class="fas fa-times me-1"></i>Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSalesForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-shopping-cart me-2"></i>Record Sales</h5>
                </div>
                <div class="card-body">
                    <!-- Sales Type Tabs -->
                    <ul class="nav nav-tabs" id="salesTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="egg-sales-tab" data-bs-toggle="tab" data-bs-target="#egg-sales" type="button" role="tab">
                                <i class="fas fa-egg me-2"></i>Egg Sales
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="bird-sales-tab" data-bs-toggle="tab" data-bs-target="#bird-sales" type="button" role="tab">
                                <i class="fas fa-dove me-2"></i>Birds Sold
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Content -->
                    <div class="tab-content mt-3" id="salesTabContent">
                        <!-- Egg Sales Tab -->
                        <div class="tab-pane fade show active" id="egg-sales" role="tabpanel">
                            <form id="eggSalesForm">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="eggSaleDate" class="form-label">Date</label>
                                            <input type="date" class="form-control" id="eggSaleDate" value="${today}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="eggCustomerName" class="form-label">Customer Name</label>
                                            <input type="text" class="form-control" id="eggCustomerName" required>
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
                                            <label for="pricePerCrate" class="form-label">Price per Crate (${this.getUserCurrency() === 'GHS' ? '₵' : this.getUserCurrency() === 'USD' ? '$' : '£'})</label>
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
                                            <label for="eggPaymentMethod" class="form-label">Payment Method</label>
                                            <select class="form-select" id="eggPaymentMethod" required>
                                                <option value="">Select method...</option>
                                                <option value="cash">Cash</option>
                                                <option value="mobile_money">Mobile Money</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="check">Check</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="eggTotalAmount" class="form-label">Total Amount (${this.getUserCurrency() === 'GHS' ? '₵' : this.getUserCurrency() === 'USD' ? '$' : '£'})</label>
                                            <input type="number" class="form-control" id="eggTotalAmount" step="0.01" readonly>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="eggSalesNotes" class="form-label">Notes</label>
                                            <textarea class="form-control" id="eggSalesNotes" rows="2"></textarea>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-2"></i>Record Egg Sale
                                </button>
                            </form>
                        </div>

                        <!-- Birds Sold Tab -->
                        <div class="tab-pane fade" id="bird-sales" role="tabpanel">
                            <form id="birdSalesForm">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="birdSaleDate" class="form-label">Date</label>
                                            <input type="date" class="form-control" id="birdSaleDate" value="${today}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="birdCustomerName" class="form-label">Customer Name</label>
                                            <input type="text" class="form-control" id="birdCustomerName" required>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="birdsQuantity" class="form-label">Number of Birds</label>
                                            <input type="number" class="form-control" id="birdsQuantity" min="1" required>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="pricePerBird" class="form-label">Price per Bird (${this.getUserCurrency() === 'GHS' ? '₵' : this.getUserCurrency() === 'USD' ? '$' : '£'})</label>
                                            <input type="number" class="form-control" id="pricePerBird" step="0.01" min="0" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="birdWeight" class="form-label">Average Weight (kg)</label>
                                            <input type="number" class="form-control" id="birdWeight" step="0.1" min="0">
                                            <small class="text-muted">Optional: Average weight per bird</small>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="birdPaymentMethod" class="form-label">Payment Method</label>
                                            <select class="form-select" id="birdPaymentMethod" required>
                                                <option value="">Select method...</option>
                                                <option value="cash">Cash</option>
                                                <option value="mobile_money">Mobile Money</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="check">Check</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="birdTotalAmount" class="form-label">Total Amount (${this.getUserCurrency() === 'GHS' ? '₵' : this.getUserCurrency() === 'USD' ? '$' : '£'})</label>
                                            <input type="number" class="form-control" id="birdTotalAmount" step="0.01" readonly>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="birdSalesNotes" class="form-label">Notes</label>
                                            <textarea class="form-control" id="birdSalesNotes" rows="2" placeholder="Reason for sale, breed, condition, etc."></textarea>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-success">
                                    <i class="fas fa-save me-2"></i>Record Bird Sale
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSalesSummary() {
        // Separate egg sales and bird sales
        const eggSales = this.salesRecords.filter(sale => sale.saleType === 'eggs' || !sale.saleType);
        const birdSales = this.salesRecords.filter(sale => sale.saleType === 'birds');
        
        const totalEggSales = eggSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const totalBirdSales = birdSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const totalSales = totalEggSales + totalBirdSales;
        
        const totalCrates = eggSales.reduce((sum, sale) => sum + (sale.cratesQuantity || 0), 0);
        const totalEggsSold = eggSales.reduce((sum, sale) => sum + (sale.totalEggs || 0), 0);
        const totalBirdsSold = birdSales.reduce((sum, sale) => sum + (sale.birdsQuantity || 0), 0);
        
        const avgPricePerCrate = totalCrates > 0 ? totalEggSales / totalCrates : 0;
        const avgPricePerBird = totalBirdsSold > 0 ? totalBirdSales / totalBirdsSold : 0;

        return `
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-success">${this.formatCurrency(totalSales)}</div>
                            <div class="stats-label">Total Sales</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-primary">${this.formatCurrency(totalEggSales)}</div>
                            <div class="stats-label">Egg Sales</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-warning">${this.formatCurrency(totalBirdSales)}</div>
                            <div class="stats-label">Bird Sales</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-info">${totalCrates.toFixed(1)}</div>
                            <div class="stats-label">Crates Sold</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-info">${totalBirdsSold.toLocaleString()}</div>
                            <div class="stats-label">Birds Sold</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-secondary">${this.salesRecords.length}</div>
                            <div class="stats-label">Total Records</div>
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
                            <p>Start recording your egg and bird sales to track revenue.</p>
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
                                    <th>Type</th>
                                    <th>Customer</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
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
        const date = new Date(sale.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        const saleType = sale.saleType || 'eggs';
        const typeIcon = saleType === 'birds' ? '<i class="fas fa-dove text-warning"></i>' : '<i class="fas fa-egg text-primary"></i>';
        const quantity = saleType === 'birds' ? `${sale.birdsQuantity} birds` : `${sale.crates || sale.cratesQuantity} crates`;
        const unitPrice = saleType === 'birds' ? this.formatCurrency(sale.pricePerBird || 0) : this.formatCurrency(sale.pricePerCrate || 0);
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${typeIcon} ${saleType.charAt(0).toUpperCase() + saleType.slice(1)}</td>
                <td><strong>${sale.customer || sale.customerName}</strong></td>
                <td>${quantity}</td>
                <td>${unitPrice}</td>
                <td><strong>${this.formatCurrency(sale.totalAmount || sale.amount || 0)}</strong></td>
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
            'mobile_money': 'bg-info',
            'bank': 'bg-primary',
            'check': 'bg-info',
            'credit': 'bg-warning'
        };
        return classes[method] || 'bg-secondary';
    }

    async handleEggSalesSubmit(event) {
        event.preventDefault();

        const crates = parseFloat(document.getElementById('cratesQuantity').value);
        const pricePerCrate = parseFloat(document.getElementById('pricePerCrate').value);
        const eggsPerCrate = parseInt(document.getElementById('eggsPerCrate').value);
        const totalAmount = crates * pricePerCrate;
        const totalEggs = crates * eggsPerCrate;
        
        const formData = {
            cycleId: this.cycle.id,
            saleType: 'eggs',
            date: document.getElementById('eggSaleDate').value,
            customerName: document.getElementById('eggCustomerName').value,
            cratesQuantity: crates,
            pricePerCrate: pricePerCrate,
            eggsPerCrate: eggsPerCrate,
            totalEggs: totalEggs,
            totalAmount: totalAmount,
            paymentMethod: document.getElementById('eggPaymentMethod').value,
            notes: document.getElementById('eggSalesNotes').value,
            createdAt: new Date().toISOString()
        };

        try {
            await db.add('sales', formData);
            this.showToast('Egg sale recorded successfully!', 'success');
            
            // Reset form
            document.getElementById('eggSalesForm').reset();
            document.getElementById('eggSaleDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('eggsPerCrate').value = 30;
            
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error recording egg sale:', error);
            this.showToast('Error recording egg sale. Please try again.', 'error');
        }
    }

    async handleBirdSalesSubmit(event) {
        event.preventDefault();

        const birdsQuantity = parseInt(document.getElementById('birdsQuantity').value);
        const pricePerBird = parseFloat(document.getElementById('pricePerBird').value);
        const totalAmount = birdsQuantity * pricePerBird;
        const birdWeight = parseFloat(document.getElementById('birdWeight').value) || 0;
        
        const formData = {
            cycleId: this.cycle.id,
            saleType: 'birds',
            date: document.getElementById('birdSaleDate').value,
            customerName: document.getElementById('birdCustomerName').value,
            birdsQuantity: birdsQuantity,
            pricePerBird: pricePerBird,
            birdWeight: birdWeight,
            totalAmount: totalAmount,
            paymentMethod: document.getElementById('birdPaymentMethod').value,
            notes: document.getElementById('birdSalesNotes').value,
            createdAt: new Date().toISOString()
        };

        try {
            await db.add('sales', formData);
            this.showToast('Bird sale recorded successfully!', 'success');
            
            // Reset form
            document.getElementById('birdSalesForm').reset();
            document.getElementById('birdSaleDate').value = new Date().toISOString().split('T')[0];
            
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error recording bird sale:', error);
            this.showToast('Error recording bird sale. Please try again.', 'error');
        }
    }

    calculateEggTotal() {
        const crates = parseFloat(document.getElementById('cratesQuantity').value) || 0;
        const pricePerCrate = parseFloat(document.getElementById('pricePerCrate').value) || 0;
        const total = crates * pricePerCrate;
        document.getElementById('eggTotalAmount').value = total.toFixed(2);
    }

    calculateBirdTotal() {
        const birds = parseInt(document.getElementById('birdsQuantity').value) || 0;
        const pricePerBird = parseFloat(document.getElementById('pricePerBird').value) || 0;
        const total = birds * pricePerBird;
        document.getElementById('birdTotalAmount').value = total.toFixed(2);
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

// Event listeners are now handled within the render method for better component isolation