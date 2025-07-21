class VaccinationManager {
    constructor() {
        this.cycle = null;
        this.vaccinations = [];
        this.customSchedule = [];
    }

    async init(cycleId) {
        this.cycle = await db.get('cycles', parseInt(cycleId));
        this.vaccinations = await db.getByIndex('vaccinations', 'cycleId', parseInt(cycleId));
        this.vaccinations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Load custom schedule for this cycle
        this.customSchedule = await this.loadCustomSchedule(parseInt(cycleId));
        
        this.render();
    }

    render() {
        const content = `
            <div class="vaccination-manager fade-in">
                ${this.renderHeader()}
                ${this.renderVaccinationForm()}
                ${this.renderVaccinationSchedule()}
                ${this.renderVaccinationHistory()}
            </div>
        `;

        document.getElementById('app-content').innerHTML = content;
        
        // Initialize flock age calculation
        setTimeout(() => {
            this.initializeFlockAge();
        }, 100);
    }

    renderHeader() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Vaccination Management</h2>
                    <p class="text-muted mb-0">Cycle: ${this.cycle?.name || 'Unknown'}</p>
                </div>
                <button class="btn btn-outline-secondary" onclick="router.navigate('analytics', {cycleId: ${this.cycle?.id}})">
                    <i class="fas fa-arrow-left me-2"></i>Back to Analytics
                </button>
            </div>
        `;
    }

    renderVaccinationForm() {
        const today = new Date().toISOString().split('T')[0];

        return `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-syringe me-2"></i>Record Vaccination</h5>
                </div>
                <div class="card-body">
                    <form id="vaccinationForm">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="vaccinationDate" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="vaccinationDate" value="${today}" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="flockAgeVacc" class="form-label">Flock Age (days)</label>
                                    <input type="number" class="form-control" id="flockAgeVacc" readonly style="background-color: #f8f9fa;" title="Automatically calculated from cycle start date">
                                    <small class="text-muted">Calculated automatically</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="vaccineName" class="form-label">Vaccine Name</label>
                                    <select class="form-select" id="vaccineName" required>
                                        <option value="">Select vaccine...</option>
                                        <option value="Marek's Disease">Marek's Disease</option>
                                        <option value="Newcastle Disease">Newcastle Disease</option>
                                        <option value="Infectious Bronchitis">Infectious Bronchitis</option>
                                        <option value="Gumboro/IBD">Gumboro (IBD)</option>
                                        <option value="Fowl Pox">Fowl Pox</option>
                                        <option value="Avian Influenza">Avian Influenza</option>
                                        <option value="Infectious Coryza">Infectious Coryza</option>
                                        <option value="Egg Drop Syndrome">Egg Drop Syndrome</option>
                                        <option value="Salmonella">Salmonella</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="administrationMethod" class="form-label">Method</label>
                                    <select class="form-select" id="administrationMethod" required>
                                        <option value="">Select method...</option>
                                        <option value="drinking_water">Drinking Water</option>
                                        <option value="injection">Injection</option>
                                        <option value="spray">Spray</option>
                                        <option value="eye_drop">Eye Drop</option>
                                        <option value="wing_web">Wing Web</option>
                                        <option value="in_ovo">In Ovo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="dosage" class="form-label">Dosage</label>
                                    <input type="text" class="form-control" id="dosage" placeholder="e.g., 1ml per bird">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="birdsTreated" class="form-label">Birds Treated</label>
                                    <input type="number" class="form-control" id="birdsTreated" min="1" required>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="batchNumber" class="form-label">Batch/Lot Number</label>
                                    <input type="text" class="form-control" id="batchNumber">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="mb-3">
                                    <label for="expiryDate" class="form-label">Vaccine Expiry</label>
                                    <input type="date" class="form-control" id="expiryDate">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="manufacturer" class="form-label">Manufacturer</label>
                                    <input type="text" class="form-control" id="manufacturer">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="veterinarian" class="form-label">Veterinarian</label>
                                    <input type="text" class="form-control" id="veterinarian">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label for="vaccinationNotes" class="form-label">Notes</label>
                                    <textarea class="form-control" id="vaccinationNotes" rows="2" 
                                              placeholder="Any observations, reactions, or additional notes..."></textarea>
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-2"></i>Record Vaccination
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderVaccinationSchedule() {
        const schedule = this.getVaccinationSchedule();

        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-calendar-alt me-2"></i>Vaccination Schedule</h5>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="vaccinationManager.showScheduleManager()">
                            <i class="fas fa-edit me-1"></i>Customize Schedule
                        </button>
                        <button class="btn btn-outline-secondary" onclick="vaccinationManager.resetToStandardSchedule()">
                            <i class="fas fa-undo me-1"></i>Use Standard
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${schedule.length === 0 ? `
                        <div class="text-center py-4">
                            <i class="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
                            <h5>No Schedule Set</h5>
                            <p class="text-muted">Create a custom vaccination schedule or use the standard schedule.</p>
                            <button class="btn btn-primary me-2" onclick="vaccinationManager.showScheduleManager()">
                                <i class="fas fa-plus me-1"></i>Create Custom Schedule
                            </button>
                            <button class="btn btn-outline-primary" onclick="vaccinationManager.resetToStandardSchedule()">
                                <i class="fas fa-calendar me-1"></i>Use Standard Schedule
                            </button>
                        </div>
                    ` : `
                        <div class="row">
                            ${schedule.map(item => `
                                <div class="col-md-4 mb-3">
                                    <div class="card border-left-${item.completed ? 'success' : 'warning'}">
                                        <div class="card-body p-3">
                                            <h6 class="card-title mb-1">${item.vaccine}</h6>
                                            <p class="card-text text-muted mb-1">Day ${item.day} (${item.weeks} weeks)</p>
                                            <small class="text-${item.completed ? 'success' : 'warning'}">
                                                ${item.completed ? '✓ Completed' : '⏳ Pending'}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderVaccinationHistory() {
        if (this.vaccinations.length === 0) {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <i class="fas fa-syringe"></i>
                            <h4>No Vaccination Records</h4>
                            <p>Start recording vaccinations to track flock health.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Vaccination History</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Age (days)</th>
                                    <th>Vaccine</th>
                                    <th>Method</th>
                                    <th>Birds Treated</th>
                                    <th>Veterinarian</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.vaccinations.map(vaccination => this.renderVaccinationRow(vaccination)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderVaccinationRow(vaccination) {
        return `
            <tr>
                <td>${new Date(vaccination.date).toLocaleDateString()}</td>
                <td><span class="badge bg-info">${vaccination.flockAge}</span></td>
                <td><strong>${vaccination.vaccineName}</strong></td>
                <td>
                    <span class="badge ${this.getMethodBadgeClass(vaccination.administrationMethod)}">
                        ${vaccination.administrationMethod.replace('_', ' ')}
                    </span>
                </td>
                <td>${vaccination.birdsTreated}</td>
                <td>${vaccination.veterinarian || '-'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="vaccinationManager.viewVaccinationDetails(${vaccination.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="vaccinationManager.deleteVaccination(${vaccination.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getMethodBadgeClass(method) {
        const classes = {
            'drinking_water': 'bg-primary',
            'injection': 'bg-danger',
            'spray': 'bg-info',
            'eye_drop': 'bg-warning',
            'wing_web': 'bg-success',
            'in_ovo': 'bg-secondary'
        };
        return classes[method] || 'bg-secondary';
    }

    getVaccinationSchedule() {
        // Use custom schedule if available, otherwise use standard schedule
        const schedule = this.customSchedule.length > 0 ? this.customSchedule : this.getStandardSchedule();

        return schedule.map(item => {
            const completed = this.vaccinations.some(vacc => 
                vacc.vaccineName.toLowerCase().includes(item.vaccine.toLowerCase()) &&
                Math.abs(vacc.flockAge - item.day) <= 3 // Allow 3 days tolerance
            );
            return { ...item, completed };
        });
    }

    getStandardSchedule() {
        return [
            { day: 1, weeks: 0, vaccine: "Marek's Disease", method: "injection" },
            { day: 7, weeks: 1, vaccine: "Newcastle + IB", method: "spray" },
            { day: 14, weeks: 2, vaccine: "Gumboro (IBD)", method: "drinking_water" },
            { day: 21, weeks: 3, vaccine: "Newcastle + IB", method: "drinking_water" },
            { day: 28, weeks: 4, vaccine: "Gumboro (IBD)", method: "drinking_water" },
            { day: 35, weeks: 5, vaccine: "Newcastle", method: "drinking_water" },
            { day: 63, weeks: 9, vaccine: "Fowl Pox", method: "wing_web" },
            { day: 105, weeks: 15, vaccine: "Newcastle + IB", method: "injection" },
            { day: 119, weeks: 17, vaccine: "Egg Drop Syndrome", method: "injection" }
        ];
    }

    async handleVaccinationSubmit(event) {
        event.preventDefault();

        const formData = {
            cycleId: this.cycle.id,
            date: document.getElementById('vaccinationDate').value,
            flockAge: parseInt(document.getElementById('flockAgeVacc').value),
            vaccineName: document.getElementById('vaccineName').value,
            administrationMethod: document.getElementById('administrationMethod').value,
            dosage: document.getElementById('dosage').value,
            birdsTreated: parseInt(document.getElementById('birdsTreated').value),
            batchNumber: document.getElementById('batchNumber').value,
            expiryDate: document.getElementById('expiryDate').value,
            manufacturer: document.getElementById('manufacturer').value,
            veterinarian: document.getElementById('veterinarian').value,
            notes: document.getElementById('vaccinationNotes').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await db.add('vaccinations', formData);
            this.showToast('Vaccination recorded successfully!', 'success');
            
            // Reset form
            document.getElementById('vaccinationForm').reset();
            document.getElementById('vaccinationDate').value = new Date().toISOString().split('T')[0];
            
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error recording vaccination:', error);
            this.showToast('Error recording vaccination. Please try again.', 'error');
        }
    }

    async deleteVaccination(vaccinationId) {
        if (!confirm('Are you sure you want to delete this vaccination record?')) {
            return;
        }

        try {
            await db.delete('vaccinations', vaccinationId);
            this.showToast('Vaccination deleted successfully!', 'success');
            await this.init(this.cycle.id); // Refresh the view
        } catch (error) {
            console.error('Error deleting vaccination:', error);
            this.showToast('Error deleting vaccination. Please try again.', 'error');
        }
    }

    viewVaccinationDetails(vaccinationId) {
        const vaccination = this.vaccinations.find(v => v.id === vaccinationId);
        if (!vaccination) return;

        const modal = `
            <div class="modal fade" id="vaccinationDetailModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Vaccination Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-6"><strong>Date:</strong></div>
                                <div class="col-6">${new Date(vaccination.date).toLocaleDateString()}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Flock Age:</strong></div>
                                <div class="col-6">${vaccination.flockAge} days</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Vaccine:</strong></div>
                                <div class="col-6">${vaccination.vaccineName}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Method:</strong></div>
                                <div class="col-6">${vaccination.administrationMethod.replace('_', ' ')}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Dosage:</strong></div>
                                <div class="col-6">${vaccination.dosage || 'N/A'}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Birds Treated:</strong></div>
                                <div class="col-6">${vaccination.birdsTreated}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Batch Number:</strong></div>
                                <div class="col-6">${vaccination.batchNumber || 'N/A'}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Manufacturer:</strong></div>
                                <div class="col-6">${vaccination.manufacturer || 'N/A'}</div>
                            </div>
                            <div class="row">
                                <div class="col-6"><strong>Veterinarian:</strong></div>
                                <div class="col-6">${vaccination.veterinarian || 'N/A'}</div>
                            </div>
                            ${vaccination.notes ? `
                                <hr>
                                <div class="row">
                                    <div class="col-12"><strong>Notes:</strong></div>
                                    <div class="col-12">${vaccination.notes}</div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modal;
        const modalElement = new bootstrap.Modal(document.getElementById('vaccinationDetailModal'));
        modalElement.show();
    }

    calculateFlockAge(date) {
        if (!this.cycle || !this.cycle.startDate) return 1;
        const startDate = new Date(this.cycle.startDate);
        const currentDate = new Date(date);
        const diffTime = Math.abs(currentDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    initializeFlockAge() {
        const dateInput = document.getElementById('vaccinationDate');
        const flockAgeInput = document.getElementById('flockAgeVacc');
        
        if (dateInput && flockAgeInput) {
            // Calculate and set initial flock age
            const flockAge = this.calculateFlockAge(dateInput.value);
            flockAgeInput.value = flockAge;
            
            // Add event listener for date changes
            dateInput.addEventListener('change', () => {
                const newFlockAge = this.calculateFlockAge(dateInput.value);
                flockAgeInput.value = newFlockAge;
            });
        }
    }

    async loadCustomSchedule(cycleId) {
        try {
            // Try to load custom schedule from localStorage first, then from a potential future database table
            const scheduleKey = `vaccination_schedule_${cycleId}`;
            const savedSchedule = localStorage.getItem(scheduleKey);
            return savedSchedule ? JSON.parse(savedSchedule) : [];
        } catch (error) {
            console.error('Error loading custom schedule:', error);
            return [];
        }
    }

    async saveCustomSchedule(schedule) {
        try {
            const scheduleKey = `vaccination_schedule_${this.cycle.id}`;
            localStorage.setItem(scheduleKey, JSON.stringify(schedule));
            this.customSchedule = schedule;
            this.showToast('Custom vaccination schedule saved successfully!', 'success');
            this.render(); // Refresh the view
        } catch (error) {
            console.error('Error saving custom schedule:', error);
            this.showToast('Error saving custom schedule. Please try again.', 'error');
        }
    }

    async resetToStandardSchedule() {
        if (!confirm('This will replace your custom schedule with the standard vaccination schedule. Continue?')) {
            return;
        }

        try {
            const scheduleKey = `vaccination_schedule_${this.cycle.id}`;
            localStorage.removeItem(scheduleKey);
            this.customSchedule = [];
            this.showToast('Switched to standard vaccination schedule.', 'success');
            this.render(); // Refresh the view
        } catch (error) {
            console.error('Error resetting schedule:', error);
            this.showToast('Error resetting schedule. Please try again.', 'error');
        }
    }

    showScheduleManager() {
        const currentSchedule = this.customSchedule.length > 0 ? this.customSchedule : this.getStandardSchedule();
        
        const modal = `
            <div class="modal fade" id="scheduleManagerModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-edit me-2"></i>Customize Vaccination Schedule
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h6>Schedule Items</h6>
                                    <button class="btn btn-sm btn-success" onclick="vaccinationManager.addScheduleItem()">
                                        <i class="fas fa-plus me-1"></i>Add Item
                                    </button>
                                </div>
                                <div id="schedule-items">
                                    ${this.renderScheduleItems(currentSchedule)}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="vaccinationManager.saveScheduleFromModal()">
                                <i class="fas fa-save me-2"></i>Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modal;
        const modalElement = new bootstrap.Modal(document.getElementById('scheduleManagerModal'));
        modalElement.show();
    }

    renderScheduleItems(schedule) {
        return schedule.map((item, index) => `
            <div class="row mb-3 schedule-item" data-index="${index}">
                <div class="col-md-2">
                    <label class="form-label">Day</label>
                    <input type="number" class="form-control" value="${item.day}" min="1" 
                           onchange="vaccinationManager.updateScheduleItem(${index}, 'day', this.value)">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Weeks</label>
                    <input type="number" class="form-control" value="${item.weeks}" min="0" step="0.1"
                           onchange="vaccinationManager.updateScheduleItem(${index}, 'weeks', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Vaccine</label>
                    <input type="text" class="form-control" value="${item.vaccine}" 
                           onchange="vaccinationManager.updateScheduleItem(${index}, 'vaccine', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Method</label>
                    <select class="form-select" onchange="vaccinationManager.updateScheduleItem(${index}, 'method', this.value)">
                        <option value="drinking_water" ${item.method === 'drinking_water' ? 'selected' : ''}>Drinking Water</option>
                        <option value="injection" ${item.method === 'injection' ? 'selected' : ''}>Injection</option>
                        <option value="spray" ${item.method === 'spray' ? 'selected' : ''}>Spray</option>
                        <option value="eye_drop" ${item.method === 'eye_drop' ? 'selected' : ''}>Eye Drop</option>
                        <option value="wing_web" ${item.method === 'wing_web' ? 'selected' : ''}>Wing Web</option>
                        <option value="in_ovo" ${item.method === 'in_ovo' ? 'selected' : ''}>In Ovo</option>
                    </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-outline-danger btn-sm" onclick="vaccinationManager.removeScheduleItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    addScheduleItem() {
        const scheduleItems = document.getElementById('schedule-items');
        const currentItems = Array.from(scheduleItems.children);
        const newIndex = currentItems.length;
        
        const newItem = document.createElement('div');
        newItem.innerHTML = `
            <div class="row mb-3 schedule-item" data-index="${newIndex}">
                <div class="col-md-2">
                    <label class="form-label">Day</label>
                    <input type="number" class="form-control" value="1" min="1" 
                           onchange="vaccinationManager.updateScheduleItem(${newIndex}, 'day', this.value)">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Weeks</label>
                    <input type="number" class="form-control" value="0" min="0" step="0.1"
                           onchange="vaccinationManager.updateScheduleItem(${newIndex}, 'weeks', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Vaccine</label>
                    <input type="text" class="form-control" value="" placeholder="Enter vaccine name"
                           onchange="vaccinationManager.updateScheduleItem(${newIndex}, 'vaccine', this.value)">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Method</label>
                    <select class="form-select" onchange="vaccinationManager.updateScheduleItem(${newIndex}, 'method', this.value)">
                        <option value="drinking_water">Drinking Water</option>
                        <option value="injection">Injection</option>
                        <option value="spray">Spray</option>
                        <option value="eye_drop">Eye Drop</option>
                        <option value="wing_web">Wing Web</option>
                        <option value="in_ovo">In Ovo</option>
                    </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-outline-danger btn-sm" onclick="vaccinationManager.removeScheduleItem(${newIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        scheduleItems.appendChild(newItem.firstElementChild);
    }

    updateScheduleItem(index, field, value) {
        // This will be handled when saving the schedule
        console.log(`Updated item ${index}, field ${field} to ${value}`);
    }

    removeScheduleItem(index) {
        const item = document.querySelector(`[data-index="${index}"]`);
        if (item) {
            item.remove();
        }
    }

    saveScheduleFromModal() {
        const scheduleItems = document.querySelectorAll('.schedule-item');
        const newSchedule = [];
        
        scheduleItems.forEach(item => {
            const day = parseInt(item.querySelector('input[type="number"]').value);
            const weeks = parseFloat(item.querySelectorAll('input[type="number"]')[1].value);
            const vaccine = item.querySelector('input[type="text"]').value.trim();
            const method = item.querySelector('select').value;
            
            if (vaccine && day > 0) {
                newSchedule.push({
                    day: day,
                    weeks: weeks,
                    vaccine: vaccine,
                    method: method
                });
            }
        });
        
        // Sort by day
        newSchedule.sort((a, b) => a.day - b.day);
        
        if (newSchedule.length === 0) {
            this.showToast('Please add at least one vaccination item.', 'error');
            return;
        }
        
        this.saveCustomSchedule(newSchedule);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleManagerModal'));
        modal.hide();
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

// Global vaccination manager instance
const vaccinationManager = new VaccinationManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'vaccinationForm') {
            vaccinationManager.handleVaccinationSubmit(e);
        }
    });


});