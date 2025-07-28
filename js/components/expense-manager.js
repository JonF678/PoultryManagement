class ExpenseManager {
    constructor() {
        this.cycle = null;
        this.expenses = [];
        this.allExpenses = [];
        this.currentCategoryFilter = 'all';
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
        this.allExpenses = await db.getByIndex('expenses', 'cycleId', parseInt(cycleId));
        this.allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.applyFilters();
        this.render();
    }

    render() {
        const content = `
            <div class="expense-manager fade-in">
                ${this.renderHeader()}
                ${this.renderExpenseForm()}
                ${this.renderExpenseSummary()}
                ${this.renderExpenseHistory()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
        
        // Add event listeners
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterByCategory(e.target.value));
    }

    applyFilters() {
        this.expenses = this.allExpenses.filter(expense => {
            if (this.currentCategoryFilter === 'all') {
                return true;
            }
            return expense.category === this.currentCategoryFilter;
        });
    }

    filterByCategory(category) {
        this.currentCategoryFilter = category;
        this.applyFilters();
        this.render();
    }

    clearFilters() {
        this.currentCategoryFilter = 'all';
        this.applyFilters();
        this.render();
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Expense Management</h2>
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
                            <label for="categoryFilter" class="form-label">Filter by Category</label>
                            <select class="form-select" id="categoryFilter">
                                <option value="all" ${this.currentCategoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
                                <option value="feed" ${this.currentCategoryFilter === 'feed' ? 'selected' : ''}>Feed</option>
                                <option value="medication" ${this.currentCategoryFilter === 'medication' ? 'selected' : ''}>Medication</option>
                                <option value="vaccination" ${this.currentCategoryFilter === 'vaccination' ? 'selected' : ''}>Vaccination</option>
                                <option value="labor" ${this.currentCategoryFilter === 'labor' ? 'selected' : ''}>Labor</option>
                                <option value="utilities" ${this.currentCategoryFilter === 'utilities' ? 'selected' : ''}>Utilities</option>
                                <option value="equipment" ${this.currentCategoryFilter === 'equipment' ? 'selected' : ''}>Equipment</option>
                                <option value="transport" ${this.currentCategoryFilter === 'transport' ? 'selected' : ''}>Transport</option>
                                <option value="maintenance" ${this.currentCategoryFilter === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                <option value="other" ${this.currentCategoryFilter === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex gap-3 mt-4">
                                <div class="text-center">
                                    <div class="fw-bold text-primary">${this.expenses.length}</div>
                                    <small class="text-muted">Records</small>
                                </div>
                                <div class="text-center">
                                    <div class="fw-bold text-danger">${this.formatCurrency(this.expenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                                    <small class="text-muted">Total</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 text-end">
                            <button class="btn btn-outline-secondary btn-sm" onclick="expenseManager.clearFilters()">
                                <i class="fas fa-times me-1"></i>Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderExpenseForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>Record Expense</h5>
                </div>
                <div class="card-body">
                    <form id="expenseForm">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="expenseDate" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="expenseDate" value="${today}" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="expenseCategory" class="form-label">Category</label>
                                    <select class="form-select" id="expenseCategory" required>
                                        <option value="">Select category...</option>
                                        <option value="feed">Feed</option>
                                        <option value="medication">Medication</option>
                                        <option value="vaccination">Vaccination</option>
                                        <option value="labor">Labor</option>
                                        <option value="utilities">Utilities</option>
                                        <option value="equipment">Equipment</option>
                                        <option value="transport">Transport</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="expenseAmount" class="form-label">Amount (${this.getUserCurrency() === 'GHS' ? '₵' : this.getUserCurrency() === 'USD' ? '$' : '£'})</label>
                                    <input type="number" class="form-control" id="expenseAmount" step="0.01" min="0" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="supplier" class="form-label">Supplier/Vendor</label>
                                    <input type="text" class="form-control" id="supplier">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="expenseDescription" class="form-label">Description</label>
                                    <input type="text" class="form-control" id="expenseDescription" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="quantity" class="form-label">Quantity</label>
                                    <input type="number" class="form-control" id="quantity" step="0.1" min="0">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="unit" class="form-label">Unit</label>
                                    <input type="text" class="form-control" id="unit" placeholder="kg, bags, hours, etc.">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label for="expenseNotes" class="form-label">Notes</label>
                                    <textarea class="form-control" id="expenseNotes" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-2"></i>Record Expense
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderExpenseSummary() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const categoryTotals = this.expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, 'none');
        
        const avgExpensePerDay = this.expenses.length > 0 ? totalExpenses / this.expenses.length : 0;

        return `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-danger">${this.formatCurrency(totalExpenses)}</div>
                            <div class="stats-label">Total Expenses</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-primary">${this.expenses.length}</div>
                            <div class="stats-label">Total Records</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-warning">${this.formatCurrency(avgExpensePerDay)}</div>
                            <div class="stats-label">Avg per Entry</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body text-center">
                            <div class="stats-value text-info">${topCategory}</div>
                            <div class="stats-label">Top Category</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderExpenseHistory() {
        if (this.expenses.length === 0) {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h4>No Expense Records</h4>
                            <p>Start recording your expenses to track costs.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Expense History</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Supplier</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.expenses.map(expense => this.renderExpenseRow(expense)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderExpenseRow(expense) {
        const date = new Date(expense.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>
                    <span class="badge ${this.getCategoryBadgeClass(expense.category)}">${expense.category}</span>
                </td>
                <td>
                    <strong>${expense.description}</strong>
                    ${expense.quantity ? `<br><small class="text-muted">${expense.quantity} ${expense.unit || ''}</small>` : ''}
                </td>
                <td><strong>${this.formatCurrency(expense.amount)}</strong></td>
                <td>${expense.supplier || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-danger" onclick="expenseManager.deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getCategoryBadgeClass(category) {
        const classes = {
            'feed': 'bg-warning',
            'medication': 'bg-danger',
            'vaccination': 'bg-info',
            'labor': 'bg-primary',
            'utilities': 'bg-secondary',
            'equipment': 'bg-dark',
            'transport': 'bg-success',
            'maintenance': 'bg-warning',
            'other': 'bg-light text-dark'
        };
        return classes[category] || 'bg-secondary';
    }

    async handleExpenseSubmit(event) {
        event.preventDefault();

        const formData = {
            cycleId: this.cycle.id,
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            supplier: document.getElementById('supplier').value,
            quantity: parseFloat(document.getElementById('quantity').value) || null,
            unit: document.getElementById('unit').value,
            notes: document.getElementById('expenseNotes').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await db.add('expenses', formData);
            this.showToast('Expense recorded successfully!', 'success');
            
            // Reset form
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error recording expense:', error);
            this.showToast('Error recording expense. Please try again.', 'error');
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense record?')) {
            return;
        }

        try {
            await db.delete('expenses', expenseId);
            this.showToast('Expense deleted successfully!', 'success');
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showToast('Error deleting expense. Please try again.', 'error');
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

// Global expense manager instance
const expenseManager = new ExpenseManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'expenseForm') {
            expenseManager.handleExpenseSubmit(e);
        }
    });
});