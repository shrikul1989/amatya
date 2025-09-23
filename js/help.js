export const Help = {
    template(App) {
        return `
            <div class="space-y-6 text-slate-700">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-2xl font-bold mb-4">Welcome to Amatya!</h2>
                    <p class="mb-2">
                        Amatya is a <strong>100% private personal finance manager</strong> designed with your security in mind.
                    </p>
                    <p>
                        All the financial data you enter—every transaction, account balance, and category—is stored exclusively on your own computer within your web browser's secure local storage. Nothing is ever sent over the internet, and we never see or have access to your information.
                    </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">How to Get Started</h3>
                    <ol class="list-decimal list-inside space-y-3">
                        <li>
                            <strong>Add Your Accounts:</strong> Go to the <i class="fas fa-cog"></i> <strong>Settings</strong> page. In the "Accounts & Credit Cards" section, add all your sources of money, like your savings account, checking account, or credit cards. Be sure to set the correct "Initial Balance" for each.
                        </li>
                        <li>
                            <strong>Customize Categories:</strong> Visit the <i class="fas fa-tags"></i> <strong>Categories</strong> page. You can delete the default categories or add new ones that match your spending habits. Choosing a unique icon and color for each category makes the charts easier to read!
                        </li>
                        <li>
                            <strong>Add Your First Transaction:</strong> Go to the <i class="fas fa-exchange-alt"></i> <strong>Transactions</strong> page and click "+ Add Transaction" to manually enter your first income or expense.
                        </li>
                    </ol>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">How to Use the Import Feature</h3>
                    <p class="mb-3">
                        The <i class="fas fa-file-import"></i> <strong>Import</strong> page is the most powerful tool in Amatya. It lets you teach the app how to read statement files (CSV or Excel) from your bank. You only have to do this once for each account.
                    </p>
                    <ol class="list-decimal list-inside space-y-3">
                        <li>
                            <strong>Upload Your File:</strong> Download a statement from your bank's website (CSV is best!) and upload it.
                        </li>
                        <li>
                            <strong>Select the Header Row:</strong> Click on the row in the preview that has your column titles (like 'Date', 'Description'). This tells Amatya to ignore any extra information at the top of the file.
                        </li>
                        <li>
                            <strong>Map the Columns:</strong> For each column from your file, use the dropdown to select the matching field (e.g., tell Amatya which column is 'Debit' and 'Credit').
                        </li>
                         <li>
                            <strong>Save the Profile:</strong> Give your mapping a name (e.g., "HDFC Savings Account"). The next time you upload a file, you can just select this profile to skip the mapping steps!
                        </li>
                        <li>
                            <strong>Review and Finalize:</strong> On the final screen, you can assign categories, mark transactions as recurring, and classify transfers before saving them to your records.
                        </li>
                    </ol>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Planning Your Budget with Projections</h3>
                    <p class="mb-3">
                        The <i class="fas fa-chart-line"></i> <strong>Projections</strong> page is where you can plan your budget for upcoming months.
                    </p>
                    <ol class="list-decimal list-inside space-y-3">
                        <li>
                            <strong>Select a Month:</strong> Use the dropdown menus at the top to choose the Year and Month you want to plan for.
                        </li>
                        <li>
                            <strong>Copy Recurring Bills:</strong> Click the "Create New/Copy" button. Amatya will automatically find all expenses you've marked as "recurring" in other projections (like rent or subscriptions) and add them to the new month's plan.
                        </li>
                        <li>
                            <strong>Add One-Time Expenses:</strong> Click the "+ Add Expense" button to add any other expenses you anticipate for that month, such as a planned trip or a doctor's visit.
                        </li>
                        <li>
                            <strong>Review Your Plan:</strong> The overview at the top shows your total projected expenses for the month and compares it against your current account balance, so you know exactly where you stand.
                        </li>
                    </ol>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Understanding Analytics</h3>
                    <p class="mb-3">
                        The <i class="fas fa-chart-pie"></i> <strong>Analytics</strong> page helps you visualize your financial habits. Use the filters at the top to select a date range (like "Last 3 Months") and see charts that break down:
                    </p>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Your income vs. your expenses over time.</li>
                        <li>How your spending in a specific category (like 'Groceries') changes from month to month.</li>
                        <li>Which of your accounts you spend the most from.</li>
                        <li>How much of your spending is on recurring bills vs. one-time purchases.</li>
                    </ul>
                </div>
                
                 <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Important: Backing Up Your Data</h3>
                    <p class="mb-3">
                        Because all your data is stored locally, it is <strong>very important</strong> to back it up regularly.
                    </p>
                    <p>
                        Go to the <i class="fas fa-cog"></i> <strong>Settings</strong> page and click the <strong>"Export Data"</strong> button. This will save a single JSON file containing all your information. Store this file in a safe place. If you ever switch computers or clear your browser data, you can use the "Import Data" button to restore everything.
                    </p>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Open Source & Transparency</h3>
                    <p class="mb-3">
                        Amatya is a free and open-source project. We believe in full transparency, which is why the complete source code is available for you to inspect, audit, and contribute to.
                    </p>
                    <p>
                        You can find the public repository on GitHub:
                        <a href="https://github.com/shrikul1989/amatya" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">
                            https://github.com/shrikul1989/amatya
                        </a>
                    </p>
                </div>

            </div>
        `;
    }
};

