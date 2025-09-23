export const Projections = {
    template(App) {
        const { year, month } = App.state.currentProjection;
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        return `
            <p class="text-slate-500 mb-6">Plan and forecast your monthly budgets.</p>
            
            <div class="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-md">
                <label for="projection-year">Year:</label>
                <select id="projection-year" class="bg-slate-50 border border-slate-300 rounded-md p-2">
                    ${[...Array(5).keys()].map(i => new Date().getFullYear() - 2 + i).map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
                <label for="projection-month">Month:</label>
                <select id="projection-month" class="bg-slate-50 border border-slate-300 rounded-md p-2">
                    ${[...Array(12).keys()].map(i => `<option value="${i+1}" ${i+1 === month ? 'selected' : ''}>${new Date(0, i).toLocaleString('default', { month: 'long' })}</option>`).join('')}
                </select>
                <button id="create-new-projection" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Create New/Copy</button>
            </div>
            
            <h3 class="text-2xl font-semibold mb-4">${monthName} ${year}</h3>
            
            <div id="projection-overview" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Overview content here -->
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md">
                 <h4 class="text-xl font-semibold mb-4">Projected Expenses</h4>
                 <ul id="projected-expenses-list" class="space-y-2 mb-4 h-96 overflow-y-auto"></ul>
                 <button id="show-add-projection-expense" class="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">+ Add Expense</button>
            </div>
        `;
    },

    postRender(App) {
        Projections.renderProjectionsView(App);
    },

    handleChange(App, e) {
        if (e.target.id === 'projection-year' || e.target.id === 'projection-month') {
            App.state.currentProjection.year = parseInt(document.getElementById('projection-year').value);
            App.state.currentProjection.month = parseInt(document.getElementById('projection-month').value);
            Projections.renderProjectionsView(App);
        }
    },

    handleClick(App, e) {
        // Create/copy projection
        if (e.target.id === 'create-new-projection') {
            App.showConfirmationModal(
                'Create New Projection?',
                'This will create a new projection for the selected month, copying all "recurring" expenses from other projections. Continue?',
                () => {
                    const { year, month } = App.state.currentProjection;
                    const key = `${year}-${String(month).padStart(2, '0')}`;

                    if (!App.state.projections[key]) {
                        App.state.projections[key] = { expenses: [] };
                    }

                    let recurringExpenses = [];
                    for (const projKey in App.state.projections) {
                        if (App.state.projections[projKey].expenses) {
                            recurringExpenses.push(...App.state.projections[projKey].expenses.filter(exp => exp.recurring));
                        }
                    }
                    
                    recurringExpenses.forEach(exp => {
                        if (!App.state.projections[key].expenses.some(e => e.description === exp.description)) {
                            App.state.projections[key].expenses.push({ ...exp, id: Date.now() + Math.random() });
                        }
                    });

                    App.db.save();
                    App.showToast('Projection created/updated with recurring expenses!');
                    Projections.renderProjectionsView(App);
                }
            );
        }

        // Show add forms
        if (e.target.id === 'show-add-projection-expense') {
            App.showModal('Add Projected Expense', `
                <form id="add-projection-expense-form">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium">Description</label>
                            <input type="text" id="proj-description" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Amount</label>
                            <input type="number" step="0.01" id="proj-amount" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Category</label>
                            <select id="proj-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions()}</select>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="proj-recurring" class="h-4 w-4 rounded">
                            <label for="proj-recurring" class="ml-2 text-sm">Mark as recurring</label>
                        </div>
                    </div>
                    <div class="flex justify-end mt-6">
                        <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Add Expense</button>
                    </div>
                </form>
            `);
        }

        // Handle deletions
        const deleteExpenseBtn = e.target.closest('.delete-projection-expense');
        if (deleteExpenseBtn) {
            App.showConfirmationModal('Delete Expense?', 'Are you sure you want to delete this projected expense?', () => {
                const id = deleteExpenseBtn.dataset.id;
                const { year, month } = App.state.currentProjection;
                const key = `${year}-${String(month).padStart(2, '0')}`;
                if (App.state.projections[key]) {
                    App.state.projections[key].expenses = App.state.projections[key].expenses.filter(exp => exp.id != id);
                    App.db.save();
                    App.showToast('Projected expense deleted.');
                    Projections.renderProjectionsView(App);
                }
            });
        }
    },

    handleSubmit(App, e) {
        if (e.target.id === 'add-projection-expense-form') {
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!App.state.projections[key]) {
                App.state.projections[key] = { expenses: [] };
            }
            App.state.projections[key].expenses.push({
                id: Date.now(),
                description: document.getElementById('proj-description').value,
                amount: parseFloat(document.getElementById('proj-amount').value),
                categoryId: document.getElementById('proj-category').value,
                recurring: document.getElementById('proj-recurring').checked
            });
            App.db.save();
            App.showToast('Projected expense added.');
            App.closeModal();
            Projections.renderProjectionsView(App);
        }
    },

    renderProjectionsView(App) {
        const { year, month } = App.state.currentProjection;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const projection = App.state.projections[key] || { expenses: [] };

        let totalBalance = 0;
        App.state.accounts.forEach(acc => totalBalance += App.getCalculatedAccountBalance(acc.id));

        const totalProjected = projection.expenses.reduce((sum, exp) => sum + exp.amount, 0);

        document.getElementById('projection-overview').innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-sm font-medium text-slate-500">Total Account Balance</h3>
                <p class="text-3xl font-bold mt-1">${App.formatCurrency(totalBalance)}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-sm font-medium text-slate-500">Total Projected Expenses</h3>
                <p class="text-3xl font-bold mt-1 text-red-500">${App.formatCurrency(totalProjected)}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-sm font-medium text-slate-500">Projected Difference</h3>
                <p class="text-3xl font-bold mt-1 ${totalBalance - totalProjected >= 0 ? 'text-green-500' : 'text-red-500'}">${App.formatCurrency(totalBalance - totalProjected)}</p>
            </div>
        `;

        document.getElementById('projected-expenses-list').innerHTML = projection.expenses.map(exp => `
            <li class="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                <div>
                    <p class="font-medium">${exp.description} ${exp.recurring ? '<i class="fas fa-sync-alt text-xs text-indigo-400 ml-1"></i>' : ''}</p>
                    <p class="text-sm text-slate-500">${App.getCategoryById(exp.categoryId).name}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="font-semibold">${App.formatCurrency(exp.amount)}</p>
                    <button data-id="${exp.id}" class="delete-projection-expense text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </li>
        `).join('') || '<p class="text-slate-500 p-2">No projected expenses for this month.</p>';
    }
};

