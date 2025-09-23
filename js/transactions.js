export const Transactions = {
    template(App) {
        return `
            <p class="text-slate-500 mb-6">View and manage all your income and expenses.</p>
            
            <div class="flex justify-between items-center mb-6">
                <div class="flex gap-2">
                    <button id="show-add-transaction" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Add Transaction</button>
                    <button id="show-self-transfer" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Self Transfer</button>
                </div>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 class="font-semibold mb-2">Filters</h3>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input type="date" id="filter-start-date" class="filter-input bg-slate-50 border border-slate-300 rounded-md p-2">
                    <input type="date" id="filter-end-date" class="filter-input bg-slate-50 border border-slate-300 rounded-md p-2">
                    <select id="filter-category" class="filter-input bg-slate-50 border border-slate-300 rounded-md p-2">
                        <option value="">All Categories</option>
                        ${App.getCategoryOptions()}
                    </select>
                    <select id="filter-account" class="filter-input bg-slate-50 border border-slate-300 rounded-md p-2">
                        <option value="">All Sources</option>
                        ${App.getAccountOptions()}
                    </select>
                    <select id="filter-type" class="filter-input bg-slate-50 border border-slate-300 rounded-md p-2">
                        <option value="">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-6 mb-6">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Spending by Category</h3>
                    <div class="relative h-80">
                        <canvas id="transactions-category-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="p-4 font-semibold">Date</th>
                            <th class="p-4 font-semibold">Description</th>
                            <th class="p-4 font-semibold">Category/Transfer</th>
                            <th class="p-4 font-semibold">Source &rarr; Destination</th>
                            <th class="p-4 font-semibold text-right">Amount</th>
                            <th class="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="transactions-table-body">
                        <!-- Transactions will be rendered here -->
                    </tbody>
                </table>
            </div>
        `;
    },

    postRender(App) {
        Transactions.renderTransactionsView(App);
    },

    handleChange(App, e) {
        if (e.target.classList.contains('filter-input')) {
            Transactions.applyFilters(App);
        }
    },

    handleClick(App, e) {
        // Show add/edit modal
        if (e.target.closest('.edit-transaction')) {
            const txId = e.target.closest('.edit-transaction').dataset.id;
            const transaction = App.state.transactions.find(t => t.id == txId);
            if (transaction.type === 'transfer') {
                Transactions.showSelfTransferModal(App, transaction);
            } else {
                Transactions.showAddEditTransactionModal(App, transaction);
            }
        } else if (e.target.id === 'show-add-transaction') {
            Transactions.showAddEditTransactionModal(App);
        }
        
        if(e.target.id === 'show-self-transfer') {
            Transactions.showSelfTransferModal(App);
        }

        // Delete transaction
        const deleteBtn = e.target.closest('.delete-transaction');
        if (deleteBtn) {
            App.showConfirmationModal('Delete Transaction?', 'Are you sure you want to delete this transaction?', () => {
                const txId = deleteBtn.dataset.id;
                App.state.transactions = App.state.transactions.filter(tx => tx.id != txId);
                App.db.save();
                App.showToast('Transaction deleted.');
                App.navigateTo('transactions');
            });
        }
    },

    handleSubmit(App, e) {
        // Handle form submission
        if (e.target.id === 'transaction-form') {
            e.preventDefault();
            const id = e.target.dataset.id;
            const transactionData = {
                type: document.getElementById('tx-type').value,
                amount: parseFloat(document.getElementById('tx-amount').value),
                categoryId: document.getElementById('tx-category').value,
                accountId: document.getElementById('tx-account').value,
                date: new Date(document.getElementById('tx-date').value).toISOString(),
                description: document.getElementById('tx-description').value,
                recurring: document.getElementById('tx-recurring').checked
            };
            
            if (id) { // Editing
                const index = App.state.transactions.findIndex(tx => tx.id == id);
                if (index > -1) App.state.transactions[index] = {...App.state.transactions[index], ...transactionData, id: parseInt(id)};
                App.showToast('Transaction updated.');
            } else { // Adding
                App.state.transactions.push({id: Date.now(), ...transactionData});
                App.showToast('Transaction added.');
            }
            App.db.save();
            App.closeModal();
            App.navigateTo('transactions');
        }
        
        if (e.target.id === 'self-transfer-form') {
            e.preventDefault();
            const id = e.target.dataset.id;
            const sourceAccountId = document.getElementById('transfer-from').value;
            const destinationAccountId = document.getElementById('transfer-to').value;
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            
            if (sourceAccountId === destinationAccountId) {
                App.showToast('Source and destination accounts cannot be the same.', 'error');
                return;
            }

            const transferData = {
                type: 'transfer',
                amount,
                accountId: sourceAccountId,
                destinationAccountId,
                date: new Date(document.getElementById('transfer-date').value).toISOString(),
                description: document.getElementById('transfer-description').value,
            };

            if (id) { // Editing
                const index = App.state.transactions.findIndex(tx => tx.id == id);
                if (index > -1) App.state.transactions[index] = {...App.state.transactions[index], ...transferData, id: parseInt(id) };
                App.showToast('Transfer updated successfully.');
            } else { // Adding
                App.state.transactions.push({ id: Date.now(), ...transferData });
                App.showToast('Transfer recorded successfully.');
            }
            
            App.db.save();
            App.closeModal();
            App.navigateTo('transactions');
        }
    },

    renderTransactionsView(App, filteredTxs = null) {
        const transactions = (filteredTxs || [...App.state.transactions]);
        const sortedTransactions = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));

        const tableBody = document.getElementById('transactions-table-body');
        if(tableBody) {
            tableBody.innerHTML = sortedTransactions.map(tx => {
                if(tx.type === 'transfer') {
                    const source = App.getAccountById(tx.accountId);
                    const dest = App.getAccountById(tx.destinationAccountId);
                    return `
                        <tr class="border-b">
                            <td class="p-4">${new Date(tx.date).toLocaleDateString()}</td>
                            <td class="p-4">${tx.description || 'Self Transfer'}</td>
                            <td class="p-4"><span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Transfer</span></td>
                            <td class="p-4 text-sm text-slate-500">${source.name} &rarr; ${dest.name}</td>
                            <td class="p-4 text-right font-semibold text-slate-500">${App.formatCurrency(tx.amount)}</td>
                            <td class="p-4 text-center">
                                <button data-id="${tx.id}" class="edit-transaction text-slate-400 hover:text-indigo-500 mr-2"><i class="fas fa-pencil-alt"></i></button>
                                <button data-id="${tx.id}" class="delete-transaction text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                }
                const category = App.getCategoryById(tx.categoryId);
                const account = App.getAccountById(tx.accountId);
                return `
                    <tr class="border-b">
                        <td class="p-4">${new Date(tx.date).toLocaleDateString()}</td>
                        <td class="p-4">${tx.description || 'N/A'}</td>
                        <td class="p-4"><span class="px-2 py-1 text-xs rounded-full" style="background-color:${category.color}33; color:${category.color}">${category.name}</span></td>
                        <td class="p-4 text-sm text-slate-500">${account.name}</td>
                        <td class="p-4 text-right font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}">${tx.type === 'expense' ? '-' : '+'}${App.formatCurrency(tx.amount)}</td>
                        <td class="p-4 text-center">
                            <button data-id="${tx.id}" class="edit-transaction text-slate-400 hover:text-indigo-500 mr-2"><i class="fas fa-pencil-alt"></i></button>
                            <button data-id="${tx.id}" class="delete-transaction text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="6" class="p-4 text-center text-slate-500">No transactions found.</td></tr>';
        }
        Transactions.renderTransactionsCharts(App, transactions);
    },

    renderTransactionsCharts(App, transactions = []) {
        if (window.transactionsCategoryChart) window.transactionsCategoryChart.destroy();
        const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, tx) => {
            const category = App.getCategoryById(tx.categoryId);
            acc[category.name] = (acc[category.name] || 0) + tx.amount;
            return acc;
        }, {});

        const catChartCanvas = document.getElementById('transactions-category-chart');
        if (catChartCanvas) {
            const ctx = catChartCanvas.getContext('2d');
            window.transactionsCategoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categorySpending),
                    datasets: [{
                        data: Object.values(categorySpending),
                        backgroundColor: Object.keys(categorySpending).map(name => App.state.categories.find(c => c.name === name)?.color || '#94a3b8'),
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    },

    applyFilters(App) {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const category = document.getElementById('filter-category').value;
        const type = document.getElementById('filter-type').value;
        const account = document.getElementById('filter-account').value;

        let filtered = [...App.state.transactions];

        if (startDate) filtered = filtered.filter(tx => new Date(tx.date) >= new Date(startDate));
        if (endDate) filtered = filtered.filter(tx => new Date(tx.date) <= new Date(endDate));
        if (category) filtered = filtered.filter(tx => tx.categoryId == category);
        if (type) filtered = filtered.filter(tx => tx.type === type);
        if (account) filtered = filtered.filter(tx => tx.accountId == account || tx.destinationAccountId == account);
        
        Transactions.renderTransactionsView(App, filtered);
    },

    showAddEditTransactionModal(App, transaction = null) {
        const isEdit = transaction !== null;
        App.showModal(isEdit ? 'Edit Transaction' : 'Add Transaction', `
            <form id="transaction-form" data-id="${isEdit ? transaction.id : ''}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Type</label>
                        <select id="tx-type" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                            <option value="expense" ${isEdit && transaction.type === 'expense' ? 'selected' : ''}>Expense</option>
                            <option value="income" ${isEdit && transaction.type === 'income' ? 'selected' : ''}>Income</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Amount</label>
                        <input type="number" id="tx-amount" step="0.01" required value="${isEdit ? transaction.amount : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Category</label>
                        <select id="tx-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions(isEdit ? transaction.categoryId : null)}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Account</label>
                        <select id="tx-account" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions(isEdit ? transaction.accountId : null)}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Date</label>
                        <input type="date" id="tx-date" required value="${isEdit ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium">Description</label>
                        <input type="text" id="tx-description" value="${isEdit ? transaction.description || '' : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                </div>
                <div class="flex items-center mt-4">
                    <input type="checkbox" id="tx-recurring" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" ${isEdit && transaction.recurring ? 'checked' : ''}>
                    <label for="tx-recurring" class="ml-2 block text-sm">Recurring Expense</label>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg">${isEdit ? 'Save Changes' : 'Add Transaction'}</button>
                </div>
            </form>
        `);
    },

    showSelfTransferModal(App, transfer = null) {
        const isEdit = transfer !== null;
        App.showModal(isEdit ? 'Edit Transfer' : 'Record Self Transfer', `
            <form id="self-transfer-form" data-id="${isEdit ? transfer.id : ''}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">From Account</label>
                        <select id="transfer-from" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions(isEdit ? transfer.accountId : null)}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">To Account</label>
                        <select id="transfer-to" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions(isEdit ? transfer.destinationAccountId : null)}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Amount</label>
                        <input type="number" step="0.01" id="transfer-amount" required value="${isEdit ? transfer.amount : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Date</label>
                        <input type="date" id="transfer-date" required value="${isEdit ? new Date(transfer.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Description (Optional)</label>
                        <input type="text" id="transfer-description" value="${isEdit ? transfer.description || '' : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg">${isEdit ? 'Save Changes' : 'Record Transfer'}</button>
                </div>
            </form>
        `);
    },
};

