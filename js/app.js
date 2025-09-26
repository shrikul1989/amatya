import { Dashboard } from './dashboard.js';
import { Projections } from './projections.js';
import { Transactions } from './transactions.js';
import { Analytics } from './analytics.js';
import { Import } from './import.js';
import { Categories } from './categories.js';
import { Settings } from './settings.js';
import { Help } from './help.js';

export const App = {
    // --- STATE ---
    state: {
        activeTab: 'dashboard',
        settings: {
            theme: 'light',
        },
        categories: [],
        accounts: [], 
        transactions: [],
        projections: {},
        categorizationRules: [],
        importProfiles: [],
        currentProjection: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1
        }
    },
    
    // --- DATABASE ---
    db: {
        save() {
            localStorage.setItem('amatyaData', JSON.stringify(App.state));
        },
        load() {
            const data = localStorage.getItem('amatyaData');
            if (data) {
                const parsedData = JSON.parse(data);
                if (parsedData.accounts && parsedData.accounts.some(acc => acc.balance !== undefined && acc.initialBalance === undefined)) {
                    parsedData.accounts.forEach(acc => {
                        if(acc.balance !== undefined && acc.initialBalance === undefined) {
                            acc.initialBalance = acc.balance;
                            delete acc.balance;
                        }
                    });
                }
                App.state = parsedData;
                App.state.settings.theme = 'light';
            } else {
                App.state.categories = [
                    { id: Date.now() + 0, name: 'Uncategorized', color: '#94a3b8', icon: 'fas fa-question-circle' },
                    { id: Date.now() + 1, name: 'Salary', color: '#16a34a', icon: 'fas fa-briefcase' },
                    { id: Date.now() + 2, name: 'Groceries', color: '#4ade80', icon: 'fas fa-shopping-cart' },
                    { id: Date.now() + 3, name: 'Dining Out', color: '#f97316', icon: 'fas fa-utensils' },
                    { id: Date.now() + 4, name: 'Rent', color: '#ef4444', icon: 'fas fa-home' },
                    { id: Date.now() + 5, name: 'Loan EMI', color: '#dc2626', icon: 'fas fa-file-invoice-dollar' },
                    { id: Date.now() + 6, name: 'Utilities', color: '#facc15', icon: 'fas fa-bolt' },
                    { id: Date.now() + 7, name: 'Shopping', color: '#ec4899', icon: 'fas fa-tshirt' },
                    { id: Date.now() + 8, name: 'Travel', color: '#0ea5e9', icon: 'fas fa-plane' },
                    { id: Date.now() + 9, name: 'Health', color: '#14b8a6', icon: 'fas fa-heartbeat' },
                    { id: Date.now() + 10, name: 'Entertainment', color: '#8b5cf6', icon: 'fas fa-film' },
                    { id: Date.now() + 11, name: 'Subscriptions', color: '#6366f1', icon: 'fas fa-sync-alt' },
                    { id: Date.now() + 12, name: 'Education', color: '#3b82f6', icon: 'fas fa-graduation-cap' },
                ];
                App.state.accounts = [
                    { id: Date.now() + 13, name: 'HDFC Savings xxxx', initialBalance: 1000 },
                    { id: Date.now() + 14, name: 'ICICI Savings xxxx', initialBalance: 1000 },
                    { id: Date.now() + 15, name: 'SBI Credit Card - xxxx', initialBalance: 0 },
                ];
                App.db.save();
            }
            // Ensure importProfiles is an array
            if (!Array.isArray(App.state.importProfiles)) {
                App.state.importProfiles = [];
            }
        }
    },

    // --- INITIALIZATION ---
    init() {
        this.db.load();
        this.applyTheme();
        this.renderNav();
        this.navigateTo(this.state.activeTab);
        this.bindEvents();
        this.showWelcomeModalIfNeeded();
        this.showBackupAlert();
    },

    // --- NAVIGATION & ROUTING ---
    navigateTo(tabId) {
        this.state.activeTab = tabId;
        this.db.save();
        this.renderPage(tabId);
        this.updateActiveNav(tabId);
        if (window.innerWidth < 1024) {
            this.closeMobileMenu();
        }
    },
    
    renderPage(tabId) {
        const pageContent = document.getElementById('page-content');
        const pageTitle = document.getElementById('page-title');
        
        const module = this.getModuleForTab(tabId);
        pageContent.innerHTML = module.template(this);
        pageTitle.textContent = tabId === 'projections' ? 'Monthly Budget' : tabId.charAt(0).toUpperCase() + tabId.slice(1);
        
        if (module.postRender) {
            module.postRender(this);
        }
    },
    
    getModuleForTab(tabId) {
        switch(tabId) {
            case 'dashboard': return Dashboard;
            case 'projections': return Projections;
            case 'transactions': return Transactions;
            case 'analytics': return Analytics;
            case 'categories': return Categories;
            case 'settings': return Settings;
            case 'import': return Import;
            case 'help': return Help;
            default: return Dashboard;
        }
    },

    // --- EVENT BINDING & HANDLERS ---
    bindEvents() {
        document.getElementById('menu-toggle').addEventListener('click', () => this.toggleMobileMenu());
        
        document.getElementById('main-nav').addEventListener('click', e => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                this.navigateTo(navLink.dataset.tab);
            }
        });

        // Backup alert listeners
        const closeBackupAlertBtn = document.getElementById('close-backup-alert');
        if (closeBackupAlertBtn) {
            closeBackupAlertBtn.addEventListener('click', () => this.hideBackupAlert());
        }
        const backupAlertSettingsLink = document.getElementById('backup-alert-settings-link');
        if (backupAlertSettingsLink) {
            backupAlertSettingsLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('settings'); });
        }

        const handleEvent = (eventType, e) => {
            const module = this.getModuleForTab(this.state.activeTab);
            if (module && module[eventType]) {
                module[eventType](this, e);
            }
        };

        document.body.addEventListener('click', e => handleEvent('handleClick', e));
        document.body.addEventListener('submit', e => {
            e.preventDefault(); // Prevent default form submission globally
            handleEvent('handleSubmit', e);
        });
        document.body.addEventListener('change', e => handleEvent('handleChange', e));
    },
    
    // --- GETTERS & HELPERS ---
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    },

    getCategoryOptions(selectedId = null) {
        return this.state.categories.map(cat => 
            `<option value="${cat.id}" ${cat.id == selectedId ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    },
    
    getAccountOptions(selectedId = null) {
        return this.state.accounts.map(acc => 
            `<option value="${acc.id}" ${acc.id == selectedId ? 'selected' : ''}>${acc.name}</option>`
        ).join('');
    },
    
    getImportProfileOptions(selectedId = null) {
        return this.state.importProfiles.map(p =>
            `<option value="${p.id}" ${p.id == selectedId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
    },

    getCategoryById(id) {
        return this.state.categories.find(c => c.id == id) || { name: 'Uncategorized', color: '#94a3b8', icon: 'fas fa-question-circle' };
    },
    
    getAccountById(id) {
        return this.state.accounts.find(a => a.id == id) || { name: 'N/A', initialBalance: 0 };
    },

    getCalculatedAccountBalance(accountId) {
        const account = this.getAccountById(accountId);
        if (!account) return 0;

        let balance = account.initialBalance || 0;

        this.state.transactions.forEach(tx => {
            if (tx.type === 'income' && tx.accountId == accountId) {
                balance += tx.amount;
            }
            if (tx.type === 'expense' && tx.accountId == accountId) {
                balance -= tx.amount;
            }
            if (tx.type === 'transfer') {
                if (tx.accountId == accountId) { // Source account
                    balance -= tx.amount;
                }
                if (tx.destinationAccountId == accountId) { // Destination account
                    balance += tx.amount;
                }
            }
        });
        return balance;
    },

    getThisMonthTransactions() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactions = this.state.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startOfMonth && txDate <= endOfMonth;
        });

        return {
            transactions,
            income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        };
    },

    getThisMonthProjectionData() {
        const now = new Date();
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const projection = this.state.projections[key] || { expenses: [] };
        return {
            projection,
            totalProjected: projection.expenses.reduce((sum, exp) => sum + exp.amount, 0),
        };
    },
    
    getRecentTransactions(count = 5) {
        return [...this.state.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, count);
    },

    getDbSize() {
        const data = localStorage.getItem('amatyaData');
        if (!data) return '0 KB';
        const sizeInBytes = new Blob([data]).size;
        const sizeInKb = (sizeInBytes / 1024).toFixed(2);
        const sizeInMb = (sizeInKb / 1024).toFixed(2);
        if (sizeInMb > 1) {
            return `${sizeInMb} MB`;
        }
        return `${sizeInKb} KB`;
    },

    // --- UI & THEME HELPERS ---
    applyTheme() {
        document.documentElement.classList.remove('dark');
    },

    showBackupAlert() {
        // Use sessionStorage to only show the alert once per session
        if (sessionStorage.getItem('amatyaBackupAlertDismissed')) {
            return;
        }
        const alertEl = document.getElementById('backup-alert');
        if (alertEl) alertEl.classList.remove('hidden');
    },

    hideBackupAlert() {
        document.getElementById('backup-alert')?.classList.add('hidden');
        sessionStorage.setItem('amatyaBackupAlertDismissed', 'true');
    },

    renderNav() {
        const navEl = document.getElementById('main-nav');
        const navItems = [
            { id: 'dashboard', icon: 'fa-house', text: 'Dashboard' },
            { id: 'projections', icon: 'fa-chart-line', text: 'Projections' },
            { id: 'transactions', icon: 'fa-exchange-alt', text: 'Transactions' },
            { id: 'analytics', icon: 'fa-chart-pie', text: 'Analytics' },
            { id: 'import', icon: 'fa-file-import', text: 'Import' },
            { id: 'categories', icon: 'fa-tags', text: 'Categories' },
            { id: 'settings', icon: 'fa-cog', text: 'Settings' },
            { id: 'help', icon: 'fa-question-circle', text: 'Help' },
        ];
        navEl.innerHTML = navItems.map(item => `
            <a href="#" class="nav-link flex items-center gap-4 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100" data-tab="${item.id}">
                <i class="fas ${item.icon} w-5 text-center"></i>
                <span>${item.text}</span>
            </a>
        `).join('');
    },
    
    updateActiveNav(tabId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('bg-slate-100', 'font-semibold');
            } else {
                link.classList.remove('bg-slate-100', 'font-semibold');
            }
        });
    },

    toggleMobileMenu() {
        document.getElementById('sidebar').classList.toggle('open');
    },
    
    closeMobileMenu() {
        document.getElementById('sidebar').classList.remove('open');
    },

    showWelcomeModalIfNeeded() {
        if (!localStorage.getItem('amatyaWelcomed')) {
            this.showModal('Welcome to Amatya!', `
                <p class="mb-4">This is a <strong>100% private</strong> finance manager.</p>
                <p class="mb-4">All your data is stored securely in <em>your browser's local storage</em> and never sent to any server.</p>
                <p>Get started by adding categories, accounts, and your first transaction!</p>
            `);
            localStorage.setItem('amatyaWelcomed', 'true');
        }
    },
    
    // --- MODALS & TOASTS ---
    showModal(title, content) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 lg:w-1/3 p-6 animate-enter" id="modal-content">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold">${title}</h3>
                    <button id="close-modal" class="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <div>${content}</div>
            </div>
        `;
        modalContainer.classList.remove('hidden');
        modalContainer.classList.add('flex');
        document.getElementById('close-modal').onclick = () => this.closeModal();
        modalContainer.onclick = (e) => {
            if (e.target.id === 'modal-container') this.closeModal();
        };
    },

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('hidden');
        modalContainer.classList.remove('flex');
        modalContainer.innerHTML = '';
    },

    showConfirmationModal(title, message, onConfirm) {
        this.showModal(title, `
            <p class="mb-6">${message}</p>
            <div class="flex justify-end gap-4">
                <button id="confirm-cancel" class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300">Cancel</button>
                <button id="confirm-action" class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Confirm</button>
            </div>
        `);
        document.getElementById('confirm-cancel').onclick = () => this.closeModal();
        document.getElementById('confirm-action').onclick = () => {
            onConfirm();
            this.closeModal();
        };
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        toast.className = `p-4 rounded-lg text-white shadow-lg animate-enter ${bgColor}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
