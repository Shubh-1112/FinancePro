// Charts functionality using Chart.js

class Charts {
    constructor() {
        this.expenseChart = null;
        this.trendsChart = null;
        this.colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
    }

    async init() {
        // Wait for the DOM to be ready and charts to be visible
        const expenseChartElement = document.getElementById('expenseChart');
        const trendsChartElement = document.getElementById('trendsChart');
        if (!expenseChartElement || !trendsChartElement) {
            setTimeout(() => this.init(), 200);
            return;
        }

        setTimeout(async () => {
            this.createExpenseChart();
            await this.createTrendsChart();
        }, 100);
    }

    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) {
            return;
        }

        if (!window.Chart) {
            setTimeout(() => this.createExpenseChart(), 500);
            return;
        }

        // Check if canvas has valid dimensions
        const rect = ctx.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(() => this.createExpenseChart(), 200);
            return;
        }

        // Destroy existing chart if it exists
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        // Get current budget data from app
        const budgetData = app ? app.budgetData : { expenses: [] };
        // Filter to use only manual expenses (other expenses), exclude AI planner expenses and savings
        const chartExpenses = budgetData.expenses.filter(expense =>
            !expense.name.includes(' Budget')
        );

        const data = {
            labels: chartExpenses.map(exp => exp.name),
            datasets: [{
                data: chartExpenses.map(exp => exp.amount),
                backgroundColor: this.colors.slice(0, chartExpenses.length),
                borderWidth: 0,
                hoverOffset: 4
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: this.getTextColor(),
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                            }
                        },
                        backgroundColor: this.getTooltipBg(),
                        titleColor: this.getTextColor(),
                        bodyColor: this.getTextColor(),
                        borderColor: this.getBorderColor(),
                        borderWidth: 1
                    }
                },
                cutout: '60%'
            }
        };

        try {
            this.expenseChart = new Chart(ctx, config);
        } catch (error) {
            console.error('Error creating expense chart:', error);
        }
    }

    async createTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) {
            return;
        }

        if (!window.Chart) {
            setTimeout(() => this.createTrendsChart(), 500);
            return;
        }

        // Check if canvas has valid dimensions
        const rect = ctx.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            setTimeout(() => this.createTrendsChart(), 200);
            return;
        }

        // Destroy existing chart if it exists
        if (this.trendsChart) {
            this.trendsChart.destroy();
        }

        // Get current budget data from app
        const budgetData = app ? app.budgetData : { expenses: [] };
        // Filter to use only manual expenses (other expenses), exclude AI planner expenses and savings
        const chartExpenses = budgetData.expenses.filter(expense =>
            !expense.name.includes(' Budget')
        );
        const currentExpenses = chartExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Load historical data from database or use current data if no history
        const trendData = await this.loadTrendData(currentExpenses);

        const data = {
            labels: trendData.map(item => item.month),
            datasets: [{
                label: 'Monthly Expenses',
                data: trendData.map(item => item.expenses),
                backgroundColor: this.createGradient(ctx, '#8B5CF6', '#3B82F6'),
                borderColor: '#8B5CF6',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.getTooltipBg(),
                        titleColor: this.getTextColor(),
                        bodyColor: this.getTextColor(),
                        borderColor: this.getBorderColor(),
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return `Expenses: ₹${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.getTextColor()
                        }
                    },
                    y: {
                        grid: {
                            color: this.getBorderColor(),
                            drawBorder: false
                        },
                        ticks: {
                            color: this.getTextColor(),
                            callback: function (value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };

        try {
            this.trendsChart = new Chart(ctx, config);
        } catch (error) {
            console.error('Error creating trends chart:', error);
        }
    }

    updateCharts(budgetData) {
        // Update expense chart
        if (this.expenseChart && budgetData) {
            // Filter to use only manual expenses (other expenses), exclude AI planner expenses and savings
            const chartExpenses = budgetData.expenses.filter(expense =>
                !expense.name.includes(' Budget')
            );
            const newLabels = chartExpenses.map(exp => exp.name);
            const newData = chartExpenses.map(exp => exp.amount);

            this.expenseChart.data.labels = newLabels;
            this.expenseChart.data.datasets[0].data = newData;
            this.expenseChart.data.datasets[0].backgroundColor = this.colors.slice(0, chartExpenses.length);
            this.expenseChart.update();
        }

        // Update trends chart with current month data
        if (this.trendsChart && budgetData) {
            // Filter to use only manual expenses (other expenses), exclude AI planner expenses and savings
            const chartExpenses = budgetData.expenses.filter(expense =>
                !expense.name.includes(' Budget')
            );
            const currentExpenses = chartExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const lastIndex = this.trendsChart.data.datasets[0].data.length - 1;
            this.trendsChart.data.datasets[0].data[lastIndex] = currentExpenses;
            this.trendsChart.update();
        }
    }

    createGradient(ctx, colorStart, colorEnd) {
        if (!ctx.getContext) return colorStart;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart + '80');
        gradient.addColorStop(1, colorEnd + '10');
        return gradient;
    }

    getTextColor() {
        return document.body.classList.contains('dark') ? '#ffffff' : '#374151';
    }

    getTooltipBg() {
        return document.body.classList.contains('dark') ? '#1f2937' : '#ffffff';
    }

    getBorderColor() {
        return document.body.classList.contains('dark') ? '#4b5563' : '#e5e7eb';
    }

    async loadTrendData(currentExpenses) {
        try {
            // Try to load historical data from API
            const response = await fetch('./php/api.php?action=getExpenseTrends&userId=1');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    return data.data;
                }
            }
        } catch (error) {
            console.error('Error loading trend data:', error);
        }

        // If no historical data, create sample data with current expenses
        const currentMonth = new Date().toLocaleString('default', { month: 'short' });
        return [
            { month: currentMonth, expenses: currentExpenses || 0 }
        ];
    }

    // Method to refresh charts when theme changes
    refreshCharts() {
        if (this.expenseChart) {
            this.expenseChart.options.plugins.legend.labels.color = this.getTextColor();
            this.expenseChart.options.plugins.tooltip.backgroundColor = this.getTooltipBg();
            this.expenseChart.options.plugins.tooltip.titleColor = this.getTextColor();
            this.expenseChart.options.plugins.tooltip.bodyColor = this.getTextColor();
            this.expenseChart.options.plugins.tooltip.borderColor = this.getBorderColor();
            this.expenseChart.update();
        }

        if (this.trendsChart) {
            this.trendsChart.options.scales.x.ticks.color = this.getTextColor();
            this.trendsChart.options.scales.y.ticks.color = this.getTextColor();
            this.trendsChart.options.scales.y.grid.color = this.getBorderColor();
            this.trendsChart.options.plugins.tooltip.backgroundColor = this.getTooltipBg();
            this.trendsChart.options.plugins.tooltip.titleColor = this.getTextColor();
            this.trendsChart.options.plugins.tooltip.bodyColor = this.getTextColor();
            this.trendsChart.options.plugins.tooltip.borderColor = this.getBorderColor();
            this.trendsChart.update();
        }
    }

    destroy() {
        if (this.expenseChart) {
            this.expenseChart.destroy();
            this.expenseChart = null;
        }
        if (this.trendsChart) {
            this.trendsChart.destroy();
            this.trendsChart = null;
        }
    }
}

// Initialize charts when DOM is ready
let charts;
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the app to initialize
    setTimeout(() => {
        try {
            charts = new Charts();
            charts.init();

            // Make charts available globally
            window.charts = charts;
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }, 1000); // Increased timeout to give more time for app initialization
});

// Re-initialize charts when the dashboard becomes visible
document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-item[data-page="dashboard"]')) {
        setTimeout(() => {
            if (charts) {
                charts.init();
            }
        }, 100);
    }
});

// Refresh charts on theme change
document.addEventListener('click', (e) => {
    if (e.target.matches('#darkModeToggle') || e.target.closest('#darkModeToggle')) {
        setTimeout(() => {
            if (charts) {
                charts.refreshCharts();
            }
        }, 100);
    }
});