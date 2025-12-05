# 💰 FinancePro - Personal Finance Planner

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1?logo=mysql)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript)

**A modern, feature-rich personal finance management application built with PHP, MySQL, and Vanilla JavaScript**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

FinancePro is a comprehensive personal finance management application that helps users track expenses, manage budgets, set savings goals, and gain insights into their financial health. Built with modern web technologies and featuring an intuitive dark mode interface, it provides a seamless experience across all devices.

### Why FinancePro?

- **📊 Smart Budget Planning**: AI-powered budget allocation across categories
- **💳 Expense Tracking**: Track all your expenses with detailed categorization
- **🎯 Savings Goals**: Set and monitor progress towards financial goals
- **📈 Visual Analytics**: Beautiful charts and graphs for financial insights
- **🏆 Gamification**: Earn points and badges for good financial habits
- **🔄 Auto-Increment Income**: Automatic monthly income updates
- **💰 Fixed Expenses**: Auto-add recurring expenses on due dates
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile

---

## ✨ Features

### 💼 Financial Management
- **Budget Tracking**: Set monthly/yearly budgets and track spending
- **Expense Categories**: 10+ pre-defined categories (Housing, Food, Transport, etc.)
- **Income Management**: Track multiple income sources with auto-increment
- **Savings Goals**: Set targets and monitor progress with visual indicators
- **Total Savings**: Cumulative savings tracking across all periods

### 🤖 AI-Powered Features
- **Smart Budget Planner**: AI-suggested budget allocation across categories
- **Percentage-based Planning**: Allocate budget by percentage or amount
- **Category Locking**: Lock specific categories while adjusting others
- **Real-time Recalculation**: Dynamic budget redistribution

### 📊 Analytics & Reports
- **Expense Distribution Chart**: Doughnut chart showing spending by category
- **Expense Trends**: Line chart tracking spending over time
- **PDF Reports**: Generate detailed financial reports with insights
- **Progress Tracking**: Visual progress bars for savings goals

### 🎮 Gamification & Rewards
- **Points System**: Earn points for staying under budget
- **Achievement Badges**: 6 unique badges (Smart Saver, Budget Pro, etc.)
- **Leaderboard**: Compete with other users
- **Streak Tracking**: Monitor consecutive months under budget

### 👤 User Management
- **Secure Authentication**: Bcrypt password hashing
- **Session Management**: Secure PHP sessions
- **Password Recovery**: Email-based OTP system with PHPMailer
- **User Profiles**: Manage personal information

### 🎨 User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Single Page Application**: Smooth navigation without page reloads
- **Real-time Updates**: Instant feedback on all actions
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Visual feedback during data operations

### 📧 Communication
- **Email Notifications**: Password reset OTP via PHPMailer
- **SMTP Integration**: Configurable email settings
- **Feedback System**: Users can submit feedback with reactions

---

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Flexbox, Grid
- **JavaScript ES6+**: Modern vanilla JavaScript
- **Chart.js**: Data visualization
- **jsPDF**: PDF generation
- **Lucide Icons**: Beautiful icon library
- **Spline 3D**: Interactive 3D landing hero

### Backend
- **PHP 8.2+**: Server-side logic
- **MySQL 5.7+**: Relational database
- **PDO**: Secure database interactions
- **PHPMailer**: Email functionality

### Libraries & Tools
- **Google Fonts**: Typography (Roboto Serif, Inter)
- **SweetAlert2**: Beautiful alerts (forgot password flow)
- **History API**: Client-side routing

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Track your financial health at a glance with beautiful charts and metrics*

### AI Smart Planner
![AI Planner](docs/screenshots/ai-planner.png)
*Let AI help you allocate your budget intelligently*

### Dark Mode
![Dark Mode](docs/screenshots/dark-mode.png)
*Comfortable viewing experience with dark mode*

### Mobile Responsive
![Mobile View](docs/screenshots/mobile.png)
*Fully responsive design works perfectly on all devices*

---

## 🚀 Installation

### Prerequisites

- **PHP 8.2 or higher**
- **MySQL 5.7 or higher** (or MariaDB 10.2+)
- **Web Server** (Apache, Nginx, or PHP built-in server)
- **Composer** (optional, for PHPMailer dependencies)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/finance-pro.git
cd finance-pro
```

### Step 2: Database Setup

1. **Create Database**:
```sql
CREATE DATABASE personal_finance_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Import Schema**:
```bash
mysql -u your_username -p personal_finance_planner < database/schema.sql
```

