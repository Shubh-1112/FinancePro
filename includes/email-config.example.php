# Email Configuration Template

Copy this file to `includes/email-config.php` and update with your SMTP credentials.

```php
<?php
/**
 * Email Configuration
 * Configure SMTP settings for password recovery emails
 */

return [
    // SMTP Server Settings
    'smtp_host' => 'smtp.gmail.com',              // SMTP server (Gmail, SendGrid, etc.)
    'smtp_port' => 587,                            // SMTP port (587 for TLS, 465 for SSL)
    'smtp_username' => 'your-email@gmail.com',     // Your email address
    'smtp_password' => 'your-app-password',        // App password (not your regular password)
    'smtp_encryption' => 'tls',                    // Encryption type: 'tls' or 'ssl'
    
    // Email Sender Information
    'from_email' => 'your-email@gmail.com',        // Sender email address
    'from_name' => 'FinancePro',                   // Sender name
    
    // Development Settings
    'dev_mode' => true,                            // Set to false in production
    // When dev_mode is true, OTP will be shown in SweetAlert (for testing)
    // When false, OTP will only be sent via email
];
?>
```

## Gmail Setup Instructions

If using Gmail, follow these steps:

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Update Configuration**
   - Use the generated app password in `smtp_password`
   - Use your Gmail address in `smtp_username` and `from_email`

## Other SMTP Providers

### SendGrid
```php
'smtp_host' => 'smtp.sendgrid.net',
'smtp_port' => 587,
'smtp_username' => 'apikey',
'smtp_password' => 'your-sendgrid-api-key',
```

### Mailgun
```php
'smtp_host' => 'smtp.mailgun.org',
'smtp_port' => 587,
'smtp_username' => 'postmaster@your-domain.mailgun.org',
'smtp_password' => 'your-mailgun-password',
```

### Amazon SES
```php
'smtp_host' => 'email-smtp.us-east-1.amazonaws.com',
'smtp_port' => 587,
'smtp_username' => 'your-ses-smtp-username',
'smtp_password' => 'your-ses-smtp-password',
```

## Important Notes

1. **Never commit the actual `email-config.php` file** - it contains sensitive credentials
2. Set `dev_mode` to `false` in production
3. Use app-specific passwords, not your regular email password
4. Test email functionality before deploying to production
