// Dashboard-specific functionality

class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.updateScrollProgress();
        window.addEventListener('scroll', () => this.updateScrollProgress());
    }

    setupDashboardEvents() {
        // Dashboard-specific event handling can go here
        // For now, most functionality is handled in app.js
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    window.dashboard = dashboard;
});