Or using phpMyAdmin:
- Open phpMyAdmin
- Select the `personal_finance_planner` database
- Go to "Import" tab
- Choose `database/schema.sql`
- Click "Go"

### Step 3: Configure Database Connection

Edit `includes/config.php`:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');     // Your MySQL host
define('DB_PORT', '3306');          // MySQL port (3306 default, 3307 for XAMPP)
define('DB_USER', 'your_username'); // Your MySQL username
define('DB_PASS', 'your_password'); // Your MySQL password
define('DB_NAME', 'personal_finance_planner');

// Site configuration
define('SITE_URL', 'http://localhost:8000');
define('SITE_NAME', 'FinancePro');
```

### Step 4: Configure Email (Optional)

For password recovery functionality, edit `includes/email-config.php`:

```php
<?php
return [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'your-email@gmail.com',
    'smtp_password' => 'your-app-password', // Use App Password for Gmail
    'smtp_encryption' => 'tls',
    'from_email' => 'your-email@gmail.com',
    'from_name' => 'FinancePro',
    'dev_mode' => true // Set to false in production
];
```

**Gmail Setup**:
1. Enable 2-Factor Authentication
2. Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use the generated password in `smtp_password`

### Step 5: Set Permissions (Linux/Mac)

```bash
chmod -R 755 .
chmod -R 777 includes/  # If needed for config files
```

### Step 6: Start the Application

#### Option A: PHP Built-in Server (Development)
```bash
php -S localhost:8000
```

#### Option B: XAMPP
1. Copy project to `htdocs` folder
2. Start Apache and MySQL from XAMPP Control Panel
3. Access: `http://localhost/finance-pro`

#### Option C: Apache/Nginx
Configure your virtual host to point to the project directory.

### Step 7: Access the Application

Open your browser and navigate to:
- **Development**: `http://localhost:8000`
- **XAMPP**: `http://localhost/finance-pro`

---

## ⚙️ Configuration

### Database Configuration

**File**: `includes/config.php`

```php
// Database settings
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'personal_finance_planner');
```

### Email Configuration

**File**: `includes/email-config.php`

```php
return [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'your-email@gmail.com',
    'smtp_password' => 'your-app-password',
    'smtp_encryption' => 'tls',
    'from_email' => 'your-email@gmail.com',
    'from_name' => 'FinancePro',
    'dev_mode' => false // Set to true for development
];
```

### Environment Variables (Optional)

Create a `.env` file for sensitive data:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=personal_finance_planner

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📖 Usage

### Getting Started

1. **Register an Account**
   - Click "Register" on the login page
   - Fill in your details
   - Accept terms and conditions
   - Click "Create Account"

2. **Set Up Your Budget**
   - Go to Settings → Budget Settings
   - Enter your monthly income
   - Set your savings goal
   - Configure auto-increment (optional)

3. **Add Expenses**
   - Navigate to "Add Transaction"
   - Choose expense type
   - Enter amount and category
   - Mark as fixed expense if recurring

4. **Use AI Planner**
   - Go to "AI Smart Planner"
   - Enter your budget amount
   - Select categories
   - Let AI suggest optimal allocation
   - Save the plan

5. **Track Progress**
   - View Dashboard for overview
   - Check charts for spending patterns
   - Download PDF reports
   - Monitor savings progress

### Key Features Usage

#### Auto-Increment Income
Set up automatic monthly income increases:
1. Go to Settings → Budget Settings
2. Enable "Auto-Increment Income"
3. Set increment date (day of month)
4. Enter increment amount
5. System will automatically add this amount on the specified date each month

#### Fixed Expenses
Auto-add recurring expenses:
1. Add Transaction → Add Expense
2. Check "Fixed Expense"
3. Select due date (day of month)
4. System will automatically add this expense on the due date each month

#### PDF Reports
Generate detailed financial reports:
1. Go to Dashboard
2. Click "Download PDF Report"
3. PDF includes:
   - Income and expense summary
   - Spending by category
   - Savings progress
   - Financial insights

#### Rewards System
Earn points and badges:
- **Points**: Earned by staying under budget
- **Badges**: Unlocked for achievements
- **Leaderboard**: See how you rank
- **Streak**: Track consecutive months under budget

---

## 📁 Project Structure

