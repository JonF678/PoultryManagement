class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.adminPassword = 'admin123'; // Default password - user can change in settings
        this.sessionKey = 'poultryAppSession';
        this.passwordKey = 'poultryAppPassword';
        this.loadSettings();
    }

    loadSettings() {
        // Load custom password if set
        const savedPassword = localStorage.getItem(this.passwordKey);
        if (savedPassword) {
            this.adminPassword = savedPassword;
        }
    }

    checkSession() {
        const session = localStorage.getItem(this.sessionKey);
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Session expires after 24 hours
            if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                this.isAuthenticated = true;
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    async showLoginScreen() {
        return new Promise((resolve) => {
            const loginHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-header">
                            <i class="fas fa-egg login-icon"></i>
                            <h2>Poultry Management System</h2>
                            <p class="text-muted">Enter admin password to continue</p>
                        </div>
                        <form id="loginForm" class="login-form">
                            <div class="form-group">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-lock"></i>
                                    </span>
                                    <input type="password" 
                                           id="adminPassword" 
                                           class="form-control" 
                                           placeholder="Admin Password" 
                                           required
                                           autocomplete="current-password">
                                </div>
                            </div>
                            <div class="form-check mb-3">
                                <input type="checkbox" class="form-check-input" id="rememberMe" checked>
                                <label class="form-check-label" for="rememberMe">
                                    Keep me logged in for 24 hours
                                </label>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="fas fa-sign-in-alt me-2"></i>Login
                            </button>
                        </form>
                        <div id="loginError" class="alert alert-danger mt-3 d-none">
                            Incorrect password. Please try again.
                        </div>
                        <div class="login-footer">
                            <small class="text-muted">
                                Default password: admin123<br>
                                You can change this in Settings after logging in.
                            </small>
                        </div>
                    </div>
                </div>
            `;

            document.body.innerHTML = loginHTML;

            const form = document.getElementById('loginForm');
            const passwordInput = document.getElementById('adminPassword');
            const errorDiv = document.getElementById('loginError');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const enteredPassword = passwordInput.value;
                
                if (this.validatePassword(enteredPassword)) {
                    const rememberMe = document.getElementById('rememberMe').checked;
                    this.login(rememberMe);
                    resolve(true);
                } else {
                    errorDiv.classList.remove('d-none');
                    passwordInput.value = '';
                    passwordInput.focus();
                    
                    // Hide error after 3 seconds
                    setTimeout(() => {
                        errorDiv.classList.add('d-none');
                    }, 3000);
                }
            });

            // Focus on password input
            passwordInput.focus();
        });
    }

    validatePassword(password) {
        return password === this.adminPassword;
    }

    login(rememberSession = true) {
        this.isAuthenticated = true;
        
        if (rememberSession) {
            const sessionData = {
                timestamp: new Date().getTime(),
                authenticated: true
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        }
        
        console.log('User authenticated successfully');
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem(this.sessionKey);
        
        // Reload the page to show login screen
        window.location.reload();
    }

    changePassword(newPassword) {
        if (newPassword && newPassword.length >= 6) {
            this.adminPassword = newPassword;
            localStorage.setItem(this.passwordKey, newPassword);
            return true;
        }
        return false;
    }

    getCurrentPassword() {
        return this.adminPassword;
    }

    // Method to add logout functionality to the app
    addLogoutButton() {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar && !document.getElementById('logoutBtn')) {
            const logoutItem = document.createElement('li');
            logoutItem.className = 'nav-item';
            logoutItem.innerHTML = `
                <a class="nav-link" href="#" id="logoutBtn">
                    <i class="fas fa-sign-out-alt me-1"></i>Logout
                </a>
            `;
            navbar.appendChild(logoutItem);

            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        }
    }
}

// Create global auth instance
const auth = new Auth();