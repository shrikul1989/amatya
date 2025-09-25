export const Import = {
    // Internal state for the import process
    state: {
        fileData: [],
        headerRowIndex: -1,
        columnMap: {},
        profileId: null,
        dateFormat: 'dmy_4', // Default date format
    },

    template(App) {
        return `
            <div id="import-workflow">
                <!-- Step 1: File Upload -->
                <div id="import-step-1" class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Import Transactions</h3>
                    <p class="text-slate-500 mb-4">
                        You can import <strong>CSV</strong> or <strong>Excel (.xlsx, .xls)</strong> files. 
                        This tool allows you to map your file's columns to Amatya's fields just once per account.
                    </p>
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4" role="alert">
                        <p class="font-bold">Pro Tip</p>
                        <p>If you experience formatting issues with an Excel file, try opening it in your spreadsheet software and saving it as a <strong>CSV file</strong> first. CSV is the most reliable format for imports.</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <label for="statement-file-input" class="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                            <i class="fas fa-upload mr-2"></i> Choose File
                        </label>
                        <input type="file" id="statement-file-input" class="hidden" accept=".csv, .xlsx, .xls">
                        <select id="import-profile-select" class="bg-slate-50 border border-slate-300 rounded-md p-2">
                            <option value="">New Import Profile</option>
                            ${App.getImportProfileOptions()}
                        </select>
                    </div>
                     <p id="file-name-display" class="mt-4 text-sm text-slate-500"></p>
                </div>

                <!-- Subsequent steps will be rendered here -->
                <div id="import-step-container" class="mt-6"></div>
            </div>
        `;
    },

    postRender(App) {
        Import.resetLocalState();
    },

    handleChange(App, e) {
        if (e.target.id === 'statement-file-input' && e.target.files.length > 0) {
            Import.handleFileSelect(App, e.target.files[0]);
        }
        if (e.target.id === 'import-profile-select') {
            Import.state.profileId = e.target.value;
        }
        if (e.target.classList.contains('import-type-select')) {
            Import.toggleDestinationAccount(App, e.target);
        }
        // Show/hide date format selector in column mapping
        if (e.target.classList.contains('column-mapper')) {
            const container = e.target.closest('th').querySelector('.date-format-selector-container');
            if (e.target.value === 'date') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        }
    },
    
    handleClick(App, e) {
        const headerRow = e.target.closest('.header-row');
        if (headerRow) {
            Import.state.headerRowIndex = parseInt(headerRow.dataset.rowIndex);
            document.querySelectorAll('.header-row').forEach(row => row.classList.remove('selected'));
            headerRow.classList.add('selected');
        }
        
        if (e.target.id === 'confirm-header-btn') {
            Import.renderColumnMapping(App);
        }
        
        if (e.target.id === 'process-mapping-btn') {
            Import.processAndReview(App);
        }
        
        if (e.target.id === 'save-profile-btn') {
            Import.saveProfile(App);
        }
        
        if (e.target.id === 'import-final-btn') {
            Import.importTransactions(App);
        }
        
        const selectAllCheckbox = e.target.closest('#select-all-import');
        if(selectAllCheckbox) {
            document.querySelectorAll('.import-checkbox').forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        }
    },
    
    resetLocalState() {
        Import.state.fileData = [];
        Import.state.headerRowIndex = -1;
        Import.state.columnMap = {};
        Import.state.profileId = null;
        Import.state.dateFormat = 'dmy_4';
    },

    _parseDate(dateString, format) {
        if (dateString instanceof Date) {
            return dateString;
        }
        if (typeof dateString !== 'string') {
            return null;
        }

        let parts;
        switch (format) {
            case 'dmy_4': // DD/MM/YYYY
                parts = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
                if (parts) return new Date(parts[3], parts[2] - 1, parts[1]);
                break;
            case 'mdy_4': // MM/DD/YYYY
                parts = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
                if (parts) return new Date(parts[3], parts[1] - 1, parts[2]);
                break;
            case 'dmy_2': // DD/MM/YY
                parts = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
                if (parts) return new Date(parseInt(parts[3]) > 50 ? '19' + parts[3] : '20' + parts[3], parts[2] - 1, parts[1]);
                break;
            case 'mdy_2': // MM/DD/YY
                parts = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
                if (parts) return new Date(parseInt(parts[3]) > 50 ? '19' + parts[3] : '20' + parts[3], parts[1] - 1, parts[2]);
                break;
            case 'ymd_4': // YYYY-MM-DD
                return new Date(dateString); // Default parser handles this well
        }
        return new Date(dateString);
    },

    handleFileSelect(App, file) {
        document.getElementById('file-name-display').textContent = `Selected file: ${file.name}`;
        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                complete: (results) => {
                    Import._startImportWorkflow(App, results.data);
                }
            });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                Import._startImportWorkflow(App, jsonData);
            };
            reader.readAsArrayBuffer(file);
        } else {
            App.showToast('Unsupported file type. Please select a CSV or Excel file.', 'error');
        }
    },
    
    _startImportWorkflow(App, data) {
        Import.state.fileData = data;
        if (Import.state.profileId) {
            const profile = App.state.importProfiles.find(p => p.id == Import.state.profileId);
            if (profile) {
                Import.state.headerRowIndex = profile.headerRowIndex;
                Import.state.columnMap = profile.columnMap;
                Import.state.dateFormat = profile.dateFormat || 'dmy_4';
                Import.processAndReview(App);
            } else { // Profile might be deleted
                Import.renderHeaderSelection(App);
            }
        } else {
            Import.renderHeaderSelection(App);
        }
    },

    renderHeaderSelection(App) {
        const container = document.getElementById('import-step-container');
        const previewData = Import.state.fileData.slice(0, 30);
        const maxCols = previewData.reduce((max, row) => Math.max(max, row.length), 0);

        container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-2">Step 1: Select Header Row</h3>
                <p class="text-slate-500 mb-4">Click on the row below that contains your column titles (e.g., "Date", "Description"). Rows above it will be ignored.</p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left preview-table">
                        <tbody>
                            ${previewData.map((row, index) => `
                                <tr class="header-row" data-row-index="${index}">
                                          ${Array.from({ length: maxCols }, (_, i) => `<td>${row[i] instanceof Date ? row[i].toLocaleDateString('en-GB') : (row[i] || '')}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-end mt-4">
                    <button id="confirm-header-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Next: Map Columns</button>
                </div>
            </div>
        `;
    },
    
    renderColumnMapping(App) {
        if(Import.state.headerRowIndex === -1) {
            App.showToast("Please select a header row first.", "error");
            return;
        }
        const container = document.getElementById('import-step-container');
        const header = Import.state.fileData[Import.state.headerRowIndex];
        const previewData = Import.state.fileData.slice(Import.state.headerRowIndex + 1, Import.state.headerRowIndex + 6);
        const numCols = header.length;
        
        const mappingOptions = [
            { value: 'ignore', label: 'Ignore' },
            { value: 'date', label: 'Date' },
            { value: 'description', label: 'Description' },
            { value: 'debit', label: 'Debit (Outgoing)' },
            { value: 'credit', label: 'Credit (Incoming)' },
            { value: 'amount', label: 'Amount (Single Column +/-)' }
        ];

        container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-2">Step 2: Map Columns</h3>
                <p class="text-slate-500 mb-4">For each column from your file, select the matching field in Amatya.</p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left preview-table">
                         <thead>
                            <tr>
                                ${header.map((col, index) => `
                                    <th class="p-2">
                                        <p class="font-bold mb-1">${col || '(Unnamed Column)'}</p>
                                        <select class="column-mapper bg-slate-50 border border-slate-300 rounded-md p-1 w-full" data-col-index="${index}" data-is-date-col="false">
                                            ${mappingOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                                        </select>
                                        <div class="date-format-selector-container mt-1" style="display: none;">
                                            <select class="date-format-selector bg-slate-50 border border-slate-300 rounded-md p-1 w-full">
                                                <option value="dmy_4">DD/MM/YYYY</option>
                                                <option value="mdy_4">MM/DD/YYYY</option>
                                                <option value="dmy_2">DD/MM/YY</option>
                                                <option value="mdy_2">MM/DD/YY</option>
                                                <option value="ymd_4">YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                           ${previewData.map(row => `
                                <tr>
                                    ${Array.from({ length: numCols }, (_, i) => `<td class="p-2">${row[i] instanceof Date ? row[i].toLocaleDateString('en-GB') : (row[i] || '')}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                 <div class="flex justify-end mt-4">
                    <button id="process-mapping-btn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Next: Review Transactions</button>
                </div>
            </div>
        `;
    },
    
    processAndReview(App) {
        // Collect mapping from dropdowns if not already set
        if (Object.keys(Import.state.columnMap).length === 0) {
            document.querySelectorAll('.column-mapper').forEach(select => {
                Import.state.columnMap[select.dataset.colIndex] = select.value;
                // If this is the date column, find and save the selected format
                if (select.value === 'date') {
                    const formatSelector = select.closest('th').querySelector('.date-format-selector');
                    Import.state.dateFormat = formatSelector.value;
                }
            });
        }
        
        const dataRows = Import.state.fileData.slice(Import.state.headerRowIndex + 1);
        let parsedTransactions = [];
        
        dataRows.forEach(row => {
            let tx = {};
            for (const colIndex in Import.state.columnMap) {
                const field = Import.state.columnMap[colIndex];
                if(field !== 'ignore' && row[colIndex] !== undefined && row[colIndex] !== null) {
                    tx[field] = row[colIndex];
                }
            }

            // Validate and format
            const date = tx.date ? Import._parseDate(tx.date, Import.state.dateFormat) : null;
            let amount = 0;
            let type = 'expense';
            let description = tx.description ? String(tx.description).trim() : '';

            if (tx.amount) { // Single column amount
                const parsedAmount = parseFloat(String(tx.amount).replace(/[^0-9.-]+/g,""));
                if (parsedAmount < 0) {
                    type = 'expense';
                    amount = Math.abs(parsedAmount);
                } else {
                    type = 'income';
                    amount = parsedAmount;
                }
            } else { // Debit/Credit columns
                const debit = tx.debit ? parseFloat(String(tx.debit).replace(/[^0-9.-]+/g,"")) : 0;
                const credit = tx.credit ? parseFloat(String(tx.credit).replace(/[^0-9.-]+/g,"")) : 0;
                if(debit > 0) {
                    type = 'expense';
                    amount = debit;
                } else if (credit > 0) {
                    type = 'income';
                    amount = credit;
                }
            }
            
            if (date && !isNaN(date) && amount > 0 && description) {
                parsedTransactions.push({
                    id: Date.now() + Math.random(),
                    date: date.toISOString(),
                    description: description,
                    amount,
                    type,
                });
            }
        });
        
        Import.renderReview(App, parsedTransactions);
    },
    
    renderReview(App, transactions) {
         const container = document.getElementById('import-step-container');
         container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold mb-2">Step 3: Review & Finalize</h3>
                <p class="text-slate-500 mb-4">Set the source account and adjust individual transactions as needed before importing.</p>
                
                <div class="mb-4">
                    <label for="import-account-select" class="block font-medium mb-1">Set Source Account for all transactions:</label>
                    <select id="import-account-select" class="bg-slate-50 border border-slate-300 rounded-md p-2">
                        ${App.getAccountOptions()}
                    </select>
                </div>
                
                <div class="h-96 overflow-y-auto border rounded-md">
                     <table id="review-table" class="w-full text-sm text-left">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="p-2"><input type="checkbox" id="select-all-import" checked></th>
                                <th class="p-2">Date</th>
                                <th class="p-2 w-1/4">Description</th>
                                <th class="p-2">Type</th>
                                <th class="p-2">Category / To Account</th>
                                <th class="p-2">Recurring</th>
                                <th class="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(tx => `
                                <tr data-transaction='${JSON.stringify(tx)}'>
                                    <td class="p-2"><input type="checkbox" class="import-checkbox" checked></td>
                                    <td class="p-2">${new Date(tx.date).toLocaleDateString('en-GB')}</td>
                                    <td class="p-2">${tx.description}</td>
                                    <td class="p-2">
                                        <select class="import-type-select bg-slate-50 border border-slate-300 rounded-md p-1 w-full">
                                            <option value="income" ${tx.type === 'income' ? 'selected' : ''}>Income</option>
                                            <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>Expense</option>
                                            <option value="transfer">Transfer</option>
                                        </select>
                                    </td>
                                    <td class="p-2 destination-cell">
                                        <select class="import-category-select bg-slate-50 border border-slate-300 rounded-md p-1 w-full">
                                            ${App.getCategoryOptions()}
                                        </select>
                                    </td>
                                    <td class="p-2 text-center">
                                        <input type="checkbox" class="import-recurring-checkbox h-4 w-4">
                                    </td>
                                    <td class="p-2 text-right">${App.formatCurrency(tx.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-between items-center mt-4">
                    ${!Import.state.profileId ? `<button id="save-profile-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save Profile & Import</button>` : ''}
                    <button id="import-final-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-auto">Import Transactions</button>
                </div>
            </div>
         `;
    },

    toggleDestinationAccount(App, selectElement) {
        const row = selectElement.closest('tr');
        const destinationCell = row.querySelector('.destination-cell');
        
        if (selectElement.value === 'transfer') {
            destinationCell.innerHTML = `
                <select class="import-destination-select bg-slate-50 border border-slate-300 rounded-md p-1 w-full">
                    ${App.getAccountOptions()}
                </select>
            `;
        } else {
            destinationCell.innerHTML = `
                <select class="import-category-select bg-slate-50 border border-slate-300 rounded-md p-1 w-full">
                    ${App.getCategoryOptions()}
                </select>
            `;
        }
    },
    
    saveProfile(App) {
        const profileName = prompt("Enter a name for this import profile (e.g., 'HDFC Savings'):");
        if (profileName) {
            App.state.importProfiles.push({
                id: Date.now(),
                name: profileName,
                headerRowIndex: Import.state.headerRowIndex,
                columnMap: Import.state.columnMap,
                dateFormat: Import.state.dateFormat
            });
            App.db.save();
            App.showToast("Import profile saved!");
            Import.importTransactions(App);
        }
    },
    
    importTransactions(App) {
        const sourceAccountId = document.getElementById('import-account-select').value;
        const rowsToImport = document.querySelectorAll('#review-table tbody tr');
        let importCount = 0;
        
        rowsToImport.forEach(row => {
            if (row.querySelector('.import-checkbox').checked) {
                const txData = JSON.parse(row.dataset.transaction);
                const type = row.querySelector('.import-type-select').value;
                
                let finalTx = {
                    id: txData.id,
                    date: txData.date,
                    description: txData.description,
                    amount: txData.amount,
                    type: type,
                    accountId: sourceAccountId
                };

                if(type === 'transfer') {
                    const destinationSelect = row.querySelector('.import-destination-select');
                    if(destinationSelect) {
                        finalTx.destinationAccountId = destinationSelect.value;
                    }
                } else {
                    const categorySelect = row.querySelector('.import-category-select');
                    const recurringCheckbox = row.querySelector('.import-recurring-checkbox');
                    if (categorySelect) {
                        finalTx.categoryId = categorySelect.value;
                    }
                    if (recurringCheckbox) {
                        finalTx.recurring = recurringCheckbox.checked;
                    }
                }
                
                App.state.transactions.push(finalTx);
                importCount++;
            }
        });

        App.db.save();
        App.showToast(`${importCount} transactions imported successfully.`);
        App.navigateTo('transactions');
    }
};