```
finance-pro/
├── css/
│   ├── styles.css              # Main stylesheet
│   └── forgot-password.css     # Password recovery styles
├── js/
│   ├── app.js                  # Main application logic
│   ├── charts.js               # Chart.js integration
│   ├── dashboard.js            # Dashboard functionality
│   ├── pdf-generator.js        # PDF report generation
│   └── forgot-password.js      # Password recovery logic
├── php/
│   ├── api.php                 # Main API controller
│   ├── login.php               # Login handler
│   ├── register.php            # Registration handler
│   ├── logout.php              # Logout handler
│   ├── check_session.php       # Session validation
│   ├── forgot-password.php     # Password reset request
│   ├── verify-otp.php          # OTP verification
│   ├── resend-otp.php          # Resend OTP
│   └── reset-password.php      # Password reset
├── includes/
│   ├── config.php              # Database configuration
│   ├── email-config.php        # Email configuration
│   ├── EmailService.php        # Email service class
│   └── PHPMailer/              # PHPMailer library
├── database/
│   ├── schema.sql              # Database schema
│   └── migrations/             # Database migrations
├── docs/
│   └── screenshots/            # Application screenshots
├── index.html                  # Main application page
├── login.html                  # Login page
├── register.html               # Registration page
├── feedback.html               # Feedback page
├── setup.php                   # Database setup script
├── README.md                   # This file
├── TECHNICAL_DOCUMENTATION.md  # Technical documentation
└── .gitignore                  # Git ignore file
```

---

## 🗄 Database Schema

### Main Tables

#### `users`
Stores user account information
- `id`, `username`, `email`, `password`, `first_name`, `last_name`, `contact`, `dob`, `created_at`

#### `budget_data`
Stores budget and income information
- `id`, `user_id`, `income`, `savings_goal`, `total_savings`, `income_increment_date`, `income_increment_amount`, `last_increment_month`

#### `expenses`
Stores all expense transactions
- `id`, `user_id`, `category_id`, `name`, `amount`, `percentage`, `is_fixed`, `is_auto_added`, `date_added`

#### `categories`
Pre-defined expense categories
- `id`, `name`, `icon`

#### `fixed_expenses`
Recurring expense templates
- `id`, `user_id`, `name`, `amount`, `category`, `due_date`, `last_added_month`

#### `user_points`
Gamification points and badges
- `id`, `user_id`, `total_points`, `months_under_budget`, `months_no_shopping_entertainment`

#### `user_badges`
Achievement badges earned
- `id`, `user_id`, `badge_name`, `earned_at`

#### `feedback`
User feedback submissions
- `id`, `first_name`, `last_name`, `feedback`, `likes`, `dislikes`, `created_at`

---

## 🔒 Security

### Implemented Security Measures

1. **Password Security**
   - Bcrypt hashing with cost factor 12
   - Minimum 8 characters required
   - Password strength validation

2. **SQL Injection Prevention**
   - PDO prepared statements for all queries
   - Parameter binding
   - Input validation

3. **Session Management**
   - Secure PHP sessions
   - Session regeneration on login
   - Automatic logout on inactivity

4. **XSS Prevention**
   - HTML escaping for user input
   - Content Security Policy headers
   - Output sanitization

5. **CSRF Protection**
   - Session-based validation
   - Token-based protection (recommended for production)

6. **Email Security**
   - OTP expiration (10 minutes)
   - Rate limiting on OTP requests
   - Secure SMTP with TLS/SSL

### Security Best Practices

- Change default database credentials
- Use strong passwords
- Enable HTTPS in production
- Keep PHP and MySQL updated
- Regular security audits
- Implement rate limiting
- Add CSRF tokens
- Enable error logging (not display)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PSR-12 coding standards for PHP
- Use ES6+ JavaScript features
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts
- **jsPDF** - PDF generation
- **PHPMailer** - Email functionality
- **Lucide Icons** - Icon library
- **Spline** - 3D graphics
- **Google Fonts** - Typography

---

## 📧 Contact

**Project Maintainer**: Your Name

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🚀 Future Enhancements

- [ ] Multi-currency support
- [ ] Budget templates
- [ ] Expense splitting
- [ ] Bank account integration
- [ ] Mobile app (React Native)
- [ ] Export to Excel/CSV
- [ ] Recurring income management
- [ ] Bill reminders
- [ ] Investment tracking
- [ ] Tax calculation
- [ ] Multi-language support
- [ ] Two-factor authentication

---

<div align="center">

**Made with ❤️ by [Your Name]**

⭐ Star this repo if you find it helpful!

</div>
