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
            
            <div id="projection-overview" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Overview content here -->
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h4 class="text-xl font-semibold mb-4">Projected Expenses</h4>
                <button id="show-add-projection-expense" class="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 mb-4">+ Add Expense</button>
                <ul id="projected-expenses-list" class="space-y-2 h-96 overflow-y-auto"></ul>
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
            Projections.showAddEditExpenseModal(App);
        }
        
        // Show edit form
        const editExpenseBtn = e.target.closest('.edit-projection-expense');
        if (editExpenseBtn) {
            const expenseId = editExpenseBtn.dataset.id;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const expense = App.state.projections[key]?.expenses.find(exp => exp.id == expenseId);
            if (expense) Projections.showAddEditExpenseModal(App, expense);
        }

        // Show mark as paid modal
        const markPaidBtn = e.target.closest('.mark-paid-expense');
        if (markPaidBtn) {
            const expenseId = markPaidBtn.dataset.id;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const expense = App.state.projections[key]?.expenses.find(exp => exp.id == expenseId);
            if (expense) Projections.showMarkAsPaidOptionsModal(App, expense);
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

        // Handle "Mark as Paid" options
        const paidOptionBtn = e.target.closest('.paid-option-btn');
        if (paidOptionBtn) {
            const expenseId = paidOptionBtn.dataset.expenseId;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const expense = App.state.projections[key]?.expenses.find(exp => exp.id == expenseId);

            if (expense) {
                const action = paidOptionBtn.dataset.action;
                if (action === 'transaction') {
                    App.closeModal(); // Close the options modal first
                    Projections.showCreateTransactionFromProjectionModal(App, expense);
                } else if (action === 'transfer') {
                    App.closeModal(); // Close the options modal first
                    Projections.showCreateTransferFromProjectionModal(App, expense);
                } else if (action === 'just_mark') {
                    // Don't close the modal, let the confirmation modal handle it
                    App.showConfirmationModal(
                        'Mark as Paid?',
                        'Are you sure you want to mark this expense as paid without creating a transaction?',
                        () => {
                            expense.paid = true;
                            App.db.save();
                            App.showToast('Expense marked as paid.');
                            Projections.renderProjectionsView(App);
                        }
                    );
                }
            }
        }
    },

    handleSubmit(App, e) {
        if (e.target.id === 'projection-expense-form') {
            const id = e.target.dataset.id;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            
            if (!App.state.projections[key]) {
                App.state.projections[key] = { expenses: [] };
            }

            const expenseData = {
                description: document.getElementById('proj-description').value,
                amount: parseFloat(document.getElementById('proj-amount').value),
                categoryId: document.getElementById('proj-category').value,
                recurring: document.getElementById('proj-recurring').checked
            };

            if (id) { // Editing
                const index = App.state.projections[key].expenses.findIndex(exp => exp.id == id);
                if (index > -1) {
                    App.state.projections[key].expenses[index] = { ...App.state.projections[key].expenses[index], ...expenseData };
                }
                App.showToast('Projected expense updated.');
            } else { // Adding
                App.state.projections[key].expenses.push({ id: Date.now(), ...expenseData });
                App.showToast('Projected expense added.');
            }

            App.db.save();
            App.closeModal();
            Projections.renderProjectionsView(App);
        }

        if (e.target.id === 'mark-as-paid-form') {
            const expenseId = e.target.dataset.expenseId;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;

            // 1. Add the transaction
            App.state.transactions.push({
                id: Date.now(),
                type: 'expense',
                amount: parseFloat(document.getElementById('paid-amount').value),
                categoryId: document.getElementById('paid-category').value,
                accountId: document.getElementById('paid-account').value,
                date: new Date(document.getElementById('paid-date').value).toISOString(),
                description: document.getElementById('paid-description').value,
                recurring: false // This is a one-time transaction from a projection
            });

            // 2. Mark the projected expense as paid
            const projExpense = App.state.projections[key]?.expenses.find(exp => exp.id == expenseId);
            if (projExpense) projExpense.paid = true;

            App.db.save();
            App.showToast('Transaction added and expense marked as paid!');
            App.closeModal();
            Projections.renderProjectionsView(App);
        }

        if (e.target.id === 'mark-as-transfer-form') {
            const expenseId = e.target.dataset.expenseId;
            const { year, month } = App.state.currentProjection;
            const key = `${year}-${String(month).padStart(2, '0')}`;

            // 1. Add the transfer transaction
            App.state.transactions.push({
                id: Date.now(),
                type: 'transfer',
                amount: parseFloat(document.getElementById('transfer-amount').value),
                accountId: document.getElementById('transfer-from').value,
                destinationAccountId: document.getElementById('transfer-to').value,
                date: new Date(document.getElementById('transfer-date').value).toISOString(),
                description: document.getElementById('transfer-description').value,
                categoryId: document.getElementById('transfer-category').value
            });

            // 2. Mark the projected expense as paid
            const projExpense = App.state.projections[key]?.expenses.find(exp => exp.id == expenseId);
            if (projExpense) projExpense.paid = true;

            App.db.save();
            App.showToast('Transfer recorded and expense marked as paid!');
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
        const totalPaid = projection.expenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
        const totalUnpaid = totalProjected - totalPaid;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const isPast = year < currentYear || (year === currentYear && month < currentMonth);

        document.getElementById('projection-overview').innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-sm font-medium text-slate-500">Combined Account balance as of today</h3>
                <p class="text-3xl font-bold mt-1">${App.formatCurrency(totalBalance)}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-sm font-medium text-slate-500">Projected Expenses for month</h3>
                <p class="text-3xl font-bold mt-1 text-red-500">${App.formatCurrency(totalProjected)}</p>
                <div class="text-xs mt-2 space-y-1">
                    <p class="flex justify-between"><span>Paid:</span> <span class="font-medium text-green-600">${App.formatCurrency(totalPaid)}</span></p>
                    <p class="flex justify-between"><span>Unpaid:</span> <span class="font-medium text-orange-600">${App.formatCurrency(totalUnpaid)}</span></p>
                </div>
            </div>
            ${!isPast ? `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-sm font-medium text-slate-500">Projected Difference</h3>
                    <p class="text-3xl font-bold mt-1 ${totalBalance - totalProjected >= 0 ? 'text-green-500' : 'text-red-500'}">${App.formatCurrency(totalBalance - totalProjected)}</p>
                </div>
            ` : ''}
        `;

        document.getElementById('projected-expenses-list').innerHTML = projection.expenses.map(exp => `
            <li class="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 ${exp.paid ? 'opacity-60' : ''}">
                <div>
                    <p class="font-medium ${exp.paid ? 'line-through' : ''}">${exp.description} ${exp.recurring ? '<i class="fas fa-sync-alt text-xs text-indigo-400 ml-1"></i>' : ''}</p>
                    <p class="text-sm text-slate-500">${App.getCategoryById(exp.categoryId).name}</p>
                </div>
                <div class="flex items-center gap-2">
                    <p class="font-semibold mr-2">${App.formatCurrency(exp.amount)}</p>
                    ${exp.paid 
                        ? '<span class="text-xs font-bold text-green-500 px-2 py-1 bg-green-100 rounded-full">PAID</span>'
                        : `<button data-id="${exp.id}" class="mark-paid-expense text-slate-400 hover:text-green-500" title="Mark as Paid"><i class="fas fa-check-circle"></i></button>`
                    }
                    <button data-id="${exp.id}" class="edit-projection-expense text-slate-400 hover:text-indigo-500" ${exp.paid ? 'disabled' : ''}>
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button data-id="${exp.id}" class="delete-projection-expense text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </li>
        `).join('') || '<p class="text-slate-500 p-2">No projected expenses for this month.</p>';
    },

    showAddEditExpenseModal(App, expense = null) {
        const isEdit = expense !== null;
        App.showModal(isEdit ? 'Edit Projected Expense' : 'Add Projected Expense', `
            <form id="projection-expense-form" data-id="${isEdit ? expense.id : ''}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">Description</label>
                        <input type="text" id="proj-description" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${isEdit ? expense.description : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Amount</label>
                        <input type="number" step="0.01" id="proj-amount" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${isEdit ? expense.amount : ''}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Category</label>
                        <select id="proj-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions(isEdit ? expense.categoryId : null)}</select>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="proj-recurring" class="h-4 w-4 rounded" ${isEdit && expense.recurring ? 'checked' : ''}>
                        <label for="proj-recurring" class="ml-2 text-sm">Mark as recurring</label>
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">${isEdit ? 'Save Changes' : 'Add Expense'}</button>
                </div>
            </form>
        `);
    },

    showMarkAsPaidOptionsModal(App, expense) {
        App.showModal('Mark Expense as Paid', `
            <p class="text-slate-600 mb-4">How would you like to proceed with "<b>${expense.description}</b>"?</p>
            <div class="flex flex-col space-y-3">
                <button data-expense-id="${expense.id}" data-action="transaction" class="paid-option-btn w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-lg">
                    <p class="font-semibold">Create an Expense Transaction</p>
                    <p class="text-sm text-slate-500">Add a new expense to your transaction history.</p>
                </button>
                <button data-expense-id="${expense.id}" data-action="transfer" class="paid-option-btn w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-lg">
                    <p class="font-semibold">Record as a Self Transfer</p>
                    <p class="text-sm text-slate-500">Useful for credit card payments or moving money between accounts.</p>
                </button>
                <button data-expense-id="${expense.id}" data-action="just_mark" class="paid-option-btn w-full text-left p-3 bg-slate-100 hover:bg-slate-200 rounded-lg">
                    <p class="font-semibold">Just Mark as Paid</p>
                    <p class="text-sm text-slate-500">Update the budget without creating a transaction.</p>
                </button>
            </div>
        `);
    },

    showCreateTransactionFromProjectionModal(App, expense) {
        App.showModal('Mark as Paid & Add Transaction', `
            <form id="mark-as-paid-form" data-expense-id="${expense.id}">
                <p class="text-sm text-slate-600 mb-4">This will add a new transaction and mark the projected expense as paid.</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">Description</label>
                        <input type="text" id="paid-description" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${expense.description}">
                    </div>
                     <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium">Amount</label>
                            <input type="number" step="0.01" id="paid-amount" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${expense.amount}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Date</label>
                            <input type="date" id="paid-date" required value="${new Date().toISOString().split('T')[0]}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Category</label>
                        <select id="paid-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions(expense.categoryId)}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Paid From Account</label>
                        <select id="paid-account" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions()}</select>
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add Transaction</button>
                </div>
            </form>
        `);
    },

    showCreateTransferFromProjectionModal(App, expense) {
        App.showModal('Record as Transfer & Mark Paid', `
            <form id="mark-as-transfer-form" data-expense-id="${expense.id}">
                <p class="text-sm text-slate-600 mb-4">This will add a new self transfer and mark the projected expense as paid.</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">Description</label>
                        <input type="text" id="transfer-description" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${expense.description}">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium">Amount</label>
                            <input type="number" step="0.01" id="transfer-amount" required class="mt-1 w-full bg-slate-50 border rounded-md p-2" value="${expense.amount}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Date</label>
                            <input type="date" id="transfer-date" required value="${new Date().toISOString().split('T')[0]}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">From Account</label>
                        <select id="transfer-from" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions()}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">To Account</label>
                        <select id="transfer-to" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getAccountOptions()}</select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Category</label>
                        <select id="transfer-category" required class="mt-1 w-full bg-slate-50 border rounded-md p-2">${App.getCategoryOptions(expense.categoryId)}</select>
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Record Transfer</button>
                </div>
            </form>
        `);
    }
};
