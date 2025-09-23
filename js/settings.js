export const Settings = {
    template(App) {
        return `
            <p class="text-slate-500 mb-6">Customize the app to your preferences.</p>
            <div class="space-y-6">
                <!-- Accounts & Credit Cards -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Accounts & Credit Cards</h3>
                    <div id="accounts-list" class="space-y-2 mb-4"></div>
                    <button id="show-add-account" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">+ Add New Source</button>
                </div>

                <!-- Import Profiles -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Saved Import Profiles</h3>
                    <div id="import-profiles-list" class="space-y-2"></div>
                </div>
                
                <!-- Data Management -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Data Management</h3>
                    <div class="mb-4">
                        <p class="text-sm text-slate-600">Current Database Size: <b id="db-size">Calculating...</b></p>
                        <p class="text-xs text-slate-500 mt-1">
                            For optimal performance, it is recommended to export your data and clear it from the app when the size approaches 5-10 MB.
                        </p>
                    </div>
                    <div class="flex flex-wrap gap-4 border-t pt-4">
                        <button id="export-data" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Export Data</button>
                        <label for="import-data-file" class="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Import Data</label>
                        <input type="file" id="import-data-file" class="hidden" accept=".json">
                        <button id="delete-all-data" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Delete All Data</button>
                    </div>
                </div>

                <!-- Categorization Rules -->
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">Categorization Rules</h3>
                        <button id="show-add-rule" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Add Rule</button>
                    </div>
                    <div id="categorization-rules-list" class="space-y-2">
                        <!-- Rules will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    },
    
    postRender(App) {
        this.renderCategorizationRules(App);
        this.renderAccountsList(App);
        this.renderImportProfiles(App);
        document.getElementById('db-size').textContent = App.getDbSize();
    },

    handleChange(App, e) {
         if (e.target.id === 'import-data-file' && e.target.files.length > 0) {
            App.showConfirmationModal('Import Data?', 'This will overwrite ALL existing data in the app. This action cannot be undone. Are you sure you want to continue?', () => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedState = JSON.parse(event.target.result);
                        if(importedState.settings && importedState.categories) {
                            App.state = importedState;
                            App.db.save();
                            App.showToast('Data imported successfully! Reloading...');
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            App.showToast('Invalid data file.', 'error');
                        }
                    } catch (err) {
                        App.showToast('Error reading file.', 'error');
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            });
        }
    },

    handleClick(App, e) {
        if (e.target.id === 'export-data') {
            const dataStr = JSON.stringify(App.state, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'amatya_backup.json';
            a.click();
            URL.revokeObjectURL(url);
            App.showToast('Data exported successfully!');
        }

        if (e.target.id === 'delete-all-data') {
            App.showModal('Delete All Data', `
                <p class="mb-4 text-slate-600">This action is irreversible. Please type <b>DELETE</b> below to confirm.</p>
                <input type="text" id="delete-confirmation-input" class="w-full bg-slate-50 border border-slate-300 rounded-md p-2">
                <div class="flex justify-end mt-6">
                    <button id="confirm-delete-all" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50" disabled>Delete All</button>
                </div>
            `);

            const input = document.getElementById('delete-confirmation-input');
            const confirmBtn = document.getElementById('confirm-delete-all');
            
            input.addEventListener('input', () => {
                confirmBtn.disabled = input.value !== 'DELETE';
            });

            confirmBtn.onclick = () => {
                if (input.value === 'DELETE') {
                    localStorage.removeItem('amatyaData');
                    localStorage.removeItem('amatyaWelcomed');
                    App.showToast('All data has been deleted. Reloading...');
                    setTimeout(() => window.location.reload(), 1500);
                }
            };
        }

        // Accounts
        if (e.target.id === 'show-add-account') {
            Settings.showAddEditAccountModal(App);
        }
        const editAccountBtn = e.target.closest('.edit-account');
        if (editAccountBtn) {
            const account = App.state.accounts.find(a => a.id == editAccountBtn.dataset.id);
            Settings.showAddEditAccountModal(App, account);
        }
        const deleteAccountBtn = e.target.closest('.delete-account');
        if (deleteAccountBtn) {
             App.showConfirmationModal('Delete Account?', 'Are you sure you want to delete this account? This will not delete its transactions, but they will become unassigned.', () => {
                const id = deleteAccountBtn.dataset.id;
                App.state.accounts = App.state.accounts.filter(acc => acc.id != id);
                App.db.save();
                App.showToast('Account deleted.');
                App.navigateTo('settings');
            });
        }

        // Rules
        if (e.target.id === 'show-add-rule') {
            Settings.showAddRuleModal(App);
        }
        const deleteRuleBtn = e.target.closest('.delete-rule');
        if (deleteRuleBtn) {
            const ruleId = deleteRuleBtn.dataset.id;
            App.state.categorizationRules = App.state.categorizationRules.filter(r => r.id != ruleId);
            App.db.save();
            App.showToast('Rule deleted.');
            Settings.renderCategorizationRules(App);
        }
        
        // Import Profiles
        const deleteProfileBtn = e.target.closest('.delete-import-profile');
        if(deleteProfileBtn) {
            const profileId = deleteProfileBtn.dataset.id;
            App.state.importProfiles = App.state.importProfiles.filter(p => p.id != profileId);
            App.db.save();
            App.showToast('Import profile deleted.');
            Settings.renderImportProfiles(App);
        }
    },
    
    handleSubmit(App, e) {
        if (e.target.id === 'account-form') {
            e.preventDefault();
            const id = e.target.dataset.id;
            const accData = {
                name: document.getElementById('acc-name').value,
                initialBalance: parseFloat(document.getElementById('acc-initialBalance').value)
            };

            if(id) { // Edit
                const index = App.state.accounts.findIndex(a => a.id == id);
                if(index > -1) App.state.accounts[index] = {...App.state.accounts[index], ...accData};
                App.showToast('Account updated!');
            } else { // Add
                App.state.accounts.push({id: Date.now(), ...accData});
                App.showToast('Account added!');
            }
            App.db.save();
            App.closeModal();
            App.navigateTo('settings');
        }
        
        if (e.target.id === 'add-rule-form') {
            e.preventDefault();
            App.state.categorizationRules.push({
                id: Date.now(),
                keyword: document.getElementById('rule-keyword').value,
                categoryId: document.getElementById('rule-category').value
            });
            App.db.save();
            App.showToast('Rule added.');
            App.closeModal();
            Settings.renderCategorizationRules(App);
        }
    },

    renderCategorizationRules(App) {
        const list = document.getElementById('categorization-rules-list');
        if(list) {
            list.innerHTML = App.state.categorizationRules.map(rule => `
                <div class="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                    <span>If description contains "<b>${rule.keyword}</b>" &rarr; set category to "<b>${App.getCategoryById(rule.categoryId).name}</b>"</span>
                    <button data-id="${rule.id}" class="delete-rule text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            `).join('') || '<p class="text-slate-500 text-sm">No rules defined.</p>';
        }
    },
    
    renderAccountsList(App) {
        const list = document.getElementById('accounts-list');
         if(list) {
            list.innerHTML = App.state.accounts.map(acc => `
                 <div class="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                    <div>
                        <p class="font-medium">${acc.name}</p>
                        <p class="text-xs text-slate-500">Current Balance: ${App.formatCurrency(App.getCalculatedAccountBalance(acc.id))}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-id="${acc.id}" class="edit-account text-slate-400 hover:text-indigo-500"><i class="fas fa-pencil-alt"></i></button>
                        <button data-id="${acc.id}" class="delete-account text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('') || '<p class="text-slate-500 text-sm">No accounts or cards added.</p>';
        }
    },
    
    renderImportProfiles(App) {
        const list = document.getElementById('import-profiles-list');
        if(list) {
            list.innerHTML = App.state.importProfiles.map(p => `
                <div class="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                    <span class="font-medium">${p.name}</span>
                    <button data-id="${p.id}" class="delete-import-profile text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            `).join('') || '<p class="text-slate-500 text-sm">No import profiles saved.</p>';
        }
    },

    showAddEditAccountModal(App, account = null) {
        const isEdit = account !== null;
        App.showModal(isEdit ? 'Edit Account' : 'Add Account/Card', `
            <form id="account-form" data-id="${isEdit ? account.id : ''}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">Name</label>
                        <input type="text" id="acc-name" required value="${isEdit ? account.name : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2" placeholder="e.g., Checking Account, Visa Card">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Initial Balance</label>
                        <input type="number" step="0.01" id="acc-initialBalance" required value="${isEdit ? account.initialBalance : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg">${isEdit ? 'Save Changes' : 'Add Source'}</button>
                </div>
            </form>
        `);
    },

    showAddRuleModal(App) {
        App.showModal('Add Categorization Rule', `
            <form id="add-rule-form">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">If description contains keyword:</label>
                        <input type="text" id="rule-keyword" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Then assign to category:</label>
                        <select id="rule-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions()}</select>
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg">Add Rule</button>
                </div>
            </form>
        `);
    }
};

