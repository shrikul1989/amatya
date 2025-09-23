export const Categories = {
    // A curated list of common icons for categories
    iconList: [
        'fas fa-shopping-cart', 'fas fa-utensils', 'fas fa-home', 'fas fa-file-invoice-dollar',
        'fas fa-bolt', 'fas fa-tshirt', 'fas fa-plane', 'fas fa-heartbeat', 'fas fa-film',
        'fas fa-sync-alt', 'fas fa-graduation-cap', 'fas fa-briefcase', 'fas fa-gas-pump',
        'fas fa-car', 'fas fa-gift', 'fas fa-pills', 'fas fa-paw', 'fas fa-train',
        'fas fa-question-circle', 'fas fa-tag', 'fas fa-bus', 'fas fa-mobile-alt',
        'fas fa-wifi', 'fas fa-child', 'fas fa-spa'
    ],

    template(App) {
        return `
            <p class="text-slate-500 mb-6">Create and manage your spending categories.</p>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold">Your Categories</h3>
                    <button id="show-add-category" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Add Category</button>
                </div>
                <div id="categories-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                </div>
            </div>
        `;
    },

    postRender(App) {
        Categories.renderCategoriesView(App);
    },

    handleClick(App, e) {
        if (e.target.id === 'show-add-category' || e.target.closest('.edit-category')) {
            const catId = e.target.closest('.edit-category')?.dataset.id;
            const category = App.state.categories.find(c => c.id == catId);
            Categories.showAddEditCategoryModal(App, category);
        }
        
        if(e.target.closest('.delete-category')) {
            App.showConfirmationModal(
                'Delete Category?', 
                'Are you sure? Deleting this category will mark all associated transactions as "Uncategorized".', 
                () => {
                    const catId = e.target.closest('.delete-category').dataset.id;
                    App.state.categories = App.state.categories.filter(c => c.id != catId);
                    App.db.save();
                    App.showToast('Category deleted.');
                    Categories.renderCategoriesView(App);
                }
            );
        }
    },

    handleSubmit(App, e) {
        if (e.target.id === 'category-form') {
            const id = e.target.dataset.id;
            const catData = {
                name: document.getElementById('cat-name').value,
                color: document.getElementById('cat-color').value,
                icon: document.getElementById('cat-icon').value,
            };

            if(id) { // Edit
                const index = App.state.categories.findIndex(c => c.id == id);
                if(index > -1) App.state.categories[index] = {...App.state.categories[index], ...catData, id: parseInt(id)};
                App.showToast('Category updated!');
            } else { // Add
                App.state.categories.push({id: Date.now(), ...catData});
                App.showToast('Category added!');
            }
            App.db.save();
            App.closeModal();
            Categories.renderCategoriesView(App);
        }
    },

    renderCategoriesView(App) {
        const list = document.getElementById('categories-list');
        if (list) {
            list.innerHTML = App.state.categories.map(cat => `
                <div class="p-4 rounded-lg flex justify-between items-center shadow" style="background-color:${cat.color}22">
                    <div class="flex items-center gap-3">
                        <i class="${cat.icon || 'fas fa-tag'} text-xl" style="color: ${cat.color}"></i>
                        <span class="font-semibold">${cat.name}</span>
                    </div>
                    <div class="flex gap-2">
                        <button data-id="${cat.id}" class="edit-category text-slate-400 hover:text-indigo-500"><i class="fas fa-pencil-alt"></i></button>
                        <button data-id="${cat.id}" class="delete-category text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
    },

    showAddEditCategoryModal(App, category = null) {
        const isEdit = category !== null;
        const defaultIcon = 'fas fa-tag';
        App.showModal(isEdit ? 'Edit Category' : 'Add Category', `
            <form id="category-form" data-id="${isEdit ? category.id : ''}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">Name</label>
                        <input type="text" id="cat-name" required value="${isEdit ? category.name : ''}" class="mt-1 w-full bg-slate-50 border rounded-md p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Color</label>
                        <input type="color" id="cat-color" required value="${isEdit ? category.color : '#4f46e5'}" class="mt-1 w-full h-10 bg-slate-50 border rounded-md p-1">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Icon</label>
                        <div id="icon-picker" class="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-1 p-2 border rounded-md h-32 overflow-y-auto">
                            ${this.iconList.map(iconClass => {
                                const selectedClass = isEdit && category.icon === iconClass ? 'bg-indigo-200' : 'bg-slate-100';
                                return `
                                <button type="button" class="icon-option p-2 rounded-md flex items-center justify-center text-xl hover:bg-slate-200 ${selectedClass}" data-icon-class="${iconClass}">
                                    <i class="${iconClass}"></i>
                                </button>
                                `
                            }).join('')}
                        </div>
                        <input type="hidden" id="cat-icon" value="${isEdit ? category.icon : defaultIcon}">
                    </div>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg">${isEdit ? 'Save Changes' : 'Add Category'}</button>
                </div>
            </form>
        `);

        // Add event listener for the icon picker
        const iconPicker = document.getElementById('icon-picker');
        const iconInput = document.getElementById('cat-icon');

        iconPicker.addEventListener('click', e => {
            const button = e.target.closest('.icon-option');
            if (button) {
                // Remove selected state from all buttons
                iconPicker.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('bg-indigo-200'));
                // Add selected state to the clicked button
                button.classList.add('bg-indigo-200');
                // Update the hidden input value
                iconInput.value = button.dataset.iconClass;
            }
        });
    }
};

