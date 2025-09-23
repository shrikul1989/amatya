export const Analytics = {
    template(App) {
        return `
             <p class="text-slate-500 mb-6">Analyze your financial trends over time.</p>

            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 class="font-semibold mb-2">Filters</h3>
                <div class="flex flex-wrap items-center gap-4">
                    <div id="analytics-predefined-filters" class="flex gap-2">
                        <button class="filter-btn px-3 py-1 rounded-md text-sm bg-slate-200 hover:bg-slate-300" data-range="1m">1M</button>
                        <button class="filter-btn px-3 py-1 rounded-md text-sm bg-slate-200 hover:bg-slate-300" data-range="3m">3M</button>
                        <button class="filter-btn px-3 py-1 rounded-md text-sm bg-slate-200 hover:bg-slate-300 active" data-range="6m">6M</button>
                        <button class="filter-btn px-3 py-1 rounded-md text-sm bg-slate-200 hover:bg-slate-300" data-range="1y">1Y</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <label for="analytics-start-date" class="text-sm">From:</label>
                        <input type="date" id="analytics-start-date" class="analytics-date-filter bg-slate-50 border border-slate-300 rounded-md p-2 text-sm">
                    </div>
                    <div class="flex items-center gap-2">
                         <label for="analytics-end-date" class="text-sm">To:</label>
                        <input type="date" id="analytics-end-date" class="analytics-date-filter bg-slate-50 border border-slate-300 rounded-md p-2 text-sm">
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Income vs. Expense</h3>
                    <div class="relative h-80">
                        <canvas id="analytics-income-expense-chart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">Category Spending Over Time</h3>
                        <select id="analytics-category-select" class="bg-slate-50 border border-slate-300 rounded-md p-2 text-sm">
                            ${App.getCategoryOptions()}
                        </select>
                    </div>
                    <div class="relative h-80">
                        <canvas id="analytics-category-time-chart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Spending by Source</h3>
                    <div class="relative h-80">
                        <canvas id="analytics-source-chart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Recurring vs. Non-recurring</h3>
                    <div class="relative h-80">
                        <canvas id="analytics-recurring-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    },

    postRender(App) {
        Analytics.setAnalyticsDateFilter(App, '6m');
    },

    handleClick(App, e) {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            document.querySelectorAll('#analytics-predefined-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');
            Analytics.setAnalyticsDateFilter(App, filterBtn.dataset.range);
        }
    },

    handleChange(App, e) {
        if (e.target.classList.contains('analytics-date-filter') || e.target.id === 'analytics-category-select') {
            document.querySelectorAll('#analytics-predefined-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            Analytics.renderAnalyticsCharts(App);
        }
    },

    setAnalyticsDateFilter(App, range) {
        const endDateInput = document.getElementById('analytics-end-date');
        const startDateInput = document.getElementById('analytics-start-date');
        const endDate = new Date();
        let startDate = new Date();

        switch (range) {
            case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
            case '3m': startDate.setMonth(endDate.getMonth() - 3); break;
            case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
            case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        }

        endDateInput.value = endDate.toISOString().split('T')[0];
        startDateInput.value = startDate.toISOString().split('T')[0];

        Analytics.renderAnalyticsCharts(App);
    },

    renderAnalyticsCharts(App) {
        const startDateInput = document.getElementById('analytics-start-date');
        const endDateInput = document.getElementById('analytics-end-date');
        const categoryId = document.getElementById('analytics-category-select').value;

        if (!startDateInput || !endDateInput) return;

        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        const filteredTxs = App.state.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
        });

        // Destroy existing charts
        if (window.analyticsIncomeExpenseChart) window.analyticsIncomeExpenseChart.destroy();
        if (window.analyticsCategoryTimeChart) window.analyticsCategoryTimeChart.destroy();
        if (window.analyticsSourceChart) window.analyticsSourceChart.destroy();
        if (window.analyticsRecurringChart) window.analyticsRecurringChart.destroy();

        // 1. Income vs Expense Chart
        const incomeExpenseData = filteredTxs.reduce((acc, tx) => {
            const date = new Date(tx.date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = { income: 0, expense: 0 };
            }
            if (tx.type !== 'transfer') acc[date][tx.type] += tx.amount;
            return acc;
        }, {});

        const sortedDates = Object.keys(incomeExpenseData).sort((a, b) => new Date(a) - new Date(b));
        const incomeData = sortedDates.map(date => incomeExpenseData[date].income);
        const expenseData = sortedDates.map(date => incomeExpenseData[date].expense);

        const incomeExpenseCanvas = document.getElementById('analytics-income-expense-chart');
        if (incomeExpenseCanvas) {
            const ctx = incomeExpenseCanvas.getContext('2d');
            window.analyticsIncomeExpenseChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [
                        { label: 'Income', data: incomeData, borderColor: '#22c55e', fill: false },
                        { label: 'Expense', data: expenseData, borderColor: '#ef4444', fill: false }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 2. Category vs Time Chart
        const categoryTxs = filteredTxs.filter(tx => tx.categoryId == categoryId && tx.type === 'expense');
        const categoryTimeData = categoryTxs.reduce((acc, tx) => {
            const monthYear = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            acc[monthYear] = (acc[monthYear] || 0) + tx.amount;
            return acc;
        }, {});

        const sortedMonths = Object.keys(categoryTimeData).sort((a, b) => new Date(a) - new Date(b));
        const categorySpending = sortedMonths.map(month => categoryTimeData[month]);

        const categoryTimeCanvas = document.getElementById('analytics-category-time-chart');
        if (categoryTimeCanvas) {
            const ctx = categoryTimeCanvas.getContext('2d');
            window.analyticsCategoryTimeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: `Spending in ${App.getCategoryById(categoryId).name}`,
                        data: categorySpending,
                        backgroundColor: App.getCategoryById(categoryId).color || '#4f46e5'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // 3. Source Comparison Chart
        const sourceSpending = filteredTxs.filter(t => t.type === 'expense').reduce((acc, tx) => {
            const source = App.getAccountById(tx.accountId);
            acc[source.name] = (acc[source.name] || 0) + tx.amount;
            return acc;
        }, {});

        const sourceCanvas = document.getElementById('analytics-source-chart');
        if (sourceCanvas) {
            const ctx = sourceCanvas.getContext('2d');
            window.analyticsSourceChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(sourceSpending),
                    datasets: [{
                        data: Object.values(sourceSpending),
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // 4. Recurring vs Non-recurring Chart
        const recurringSpending = filteredTxs.filter(t => t.type === 'expense').reduce((acc, tx) => {
            const type = tx.recurring ? 'Recurring' : 'Non-recurring';
            acc[type] = (acc[type] || 0) + tx.amount;
            return acc;
        }, { 'Recurring': 0, 'Non-recurring': 0 });
        
        const recurringCanvas = document.getElementById('analytics-recurring-chart');
        if (recurringCanvas) {
            const ctx = recurringCanvas.getContext('2d');
            window.analyticsRecurringChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(recurringSpending),
                    datasets: [{
                        data: Object.values(recurringSpending),
                        backgroundColor: ['#6366f1', '#a855f7'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
};

