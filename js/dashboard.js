export const Dashboard = {
    template(App) {
        const now = new Date();
        const currentMonthName = now.toLocaleString('default', { month: 'long' });
        let totalBalance = 0;
        App.state.accounts.forEach(acc => totalBalance += App.getCalculatedAccountBalance(acc.id));
        
        const { income, expenses } = App.getThisMonthTransactions();
        const { totalProjected } = App.getThisMonthProjectionData();
        const progress = totalProjected > 0 ? (expenses / totalProjected) * 100 : 0;
        
        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main content -->
                <div class="lg:col-span-3 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Balance</h3>
                            <p class="text-3xl font-bold mt-1">${App.formatCurrency(totalBalance)}</p>
                            <hr class="my-4 dark:border-slate-700">
                            <h4 class="text-xs font-semibold uppercase text-slate-400 mb-2">By Account</h4>
                            <ul class="space-y-1 text-sm max-h-24 overflow-y-auto">
                                ${App.state.accounts.map(acc => `
                                    <li class="flex justify-between">
                                        <span>${acc.name}</span>
                                        <span class="font-medium">${App.formatCurrency(App.getCalculatedAccountBalance(acc.id))}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">${currentMonthName} Income</h3>
                            <p class="text-3xl font-bold mt-1 text-green-500">${App.formatCurrency(income)}</p>
                        </div>
                        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">${currentMonthName} Expenses</h3>
                            <p class="text-3xl font-bold mt-1 text-red-500">${App.formatCurrency(expenses)}</p>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold mb-4">Quick Add Expense</h3>
                        <form id="quick-add-expense-form">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label for="quick-date" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Date</label>
                                    <input type="date" id="quick-date" value="${new Date().toISOString().split('T')[0]}" required class="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2">
                                </div>
                                <div>
                                    <label for="quick-amount" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Amount</label>
                                    <input type="number" id="quick-amount" step="0.01" required class="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2">
                                </div>
                                <div>
                                    <label for="quick-category" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Category</label>
                                    <select id="quick-category" required class="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2">
                                        ${App.getCategoryOptions()}
                                    </select>
                                </div>
                                <div>
                                    <label for="quick-account" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Source</label>
                                    <select id="quick-account" required class="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2">
                                        ${App.getAccountOptions()}
                                    </select>
                                </div>
                                <div class="md:col-span-4">
                                    <label for="quick-description" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
                                    <input type="text" id="quick-description" class="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2">
                                </div>
                            </div>
                            <div class="flex items-center mt-4">
                                <input type="checkbox" id="quick-recurring" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                                <label for="quick-recurring" class="ml-2 block text-sm text-slate-900 dark:text-slate-300">Recurring Expense</label>
                            </div>
                            <button type="submit" class="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">Add Expense</button>
                        </form>
                        <hr class="my-6 dark:border-slate-700">
                        <h3 class="text-xl font-semibold mb-2">Monthly Budget Progress</h3>
                        <p class="text-sm text-slate-500 mb-2">Spent ${App.formatCurrency(expenses)} of ${App.formatCurrency(totalProjected)}</p>
                        <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                            <div class="bg-indigo-600 h-4 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
             </div>
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Spending by Category</h3>
                    <div class="relative h-80">
                        <canvas id="category-spend-chart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Recent Transactions</h3>
                    <ul class="space-y-2 h-80 overflow-y-auto">
                        ${App.getRecentTransactions(15).map(tx => {
                            if (tx.type === 'transfer') {
                                const source = App.getAccountById(tx.accountId);
                                const dest = App.getAccountById(tx.destinationAccountId);
                                return `
                                <li class="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div>
                                        <p class="font-medium flex items-center gap-2"><i class="fas fa-exchange-alt text-blue-500"></i> Self Transfer</p>
                                        <p class="text-sm text-slate-500">${source.name} &rarr; ${dest.name}</p>
                                    </div>
                                    <p class="font-semibold text-slate-500">${App.formatCurrency(tx.amount)}</p>
                                </li>
                                `
                            }
                            return `
                            <li class="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <div>
                                    <p class="font-medium">${tx.description || App.getCategoryById(tx.categoryId).name}</p>
                                    <p class="text-sm text-slate-500">${new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <p class="font-semibold ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}">${tx.type === 'expense' ? '-' : '+'}${App.formatCurrency(tx.amount)}</p>
                            </li>
                        `}).join('') || '<p class="text-slate-500">No transactions yet.</p>'}
                    </ul>
                </div>
             </div>
        `;
    },

    postRender(App) {
        this.renderDashboardCharts(App);
    },

    handleSubmit(App, e) {
        if (e.target.id === 'quick-add-expense-form') {
            e.preventDefault();
            const date = e.target.querySelector('#quick-date').value;
            const amount = parseFloat(e.target.querySelector('#quick-amount').value);
            const categoryId = e.target.querySelector('#quick-category').value;
            const description = e.target.querySelector('#quick-description').value;
            const accountId = e.target.querySelector('#quick-account').value;
            const recurring = e.target.querySelector('#quick-recurring').checked;

            if (amount && categoryId && date && accountId) {
                App.state.transactions.push({
                    id: Date.now(),
                    type: 'expense',
                    amount,
                    categoryId,
                    description,
                    date: new Date(date).toISOString(),
                    accountId,
                    recurring
                });
                App.db.save();
                App.showToast('Expense added successfully!');
                App.navigateTo('dashboard');
            }
        }
    },

    renderDashboardCharts(App) {
        const { transactions } = App.getThisMonthTransactions();
        const categorySpending = transactions.filter(t => t.type === 'expense').reduce((acc, tx) => {
            const category = App.getCategoryById(tx.categoryId);
            acc[category.name] = (acc[category.name] || 0) + tx.amount;
            return acc;
        }, {});

        const chartCanvas = document.getElementById('category-spend-chart');
        if(chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            if(window.categoryChart) window.categoryChart.destroy();
            window.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categorySpending),
                    datasets: [{
                        data: Object.values(categorySpending),
                        backgroundColor: Object.keys(categorySpending).map(name => App.state.categories.find(c => c.name === name)?.color || '#94a3b8'),
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
};

