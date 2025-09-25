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
                        <div id="category-multiselect" class="relative w-56">
                            <button id="category-multiselect-btn" class="bg-slate-50 border border-slate-300 rounded-md p-2 text-sm w-full text-left flex justify-between items-center">
                                <span id="category-multiselect-label">Select Categories</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div id="category-multiselect-options" class="hidden absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                ${App.state.categories.map(cat => `
                                    <label class="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer text-sm">
                                        <input type="checkbox" class="category-checkbox" value="${cat.id}"> ${cat.name}
                                    </label>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="relative h-80">
                        <canvas id="analytics-category-time-chart"></canvas>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold">Income by Category</h3>
                        <div id="income-category-multiselect" class="relative w-56">
                            <button id="income-category-multiselect-btn" class="bg-slate-50 border border-slate-300 rounded-md p-2 text-sm w-full text-left flex justify-between items-center">
                                <span id="income-category-multiselect-label">Select Categories</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div id="income-category-multiselect-options" class="hidden absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                ${App.state.categories.map(cat => `
                                    <label class="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer text-sm">
                                        <input type="checkbox" class="income-category-checkbox" value="${cat.id}"> ${cat.name}
                                    </label>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="relative h-80">
                        <canvas id="analytics-income-category-chart"></canvas>
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

        const multiselectBtn = e.target.closest('#category-multiselect-btn');
        if (multiselectBtn) {
            document.getElementById('category-multiselect-options').classList.toggle('hidden');
        } else if (!e.target.closest('#category-multiselect')) {
            // Close dropdown if clicking outside
            document.getElementById('category-multiselect-options')?.classList.add('hidden');
        }

        const incomeMultiselectBtn = e.target.closest('#income-category-multiselect-btn');
        if (incomeMultiselectBtn) {
            document.getElementById('income-category-multiselect-options').classList.toggle('hidden');
        } else if (!e.target.closest('#income-category-multiselect')) {
            document.getElementById('income-category-multiselect-options')?.classList.add('hidden');
        }
    },

    handleChange(App, e) {
        if (e.target.classList.contains('analytics-date-filter')) {
            document.querySelectorAll('#analytics-predefined-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            Analytics.renderAnalyticsCharts(App);
        }
        if (e.target.classList.contains('category-checkbox')) {
            Analytics.renderAnalyticsCharts(App);
            
            // Update the label
            const checkedCount = document.querySelectorAll('.category-checkbox:checked').length;
            const label = document.getElementById('category-multiselect-label');
            if (checkedCount === 0) {
                label.textContent = 'Select Categories';
            } else {
                label.textContent = `${checkedCount} categor${checkedCount > 1 ? 'ies' : 'y'} selected`;
            }
        }
        if (e.target.classList.contains('income-category-checkbox')) {
            Analytics.renderAnalyticsCharts(App);
            
            // Update the label
            const checkedCount = document.querySelectorAll('.income-category-checkbox:checked').length;
            const label = document.getElementById('income-category-multiselect-label');
            if (checkedCount === 0) {
                label.textContent = 'Select Categories';
            } else {
                label.textContent = `${checkedCount} categor${checkedCount > 1 ? 'ies' : 'y'} selected`;
            }
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
        const checkedSpendingCategories = document.querySelectorAll('.category-checkbox:checked');
        const selectedSpendingCategoryIds = [...checkedSpendingCategories].map(cb => cb.value);
        const checkedIncomeCategories = document.querySelectorAll('.income-category-checkbox:checked');
        const selectedIncomeCategoryIds = [...checkedIncomeCategories].map(cb => cb.value);
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
        if (window.analyticsIncomeCategoryChart) window.analyticsIncomeCategoryChart.destroy();
        if (window.analyticsRecurringChart) window.analyticsRecurringChart.destroy();

        // 1. Income vs Expense Chart
        const incomeExpenseData = filteredTxs.reduce((acc, tx) => {
            const date = new Date(tx.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = { income: 0, expense: 0, label: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
            }
            if (tx.type === 'income') {
                acc[key].income += tx.amount;
            } else if (tx.type === 'expense') {
                acc[key].expense += tx.amount;
            }
            return acc;
        }, {});

        const sortedKeysIE = Object.keys(incomeExpenseData).sort();
        const labelsIE = sortedKeysIE.map(key => incomeExpenseData[key].label);
        const incomeData = sortedKeysIE.map(key => incomeExpenseData[key].income);
        const expenseData = sortedKeysIE.map(key => incomeExpenseData[key].expense);

        const incomeExpenseCanvas = document.getElementById('analytics-income-expense-chart');
        if (incomeExpenseCanvas) {
            const ctx = incomeExpenseCanvas.getContext('2d');
            window.analyticsIncomeExpenseChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labelsIE,
                    datasets: [
                        { label: 'Income', data: incomeData, backgroundColor: '#22c55e' },
                        { label: 'Expense', data: expenseData, backgroundColor: '#ef4444' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 2. Category vs Time Chart
        const categoryTxs = filteredTxs.filter(tx => selectedSpendingCategoryIds.includes(tx.categoryId) && tx.type === 'expense');
        const categoryTimeData = categoryTxs.reduce((acc, tx) => {
            const date = new Date(tx.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = { amount: 0, label: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
            }
            acc[key].amount += tx.amount;
            return acc;
        }, {});

        const sortedKeysCat = Object.keys(categoryTimeData).sort();
        const labelsCat = sortedKeysCat.map(key => categoryTimeData[key].label);
        const categorySpending = sortedKeysCat.map(key => categoryTimeData[key].amount);
        
        let categoryChartLabel = 'Spending in Selected Categories';
        let categoryChartColor = '#4f46e5'; // Default color
        if (selectedSpendingCategoryIds.length === 1) {
            const category = App.getCategoryById(selectedSpendingCategoryIds[0]);
            categoryChartLabel = `Spending in ${category.name}`;
            categoryChartColor = category.color;
        }


        const categoryTimeCanvas = document.getElementById('analytics-category-time-chart');
        if (categoryTimeCanvas) {
            const ctx = categoryTimeCanvas.getContext('2d');
            window.analyticsCategoryTimeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labelsCat,
                    datasets: [{
                        label: categoryChartLabel,
                        data: categorySpending,
                        backgroundColor: categoryChartColor
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // 3. Income by Category Chart
        const incomeCategoryTxs = filteredTxs.filter(tx => selectedIncomeCategoryIds.includes(tx.categoryId) && tx.type === 'income');
        const incomeCategoryTimeData = incomeCategoryTxs.reduce((acc, tx) => {
            const date = new Date(tx.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[key]) {
                acc[key] = { amount: 0, label: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
            }
            acc[key].amount += tx.amount;
            return acc;
        }, {});

        const sortedKeysIncomeCat = Object.keys(incomeCategoryTimeData).sort();
        const labelsIncomeCat = sortedKeysIncomeCat.map(key => incomeCategoryTimeData[key].label);
        const incomeCategoryData = sortedKeysIncomeCat.map(key => incomeCategoryTimeData[key].amount);
        
        let incomeCatChartLabel = 'Income from Selected Categories';
        let incomeCatChartColor = '#16a34a'; // Default green color
        if (selectedIncomeCategoryIds.length === 1) {
            const category = App.getCategoryById(selectedIncomeCategoryIds[0]);
            incomeCatChartLabel = `Income from ${category.name}`;
            incomeCatChartColor = category.color;
        }

        const incomeCategoryCanvas = document.getElementById('analytics-income-category-chart');
        if (incomeCategoryCanvas) {
            const ctx = incomeCategoryCanvas.getContext('2d');
            window.analyticsIncomeCategoryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labelsIncomeCat,
                    datasets: [{ label: incomeCatChartLabel, data: incomeCategoryData, backgroundColor: incomeCatChartColor }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // 4. Source Comparison Chart
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
        
        // 5. Recurring vs Non-recurring Chart
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
