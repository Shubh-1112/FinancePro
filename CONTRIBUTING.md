# Contributing to FinancePro

First off, thank you for considering contributing to FinancePro! It's people like you that make FinancePro such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and what behavior you expected
* **Include screenshots** if possible
* **Include your environment details** (OS, PHP version, MySQL version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the suggested enhancement
* **Explain why this enhancement would be useful**
* **List some examples** of how it would be used

### Pull Requests

* Fill in the required template
* Follow the PHP and JavaScript style guides
* Include screenshots and animated GIFs in your pull request whenever possible
* End all files with a newline
* Avoid platform-dependent code

## Development Process

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/finance-pro.git
   cd finance-pro
   ```

3. Set up the database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. Copy configuration files:
   ```bash
   cp includes/config.example.php includes/config.php
   cp includes/email-config.example.php includes/email-config.php
   ```

5. Update configuration files with your local settings

6. Start development server:
   ```bash
   php -S localhost:8000
   ```

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes thoroughly

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Add feature: your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

## Style Guides

### PHP Style Guide

* Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) coding standards
* Use meaningful variable and function names
* Add PHPDoc comments for functions and classes
* Use type hints where possible
* Keep functions small and focused

Example:
```php
<?php
/**
 * Calculate total expenses for a user
 *
 * @param int $userId User ID
 * @return float Total expenses
 */
function calculateTotalExpenses(int $userId): float {
    // Implementation
}
```

### JavaScript Style Guide

* Use ES6+ features
* Use `const` and `let` instead of `var`
* Use arrow functions where appropriate
* Use template literals for string interpolation
* Add JSDoc comments for complex functions

Example:
```javascript
/**
 * Calculate savings progress percentage
 * @param {number} current - Current savings amount
 * @param {number} goal - Savings goal amount
 * @returns {number} Progress percentage
 */
const calculateProgress = (current, goal) => {
    return goal > 0 ? (current / goal) * 100 : 0;
};
```

### CSS Style Guide

* Use meaningful class names
* Follow BEM naming convention where appropriate
* Use CSS custom properties for colors and spacing
* Keep selectors simple and specific
* Group related properties together

Example:
```css
/* Component */
.card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4);
}

/* Modifier */
.card--highlighted {
    border: 2px solid var(--color-purple-500);
}
```

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Examples:
```
Add user profile editing functionality
Fix dashboard chart rendering issue
Update README with installation instructions
Refactor expense calculation logic
```

## Testing

### Manual Testing Checklist

Before submitting a PR, please test:

- [ ] User registration and login
- [ ] Adding/editing/deleting expenses
- [ ] Budget calculations
- [ ] Chart rendering
- [ ] PDF report generation
- [ ] Dark mode toggle
- [ ] Mobile responsiveness
- [ ] Password recovery flow
- [ ] Fixed expenses auto-add
- [ ] Income auto-increment

### Browser Testing

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Documentation

* Update README.md if you change functionality
* Update TECHNICAL_DOCUMENTATION.md for architectural changes
* Add inline comments for complex logic
* Update API documentation if you modify endpoints

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

## Recognition

Contributors will be recognized in the README.md file.

Thank you for contributing! 🎉
