# Quick Start Guide

## Prerequisites
- PHP 8.2+
- MySQL 5.7+
- Web server (Apache/Nginx) or PHP built-in server

## Installation (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/finance-pro.git
cd finance-pro
```

### 2. Create Database
```sql
CREATE DATABASE personal_finance_planner;
```

### 3. Import Schema
```bash
mysql -u root -p personal_finance_planner < database/schema.sql
```

### 4. Configure
```bash
# Copy config templates
cp includes/config.example.php includes/config.php
cp includes/email-config.example.php includes/email-config.php

# Edit includes/config.php with your database credentials
# Edit includes/email-config.php with your SMTP settings (optional)
```

### 5. Run
```bash
php -S localhost:8000
```

### 6. Access
Open browser: `http://localhost:8000`

## First Steps

1. **Register** - Create your account
2. **Set Budget** - Go to Settings → Budget Settings
3. **Add Expenses** - Navigate to Add Transaction
4. **View Dashboard** - See your financial overview

## Troubleshooting

### Database Connection Error
- Check `includes/config.php` credentials
- Verify MySQL is running
- For XAMPP on Mac, use port `3307`

### Email Not Working
- Update `includes/email-config.php`
- For Gmail, use App Password
- Set `dev_mode` to `true` for testing

### Charts Not Loading
- Clear browser cache
- Check browser console for errors
- Ensure Chart.js is loading

## Need Help?

- Check [README.md](README.md) for detailed documentation
- See [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for architecture
- Open an issue on GitHub

## Next Steps

- Explore AI Smart Planner
- Set up fixed expenses
- Configure auto-increment income
- Download PDF reports
- Earn badges and points!

---

**Happy budgeting! 💰**
