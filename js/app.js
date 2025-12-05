// Personal Finance Planner - Main Application JavaScript

// Application State
class AppState {
    constructor() {
        this.currentPage = 'dashboard';
        this.darkMode = this.getDarkModeFromStorage();
        this.budgetData = this.getBudgetDataFromStorage();
        this.userPoints = this.getUserPointsFromStorage();
        this.monthsNoShoppingEntertainment = 0; // Track months with no shopping/entertainment expenses
        this.userId = null; // Will be set from session
        // Categories loaded from API
        this.availableCategories = [];
        this.categoryIconByName = {};
        this._categoriesPromise = null;
        this._defaultCategories = [
            { id: '1', name: 'Housing', icon: '🏠' },
            { id: '2', name: 'Food', icon: '🍔' },
            { id: '3', name: 'Transport', icon: '🚗' },
            { id: '4', name: 'Entertainment', icon: '🎮' },
            { id: '5', name: 'Healthcare', icon: '🏥' },
            { id: '6', name: 'Shopping', icon: '🛒' },
            { id: '7', name: 'Utilities', icon: '⚡' },
            { id: '8', name: 'Education', icon: '📚' },
            { id: '9', name: 'Travel', icon: '✈️' },
            { id: '10', name: 'Other', icon: '📦' }
        ];
        this.aiSelectedCategories = new Set();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyDarkMode();

        // Start with empty dashboard first, then load data
        this.updateDashboard();

        // Load data without showing loading overlay initially
        this.loadInitialData();
    }

    setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }

        // Dropdown menu toggle
        const dropdownToggle = document.getElementById('navDropdownToggle');
        const dropdownMenu = document.getElementById('navDropdownMenu');

        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
                dropdownToggle.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                    dropdownToggle.classList.remove('active');
                }
            });

            // Close dropdown when clicking a nav item
            const dropdownNavItems = dropdownMenu.querySelectorAll('.nav-item');
            dropdownNavItems.forEach(item => {
                item.addEventListener('click', () => {
                    dropdownMenu.classList.remove('show');
                    dropdownToggle.classList.remove('active');
                });
            });
        }

        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // PDF download
        const downloadBtn = document.getElementById('downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPDF());
        }
    }

    getDarkModeFromStorage() {
        const stored = localStorage.getItem('darkMode');
        return stored ? JSON.parse(stored) : false;
    }

    getBudgetDataFromStorage() {
        // Return empty structure - data will be loaded from database
        return {
            income: 0,
            incomeHistory: [],
            expenses: [],
            savingsGoal: 0,
            duration: 'monthly'
        };
    }

    getUserPointsFromStorage() {
        // Return empty structure - data will be loaded from database
        return {
            total: 0,
            badges: [],
            monthsUnderBudget: 0
        };
    }

    async loadIncomeHistory() {
        try {
            const response = await fetch(`./php/api.php?action=getIncomeHistory&userId=${this.userId}`);
            const data = await response.json();

            if (data.success) {
                this.budgetData.incomeHistory = data.data;
                this.updateIncomeHistoryUI();
            }
        } catch (error) {
            console.error('Error loading income history:', error);
        }
    }

    updateIncomeHistoryUI() {
        const incomeHistoryContainer = document.getElementById('incomeHistory');
        if (!incomeHistoryContainer) return;

        incomeHistoryContainer.innerHTML = '';

        this.budgetData.incomeHistory.forEach(income => {
            const card = document.createElement('div');
            card.className = 'income-card bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg shadow mb-4';

            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold">${income.name}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300">${new Date(income.date_added).toLocaleDateString()}</p>
                    </div>
                    <div class="text-xl font-bold">$${income.amount.toFixed(2)}</div>
                </div>
                ${income.is_recurring ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">Recurring</span>' : ''}
            `;

            incomeHistoryContainer.appendChild(card);
        });
    }

    async saveBudgetDataToDatabase() {
        // Save to database instead of localStorage
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateBudgetData',
                    userId: this.userId,
                    budgetData: this.budgetData
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save budget data:', result.error);
            }
        } catch (error) {
            console.error('Error saving budget data:', error);
        }
    }

    async saveUserPointsToDatabase() {
        // Save to database instead of localStorage
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateUserPoints',
                    userId: this.userId,
                    points: this.userPoints
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save user points:', result.error);
            }
        } catch (error) {
            console.error('Error saving user points:', error);
        }
    }

    saveDarkModeToStorage() {
        localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.applyDarkMode();
        this.saveDarkModeToStorage();
    }

    applyDarkMode() {
        const body = document.body;
        const moonIcon = document.querySelector('.icon-moon');
        const sunIcon = document.querySelector('.icon-sun');

        if (this.darkMode) {
            body.classList.add('dark');
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            body.classList.remove('dark');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
        }

        // Re-render category cards if on AI planner page to update theme
        if (this.currentPage === 'smart-planner') {
            this.renderPlannerCategories();
        }
    }

    navigateToPage(page) {
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Hide all pages
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(p => p.classList.remove('active'));

        // Show selected page
        const selectedPage = document.getElementById(`${page}-page`);
        if (selectedPage) {
            selectedPage.classList.add('active');
            this.currentPage = page;

            // Show Spline landing hero only on the landing (dashboard) view
            const hero = document.getElementById('landing-hero');
            if (hero) {
                hero.style.display = page === 'dashboard' ? 'block' : 'none';
            }

            // Optional: scroll to top when navigating
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Load page content if needed
            this.loadPageContent(page);
        }
    }

    async loadPageContent(page) {
        const pageElement = document.getElementById(`${page}-page`);
        if (!pageElement) return;

        // Force regenerate rewards page to show new design
        if (page === 'rewards') {
            this.showLoading();
            this.generatePageContent(page);
            this.hideLoading();
        } else if (pageElement.innerHTML.trim() === '') {
            // Directly generate content client-side to avoid 404s for missing static pages
            this.showLoading();
            this.generatePageContent(page);
            this.hideLoading();
        } else {
            // Page already loaded, just refresh data
            this.refreshPageData(page);
        }
    }

    generatePageContent(page) {
        const pageElement = document.getElementById(`${page}-page`);
        if (!pageElement) return;

        switch (page) {
            case 'add-expense':
                pageElement.innerHTML = this.generateAddExpenseContent();
                break;
            case 'smart-planner':
                pageElement.innerHTML = this.generateSmartPlannerContent();
                break;
            case 'smart-plan':
                pageElement.innerHTML = this.generateSmartPlanContent();
                break;
            case 'rewards':
                pageElement.innerHTML = this.generateRewardsContent();
                break;
            case 'feedback':
                pageElement.innerHTML = this.generateFeedbackContent();
                break;
            case 'settings':
                pageElement.innerHTML = this.generateSettingsContent();
                break;
            default:
                pageElement.innerHTML = '<p>Page not found</p>';
        }

        this.initPageFunctionality(page);
    }

    initPageFunctionality(page) {
        switch (page) {
            case 'add-expense':
                this.initAddExpensePage();
                break;
            case 'smart-planner':
                this.initSmartPlannerPage();
                break;
            case 'smart-plan':
                this.initSmartPlanPage();
                break;
            case 'rewards':
                this.initRewardsPage();
                break;
            case 'feedback':
                this.initFeedbackPage();
                break;
            case 'settings':
                this.initSettingsPage();
                break;
        }

        // Re-initialize Lucide icons for new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    refreshPageData(page) {
        switch (page) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'smart-plan':
                this.updateSmartPlan();
                break;
            case 'rewards':
                this.updateRewards();
                break;
        }
    }

    async loadInitialData() {
        await this.loadIncomeHistory();

        // Don't show loading overlay on initial load

        try {
            // First, get the user ID from session
            const sessionResponse = await fetch('./php/check_session.php');
            const sessionData = await sessionResponse.json();

            if (!sessionData.logged_in) {
                window.location.href = 'login.html';
                return;
            }

            this.userId = sessionData.user_id;

            // Load budget data
            const budgetResponse = await fetch(`./php/api.php?action=getBudgetData&userId=${this.userId}`);

            if (budgetResponse.ok) {
                const budgetData = await budgetResponse.json();

                if (budgetData.success) {
                    this.budgetData = budgetData.data;
                } else {
                    console.error('Budget data API error:', budgetData.error);
                    this.showToast('Error loading budget data: ' + budgetData.error, 'error');
                }
            } else {
                console.error('Budget response not OK:', budgetResponse.status, budgetResponse.statusText);
                const errorText = await budgetResponse.text();
                console.error('Error response:', errorText);
                this.showToast('Server error loading budget data', 'error');
            }

            // Load categories for Add Expense and AI Planner (don't spam fetch on startup)
            if (!this.availableCategories.length) {
                await this.loadCategories();
            }

            // Load user points and badges (badges will trigger automatic badge checking)
            const pointsResponse = await fetch(`./php/api.php?action=getUserPoints&userId=${this.userId}`);

            if (pointsResponse.ok) {
                const pointsData = await pointsResponse.json();

                if (pointsData.success) {
                    this.userPoints.total = pointsData.data.total_points || 0;
                    this.userPoints.monthsUnderBudget = pointsData.data.months_under_budget || 0;
                    this.monthsNoShoppingEntertainment = pointsData.data.months_no_shopping_entertainment || 0;
                } else {
                    console.error('Points data API error:', pointsData.error);
                }

            } else {
                console.error('Points response not OK:', pointsResponse.status);
            }

            // Load user badges (this will trigger badge checking and awarding)
            const badgesResponse = await fetch(`./php/api.php?action=getUserBadges&userId=${this.userId}`);

            if (badgesResponse.ok) {
                const badgesData = await badgesResponse.json();

                if (badgesData.success) {
                    this.userPoints.badges = badgesData.data || [];
                } else {
                    console.error('Badges data API error:', badgesData.error);
                }
            } else {
                console.error('Badges response not OK:', badgesResponse.status);
            }

        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Network error: ' + error.message, 'error');

            // Set default fallback data if API completely fails
            if (!this.budgetData.income && !this.budgetData.expenses.length) {
                this.budgetData = {
                    income: 0,
                    expenses: [],
                    savingsGoal: 0,
                    duration: 'monthly'
                };
            }
        } finally {
            // Update dashboard with loaded data
            this.updateDashboard();

            // Force hide any loading elements
            this.hideLoading();

            // Add data-loaded class to body to hide spinners via CSS
            document.body.classList.add('data-loaded');

            // Only hide specific loading spinner elements
            const loadingSpinners = document.querySelectorAll('.loading-spinner');
            loadingSpinners.forEach(spinner => {
                spinner.classList.add('hidden');
            });
        }
    }

    updateDashboard() {
        // Handle case where expenses might be undefined
        const allExpenses = this.budgetData.expenses || [];
        // Filter out AI planner expenses and savings for dashboard calculations
        const manualExpenses = allExpenses.filter(expense =>
            // Exclude AI-generated budget items (have ' Budget' suffix)
            // Also exclude AI-generated savings entries like 'Savings Allocation' so they don't show up in manual list
            !expense.name.includes(' Budget') && !(expense.category === 'Savings' && expense.name.includes('Allocation'))
        );
        const totalExpenses = manualExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const income = this.budgetData.income || 0;
        const savingsGoal = this.budgetData.savingsGoal || 0;
        const totalSavings = this.budgetData.totalSavings || 0;
        const remainingBudget = income - totalExpenses;
        const expensePercentage = income > 0 ? ((totalExpenses / income) * 100).toFixed(1) : 0;
        const savingsProgress = savingsGoal > 0 ? Math.min((totalSavings / savingsGoal) * 100, 100) : (totalSavings > 0 ? 100 : 0);

        // Update overview cards with proper formatting
        this.updateElement('total-income', `₹${income.toLocaleString()}`);
        this.updateElement('total-expenses', `₹${totalExpenses.toLocaleString()}`);
        this.updateElement('expense-percentage', `${expensePercentage}% of income`);
        this.updateElement('savings-goal', `₹${savingsGoal.toLocaleString()}`);
        this.updateElement('total-savings', `₹${totalSavings.toLocaleString()}`);
        this.updateElement('remaining-budget', `₹${remainingBudget.toLocaleString()}`);
        this.updateElement('current-savings', `₹${totalSavings.toLocaleString()}`);
        this.updateElement('goal-amount', `₹${savingsGoal.toLocaleString()}`);

        // Update remaining budget color
        const remainingElement = document.getElementById('remaining-budget');
        if (remainingElement) {
            if (remainingBudget >= 0) {
                remainingElement.style.color = this.darkMode ? 'var(--color-green-400)' : 'var(--color-green-600)';
            } else {
                remainingElement.style.color = this.darkMode ? 'var(--color-red-400)' : 'var(--color-red-600)';
            }
        }

        // Update remaining description
        const descriptionElement = document.getElementById('remaining-description');
        if (descriptionElement) {
            descriptionElement.textContent = remainingBudget >= 0 ? 'Available to save' : 'Over budget';
        }

        // Update progress bar based on total savings vs savings goal
        const progressFill = document.getElementById('savings-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.max(0, savingsProgress)}%`;
        }

        // Update progress message
        const progressMessage = document.getElementById('progress-message');
        if (progressMessage) {
            if (savingsGoal === 0) {
                if (totalSavings > 0) {
                    progressMessage.textContent = `You've saved ₹${totalSavings.toLocaleString()} so far!`;
                } else {
                    progressMessage.textContent = "Start building your savings!";
                }
                progressMessage.style.display = "block";
            } else if (savingsProgress >= 100) {
                progressMessage.textContent = "🎉 Congratulations! You've reached your savings goal!";
                progressMessage.style.display = "block";
            } else if (savingsProgress > 0) {
                progressMessage.textContent = `${savingsProgress.toFixed(1)}% of your goal achieved (₹${totalSavings.toLocaleString()} saved)`;
                progressMessage.style.display = "block";
            } else {
                progressMessage.textContent = "Start saving towards your goal!";
                progressMessage.style.display = "block";
            }
        }

        // Update charts if dashboard is active and charts are loaded
        setTimeout(() => {
            if (this.currentPage === 'dashboard' && window.charts) {
                window.charts.updateCharts(this.budgetData);
            }
        }, 100);
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    async addExpense(expense, suppressToast = false) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addExpense',
                    userId: this.userId,
                    expense: expense
                })
            });

            const result = await response.json();
            if (result.success) {
                // Reload data from database to get updated information
                await this.loadInitialData();

                // If this is a fixed expense, also reload the auto-pay expenses list
                if (expense.isFixed) {
                    await this.loadAutoPayExpenses();
                }

                if (!suppressToast) {
                    this.showToast('Expense added successfully!', 'success');
                }
            } else {
                if (!suppressToast) {
                    this.showToast('Failed to add expense', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            if (!suppressToast) {
                this.showToast('Error adding expense', 'error');
            }
        }
    }

    async deleteExpense(id, suppressToast = false) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'deleteExpense',
                    expenseId: id
                })
            });

            const result = await response.json();
            if (result.success) {
                // Reload data from database to get updated information
                await this.loadInitialData();
                // Refresh the smart-plan page if it's currently active
                if (this.currentPage === 'smart-plan') {
                    this.updateSmartPlan();
                }

                // Check for new badges after deleting expense
                await this.checkForNewBadges();
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    }

    async editExpense(id) {
        try {
            const expense = this.budgetData.expenses.find(exp => exp.id == id);
            if (!expense) {
                this.showToast('Expense not found', 'error');
                return;
            }

            // Create edit modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
            `;

            modal.innerHTML = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 400px; width: 90%; box-shadow: var(--shadow-xl);">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${expense.icon}</div>
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.25rem;">Edit Expense</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">${expense.name.replace(' Budget', '')} - ${expense.category}</p>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Amount (₹)</label>
                        <input type="number" id="edit-expense-amount" class="form-input" value="${expense.amount}" step="0.01" min="0" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); font-size: 1rem;">
                    </div>

                    <div style="display: flex; gap: 0.75rem;">
                        <button type="button" id="cancel-edit" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                            Cancel
                        </button>
                        <button type="button" id="save-edit" style="flex: 1; padding: 0.75rem; background: var(--color-purple-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                            Save Changes
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Initialize Lucide icons if available
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Event listeners
            const closeModal = () => modal.remove();

            document.getElementById('cancel-edit').addEventListener('click', closeModal);
            document.getElementById('save-edit').addEventListener('click', async () => {
                const newAmount = parseFloat(document.getElementById('edit-expense-amount').value);
                if (isNaN(newAmount) || newAmount <= 0) {
                    this.showToast('Please enter a valid amount', 'error');
                    return;
                }

                closeModal();

                // Update the expense with the new amount
                try {
                    const updatedExpense = {
                        ...expense,
                        amount: newAmount
                    };

                    const response = await fetch('./php/api.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'updateExpense',
                            expenseId: id,
                            expense: updatedExpense
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        // Reload data from database to get updated information
                        await this.loadInitialData();

                        // Refresh the smart-plan page if it's currently active
                        if (this.currentPage === 'smart-plan') {
                            this.updateSmartPlan();
                        }

                        this.showToast('Expense updated successfully!', 'success');
                    } else {
                        this.showToast(`Failed to update expense: ${result.error || 'Unknown error'}`, 'error');
                    }
                } catch (error) {
                    console.error('Error updating expense:', error);
                    this.showToast('Error updating expense', 'error');
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        } catch (error) {
            console.error('Error editing expense:', error);
            this.showToast('Error editing expense', 'error');
        }
    }

    async moveToManual(id) {
        try {
            const expense = this.budgetData.expenses.find(exp => exp.id == id);
            if (!expense) {
                this.showToast('Expense not found', 'error');
                return;
            }

            // Handle savings differently - add the amount to total savings instead of creating expense
            if (expense.category === 'Savings') {
                const currentTotalSavings = this.budgetData.totalSavings || 0;
                const newTotalSavings = currentTotalSavings + expense.amount;
                await this.updateTotalSavings(newTotalSavings, true);
                await this.deleteExpense(id, true);
                this.showToast(`₹${expense.amount.toLocaleString()} added to total savings!`, 'success');
                return;
            }

            // Create new manual expense without "Budget" suffix
            const manualExpense = {
                name: expense.name.replace(' Budget', ''),
                amount: expense.amount,
                category: expense.category,
                icon: expense.icon,
                isFixed: false // Manual expenses are not fixed
            };

            // Add the manual expense
            await this.addExpense(manualExpense, true);

            // Delete the AI planner expense
            await this.deleteExpense(id, true);

            this.showToast('Expense moved to manual successfully!', 'success');
        } catch (error) {
            console.error('Error moving expense to manual:', error);
            this.showToast('Error moving expense to manual', 'error');
        }
    }

    async updateIncome(income, incrementDate = null) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateIncome',
                    userId: this.userId,
                    income: income,
                    incrementDate: incrementDate
                })
            });

            const result = await response.json();
            if (result.success) {
                this.budgetData.income = income;
                this.budgetData.incomeIncrementDate = incrementDate;
                this.updateDashboard();
                this.showToast('Income updated successfully!', 'success');
            } else {
                this.showToast('Failed to update income', 'error');
            }
        } catch (error) {
            console.error('Error updating income:', error);
            this.showToast('Error updating income', 'error');
        }
    }

    async updateSavingsGoal(savingsGoal) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateSavingsGoal',
                    userId: this.userId,
                    savingsGoal: savingsGoal
                })
            });

            const result = await response.json();
            if (result.success) {
                this.budgetData.savingsGoal = savingsGoal;
                this.updateDashboard();
                this.showToast('Savings goal updated successfully!', 'success');
            } else {
                this.showToast('Failed to update savings goal', 'error');
            }
        } catch (error) {
            console.error('Error updating savings goal:', error);
            this.showToast('Error updating savings goal', 'error');
        }
    }

    async updateTotalSavings(totalSavings, suppressToast = false) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateTotalSavings',
                    userId: this.userId,
                    totalSavings: totalSavings
                })
            });

            const result = await response.json();
            if (result.success) {
                this.budgetData.totalSavings = totalSavings;
                this.updateDashboard();
                if (!suppressToast) {
                    this.showToast('Total savings updated successfully!', 'success');
                }
            } else {
                if (!suppressToast) {
                    this.showToast('Failed to update total savings', 'error');
                }
            }
        } catch (error) {
            console.error('Error updating total savings:', error);
            if (!suppressToast) {
                this.showToast('Error updating total savings', 'error');
            }
        }
    }

    async addToTotalSavings(expenseId) {
        try {
            const expense = this.budgetData.expenses.find(exp => exp.id == expenseId);
            if (!expense) {
                this.showToast('Expense not found', 'error');
                return;
            }

            if (expense.category !== 'Savings') {
                this.showToast('This is not a savings expense', 'error');
                return;
            }

            // Instead of immediately adding to the total savings, move this AI-generated
            // savings allocation into the manual expenses list so the user can manage it.
            // Create a manual savings expense (remove ' Allocation' suffix for clarity)
            const manualName = expense.name.replace(' Allocation', '').replace(' Budget', '').trim();
            const manualExpense = {
                name: manualName,
                amount: expense.amount,
                category: 'Savings',
                icon: expense.icon || '💰',
                isFixed: false
            };

            // Add manual expense and then remove the AI-generated one
            await this.addExpense(manualExpense, true);
            await this.deleteExpense(expenseId, true);

            this.showToast(`Moved ₹${expense.amount.toLocaleString()} to manual expenses.`, 'success');
        } catch (error) {
            console.error('Error adding to total savings:', error);
            this.showToast('Error adding to total savings', 'error');
        }
    }

    showAddSavingsModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: var(--shadow-xl);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: var(--text-primary); font-size: 1.25rem;">Add to Savings</h3>
                <button id="close-modal" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem; border-radius: var(--radius);">
                    <i data-lucide="x" style="width: 1.25rem; height: 1.25rem;"></i>
                </button>
            </div>

            <form id="add-savings-form">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Amount (₹)</label>
                    <input type="number" id="savings-amount" placeholder="Enter amount" min="0" step="0.01" required
                        style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Description (Optional)</label>
                    <input type="text" id="savings-description" placeholder="e.g. Monthly savings, Bonus, etc."
                        style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" id="cancel-savings" style="flex: 1; padding: 0.75rem; background: var(--color-gray-200); color: var(--text-primary); border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500;">
                        Cancel
                    </button>
                    <button type="submit" style="flex: 1; padding: 0.75rem; background: var(--color-green-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500;">
                        <i data-lucide="plus" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"></i>
                        Add Savings
                    </button>
                </div>
            </form>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event listeners
        const closeModal = () => {
            modal.remove();
        };

        document.getElementById('close-modal').addEventListener('click', closeModal);
        document.getElementById('cancel-savings').addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Form submission
        document.getElementById('add-savings-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = parseFloat(document.getElementById('savings-amount').value);
            const description = document.getElementById('savings-description').value.trim();

            if (amount <= 0) {
                this.showToast('Please enter a valid amount', 'error');
                return;
            }

            try {
                const currentTotalSavings = this.budgetData.totalSavings || 0;
                const newTotalSavings = currentTotalSavings + amount;

                await this.updateTotalSavings(newTotalSavings);

                // Optionally add to expenses list for tracking (as a savings entry)
                if (description) {
                    const savingsExpense = {
                        name: description,
                        amount: amount,
                        category: 'Savings',
                        icon: '💰',
                        isFixed: false
                    };
                    await this.addExpense(savingsExpense, true); // Suppress toast
                }

                closeModal();
            } catch (error) {
                console.error('Error adding savings:', error);
                this.showToast('Failed to add savings', 'error');
            }
        });

        // Focus on amount input
        setTimeout(() => {
            document.getElementById('savings-amount').focus();
        }, 100);
    }

    addPoints(points) {
        this.userPoints.total += points;
        this.userPoints.monthsUnderBudget += 1;
        this.saveUserPointsToStorage();
    }

    addBadge(badge) {
        if (!this.userPoints.badges.includes(badge)) {
            this.userPoints.badges.push(badge);
            this.saveUserPointsToStorage();
            this.showToast(`New badge earned: ${badge}!`, 'success');
        }
    }

    async saveExpenseToDatabase(expense) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addExpense',
                    userId: this.userId,
                    expense: expense
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save expense to database:', result.error);
            }
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    }

    async deleteExpenseFromDatabase(id) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'deleteExpense',
                    expenseId: id
                })
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to delete expense from database:', result.error);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    async downloadPDF() {
        // Check if PDF generator is available
        if (typeof generateProfessionalPDF !== 'function') {
            this.showToast('PDF generator not loaded. Please refresh the page.', 'error');
            return;
        }

        this.showLoading();

        try {
            // Fetch user profile data
            let userProfile = null;
            try {
                const profileResponse = await fetch(`./php/api.php?action=getUserProfile&userId=${this.userId}`);
                const profileResult = await profileResponse.json();
                if (profileResult.success) {
                    userProfile = profileResult.data;
                }
            } catch (error) {
                console.warn('Could not fetch user profile for PDF:', error);
            }

            // Generate PDF using the professional generator with user profile
            const doc = generateProfessionalPDF(this.budgetData, this.userId, userProfile);

            // Save the PDF
            const fileName = `FinancePro_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.hideLoading();
            this.showToast('Professional financial report downloaded successfully!', 'success');

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.hideLoading();
            this.showToast(`Error generating PDF report: ${error.message}`, 'error');
        }
    }

    async downloadExpenseTransactions() {
        // Check if PDF generator is available
        if (typeof generateProfessionalPDF !== 'function') {
            this.showToast('PDF generator not loaded. Please refresh the page.', 'error');
            return;
        }

        this.showLoading();

        try {
            // Get manual expenses (exclude AI budget items and savings allocations)
            const allExpenses = this.budgetData.expenses || [];
            const manualExpenses = allExpenses.filter(expense =>
                !expense.name.includes(' Budget') &&
                !(expense.category === 'Savings' && expense.name.includes('Allocation'))
            );

            if (manualExpenses.length === 0) {
                this.hideLoading();
                this.showToast('No expense transactions to download', 'info');
                return;
            }

            // Group expenses by date
            const groupedExpenses = {};
            manualExpenses.forEach(expense => {
                const dateTime = expense.created_at || expense.date_added;
                if (!dateTime) return;

                let date;
                if (dateTime.includes(' ')) {
                    [date] = dateTime.split(' ');
                } else {
                    date = dateTime;
                }

                if (!groupedExpenses[date]) {
                    groupedExpenses[date] = [];
                }
                groupedExpenses[date].push(expense);
            });

            // Sort dates newest first
            const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));

            // Calculate totals
            const totalExpenses = manualExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            const categoryTotals = {};
            manualExpenses.forEach(exp => {
                const category = exp.category || 'Other';
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                }
                categoryTotals[category] += exp.amount;
            });

            // Create PDF using jsPDF
            let jsPDF;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else {
                throw new Error('jsPDF library not loaded');
            }

            const doc = new jsPDF();
            doc.setFont('times', 'normal');

            const colors = {
                primary: [88, 28, 135],
                text: [17, 24, 39],
                textLight: [75, 85, 99],
                border: [209, 213, 219],
                bgLight: [249, 250, 251]
            };

            let yPos = 20;
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // Header
            doc.setFillColor(...colors.primary);
            doc.rect(0, 0, pageWidth, 50, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('times', 'bold');
            doc.text('EXPENSE TRANSACTIONS', pageWidth / 2, 25, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont('times', 'normal');
            const reportDate = new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Generated on ${reportDate}`, pageWidth / 2, 38, { align: 'center' });

            yPos = 55;

            // Fetch and add user details section
            let userProfile = null;
            try {
                const profileResponse = await fetch(`./php/api.php?action=getUserProfile&userId=${this.userId}`);
                const profileResult = await profileResponse.json();
                if (profileResult.success) {
                    userProfile = profileResult.data;
                }
            } catch (error) {
                console.warn('Could not fetch user profile for PDF:', error);
            }

            if (userProfile) {
                doc.setTextColor(...colors.primary);
                doc.setFontSize(12);
                doc.setFont('times', 'bold');
                doc.text('USER DETAILS', margin, yPos);

                yPos += 3;
                doc.setDrawColor(...colors.primary);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, margin + 40, yPos);

                yPos += 8;

                const userDetailsData = [];
                if (userProfile.first_name || userProfile.last_name) {
                    const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
                    if (fullName) userDetailsData.push(['Name', fullName]);
                }
                if (userProfile.email) userDetailsData.push(['Email', userProfile.email]);
                if (userProfile.contact) userDetailsData.push(['Contact', userProfile.contact]);
                if (userProfile.dob) {
                    const formattedDob = new Date(userProfile.dob).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    userDetailsData.push(['Date of Birth', formattedDob]);
                }

                if (userDetailsData.length > 0) {
                    doc.autoTable({
                        startY: yPos,
                        body: userDetailsData,
                        theme: 'plain',
                        styles: { font: 'times' },
                        bodyStyles: {
                            fontSize: 9,
                            textColor: colors.text,
                            font: 'times'
                        },
                        columnStyles: {
                            0: { fontStyle: 'bold', cellWidth: 45 },
                            1: { cellWidth: 'auto' }
                        },
                        margin: { left: margin + 5 }
                    });

                    yPos = doc.lastAutoTable.finalY + 12;
                }
            }

            yPos = yPos || 65;

            // Summary section
            doc.setTextColor(...colors.primary);
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            doc.text('TRANSACTION SUMMARY', margin, yPos);

            yPos += 3;
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(1);
            doc.line(margin, yPos, margin + 70, yPos);

            yPos += 15;

            // Summary table
            const summaryData = [
                ['Total Transactions', manualExpenses.length.toString()],
                ['Total Amount', `Rs. ${totalExpenses.toLocaleString('en-IN')}`],
                ['Date Range', `${sortedDates[sortedDates.length - 1]} to ${sortedDates[0]}`]
            ];

            doc.autoTable({
                startY: yPos,
                body: summaryData,
                theme: 'plain',
                styles: { font: 'times' },
                bodyStyles: {
                    fontSize: 10,
                    textColor: colors.text,
                    font: 'times'
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 80 },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: margin + 5 }
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // Category breakdown
            doc.setTextColor(...colors.primary);
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            doc.text('CATEGORY BREAKDOWN', margin, yPos);

            yPos += 10;

            const categoryData = Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => [
                    category,
                    `Rs. ${amount.toLocaleString('en-IN')}`,
                    `${((amount / totalExpenses) * 100).toFixed(1)}%`
                ]);

            doc.autoTable({
                startY: yPos,
                head: [['Category', 'Amount', '% of Total']],
                body: categoryData,
                theme: 'striped',
                styles: { font: 'times' },
                headStyles: {
                    fillColor: colors.primary,
                    textColor: [255, 255, 255],
                    fontSize: 11,
                    fontStyle: 'bold',
                    halign: 'left',
                    font: 'times'
                },
                bodyStyles: {
                    fontSize: 10,
                    textColor: colors.text,
                    font: 'times'
                },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { halign: 'right', cellWidth: 50 },
                    2: { halign: 'right', cellWidth: 'auto' }
                },
                margin: { left: margin, right: margin },
                alternateRowStyles: {
                    fillColor: colors.bgLight
                }
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // Detailed transactions
            doc.addPage();
            yPos = 20;

            doc.setTextColor(...colors.primary);
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            doc.text('DETAILED TRANSACTIONS', margin, yPos);

            yPos += 3;
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(1);
            doc.line(margin, yPos, margin + 70, yPos);

            yPos += 15;

            // Render transactions by date
            sortedDates.forEach((date, dateIndex) => {
                const dateExpenses = groupedExpenses[date];
                const formattedDate = new Date(date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Check if we need a new page
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = 20;
                }

                // Date header
                doc.setFillColor(...colors.bgLight);
                doc.rect(margin, yPos, contentWidth, 10, 'F');
                doc.setTextColor(...colors.text);
                doc.setFontSize(11);
                doc.setFont('times', 'bold');
                doc.text(formattedDate, margin + 5, yPos + 7);
                yPos += 15;

                // Transactions for this date
                const transactionData = dateExpenses.map(expense => {
                    const time = expense.created_at ? expense.created_at.split(' ')[1] : '00:00';
                    return [
                        expense.name,
                        expense.category,
                        time,
                        `Rs. ${expense.amount.toLocaleString('en-IN')}`
                    ];
                });

                doc.autoTable({
                    startY: yPos,
                    head: [['Description', 'Category', 'Time', 'Amount']],
                    body: transactionData,
                    theme: 'grid',
                    styles: { font: 'times' },
                    headStyles: {
                        fillColor: colors.primary,
                        textColor: [255, 255, 255],
                        fontSize: 9,
                        fontStyle: 'bold',
                        font: 'times'
                    },
                    bodyStyles: {
                        fontSize: 9,
                        textColor: colors.text,
                        font: 'times'
                    },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 35 },
                        2: { cellWidth: 25 },
                        3: { halign: 'right', cellWidth: 'auto' }
                    },
                    margin: { left: margin, right: margin }
                });

                yPos = doc.lastAutoTable.finalY + 10;
            });

            // Footer on last page
            const finalPage = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
            doc.setTextColor(...colors.textLight);
            doc.setFontSize(8);
            doc.setFont('times', 'normal');
            doc.text(`Generated by FinancePro | ${reportDate}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

            // Save the PDF
            const fileName = `Expense_Transactions_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.hideLoading();
            this.showToast('Expense transactions downloaded successfully!', 'success');

        } catch (error) {
            console.error('Error generating expense transactions PDF:', error);
            this.hideLoading();
            this.showToast(`Error downloading transactions: ${error.message}`, 'error');
        }
    }

    async logout() {
        // Create custom confirmation modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 400px; width: 90%; box-shadow: var(--shadow-xl);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🚪</div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.25rem;">Logout</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">Are you sure you want to logout?</p>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" id="cancel-logout" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        Cancel
                    </button>
                    <button type="button" id="confirm-logout" style="flex: 1; padding: 0.75rem; background: var(--color-blue-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        Logout
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event listeners
        const closeModal = () => modal.remove();

        document.getElementById('cancel-logout').addEventListener('click', closeModal);
        document.getElementById('confirm-logout').addEventListener('click', async () => {
            closeModal();

            try {
                const response = await fetch('./php/logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                if (result.success) {
                    // Redirect to login page
                    window.location.href = 'login.html';
                } else {
                    this.showToast('Logout failed', 'error');
                }
            } catch (error) {
                console.error('Error logging out:', error);
                this.showToast('Error logging out', 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Page content generators (will be expanded)
    generateAddExpenseContent() {
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title"><i data-lucide="plus-circle" style="width: 2rem; height: 2.5rem; margin-right: 0.5rem;"></i>Add Transaction</h1>
                    <p class="page-subtitle">Add expenses, savings, or income</p>
                </div>
            </div>

            <!-- Type Selector -->
            <div style="max-width: 600px; margin: 0 auto; margin-bottom: 1rem;">
                <div style="display: flex; gap: 2rem; justify-content: center; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; border-radius: var(--radius); background: transparent;">
                        <input type="radio" name="transaction-type" value="expense" checked style="margin: 0;">
                        <i data-lucide="minus-circle" style="width: 1.25rem; height: 1.25rem; color: var(--color-red-500);"></i>
                        <span style="font-weight: 500; color: var(--text-primary);">Add Expense</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; border-radius: var(--radius); background: transparent;">
                        <input type="radio" name="transaction-type" value="savings" style="margin: 0;">
                        <i data-lucide="piggy-bank" style="width: 1.25rem; height: 1.25rem;"></i>
                        <span style="font-weight: 500; color: var(--text-primary);">Add Savings</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; border-radius: var(--radius); background: transparent;">
                        <input type="radio" name="transaction-type" value="income" style="margin: 0;">
                        <i data-lucide="plus-circle" style="width: 1.25rem; height: 1.25rem;"></i>
                        <span style="font-weight: 500; color: var(--text-primary);">Add Income</span>
                    </label>
                </div>
            </div>

            <!-- Expense Form -->
            <div class="card" id="expense-form-card" style="max-width: 600px; margin: 0 auto;">
                <div class="card-header">
                    <h3 class="card-title">New Expense</h3>
                </div>
                <div class="card-content">
                    <form id="add-expense-form">
                        <div class="form-group">
                            <label class="form-label">Expense Name</label>
                            <input type="text" name="name" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Amount (₹)</label>
                            <input type="number" name="amount" class="form-input" step="0.01" required>
                        </div>

						<div class="form-group">
							<label class="form-label">Category</label>
							<select name="category" id="add-expense-category" class="form-select" required>
								<option value="">Loading categories...</option>
							</select>
						</div>

                        <div class="checkbox-group">
                            <input type="checkbox" name="isFixed" id="fixed-expense-checkbox" class="form-checkbox">
                            <label class="form-label">Fixed Expense</label>
                        </div>

                        <div class="form-group" id="due-date-container" style="display: none;">
                            <label class="form-label">Due Date (Day of Month)</label>
                            <select name="dueDate" id="due-date-select" class="form-select">
                                <option value="">Select day</option>
                                ${Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            return `<option value="${day}">${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month</option>`;
        }).join('')}
                            </select>
                            <small style="color: var(--text-secondary); font-size: 0.875rem;">This expense will be automatically added on this date each month.</small>
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">
                            <i data-lucide="plus"></i>
                            Add Expense
                        </button>
                    </form>
                </div>
            </div>

            <!-- Savings Form -->
            <div class="card" id="savings-form-card" style="max-width: 600px; margin: 0 auto; display: none;">
                <div class="card-header">
                    <h3 class="card-title">Add Savings</h3>
                </div>
                <div class="card-content">
                    <form id="add-savings-form">
                        <div class="form-group">
                            <label class="form-label">Amount (₹)</label>
                            <input type="number" name="amount" class="form-input" step="0.01" min="0" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description (Optional)</label>
                            <input type="text" name="description" class="form-input" placeholder="e.g. Monthly savings, Bonus, etc.">
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">
                            <i data-lucide="piggy-bank"></i>
                            Add to Savings
                        </button>
                    </form>
                </div>
            </div>

            <!-- Income Form -->
            <div class="card" id="income-form-card" style="max-width: 600px; margin: 0 auto; display: none;">
                <div class="card-header">
                    <h3 class="card-title">Add Income</h3>
                </div>
                <div class="card-content">
                    <form id="add-income-form">
                        <div class="form-group">
                            <label class="form-label">Income Amount (₹)</label>
                            <input type="number" name="amount" class="form-input" step="0.01" min="0" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Income Increment Date (Optional)</label>
                            <select name="incrementDate" class="form-select">
                                <option value="">No automatic increment</option>
                                ${Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            return `<option value="${day}">${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month</option>`;
        }).join('')}
                            </select>
                            <small style="color: var(--text-secondary); font-size: 0.875rem;">On this date, your income will automatically increase by the same amount as your current income.</small>
                        </div>

                        <div class="checkbox-group">
                            <input type="checkbox" name="isRecurring" id="is-recurring-checkbox" class="form-checkbox" checked>
                            <label class="form-label">Is Recurring Income?</label>
                            <small style="display: block; color: var(--text-secondary); font-size: 0.875rem;">Uncheck if this is a one-time income.</small>
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">
                            <i data-lucide="trending-up"></i>
                            Add Income
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    generateSmartPlannerContent() {
        return `
			<div class="page-header">
				<div>
					<h1 class="page-title"><i data-lucide="sparkles" style="width: 2rem; height: 3rem; margin-right: 0.5rem;"></i>AI Smart Planner</h1>
					<p class="page-subtitle">Allocate your budget intelligently across categories</p>
				</div>
			</div>

			<div class="card" style="max-width: 900px; margin: 0 auto;">
				<div class="card-content">
					<form id="ai-planner-form" class="form-grid">
						<div class="form-group">
							<label class="form-label" style="margin-top: 10px;">Budget Amount (₹)</label>
							<input type="number" id="ai-budget" class="form-input" min="0" step="0.01" placeholder="e.g. 3000" required />
						</div>
						<div class="form-group">
							<label class="form-label">Duration</label>
							<select id="ai-duration" class="form-select">
								<option value="weekly">Weekly</option>
								<option value="monthly" selected>Monthly</option>
								<option value="yearly">Yearly</option>
							</select>
						</div>
					</form>

					<div class="form-group" style="margin-top: 1rem;">
						<label class="form-label">Select Categories</label>
						<div id="ai-category-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .75rem;"></div>
					</div>

					<div class="form-group" style="margin-top: 1rem;">
						<label class="form-label">Savings Option</label>
						<div style="display: flex; gap: 1rem; align-items: center;">
							<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
								<input type="radio" name="savings-option" value="no" checked style="margin: 0;">
								<span>No Savings</span>
							</label>
							<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
								<input type="radio" name="savings-option" value="yes" style="margin: 0;">
								<span>Include Savings</span>
							</label>
						</div>
						<div id="savings-inputs" style="display: none; margin-top: 0.5rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--bg-card);">
							<div style="display: flex; align-items: center; gap: 0.5rem;">
								<span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 500;">₹</span>
								<input type="number" id="savings-amount" placeholder="Amount" min="0" step="0.01" style="width: 100px; padding: 0.375rem; border: 1px solid var(--border-color); border-radius: var(--radius); font-size: 0.875rem; background: var(--bg-card); color: var(--text-primary);">
								<input type="number" id="savings-percent" placeholder="%" min="0" max="100" step="0.1" style="width: 60px; padding: 0.375rem; border: 1px solid var(--border-color); border-radius: var(--radius); font-size: 0.875rem; background: var(--bg-card); color: var(--text-primary);" oninput="if(this.value > 100) this.value = 100;">
								<span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 500;">%</span>
							</div>
						</div>
					</div>

					<button id="ai-generate-plan" class="btn-primary" style="width: 100%; margin-top: 1rem;">
						<i data-lucide="wand-2"></i>
						Generate Plan
					</button>

					<div id="ai-plan-output" class="" style="margin-top: 1.25rem; display: none;"></div>
				</div>
			</div>
		`;
    }

    generateSmartPlanContent() {
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title"><i data-lucide="clipboard-list" style="width: 2rem; height: 2.5rem; margin-right: 0.5rem;"></i>Review Section</h1>
                    <p class="page-subtitle">Review and Manage your Expenses and AI Plan</p>
                </div>
                <div class="expense-toggle-container" style="display: flex; justify-content: center; margin-top: 5rem;">
                    <div class="toggle-switch-wrapper" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 25px; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <span id="manual-label" style="font-weight: 500; color: var(--text-secondary); transition: color 0.3s;">Expenses Review</span>
                        <div class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" id="expense-toggle" checked style="opacity: 0; width: 0; height: 0;">
                            <label for="expense-toggle" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, var(--color-purple-500), var(--color-blue-500)); transition: .4s; border-radius: 24px;">
                                <span class="toggle-slider" style="position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transform: translateX(26px);"></span>
                            </label>
                        </div>
                        <span id="ai-label" style="font-weight: 500; color: var(--color-purple-600); transition: color 0.3s;">AI Plan Review</span>
                    </div>
                </div>
            </div>

            <div class="card" id="manual-expenses-card" style="display: none;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">Expenses Transactions</h3>
                    <button onclick="app.downloadExpenseTransactions()" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        <i data-lucide="download" style="width: 1rem; height: 1rem; margin-right: 0.25rem;"></i>
                        Download Transactions
                    </button>
                </div>
                <div class="card-content">
                    <div id="manual-expenses-list"></div>
                </div>
            </div>

            <div class="card" id="ai-expenses-card">
                <div class="card-header">
                    <h3 class="card-title">AI Planner Expenses</h3>
                </div>
                <div class="card-content">
                    <div id="ai-expenses-list"></div>
                </div>
            </div>
        `;
    }

    generateRewardsContent() {
        // Filter to use only manual expenses (other expenses), exclude AI planner expenses
        const manualExpenses = this.budgetData.expenses.filter(expense =>
            !expense.name.includes(' Budget')
        );
        const totalExpenses = manualExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const remainingBudget = this.budgetData.income - totalExpenses;
        const isUnderBudget = remainingBudget >= this.budgetData.savingsGoal;

        // Calculate total points from earned badges
        const availableBadges = [
            { name: 'Smart Saver', icon: '💰', description: 'Save for 1 month', required: 1, points: 100 },
            { name: 'Budget Pro', icon: '📊', description: 'Stay under budget for 3 months', required: 3, points: 300 },
            { name: 'Zero Waste', icon: '♻️', description: 'Optimize all expenses', required: 5, points: 500 },
            { name: 'Financial Guru', icon: '🎓', description: 'Stay under budget for 6 months', required: 6, points: 600 },
            { name: 'Savings Master', icon: '🏆', description: 'Save ₹100,000 total', required: 10, points: 1000 },
            { name: 'First Month', icon: '🌟', description: 'Complete your first month', required: 1, points: 50 },
        ];

        const earnedBadges = this.userPoints.badges || [];
        const calculatedTotalPoints = availableBadges
            .filter(badge => earnedBadges.includes(badge.name))
            .reduce((sum, badge) => sum + badge.points, 0);

        // Use calculated points or fallback to stored points
        const totalPoints = calculatedTotalPoints || this.userPoints.total || 0;

        const currentLevel = Math.floor(totalPoints / 500) + 1;
        const nextLevelPoints = currentLevel * 500;
        const pointsToNextLevel = nextLevelPoints - totalPoints;
        const levelProgress = ((totalPoints % 500) / 500) * 100;

        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title"><i data-lucide="trophy" style="width: 2rem;height: 2rem; margin-right: 1rem;"></i>Rewards & Achievements</h1>
                    <p class="page-subtitle">Earn points and unlock badges by staying on budget</p>
                </div>
            </div>
            
            <!-- Points Overview -->
            <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="card rewards-card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.2);">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem;">
                        <h3 class="card-title">Total Points</h3>
                        <div style="padding: 0.5rem; border-radius: 0.5rem; background: linear-gradient(135deg, #fbbf24, #f59e0b);">
                            <i data-lucide="star" style="width: 1.25rem; height: 1.25rem; color: white;"></i>
                        </div>
                    </div>
                    <div class="card-content">
                    <div class="amount" id="total-points" style="font-size: 2rem; font-weight: 700;">${totalPoints}</div>
                        <p style="margin-top: 0.25rem; color: var(--text-secondary);">Level ${currentLevel}</p>
                    </div>
                </div>
                
                <div class="card rewards-card" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(34, 197, 94, 0.2);">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem;">
                        <h3 class="card-title">Badges Earned</h3>
                        <div style="padding: 0.5rem; border-radius: 0.5rem; background: linear-gradient(135deg, #10b981, #059669);">
                            <i data-lucide="award" style="width: 1.25rem; height: 1.25rem; color: white;"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="amount" id="badges-count" style="font-size: 2rem; font-weight: 700;">${this.userPoints.badges.length}</div>
                        <p style="margin-top: 0.25rem; color: var(--text-secondary);">Out of ${availableBadges.length}</p>
                    </div>
                </div>
                
                <div class="card rewards-card" style="background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.1)); border: 1px solid rgba(249, 115, 22, 0.2);">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem;">
                        <h3 class="card-title">Streak</h3>
                        <div style="padding: 0.5rem; border-radius: 0.5rem; background: linear-gradient(135deg, #f97316, #ea580c);">
                            <i data-lucide="zap" style="width: 1.25rem; height: 1.25rem; color: white;"></i>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="amount" id="streak-count" style="font-size: 2rem; font-weight: 700;">${this.userPoints.monthsUnderBudget}</div>
                        <p style="margin-top: 0.25rem; color: var(--text-secondary);">Months on track</p>
                    </div>
                </div>
            </div>

            <!-- Level Progress -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="trophy" style="width: 1.25rem; height: 1.25rem; color: var(--color-purple-500);"></i>
                        Level Progress
                    </h3>
                </div>
                <div class="card-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="color: var(--text-secondary);">Level ${currentLevel}</span>
                        <span style="color: var(--text-secondary);">${pointsToNextLevel} points to Level ${currentLevel + 1}</span>
                    </div>
                    <div style="width: 100%; height: 0.75rem; background: var(--border-color); border-radius: 9999px; overflow: hidden;">
                        <div style="width: ${levelProgress}%; height: 100%; background: linear-gradient(90deg, var(--color-purple-500), var(--color-blue-500)); transition: width 0.3s ease;"></div>
                    </div>
                    <p style="text-align: center; margin-top: 0.75rem; color: var(--text-secondary);">Keep saving to unlock more rewards!</p>
                </div>
            </div>

            <!-- Current Month Status -->
            <div class="card" style="margin-bottom: 2rem; border: 2px solid ${isUnderBudget ? 'var(--color-green-500)' : 'var(--color-orange-500)'}; background: ${isUnderBudget ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)'};">
                <div class="card-header">
                    <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="trending-up" style="width: 1.25rem; height: 1.25rem;"></i>
                        This Month's Performance
                    </h3>
                </div>
                <div class="card-content">
                    ${isUnderBudget ? `
                        <div>
                            <p style="font-size: 1.125rem; color: var(--color-green-500); margin-bottom: 0.5rem;">🎉 Great job! You're on track this month!</p>
                            <p style="color: var(--text-secondary);">You'll earn the <strong>Smart Saver</strong> badge and <strong>100 points</strong> at month end.</p>
                        </div>
                    ` : `
                        <div>
                            <p style="font-size: 1.125rem; color: var(--color-orange-500); margin-bottom: 0.5rem;">Keep pushing! You can still hit your goal.</p>
							<p style="color: var(--text-secondary);">Reduce expenses by ₹${Math.abs(this.budgetData.savingsGoal - remainingBudget).toFixed(2)} to earn the Smart Saver badge this month.</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Achievement Badges -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Achievement Badges</h3>
                </div>
                <div class="card-content">
                    <div id="badges-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        ${availableBadges.map(badge => {
            const isEarned = this.userPoints.badges.includes(badge.name);
            const canEarn = this.userPoints.monthsUnderBudget >= badge.required;

            return `
                                <div style="padding: 1rem; border-radius: 0.5rem; border: 2px solid ${isEarned ? 'var(--color-purple-500)' : canEarn ? 'var(--color-blue-500)' : 'var(--border-color)'}; background: ${isEarned ? 'rgba(139, 92, 246, 0.1)' : canEarn ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)'}; transition: all 0.2s ease;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                        <span style="font-size: 2rem; ${isEarned ? '' : 'opacity: 0.4; filter: grayscale(1);'}">${badge.icon}</span>
                                        ${isEarned ? '<span style="background: linear-gradient(90deg, var(--color-purple-500), var(--color-blue-500)); color: white; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">Earned</span>' : ''}
                                    </div>
                                    <h4 style="margin-bottom: 0.25rem; font-weight: 600;">${badge.name}</h4>
                                    <p style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">${badge.description}</p>
                                    <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--color-yellow-500);">
                                        <i data-lucide="star" style="width: 1rem; height: 1rem;"></i>
                                        <span style="font-size: 0.875rem; font-weight: 500;">${badge.points} pts</span>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Global Leaderboard -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Global Leaderboard</h3>
                </div>
                <div class="card-content">
                    <div id="leaderboard-content">
                        <div style="text-align: center; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Loading leaderboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateSettingsContent() {
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title"><i data-lucide="settings" style="width: 2rem; height: 2.5rem; margin-right: 0.5rem;"></i>Settings</h1>
                    <p class="page-subtitle">Manage your profile and budget preferences</p>
                </div>
            </div>

            <!-- Profile Section -->
            <div class="card" style="max-width: 600px; margin: 0 auto; margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title" style="font-size: 2rem">User Profile</h3>
                </div>
                <div class="card-content">
                    <form id="profile-form">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" name="first_name" id="profile-first-name" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input type="text" name="last_name" id="profile-last-name" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" id="profile-email" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Contact Number</label>
                            <input type="tel" name="contact" id="profile-contact" class="form-input">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" name="dob" id="profile-dob" class="form-input">
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%;">
                            <i data-lucide="save"></i>
                            Update Profile
                        </button>
                    </form>
                </div>
            </div>

            <!-- Budget Settings Section -->
            <div class="card" style="max-width: 600px; margin: 0 auto; margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Budget Settings</h3>
                </div>
                <div class="card-content">
                    <form id="settings-form">
                        <div class="form-group">
                            <label class="form-label">Monthly Income Increment Amount (₹)</label>
                            <input type="number" name="income" class="form-input" value="${this.budgetData.incomeIncrementAmount || 0}" step="0.01" required>
                            <small style="color: var(--text-secondary); font-size: 0.875rem;">This is the base amount that will be added to your income each month on the increment date.</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Income Increment Date</label>
                            <select name="incrementDate" class="form-select">
                                <option value="">No automatic increment</option>
                                ${Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const selected = this.budgetData.incomeIncrementDate == day ? 'selected' : '';
            return `<option value="${day}" ${selected}>${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month</option>`;
        }).join('')}
                            </select>
                            <small style="color: var(--text-secondary); font-size: 0.875rem;">On this date, your income will automatically increase by the increment amount above.</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Savings Goal (₹)</label>
                            <input type="number" name="savingsGoal" class="form-input" value="${this.budgetData.savingsGoal}" step="0.01" required>
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%;">
                            <i data-lucide="save"></i>
                            Save Settings
                        </button>
                    </form>

                    <div style="margin-top: 0.75rem; text-align: center;">
                        <button type="button" id="reset-settings-btn" style="background: var(--color-red-500); color: white; border: none; border-radius: var(--radius-lg); padding: 0.5rem 1rem; cursor: pointer;">Reset Income & Goal</button>
                    </div>
                </div>
            </div>

            <!-- Auto-Pay Settings Section -->
            <div class="card" style="max-width: 600px; margin: 0 auto; margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Auto-Pay Settings</h3>
                </div>
                <div class="card-content">
                    <div id="auto-pay-list" style="margin-bottom: 1rem;">
                        <!-- Auto-pay expenses will be loaded here -->
                    </div>
                    <button id="add-auto-pay-btn" class="btn-secondary" style="width: 100%;">
                        <i data-lucide="plus"></i>
                        Add Auto-Pay Expense
                    </button>
                </div>
            </div>

            <!-- Logout Button -->
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn-primary btn-logout">
                    <i data-lucide="log-out"></i>
                    Logout
                </button>
            </div>
        `;
    }

    // Page-specific initialization methods
    initAddExpensePage() {
        // Populate categories
        this.populateAddExpenseCategories();
        if (!this.availableCategories.length) {
            this.loadCategories();
        }

        // Transaction type switching
        const transactionRadios = document.querySelectorAll('input[name="transaction-type"]');
        const expenseFormCard = document.getElementById('expense-form-card');
        const savingsFormCard = document.getElementById('savings-form-card');
        const incomeFormCard = document.getElementById('income-form-card');

        const showForm = (type) => {
            [expenseFormCard, savingsFormCard, incomeFormCard].forEach(card => {
                if (card) card.style.display = 'none';
            });
            if (type === 'expense' && expenseFormCard) expenseFormCard.style.display = 'block';
            if (type === 'savings' && savingsFormCard) savingsFormCard.style.display = 'block';
            if (type === 'income' && incomeFormCard) incomeFormCard.style.display = 'block';

            // Update visual selection
            transactionRadios.forEach(radio => {
                const label = radio.parentElement;
                const span = label.querySelector('span');
                const icon = label.querySelector('i');
                if (radio.value === type) {
                    label.style.background = 'white';
                    label.style.border = '2px solid var(--border-color)';
                    if (radio.value === 'expense') {
                        label.style.color = 'black';
                        if (span) span.style.color = 'black';
                        if (icon) icon.style.color = 'var(--color-red-500)';
                    } else {
                        label.style.color = 'black';
                        if (span) span.style.color = 'black';
                        if (icon) icon.style.color = 'black';
                    }
                } else {
                    label.style.background = '';
                    label.style.border = 'none';
                    if (radio.value === 'expense') {
                        label.style.color = 'white';
                        if (span) span.style.color = 'white';
                        if (icon) icon.style.color = 'var(--color-red-500)';
                    } else {
                        label.style.color = 'white';
                        if (span) span.style.color = 'white';
                        if (icon) icon.style.color = radio.value === 'savings' ? 'var(--color-green-500)' :
                            radio.value === 'income' ? 'var(--color-blue-500)' :
                                'white';
                    }
                }
            });
        };

        transactionRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                showForm(e.target.value);
            });
        });

        // Initialize expense form
        const expenseForm = document.getElementById('add-expense-form');
        if (expenseForm) {
            // Initialize fixed expense checkbox handler
            const fixedCheckbox = document.getElementById('fixed-expense-checkbox');
            const dueDateContainer = document.getElementById('due-date-container');
            const dueDateSelect = document.getElementById('due-date-select');

            if (fixedCheckbox && dueDateContainer) {
                fixedCheckbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        dueDateContainer.style.display = 'block';
                        dueDateSelect.required = true;
                    } else {
                        dueDateContainer.style.display = 'none';
                        dueDateSelect.required = false;
                        dueDateSelect.value = '';
                    }
                });
            }

            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(expenseForm);
                const expense = {
                    name: formData.get('name'),
                    amount: parseFloat(formData.get('amount')),
                    category: formData.get('category'),
                    icon: this.getCategoryIcon(formData.get('category')),
                    isFixed: formData.get('isFixed') === 'on',
                    dueDate: formData.get('dueDate') ? parseInt(formData.get('dueDate')) : null
                };

                this.addExpense(expense);
                expenseForm.reset();

                // Reset due date container visibility
                if (dueDateContainer) {
                    dueDateContainer.style.display = 'none';
                }
                if (dueDateSelect) {
                    dueDateSelect.required = false;
                }
                if (fixedCheckbox) {
                    fixedCheckbox.checked = false;
                }
            });
        }

        // Initialize savings form
        const savingsForm = document.getElementById('add-savings-form');
        if (savingsForm) {
            savingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(savingsForm);
                const amount = parseFloat(formData.get('amount'));
                const description = formData.get('description').trim();

                if (amount <= 0) {
                    this.showToast('Please enter a valid amount', 'error');
                    return;
                }

                try {
                    const currentTotalSavings = this.budgetData.totalSavings || 0;
                    const newTotalSavings = currentTotalSavings + amount;

                    await this.updateTotalSavings(newTotalSavings);

                    // Optionally add to expenses list for tracking
                    if (description) {
                        const savingsExpense = {
                            name: description,
                            amount: amount,
                            category: 'Savings',
                            icon: '💰',
                            isFixed: false
                        };
                        await this.addExpense(savingsExpense, true); // Suppress toast
                    }

                    savingsForm.reset();
                } catch (error) {
                    console.error('Error adding savings:', error);
                    this.showToast('Failed to add savings', 'error');
                }
            });
        }

        // Initialize income form
        const incomeForm = document.getElementById('add-income-form');
        if (incomeForm) {
            incomeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(incomeForm);
                const amount = parseFloat(formData.get('amount'));
                const incrementDate = formData.get('incrementDate') ? parseInt(formData.get('incrementDate')) : null;
                const isRecurring = formData.get('isRecurring') === 'on'; // Get the value of the new checkbox

                if (amount <= 0) {
                    this.showToast('Please enter a valid income amount', 'error');
                    return;
                }

                try {
                    // Call the addIncome API to add a new income entry
                    const response = await fetch('./php/api.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'addIncome',
                            userId: this.userId,
                            name: 'Income',
                            amount: amount,
                            date: new Date().toISOString().slice(0, 10), // Current date
                            is_recurring: isRecurring,
                            incrementDate: incrementDate // include increment date so backend can store/apply it
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        this.showToast('Income added successfully', 'success');
                        incomeForm.reset();
                        await this.loadInitialData(); // Reload all data to update UI
                    } else {
                        this.showToast(`Failed to add income: ${result.error}`, 'error');
                    }
                } catch (error) {
                    console.error('Error adding income:', error);
                    this.showToast('Failed to add income', 'error');
                }
            });
        }

        // Set initial form visibility (expense by default)
        showForm('expense');
        // Set initial visual selection
        transactionRadios.forEach(radio => {
            const label = radio.parentElement;
            const span = label.querySelector('span');
            const icon = label.querySelector('i');
            if (radio.value === 'expense') {
                label.style.background = 'white';
                label.style.border = '2px solid var(--border-color)';
                label.style.color = 'black';
                if (span) span.style.color = 'black';
                if (icon) icon.style.color = 'var(--color-red-500)';
            } else {
                label.style.background = '';
                label.style.border = 'none';
                label.style.color = 'white';
                if (span) span.style.color = 'white';
                if (icon) icon.style.color = radio.value === 'savings' ? 'var(--color-green-500)' :
                    'var(--color-blue-500)';
            }
        });
    }

    initSmartPlannerPage() {
        // Build category chips
        this.renderPlannerCategories();
        if (!this.availableCategories.length) {
            this.loadCategories();
        }

        // Initialize savings option toggle
        const savingsRadios = document.querySelectorAll('input[name="savings-option"]');
        const savingsInputs = document.getElementById('savings-inputs');

        savingsRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'yes') {
                    savingsInputs.style.display = 'block';
                    // Update max values based on current budget
                    const budgetInput = document.getElementById('ai-budget');
                    const budget = parseFloat(budgetInput.value) || 0;
                    const amountInput = document.getElementById('savings-amount');
                    const percentInput = document.getElementById('savings-percent');
                    if (amountInput) {
                        amountInput.max = budget;
                        amountInput.value = ''; // Clear value when shown
                    }
                    if (percentInput) {
                        percentInput.max = 100;
                        percentInput.value = ''; // Clear value when shown
                    }
                } else {
                    savingsInputs.style.display = 'none';
                    // Clear values when hidden
                    const amountInput = document.getElementById('savings-amount');
                    const percentInput = document.getElementById('savings-percent');
                    if (amountInput) amountInput.value = '';
                    if (percentInput) percentInput.value = '';
                }
            });
        });

        // Add input validation for savings amount
        const savingsAmountInput = document.getElementById('savings-amount');
        if (savingsAmountInput) {
            savingsAmountInput.addEventListener('input', (e) => {
                const budgetInput = document.getElementById('ai-budget');
                const budget = parseFloat(budgetInput.value) || 0;
                const value = parseFloat(e.target.value) || 0;
                if (value > budget) {
                    e.target.value = budget;
                }
            });
        }

        const generateBtn = document.getElementById('ai-generate-plan');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateAIPlan());
        }
    }

    initSmartPlanPage() {
        this.updateSmartPlan();
        this.initExpenseToggle();
    }

    async updateSmartPlan() {
        await this.loadIncomeHistory();
        const manualExpensesList = document.getElementById('manual-expenses-list');
        const aiExpensesList = document.getElementById('ai-expenses-list');

        if (!manualExpensesList || !aiExpensesList) return;

        // Get income information
        const incomeHistory = this.budgetData.incomeHistory || [];

        const expenses = this.budgetData.expenses || [];

        // Separate expenses based on naming pattern and auto-added flag
        const manualExpenses = expenses.filter(expense =>
            // Manual expenses: exclude AI-generated budget items and AI-generated savings allocations
            !expense.name.includes(' Budget') && !(expense.category === 'Savings' && expense.name.includes('Allocation'))
        );
        const aiExpenses = expenses.filter(expense =>
            expense.name.includes(' Budget') || (expense.category === 'Savings' && expense.name.includes('Allocation')) // AI planner expenses and AI-generated savings
        );
        const autoExpenses = expenses.filter(expense =>
            expense.isAutoAdded // Auto-added fixed expenses
        );

        // Helper function to group expenses by date and sort dates newest first
        const groupExpensesByDate = (expenseList, includeIncome = false) => {
            const grouped = {};

            // Combine expenses and income history for date-wise display if includeIncome is true
            let listToProcess = [...expenseList];
            if (includeIncome) {
                const incomeHistory = this.budgetData.incomeHistory || [];
                listToProcess = [...listToProcess, ...incomeHistory.map(inc => ({ ...inc, category: 'Income', icon: '💰', name: inc.name || 'Income' }))];
            }

            listToProcess.forEach(expense => {
                const dateTime = expense.created_at || expense.date_added;
                if (!dateTime) return;

                let date, time;
                if (dateTime.includes(' ')) {
                    [date, time] = dateTime.split(' ');
                } else {
                    date = dateTime;
                    time = expense.category === 'Income' ? 'Income received' : '00:00';
                }

                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push({ ...expense, time });
            });
            // Sort dates newest first
            const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
            return { grouped, sortedDates };
        };

        // Helper function to render date cards
        const renderDateCards = (expenseList, isAI = false, isAuto = false) => {
            if (expenseList.length === 0) {
                if (isAuto) {
                    return `
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            <p>No auto-pay expenses yet.</p>
                            <p>Fixed expenses will appear here automatically on their due dates.</p>
                        </div>
                    `;
                }
                return isAI ? `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <p>No AI planner expenses yet.</p>
                        <p>Use the "AI Smart Planner" to generate budget allocations!</p>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <p>No manually added expenses yet.</p>
                        <p>Use the "Add Expense" page to add your expenses!</p>
                    </div>
                `;
            }

            const { grouped, sortedDates } = groupExpensesByDate(expenseList, !isAI);

            return sortedDates.map(date => {
                const dateExpenses = grouped[date];
                const formattedDate = new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return `
                    <div class="card" style="margin-bottom: 1rem;">
                        <div class="card-header">
                            <h4 class="card-title" style="font-size: 1.1rem;">${formattedDate}</h4>
                        </div>
                        <div class="card-content">
                            ${dateExpenses.map(expense => `
                                <div class="expense-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid ${expense.category === 'Income' ? 'var(--color-yellow-400)' : 'var(--border-color)'}; border-radius: var(--radius-lg); margin-bottom: 0.5rem; ${expense.category === 'Income' ? 'background: rgba(250, 204, 21, 0.1);' : expense.category === 'Savings' ? 'background: rgba(34, 197, 94, 0.1); border-color: var(--color-green-500);' : isAuto ? 'background: rgba(59, 130, 246, 0.1); border-color: var(--color-blue-500);' : ''}">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 1.25rem;">${expense.icon}</span>
                                        <div>
                                            <div style="font-weight: 500;">${isAI ? expense.name.replace(' Budget', '') : expense.name} ${isAuto ? '<span style="background: var(--color-blue-500); color: white; padding: 0.125rem 0.25rem; border-radius: var(--radius); font-size: 0.625rem; margin-left: 0.5rem;">AUTO-PAY</span>' : ''}</div>
                                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${expense.category} • ${expense.time}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; ${expense.category === 'Income' ? 'color: var(--color-yellow-600);' : ''}">
                                            ₹${expense.amount.toLocaleString()}
                                        </div>
                                        ${expense.category !== 'Income' ? `
                                        <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem;">
                                            ${isAI ?
                            `<button onclick="app.editExpense('${expense.id}')" style="background: var(--color-purple-500); color: white; border: none; border-radius: var(--radius); padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer;">Edit</button>` :
                            ''
                        }
                                            ${isAI && expense.category === 'Savings' ?
                            `<button onclick="app.addToTotalSavings('${expense.id}')" style="background: var(--color-green-500); color: white; border: none; border-radius: var(--radius); padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer;">Add to Savings</button>` :
                            isAI ?
                                `<button onclick="app.moveToManual('${expense.id}')" style="background: var(--color-blue-500); color: white; border: none; border-radius: var(--radius); padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer;">Move to Manual</button>` :
                                ''
                        }
                                            ${isAI ? `<button onclick="app.deleteExpense('${expense.id}')" style="background: var(--color-red-500); color: white; border: none; border-radius: var(--radius); padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer;">Delete</button>` : ''}
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        };

        // Update manual expenses section - include income entries in date cards
        manualExpensesList.innerHTML = renderDateCards(manualExpenses, false, false);

        // Update AI expenses section - don't include income entries
        aiExpensesList.innerHTML = renderDateCards(aiExpenses, true, false);

        // Update auto expenses section (if exists)
        const autoExpensesList = document.getElementById('auto-expenses-list');
        if (autoExpensesList) {
            autoExpensesList.innerHTML = renderDateCards(autoExpenses, false, true);
        }
    }

    initRewardsPage() {
        this.updateRewards();
        this.loadLeaderboard();
        this.initParticleEffects();
    }

    updateRewards() {
        // Calculate total points from earned badges
        const availableBadges = [
            { name: 'Smart Saver', icon: '💰', description: 'Save for 1 month', required: 1, points: 100 },
            { name: 'Budget Pro', icon: '📊', description: 'Stay under budget for 3 months', required: 3, points: 300 },
            { name: 'Zero Waste', icon: '♻️', description: 'Optimize all expenses', required: 5, points: 500 },
            { name: 'Financial Guru', icon: '🎓', description: 'Stay under budget for 6 months', required: 6, points: 600 },
            { name: 'Savings Master', icon: '🏆', description: 'Save ₹100,000 total', required: 10, points: 1000 },
            { name: 'First Month', icon: '🌟', description: 'Complete your first month', required: 1, points: 50 },
        ];

        const earnedBadges = this.userPoints.badges || [];
        const calculatedTotalPoints = availableBadges
            .filter(badge => earnedBadges.includes(badge.name))
            .reduce((sum, badge) => sum + badge.points, 0);

        // Use calculated points or fallback to stored points
        const totalPoints = calculatedTotalPoints || this.userPoints.total || 0;

        this.updateElement('total-points', totalPoints);

        const badgesList = document.getElementById('badges-list');
        if (badgesList) {
            badgesList.innerHTML = this.userPoints.badges.map(badge => `
                <div style="background: var(--color-purple-500); color: white; padding: 0.5rem 1rem; border-radius: var(--radius-lg); margin: 0.25rem; display: inline-block;">
                    ${badge}
                </div>
            `).join('');
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('./php/api.php?action=getLeaderboard');
            const result = await response.json();

            const leaderboardContent = document.getElementById('leaderboard-content');
            if (!leaderboardContent) return;

            if (result.success && result.data && result.data.length > 0) {
                const userRank = result.data.findIndex(user => user.id === this.userId) + 1;

                leaderboardContent.innerHTML = `
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="margin: 0; color: var(--text-primary);">Your Rank: <span style="color: var(--color-purple-600); font-weight: 600;">#${userRank || 'N/A'}</span></h4>
                            <span style="color: var(--text-secondary); font-size: 0.875rem;">Top 10 Users</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${result.data.slice(0, 10).map((user, index) => {
                    const isCurrentUser = user.id === this.userId;
                    const rank = index + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';

                    return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: 0.5rem; background: ${isCurrentUser ? 'var(--color-purple-50)' : 'var(--bg-card)'}; border: 1px solid ${isCurrentUser ? 'var(--color-purple-200)' : 'var(--border-color)'};">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span style="font-size: 1.25rem;">${medal}</span>
                                            <div>
                                                <div style="font-weight: 500; color: ${isCurrentUser ? 'var(--color-purple-600)' : 'var(--text-primary)'};">${user.first_name} ${user.last_name}</div>
                                                <div style="font-size: 0.75rem; color: var(--text-secondary);">Level ${Math.floor(user.total_points / 500) + 1}</div>
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-weight: 600; color: var(--color-purple-600);">${user.total_points} pts</div>
                                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${user.months_under_budget} months</div>
                                        </div>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `;
            } else {
                leaderboardContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
                        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">No Rankings Yet</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1rem;">Be the first to earn points and badges!</p>
                        <p style="color: var(--text-secondary); font-size: 0.875rem;">Start by staying under budget this month to earn your first achievement.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            const leaderboardContent = document.getElementById('leaderboard-content');
            if (leaderboardContent) {
                leaderboardContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
                        <p style="color: var(--text-secondary);">Unable to load leaderboard</p>
                    </div>
                `;
            }
        }
    }

    initParticleEffects() {
        // Create particle container if it doesn't exist
        if (!document.getElementById('particle-container')) {
            const particleContainer = document.createElement('div');
            particleContainer.id = 'particle-container';
            particleContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                overflow: hidden;
            `;
            document.body.appendChild(particleContainer);
        }

        // Add hover effects to rewards cards
        const rewardsCards = document.querySelectorAll('.rewards-card');
        rewardsCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                this.createParticles(e.currentTarget);
            });

            card.addEventListener('mouseleave', (e) => {
                // Instantly remove highlight effects on mouse leave
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = '';
            });
        });
    }

    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Determine card type and colors
        let particleColors = [];
        if (element.querySelector('h3').textContent.includes('Total Points')) {
            particleColors = ['#8b5cf6', '#a855f7', '#c084fc', '#ddd6fe', '#3b82f6', '#60a5fa'];
            element.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.4)';
        } else if (element.querySelector('h3').textContent.includes('Badges Earned')) {
            particleColors = ['#22c55e', '#16a34a', '#15803d', '#dcfce7', '#4ade80', '#86efac'];
            element.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.4)';
        } else if (element.querySelector('h3').textContent.includes('Streak')) {
            particleColors = ['#f97316', '#ea580c', '#dc2626', '#fed7aa', '#fb923c', '#f87171'];
            element.style.boxShadow = '0 0 30px rgba(249, 115, 22, 0.4)';
        }

        // Add highlight effect to card
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'all 0.3s ease';

        // Create 8-12 particles
        const particleCount = Math.random() * 4 + 8;

        for (let i = 0; i < particleCount; i++) {
            this.createSingleParticle(centerX, centerY, particleColors);
        }

        // Remove highlight after particles finish (but mouseleave will override this)
        setTimeout(() => {
            element.style.boxShadow = '';
            element.style.transform = '';
        }, 2000);
    }

    createSingleParticle(x, y, particleColors) {
        const particle = document.createElement('div');
        const particleContainer = document.getElementById('particle-container');

        // Random properties
        const size = Math.random() * 6 + 4;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const lifetime = Math.random() * 1000 + 1500;

        // Calculate end position
        const distance = Math.random() * 80 + 40;
        const endX = x + Math.cos(angle) * distance;
        const endY = y + Math.sin(angle) * distance;

        // Use card-specific colors
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];

        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            opacity: 0.8;
            box-shadow: 0 0 ${size}px ${color};
        `;

        particleContainer.appendChild(particle);

        // Animate particle
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / lifetime;

            if (progress >= 1) {
                particle.remove();
                return;
            }

            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentX = x + (endX - x) * easeOut;
            const currentY = y + (endY - y) * easeOut;
            const currentOpacity = 0.8 * (1 - progress);
            const currentSize = size * (1 - progress * 0.5);

            particle.style.left = `${currentX}px`;
            particle.style.top = `${currentY}px`;
            particle.style.opacity = currentOpacity;
            particle.style.width = `${currentSize}px`;
            particle.style.height = `${currentSize}px`;
            particle.style.boxShadow = `0 0 ${currentSize * 2}px ${color}`;
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    generateFeedbackContent() {
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title"><i data-lucide="message-square" style="width: 2rem; height: 2rem; margin-right: 0.5rem;"></i>Feedback</h1>
                    <p class="page-subtitle">Share your thoughts and see what others are saying</p>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="card feedback-stat-card" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(59, 130, 246, 0.2); position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
                    <canvas class="feedback-particle-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; transition: opacity 0.3s;"></canvas>
                    <div class="card-content" style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 2rem; margin-top: 20px; margin-bottom: 0.5rem;">📊</div>
                        <div class="amount" id="feedback-total-count" style="font-size: 2rem; font-weight: 700;">0</div>
                        <p style="color: var(--text-secondary);">Total Feedback</p>
                    </div>
                </div>
                <div class="card feedback-stat-card" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(34, 197, 94, 0.2); position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
                    <canvas class="feedback-particle-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; transition: opacity 0.3s;"></canvas>
                    <div class="card-content" style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 2rem; margin-top: 20px; margin-bottom: 0.5rem;">👍</div>
                        <div class="amount" id="feedback-total-likes" style="font-size: 2rem; font-weight: 700;">0</div>
                        <p style="color: var(--text-secondary);">Total Likes</p>
                    </div>
                </div>
                <div class="card feedback-stat-card" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)); border: 1px solid rgba(239, 68, 68, 0.2); position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
                    <canvas class="feedback-particle-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; transition: opacity 0.3s;"></canvas>
                    <div class="card-content" style="text-align: center; position: relative; z-index: 1;">
                        <div style="font-size: 2rem; margin-top: 20px; margin-bottom: 0.5rem;">👎</div>
                        <div class="amount" id="feedback-total-dislikes" style="font-size: 2rem; font-weight: 700;">0</div>
                        <p style="color: var(--text-secondary);">Total Dislikes</p>
                    </div>
                </div>
            </div>

            <!-- Search and Sort Controls -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-content" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-top: 20px;">
                    <input type="text" id="feedback-search" class="form-input" placeholder="🔍 Search feedback..." style="flex: 1; min-width: 250px;">
                    <select id="feedback-sort" class="form-select" style="min-width: 180px;">
                        <option value="newest">⏰ Newest First</option>
                        <option value="oldest">📅 Oldest First</option>
                        <option value="most-likes">🔥 Most Likes</option>
                        <option value="least-likes">📈 Least Likes</option>
                    </select>
                </div>
            </div>

            <!-- Feedback Grid -->
            <div id="feedback-grid" style="display: grid; gap: 1.5rem; margin-bottom: 2rem;">
                <!-- Feedback cards will be inserted here -->
            </div>

            <!-- Floating Action Button -->
            <button id="feedback-fab" class="fab" style="position: fixed; bottom: 2rem; right: 2rem; width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--color-purple-500), var(--color-blue-500)); color: white; border: none; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); transition: all 0.3s ease; z-index: 100; display: flex; align-items: center; justify-content: center;">
                +
            </button>

            <!-- Feedback Modal -->
            <div id="feedback-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 90%; max-width: 500px; padding: 2rem;">
                    <h2 style="margin-bottom: 1.5rem; text-align: center;">✨ Submit Your Feedback</h2>
                    <form id="feedback-form">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" id="feedback-first-name" class="form-input" placeholder="Enter your first name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input type="text" id="feedback-last-name" class="form-input" placeholder="Enter your last name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Your Feedback</label>
                            <textarea id="feedback-text" class="form-input" placeholder="Share your thoughts..." required style="min-height: 120px; resize: vertical;"></textarea>
                        </div>
                        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                            <button type="button" id="feedback-cancel" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);">Cancel</button>
                            <button type="submit" class="btn-primary" style="padding: 0.75rem 1.5rem;">Submit Feedback</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    initFeedbackPage() {
        this.feedbackData = [];
        this.loadFeedback();

        // Search and sort
        const searchInput = document.getElementById('feedback-search');
        const sortSelect = document.getElementById('feedback-sort');

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.renderFeedback(), 300);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.renderFeedback());
        }

        // Modal controls
        const fab = document.getElementById('feedback-fab');
        const modal = document.getElementById('feedback-modal');
        const cancelBtn = document.getElementById('feedback-cancel');
        const form = document.getElementById('feedback-form');

        if (fab && modal) {
            fab.addEventListener('click', () => {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }

        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                if (form) form.reset();
            });

            // Add hover effect for cancel button
            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                cancelBtn.style.transform = 'translateY(-2px)';
                cancelBtn.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
            });
            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                cancelBtn.style.transform = 'translateY(0)';
                cancelBtn.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                    if (form) form.reset();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.submitFeedback(e));
        }

        // Add particle animations to stats cards
        this.initFeedbackStatsParticles();
    }

    async loadFeedback() {
        try {
            const response = await fetch(`./php/api.php?action=getFeedback&userId=${this.userId}`);
            const data = await response.json();

            if (data.success) {
                this.feedbackData = data.data || [];
                this.renderFeedback();
                this.updateFeedbackStats();
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
        }
    }

    renderFeedback() {
        const grid = document.getElementById('feedback-grid');
        if (!grid) return;

        const searchTerm = (document.getElementById('feedback-search')?.value || '').toLowerCase();
        const sortBy = document.getElementById('feedback-sort')?.value || 'newest';

        let filtered = this.feedbackData.filter(item =>
            ((item.first_name + ' ' + item.last_name).toLowerCase().includes(searchTerm)) ||
            (item.feedback || '').toLowerCase().includes(searchTerm)
        );

        // Sort
        switch (sortBy) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
                break;
            case 'most-likes':
                filtered.sort((a, b) => b.likes - a.likes);
                break;
            case 'least-likes':
                filtered.sort((a, b) => a.likes - b.likes);
                break;
            default:
                filtered.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        }

        grid.innerHTML = '';

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No feedback found. Be the first to share!</p>';
            return;
        }

        filtered.forEach(item => {
            const initials = (item.first_name?.[0] || '') + (item.last_name?.[0] || '');
            const dateText = item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = 'padding: 1.5rem; transition: all 0.3s ease;';
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 60px; height: 60px; border-radius: 0.75rem; background: linear-gradient(135deg, var(--color-purple-500), var(--color-blue-500)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.25rem;">
                        ${initials}
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600;">${item.first_name} ${item.last_name || ''}</h3>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">${dateText}</div>
                    </div>
                </div>
                <div style="margin-bottom: 1rem; line-height: 1.7; color: var(--text-secondary);">
                    <p>${item.feedback}</p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="feedback-like-btn" data-id="${item.id}" style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: ${item.userLiked ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-card)'}; color: ${item.userLiked ? 'var(--color-green-500)' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;">
                        👍 <span>${item.likes || 0}</span>
                    </button>
                    <button class="feedback-dislike-btn" data-id="${item.id}" style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: ${item.userDisliked ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'}; color: ${item.userDisliked ? 'var(--color-red-500)' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;">
                        👎 <span>${item.dislikes || 0}</span>
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });

        // Add event listeners for like/dislike buttons
        grid.querySelectorAll('.feedback-like-btn').forEach(btn => {
            btn.addEventListener('click', () => this.reactToFeedback(btn.dataset.id, 'like'));
        });
        grid.querySelectorAll('.feedback-dislike-btn').forEach(btn => {
            btn.addEventListener('click', () => this.reactToFeedback(btn.dataset.id, 'dislike'));
        });
    }

    async submitFeedback(e) {
        e.preventDefault();

        const firstName = document.getElementById('feedback-first-name').value;
        const lastName = document.getElementById('feedback-last-name').value;
        const feedbackText = document.getElementById('feedback-text').value;

        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submitFeedback',
                    firstName: firstName,
                    lastName: lastName,
                    feedback: feedbackText
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast('Feedback submitted successfully!', 'success');
                document.getElementById('feedback-modal').style.display = 'none';
                document.body.style.overflow = '';
                document.getElementById('feedback-form').reset();
                await this.loadFeedback();
            } else {
                this.showToast('Failed to submit feedback', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showToast('Error submitting feedback', 'error');
        }
    }

    async reactToFeedback(feedbackId, reaction) {
        try {
            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reactFeedback',
                    feedbackId: feedbackId,
                    userId: this.userId,
                    reaction: reaction
                })
            });

            const result = await response.json();
            if (result.success) {
                await this.loadFeedback();
            }
        } catch (error) {
            console.error('Error reacting to feedback:', error);
        }
    }

    updateFeedbackStats() {
        const totalCount = this.feedbackData.length;
        const totalLikes = this.feedbackData.reduce((sum, item) => sum + (item.likes || 0), 0);
        const totalDislikes = this.feedbackData.reduce((sum, item) => sum + (item.dislikes || 0), 0);

        this.updateElement('feedback-total-count', totalCount);
        this.updateElement('feedback-total-likes', totalLikes);
        this.updateElement('feedback-total-dislikes', totalDislikes);
    }

    initFeedbackStatsParticles() {
        const statCards = document.querySelectorAll('.feedback-stat-card');
        const colors = [
            '#3B82F6', // Blue for total feedback
            '#10B981', // Green for likes
            '#EF4444'  // Red for dislikes
        ];

        statCards.forEach((card, index) => {
            const canvas = card.querySelector('.feedback-particle-canvas');
            if (!canvas) return;

            let stopAnimation = null;

            card.addEventListener('mouseenter', () => {
                canvas.style.opacity = '1';
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = `0 8px 16px ${colors[index]}40, 0 4px 8px rgba(0, 0, 0, 0.15)`;
                stopAnimation = this.createParticleAnimation(canvas, colors[index]);
            });

            card.addEventListener('mouseleave', () => {
                canvas.style.opacity = '0';
                card.style.transform = 'translateY(0)';
                // Restore original shadow based on card type
                const originalShadows = [
                    '0 4px 6px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                    '0 4px 6px rgba(34, 197, 94, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
                    '0 4px 6px rgba(239, 68, 68, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                ];
                card.style.boxShadow = originalShadows[index];
                if (stopAnimation) {
                    stopAnimation();
                    stopAnimation = null;
                }
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        });
    }

    createParticleAnimation(canvas, color) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const particles = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        let animationId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }

    initSettingsPage() {
        // Load user profile data
        this.loadUserProfile();

        // Load auto-pay expenses
        this.loadAutoPayExpenses();

        // Initialize profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUserProfile();
            });
        }

        // Initialize settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(settingsForm);
                const income = parseFloat(formData.get('income'));
                const incrementDate = formData.get('incrementDate') ? parseInt(formData.get('incrementDate')) : null;
                const savingsGoal = parseFloat(formData.get('savingsGoal'));

                this.updateIncome(income, incrementDate);
                this.updateSavingsGoal(savingsGoal);
            });
        }

        // Reset settings button handler
        const resetBtn = document.getElementById('reset-settings-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showResetIncomeConfirmation();
            });
        }

        // Initialize add auto-pay button
        const addAutoPayBtn = document.getElementById('add-auto-pay-btn');
        if (addAutoPayBtn) {
            addAutoPayBtn.addEventListener('click', () => {
                this.navigateToPage('add-expense');
            });
        }

        // Initialize logout button
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`./php/api.php?action=getUserProfile&userId=${this.userId}`);
            const result = await response.json();

            if (result.success) {
                const profile = result.data;
                document.getElementById('profile-first-name').value = profile.first_name || '';
                document.getElementById('profile-last-name').value = profile.last_name || '';
                document.getElementById('profile-email').value = profile.email || '';
                document.getElementById('profile-contact').value = profile.contact || '';
                document.getElementById('profile-dob').value = profile.dob || '';
            } else {
                this.showToast('Failed to load profile data', 'error');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showToast('Error loading profile data', 'error');
        }
    }

    async updateUserProfile() {
        try {
            const profile = {
                first_name: document.getElementById('profile-first-name').value.trim(),
                last_name: document.getElementById('profile-last-name').value.trim(),
                email: document.getElementById('profile-email').value.trim(),
                contact: document.getElementById('profile-contact').value.trim(),
                dob: document.getElementById('profile-dob').value
            };

            const response = await fetch('./php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updateUserProfile',
                    userId: this.userId,
                    profile: profile
                })
            });

            const result = await response.json();
            if (result.success) {
                this.showToast('Profile updated successfully!', 'success');
            } else {
                this.showToast(result.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Error updating profile', 'error');
        }
    }

    async loadAutoPayExpenses() {
        try {
            const response = await fetch(`./php/api.php?action=getFixedExpenses&userId=${this.userId}`);
            const result = await response.json();

            const autoPayList = document.getElementById('auto-pay-list');
            if (!autoPayList) return;

            if (result.success && result.data && result.data.length > 0) {
                autoPayList.innerHTML = result.data.map(expense => `
                    <div class="fixed-expense-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); margin-bottom: 0.5rem; background: var(--bg-card);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.25rem;">${expense.icon}</span>
                            <div>
                                <div style="font-weight: 500;">${expense.name}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">${expense.category} • Due on ${expense.due_date}${expense.due_date === 1 ? 'st' : expense.due_date === 2 ? 'nd' : expense.due_date === 3 ? 'rd' : 'th'} of each month</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">₹${parseFloat(expense.amount).toLocaleString()}</div>
                            <div style="display: flex; gap: 0.25rem;">
                                <button onclick="app.editFixedExpense('${expense.id}')" style="background: var(--color-blue-500); color: white; border: none; border-radius: var(--radius); padding: 0.375rem 0.75rem; font-size: 0.75rem; cursor: pointer;">Edit</button>
                                <button onclick="app.deleteFixedExpense('${expense.id}')" style="background: var(--color-red-500); color: white; border: none; border-radius: var(--radius); padding: 0.375rem 0.75rem; font-size: 0.75rem; cursor: pointer;">Delete</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                autoPayList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No auto-pay expenses set up yet.</p>';
            }
        } catch (error) {
            console.error('Error loading auto-pay expenses:', error);
            const autoPayList = document.getElementById('auto-pay-list');
            if (autoPayList) {
                autoPayList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error loading auto-pay expenses.</p>';
            }
        }
    }

    async editFixedExpense(expenseId) {
        try {
            // Get the expense data
            const response = await fetch(`./php/api.php?action=getFixedExpenses&userId=${this.userId}`);
            const result = await response.json();

            if (!result.success) {
                this.showToast('Failed to load expense data', 'error');
                return;
            }

            const expense = result.data.find(exp => exp.id == expenseId);
            if (!expense) {
                this.showToast('Expense not found', 'error');
                return;
            }

            // Create edit modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
            `;

            modal.innerHTML = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 500px; width: 90%; box-shadow: var(--shadow-xl);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 1.25rem;">Edit Auto-Pay Expense</h3>
                        <button id="close-edit-modal" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem; border-radius: var(--radius);">
                            <i data-lucide="x" style="width: 1.25rem; height: 1.25rem;"></i>
                        </button>
                    </div>

                    <form id="edit-fixed-expense-form">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Expense Name</label>
                            <input type="text" name="name" value="${expense.name}" class="form-input" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Amount (₹)</label>
                            <input type="number" name="amount" value="${expense.amount}" class="form-input" step="0.01" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Category</label>
                            <select name="category" class="form-select" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                                <option value="">Select Category</option>
                                ${this.availableCategories.map(cat => `<option value="${cat.name}" ${cat.name === expense.category ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                            </select>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Due Date (Day of Month)</label>
                            <select name="dueDate" class="form-select" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--bg-card); color: var(--text-primary); font-size: 1rem;">
                                <option value="">Select day</option>
                                ${Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                return `<option value="${day}" ${day === expense.due_date ? 'selected' : ''}>${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month</option>`;
            }).join('')}
                            </select>
                        </div>

                        <div style="display: flex; gap: 0.75rem;">
                            <button type="button" id="cancel-edit" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                                Cancel
                            </button>
                            <button type="submit" style="flex: 1; padding: 0.75rem; background: var(--color-blue-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                                Update Expense
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Event listeners
            const closeModal = () => modal.remove();

            document.getElementById('close-edit-modal').addEventListener('click', closeModal);
            document.getElementById('cancel-edit').addEventListener('click', closeModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Form submission
            document.getElementById('edit-fixed-expense-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const updatedExpense = {
                    name: formData.get('name'),
                    amount: parseFloat(formData.get('amount')),
                    category: formData.get('category'),
                    icon: formData.get('icon') || this.getCategoryIcon(formData.get('category')),
                    dueDate: parseInt(formData.get('dueDate'))
                };

                try {
                    const updateResponse = await fetch('./php/api.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'updateFixedExpense',
                            userId: this.userId,
                            fixedExpenseId: expenseId,
                            fixedExpense: updatedExpense
                        })
                    });

                    const updateResult = await updateResponse.json();

                    if (updateResult.success) {
                        this.showToast('Auto-pay expense updated successfully!', 'success');
                        closeModal();
                        this.loadAutoPayExpenses(); // Reload the list
                    } else {
                        this.showToast(`Failed to update expense: ${updateResult.error || 'Unknown error'}`, 'error');
                        console.error('Update failed:', updateResult.error);
                    }
                } catch (error) {
                    console.error('Error updating fixed expense:', error);
                    this.showToast(`Error updating expense: ${error.message}`, 'error');
                }
            });

        } catch (error) {
            console.error('Error editing fixed expense:', error);
            this.showToast('Error loading expense data', 'error');
        }
    }

    async deleteFixedExpense(expenseId) {
        // Create custom confirmation modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 400px; width: 90%; box-shadow: var(--shadow-xl);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.25rem;">Delete Auto-Pay Expense</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">Are you sure you want to delete this auto-pay expense? This action cannot be undone.</p>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" id="cancel-delete" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: 1px solid #d1d5db; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        Cancel
                    </button>
                    <button type="button" id="confirm-delete" style="flex: 1; padding: 0.75rem; background: var(--color-red-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        Delete Expense
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event listeners
        const closeModal = () => modal.remove();

        document.getElementById('cancel-delete').addEventListener('click', closeModal);
        document.getElementById('confirm-delete').addEventListener('click', async () => {
            closeModal();

            try {
                const response = await fetch('./php/api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'deleteFixedExpense',
                        userId: this.userId,
                        fixedExpenseId: expenseId
                    })
                });

                const result = await response.json();
                if (result.success) {
                    this.showToast('Auto-pay expense deleted successfully!', 'success');
                    this.loadAutoPayExpenses(); // Reload the list
                } else {
                    this.showToast(`Failed to delete expense: ${result.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Error deleting fixed expense:', error);
                this.showToast(`Error deleting expense: ${error.message}`, 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    getCategoryIcon(category) {
        // Prefer server-provided icon if available
        if (this.categoryIconByName && this.categoryIconByName[category]) {
            return this.categoryIconByName[category];
        }
        const icons = {
            'Housing': '🏠',
            'Food': '🍔',
            'Transport': '🚗',
            'Entertainment': '🎮',
            'Healthcare': '🏥',
            'Shopping': '🛒',
            'Savings': '💰',
            'Utilities': '💡',
            'Education': '🎓',
            'Insurance': '🛡️',
            'Debt': '📉',
            'Other': '📦'
        };
        return icons[category] || '📦';
    }

    showResetIncomeConfirmation() {
        // Create custom confirmation modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(8px);
            animation: fadeIn 0.2s ease-out;
        `;

        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .reset-modal-content {
                    animation: slideUp 0.3s ease-out;
                }
            </style>
            <div class="reset-modal-content" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 1rem; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem;">
                        🔄
                    </div>
                    <h3 style="margin: 0 0 0.75rem 0; color: var(--text-primary); font-size: 1.5rem; font-weight: 700;">Reset Income & Savings?</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6;">This will reset your income and savings goal to zero and clear all income increment settings. This action cannot be undone.</p>
                </div>

                <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.05)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--color-red-600); font-size: 0.875rem; font-weight: 500;">
                        <span style="font-size: 1.25rem;">⚠️</span>
                        <span>All income history and auto-increment settings will be permanently deleted</span>
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" id="cancel-reset-income" style="flex: 1; padding: 0.875rem 1.5rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); cursor: pointer; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                        Cancel
                    </button>
                    <button type="button" id="confirm-reset-income" style="flex: 1; padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                        Reset Everything
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeModal = () => {
            modal.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => modal.remove(), 200);
        };

        const cancelBtn = document.getElementById('cancel-reset-income');
        const confirmBtn = document.getElementById('confirm-reset-income');

        // Cancel button
        cancelBtn.addEventListener('click', closeModal);

        // Cancel button hover effects
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'var(--bg-tertiary)';
            cancelBtn.style.transform = 'translateY(-1px)';
            cancelBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'var(--bg-secondary)';
            cancelBtn.style.transform = 'translateY(0)';
            cancelBtn.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        });

        // Confirm button
        confirmBtn.addEventListener('click', async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Resetting...';

            try {
                const response = await fetch('./php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'resetIncomeSettings', userId: this.userId })
                });

                const result = await response.json();
                if (result.success) {
                    this.showToast('✅ Income and savings reset successfully!', 'success');
                    closeModal();
                    await this.loadInitialData();
                } else {
                    this.showToast('Failed to reset settings: ' + (result.error || ''), 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Reset Everything';
                }
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showToast('Error resetting settings', 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Reset Everything';
            }
        });

        // Confirm button hover effects
        confirmBtn.addEventListener('mouseenter', () => {
            if (!confirmBtn.disabled) {
                confirmBtn.style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)';
                confirmBtn.style.transform = 'translateY(-2px)';
                confirmBtn.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }
        });
        confirmBtn.addEventListener('mouseleave', () => {
            if (!confirmBtn.disabled) {
                confirmBtn.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
                confirmBtn.style.transform = 'translateY(0)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Add spin animation for loading state
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== Helper methods for categories and AI planner =====
    populateAddExpenseCategories() {
        const select = document.getElementById('add-expense-category');
        if (!select) return;
        if (!Array.isArray(this.availableCategories) || this.availableCategories.length === 0) {
            // Keep placeholder; loadCategories() will repopulate on success
            select.innerHTML = '<option value="">Loading categories...</option>';
            return;
        }
        const filteredCategories = this.availableCategories.filter(c => c.name !== 'Savings');
        select.innerHTML = '<option value="">Select Category</option>' +
            filteredCategories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
    }

    async loadCategories() {
        // Debounce multiple concurrent calls to prevent resource exhaustion
        if (this._categoriesPromise) {
            return this._categoriesPromise;
        }
        try {
            this._categoriesPromise = fetch('./php/api.php?action=getCategories');
            const res = await this._categoriesPromise;
            console.log('Categories response status:', res.status);
            if (!res.ok) {
                console.error('Categories fetch failed', res.status, res.statusText);
                // Fallback to defaults
                this.availableCategories = this._defaultCategories;
                this.categoryIconByName = {};
                this.availableCategories.forEach(c => { this.categoryIconByName[c.name] = c.icon; });
                this.populateAddExpenseCategories();
                this.renderPlannerCategories();
                this._categoriesPromise = null;
                return;
            }
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                this.availableCategories = data.data.map((c) => ({ id: String(c.id), name: c.name, icon: c.icon || '📦' }));
                this.categoryIconByName = {};
                this.availableCategories.forEach(c => { this.categoryIconByName[c.name] = c.icon; });
                // Ensure Savings category is available for AI planner
                if (!this.availableCategories.find(c => c.name === 'Savings')) {
                    this.availableCategories.push({ id: '11', name: 'Savings', icon: '💰' });
                    this.categoryIconByName['Savings'] = '💰';
                }
                // Immediately populate any visible UIs
                this.populateAddExpenseCategories();
                this.renderPlannerCategories();
            } else {
                console.warn('Categories payload invalid or empty - using defaults');
                this.availableCategories = this._defaultCategories;
                this.categoryIconByName = {};
                this.availableCategories.forEach(c => { this.categoryIconByName[c.name] = c.icon; });
                this.populateAddExpenseCategories();
                this.renderPlannerCategories();
            }
            this._categoriesPromise = null;
        } catch (e) {
            console.error('Failed to load categories', e);
            // Fallback to defaults on network errors
            this.availableCategories = this._defaultCategories;
            this.categoryIconByName = {};
            this.availableCategories.forEach(c => { this.categoryIconByName[c.name] = c.icon; });
            this.populateAddExpenseCategories();
            this.renderPlannerCategories();
            this._categoriesPromise = null;
        }
    }

    renderPlannerCategories() {
        const container = document.getElementById('ai-category-list');
        if (!container) return;
        if (!Array.isArray(this.availableCategories) || this.availableCategories.length === 0) {
            // Show empty state; loadCategories() will rerender on success
            container.innerHTML = '';
            return;
        }
        const filteredCategories = this.availableCategories.filter(c => c.name !== 'Savings');
        const isDark = document.body.classList.contains('dark');
        container.innerHTML = filteredCategories.map(c => {
            const selected = this.aiSelectedCategories.has(c.name);
            const baseBorder = '1px solid ' + (selected ? 'var(--color-purple-500)' : 'var(--border-color)');
            const baseBg = selected ? (isDark ? 'rgba(139,92,246,0.25)' : 'rgba(100, 80, 150, 0.85)') : (isDark ? 'rgba(42, 49, 65, 0.7)' : '#ffffff');
            const textColor = selected ? '#ffffff' : (isDark ? '#e5e7eb' : '#1f2937');
            return `
					<div class="ai-cat-card" data-name="${c.name}"
						style="user-select:none; border:${baseBorder}; background:${baseBg};
						border-radius: var(--radius-lg); padding:.75rem .9rem; display:flex; align-items:center; gap:.6rem; cursor:pointer; transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;">
						<span style="font-size:1.1rem;">${c.icon}</span>
						<span style="font-weight:600; color:${textColor};">${c.name}</span>
					</div>
				`;
        }).join('');

        // Hover + click interactions
        container.querySelectorAll('.ai-cat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.boxShadow = '0 0 0 2px var(--color-purple-400) inset';
                card.style.borderColor = 'var(--color-purple-500)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = '';
                const name = card.getAttribute('data-name');
                card.style.borderColor = this.aiSelectedCategories.has(name) ? 'var(--color-purple-500)' : 'var(--border-color)';
            });
            card.addEventListener('click', () => {
                const name = card.getAttribute('data-name');
                if (this.aiSelectedCategories.has(name)) {
                    this.aiSelectedCategories.delete(name);
                    const isDarkMode = document.body.classList.contains('dark');
                    card.style.borderColor = 'var(--border-color)';
                    card.style.background = isDarkMode ? 'rgba(42, 49, 65, 0.7)' : '#ffffff';
                    card.querySelector('span:last-child').style.color = isDarkMode ? '#e5e7eb' : '#1f2937';
                } else {
                    this.aiSelectedCategories.add(name);
                    card.style.borderColor = 'var(--color-purple-500)';
                    card.style.background = document.body.classList.contains('dark') ? 'rgba(139,92,246,0.25)' : 'rgba(100, 80, 150, 0.85)';
                    card.querySelector('span:last-child').style.color = '#ffffff';
                }
            });
        });
    }

    generateAIPlan() {
        const budgetInput = document.getElementById('ai-budget');
        const durationSel = document.getElementById('ai-duration');
        const output = document.getElementById('ai-plan-output');
        if (!budgetInput || !durationSel || !output) return;
        const budget = parseFloat(budgetInput.value || '0');
        if (!(budget > 0)) {
            this.showToast('Enter a valid budget amount', 'error');
            return;
        }
        const checked = Array.from(this.aiSelectedCategories);
        if (checked.length === 0) {
            this.showToast('Select at least one category', 'error');
            return;
        }

        // Check savings option
        const savingsOption = document.querySelector('input[name="savings-option"]:checked').value;
        let savingsAmount = 0;
        let savingsPercent = 0;

        if (savingsOption === 'yes') {
            const savingsAmountInput = document.getElementById('savings-amount');
            const savingsPercentInput = document.getElementById('savings-percent');

            savingsAmount = parseFloat(savingsAmountInput.value) || 0;
            savingsPercent = parseFloat(savingsPercentInput.value) || 0;

            // Validate savings inputs
            if (savingsAmount <= 0 && savingsPercent <= 0) {
                this.showToast('Enter either savings amount or percentage', 'error');
                return;
            }

            // If both are provided, use percentage as primary
            if (savingsPercent > 0) {
                savingsAmount = Math.round((budget * savingsPercent) / 100);
            } else if (savingsAmount > 0) {
                savingsPercent = (savingsAmount / budget) * 100;
            }

            // Ensure savings doesn't exceed budget
            if (savingsAmount >= budget) {
                this.showToast('Savings cannot be equal to or greater than total budget', 'error');
                return;
            }

            // Additional validation for percentage
            if (savingsPercent > 100) {
                this.showToast('Savings percentage cannot exceed 100%', 'error');
                return;
            }
        }

        // Calculate remaining budget for categories
        const remainingBudget = budget - savingsAmount;
        // Suggested percentages for common categories
        const suggested = {
            'Housing': 30,
            'Food': 15,
            'Transport': 10,
            'Utilities': 8,
            'Healthcare': 8,
            'Savings': 15,
            'Entertainment': 5,
            'Shopping': 4,
            'Education': 3,
            'Insurance': 2
        };

        // Calculate total suggested percentage for selected categories
        let totalSuggested = 0;
        checked.forEach(name => {
            if (suggested[name]) totalSuggested += suggested[name];
        });

        // If total suggested is less than 100%, distribute remaining equally among all selected categories
        const remaining = Math.max(0, 100 - totalSuggested);
        const extraPerCategory = checked.length > 0 ? remaining / checked.length : 0;

        const allocations = checked.map(name => {
            const basePercent = suggested[name] || 0;
            const percent = basePercent + extraPerCategory;
            const amount = Math.round((remainingBudget * percent) / 100);
            const icon = this.getCategoryIcon(name);
            return { name, percent, amount, icon, locked: false };
        });

        // Add savings as a special allocation if selected
        if (savingsOption === 'yes' && savingsAmount > 0) {
            allocations.push({
                name: 'Savings',
                percent: savingsPercent,
                amount: savingsAmount,
                icon: '💰',
                locked: true // Savings is always locked
            });
        }
        output.style.display = 'block';
        output.innerHTML = `
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem;">
				<div style="font-weight:600;">Proposed Allocation (${durationSel.value})</div>
				<button id="ai-accept-plan" class="btn-primary"><i data-lucide="save"></i> Save as Expenses</button>
			</div>
			<div>
				${allocations.map((a, idx) => `
					<div style="display:grid; grid-template-columns: 1fr auto; gap:.5rem; align-items:flex-start; border:1px solid var(--border-color); border-radius: var(--radius); padding:.75rem; margin:.4rem 0; ${a.name === 'Savings' ? 'background: rgba(34, 197, 94, 0.1); border-color: var(--color-green-500);' : ''}">
						<div style="display:flex; flex-direction:column; gap:.5rem;">
							<div style="display:flex; align-items:center; gap:.5rem;">
								<span>${a.icon}</span>
								<span style="font-weight:500;">${a.name}</span>
							</div>
							${a.name !== 'Savings' ? `
							<div style="display:flex; align-items:center; gap:.5rem; margin-left:1.75rem;">
								<span style="font-size:0.875rem; color:var(--text-secondary); font-weight:500;">₹</span>
								<input type="number" class="ai-amount-input" data-idx="${idx}" value="${a.amount}" min="0" max="${remainingBudget}" step="0.01" style="width:80px; padding:.375rem; border:1px solid var(--border-color); border-radius:var(--radius); font-size:0.875rem; background:var(--bg-card); color:var(--text-primary);" onfocus="this.select()">
								<input type="number" class="ai-percent-input" data-idx="${idx}" value="${a.percent.toFixed(1)}" min="0" max="100" step="0.1" style="width:60px; padding:.375rem; border:1px solid var(--border-color); border-radius:var(--radius); font-size:0.875rem; background:var(--bg-card); color:var(--text-primary);" onfocus="this.select()">
								<span style="font-size:0.875rem; color:var(--text-secondary); font-weight:500;">%</span>
								<button class="ai-lock-btn" data-idx="${idx}" style="background:var(--bg-card); border:1px solid var(--border-color); cursor:pointer; padding:.375rem; border-radius:var(--radius); transition:all .2s; display:flex; align-items:center; justify-content:center; width:32px; height:32px; color:var(--text-primary);">
									<i data-lucide="unlock" style="width:1rem; height:1rem; color:var(--text-primary);"></i>
								</button>
							</div>
							<style>
								.ai-lock-btn.locked {
									background: var(--color-purple-100) !important;
									border-color: var(--color-purple-500) !important;
								}
								.ai-lock-btn:hover {
									transform: scale(1.05);
								}
								.ai-lock-btn:active {
									transform: scale(0.95);
								}
							</style>
							` : `
							<div style="margin-left:1.75rem; padding:0.5rem; background:var(--bg-card); border-radius:var(--radius); border:1px solid var(--border-color);">
								<span style="font-size:0.875rem; color:var(--text-secondary);">Fixed savings allocation</span>
							</div>
							`}
							</div>
						</div>
						<div style="text-align:right; display:flex; flex-direction:column; gap:.25rem;">
							${a.name !== 'Savings' ? `<input type="range" min="0" max="100" value="${a.percent}" data-idx="${idx}" class="ai-range" style="width:160px;">` : `<div style="height:6px; background: var(--color-green-500); border-radius:3px;"></div>`}
							<div style="font-size:0.875rem; color:var(--text-primary);"><span class="ai-percent" data-idx="${idx}">${a.percent.toFixed(1)}%</span> · <span class="ai-amount" data-idx="${idx}">₹${a.amount.toLocaleString()}</span></div>
						</div>
					</div>
				`).join('')}
			</div>
			`;

        // Initialize Lucide icons immediately after HTML is inserted
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Wire sliders and inputs (exclude savings from interactive elements)
        const ranges = Array.from(output.querySelectorAll('.ai-range'));
        const amountInputs = Array.from(output.querySelectorAll('.ai-amount-input'));
        const percentInputs = Array.from(output.querySelectorAll('.ai-percent-input'));
        const lockButtons = Array.from(output.querySelectorAll('.ai-lock-btn'));

        // Track locked categories
        const lockedCategories = new Set();

        const syncFromRanges = () => {
            // Calculate total percentage used by locked categories
            let lockedTotalPercent = 0;
            let unlockedRanges = [];
            let unlockedTotalSlider = 0;

            ranges.forEach(r => {
                const idx = r.getAttribute('data-idx');
                const sliderValue = parseFloat(r.value);
                if (lockedCategories.has(idx)) {
                    lockedTotalPercent += sliderValue;
                } else {
                    unlockedRanges.push({ range: r, idx, sliderValue });
                    unlockedTotalSlider += sliderValue;
                }
            });

            // If no unlocked ranges or all sliders are 0, distribute evenly
            if (unlockedRanges.length === 0 || unlockedTotalSlider === 0) {
                const evenPercent = 100 / ranges.length;
                ranges.forEach(r => {
                    const idx = r.getAttribute('data-idx');
                    const amt = Math.round((budget * evenPercent) / 100);
                    const pEl = output.querySelector(`.ai-percent[data-idx="${idx}"]`);
                    const aEl = output.querySelector(`.ai-amount[data-idx="${idx}"]`);
                    const pInput = percentInputs[idx];
                    const aInput = amountInputs[idx];

                    r.value = evenPercent;
                    if (pEl) pEl.textContent = evenPercent.toFixed(1) + '%';
                    if (aEl) aEl.textContent = '₹' + amt.toLocaleString();
                    if (pInput) pInput.value = evenPercent.toFixed(1);
                    if (aInput) aInput.value = amt;
                });
                return;
            }

            // Calculate remaining percentage for unlocked categories
            const remainingPercent = Math.max(0, 100 - lockedTotalPercent);

            // Redistribute among unlocked categories
            unlockedRanges.forEach(({ range, idx, sliderValue }) => {
                const perc = unlockedTotalSlider > 0 ? (sliderValue / unlockedTotalSlider) * remainingPercent : remainingPercent / unlockedRanges.length;
                const amt = Math.round((remainingBudget * perc) / 100);
                const pEl = output.querySelector(`.ai-percent[data-idx="${idx}"]`);
                const aEl = output.querySelector(`.ai-amount[data-idx="${idx}"]`);
                const pInput = percentInputs[idx];
                const aInput = amountInputs[idx];

                range.value = perc;
                if (pEl) pEl.textContent = perc.toFixed(1) + '%';
                if (aEl) aEl.textContent = '₹' + amt.toLocaleString();
                if (pInput) pInput.value = perc.toFixed(1);
                if (aInput) aInput.value = amt;
            });
        };

        const syncFromAmountInput = (idx) => {
            let amount = parseFloat(amountInputs[idx].value) || 0;

            // Enforce max limit based on remaining budget
            if (amount > remainingBudget) {
                amount = remainingBudget;
                amountInputs[idx].value = amount;
            }

            const percent = (amount / remainingBudget) * 100;
            const range = ranges[idx];
            const pEl = output.querySelector(`.ai-percent[data-idx="${idx}"]`);
            const aEl = output.querySelector(`.ai-amount[data-idx="${idx}"]`);
            const pInput = percentInputs[idx];

            if (range) range.value = percent;
            if (pEl) pEl.textContent = percent.toFixed(1) + '%';
            if (aEl) aEl.textContent = '₹' + amount.toLocaleString();
            if (pInput) pInput.value = percent.toFixed(1);

            // Redistribute budget among other unlocked categories
            redistributeFromManualInput(idx, percent);
        };

        const syncFromPercentInput = (idx) => {
            let percent = parseFloat(percentInputs[idx].value) || 0;

            // Enforce max limit
            if (percent > 100) {
                percent = 100;
                percentInputs[idx].value = percent;
            }

            const amount = Math.round((remainingBudget * percent) / 100);
            const range = ranges[idx];
            const pEl = output.querySelector(`.ai-percent[data-idx="${idx}"]`);
            const aEl = output.querySelector(`.ai-amount[data-idx="${idx}"]`);
            const aInput = amountInputs[idx];

            if (range) range.value = percent;
            if (pEl) pEl.textContent = percent.toFixed(1) + '%';
            if (aEl) aEl.textContent = '₹' + amount.toLocaleString();
            if (aInput) aInput.value = amount;

            // Redistribute budget among other unlocked categories
            redistributeFromManualInput(idx, percent);
        };

        const syncFromRangeInput = (idx) => {
            if (lockedCategories.has(idx)) return;
            syncFromRanges();
        };

        const redistributeFromManualInput = (changedIdx, newPercent) => {
            // Calculate total percentage used by locked categories (excluding the one being changed)
            let lockedTotalPercent = 0;
            let unlockedIndices = [];

            ranges.forEach((r, idx) => {
                if (lockedCategories.has(idx.toString())) {
                    if (idx !== parseInt(changedIdx)) {
                        lockedTotalPercent += parseFloat(r.value) || 0;
                    }
                } else if (idx !== parseInt(changedIdx)) {
                    unlockedIndices.push(idx);
                }
            });

            // Calculate remaining percentage for unlocked categories (excluding the changed one)
            const remainingPercent = Math.max(0, 100 - lockedTotalPercent - newPercent);

            // Redistribute remaining percentage among other unlocked categories
            if (unlockedIndices.length > 0) {
                const percentPerUnlocked = remainingPercent / unlockedIndices.length;

                unlockedIndices.forEach(idx => {
                    const amount = Math.round((remainingBudget * percentPerUnlocked) / 100);
                    const range = ranges[idx];
                    const pEl = output.querySelector(`.ai-percent[data-idx="${idx}"]`);
                    const aEl = output.querySelector(`.ai-amount[data-idx="${idx}"]`);
                    const pInput = percentInputs[idx];
                    const aInput = amountInputs[idx];

                    if (range) range.value = percentPerUnlocked;
                    if (pEl) pEl.textContent = percentPerUnlocked.toFixed(1) + '%';
                    if (aEl) aEl.textContent = '₹' + amount.toLocaleString();
                    if (pInput) pInput.value = percentPerUnlocked.toFixed(1);
                    if (aInput) aInput.value = amount;
                });
            }
        };

        const toggleLock = (event) => {
            event.preventDefault();
            const btn = event.currentTarget;
            const idx = btn.getAttribute('data-idx');
            const icon = btn.querySelector('i');

            if (lockedCategories.has(idx)) {
                // Unlock the category
                lockedCategories.delete(idx);
                btn.innerHTML = '<i data-lucide="unlock" style="width:1rem; height:1rem; color:var(--text-primary);"></i>';
                btn.style.background = 'var(--bg-card)';
                btn.style.borderColor = 'var(--border-color)';
            } else {
                // Lock the category
                lockedCategories.add(idx);
                btn.innerHTML = '<i data-lucide="lock" style="width:1rem; height:1rem; color:var(--text-primary);"></i>';
                btn.style.background = 'var(--color-purple-500)';
                btn.style.borderColor = 'var(--color-purple-500)';
            }

            // Re-create icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Redistribute budget among unlocked categories
            syncFromRanges();
        };

        ranges.forEach(r => r.addEventListener('input', () => {
            const idx = r.getAttribute('data-idx');
            syncFromRangeInput(idx);
        }));

        amountInputs.forEach((input, idx) => input.addEventListener('input', () => syncFromAmountInput(idx)));
        percentInputs.forEach((input, idx) => input.addEventListener('input', () => syncFromPercentInput(idx)));
        lockButtons.forEach((btn) => btn.addEventListener('click', toggleLock));

        const acceptBtn = document.getElementById('ai-accept-plan');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', async () => {
                // Separate savings from regular expenses
                const savingsAllocation = allocations.find(a => a.name === 'Savings');
                const regularAllocations = allocations.filter(a => a.name !== 'Savings');

                // Prepare regular expenses - use exact displayed amount to avoid rounding differences
                const items = regularAllocations.map((allocation, i) => {
                    const amount = parseFloat(amountInputs[i].value) || 0;
                    return {
                        name: allocation.name + ' Budget',
                        amount,
                        category: allocation.name,
                        icon: allocation.icon,
                        isFixed: false
                    };
                }).filter(exp => exp.amount > 0); // Only save expenses with amount > 0

                let successCount = 0;
                let errorCount = 0;

                // Add regular expenses
                for (const exp of items) {
                    try {
                        await this.addExpense(exp, true); // Suppress individual toasts
                        successCount++;
                    } catch (error) {
                        console.error('Failed to add expense:', exp.name, error);
                        errorCount++;
                    }
                }

                // If savings was included, add as a savings expense (will be moved to total savings later)
                if (savingsAllocation && savingsAllocation.amount > 0) {
                    try {
                        const savingsExpense = {
                            name: 'Savings Allocation',
                            amount: savingsAllocation.amount,
                            category: 'Savings',
                            icon: '💰',
                            isFixed: false
                        };
                        await this.addExpense(savingsExpense, true); // Suppress toast
                        successCount++;
                    } catch (error) {
                        console.error('Failed to add savings expense:', error);
                        errorCount++;
                    }
                }

                if (errorCount === 0) {
                    this.showToast('Plan saved!', 'success');
                } else if (successCount > 0) {
                    this.showToast(`Saved ${successCount} items, but ${errorCount} failed`, 'warning');
                } else {
                    this.showToast('Failed to save plan', 'error');
                }

                this.navigateToPage('smart-plan');
            });
        }
    }

    initExpenseToggle() {
        const toggle = document.getElementById('expense-toggle');
        const manualLabel = document.getElementById('manual-label');
        const aiLabel = document.getElementById('ai-label');
        const manualCard = document.getElementById('manual-expenses-card');
        const aiCard = document.getElementById('ai-expenses-card');

        if (!toggle || !manualLabel || !aiLabel || !manualCard || !aiCard) return;

        // Set initial state based on checkbox checked state
        const setToggleState = (isChecked) => {
            const slider = toggle.nextElementSibling.querySelector('.toggle-slider');
            if (isChecked) {
                // Show AI expenses
                manualCard.style.display = 'none';
                aiCard.style.display = 'block';
                manualLabel.style.color = 'var(--text-secondary)';
                aiLabel.style.color = 'var(--color-purple-600)';
                if (slider) slider.style.transform = 'translateX(26px)';
            } else {
                // Show manual expenses
                manualCard.style.display = 'block';
                aiCard.style.display = 'none';
                manualLabel.style.color = 'var(--color-purple-600)';
                aiLabel.style.color = 'var(--text-secondary)';
                if (slider) slider.style.transform = 'translateX(0px)';
            }
        };

        // Set initial state
        setToggleState(toggle.checked);

        toggle.addEventListener('change', (e) => {
            setToggleState(e.target.checked);
        });
    }

    initAddExpenseForm() {
        const fixedCheckbox = document.getElementById('fixed-expense-checkbox');
        const dueDateContainer = document.getElementById('due-date-container');

        if (!fixedCheckbox || !dueDateContainer) return;

        fixedCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                dueDateContainer.style.display = 'block';
            } else {
                dueDateContainer.style.display = 'none';
            }
        });
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AppState();
});