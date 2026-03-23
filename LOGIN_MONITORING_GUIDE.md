# Black Vortex - Login Monitoring Guide

## 📊 Overview

The Black Vortex authentication system now includes comprehensive login monitoring and real-time statistics tracking. This guide shows you how to monitor user activity, track security events, and view login statistics.

## 🚀 Quick Start

### Option 1: One-Click Monitoring (Recommended)
```bash
cd server
start start-monitoring.bat
```

This will automatically:
1. Start the authentication server on port 4000
2. Launch the log monitor that watches for changes
3. Open the real-time dashboard in your browser

### Option 2: Manual Setup
```bash
# Terminal 1: Start authentication server
cd server
npm start

# Terminal 2: Start log monitor
cd server
npm run monitor

# Terminal 3: Open dashboard
cd server
start dashboard.html
```

### Option 3: Dashboard Only
```bash
cd server
npm run dashboard
```

## 📈 What You Can Monitor

### Real-Time Statistics
- **Successful Logins**: Count of successful authentication attempts
- **Failed Attempts**: Count of failed login attempts (security monitoring)
- **New Registrations**: Count of new user registrations
- **Unique IPs**: Number of unique IP addresses accessing the system
- **Success Rate**: Percentage of successful vs. total login attempts

### Security Monitoring
- **Failed Login Attempts**: Detailed logging of failed attempts
- **Suspicious Activity**: AI-detected suspicious login patterns
- **IP Address Tracking**: Monitor login sources for security analysis
- **User Agent Logging**: Track device/browser information

### Activity Logs
- **Event Types**: LOGIN_SUCCESS, LOGIN_FAILED, REGISTRATION_SUCCESS
- **Timestamps**: Complete audit trail with ISO timestamps
- **User Information**: Email addresses (no passwords stored)
- **IP Addresses**: Source IP for each authentication event

## 📊 Dashboard Features

### Live Statistics Cards
- **Successful Logins**: Green indicator with ✅ icon
- **Failed Attempts**: Red indicator with ❌ icon  
- **New Registrations**: Orange indicator with 📝 icon
- **Unique IPs**: Blue indicator with 🌐 icon

### Success Rate Visualization
- **Large percentage display** showing login success rate
- **Color-coded** (green for good, red for concerning)
- **Detailed breakdown** of successes vs. total attempts

### Security Overview
- **Security Status**: "SECURE" or "ATTENTION NEEDED" based on failed attempts
- **Recent Activity Count**: Number of logged events
- **Last Update Time**: Timestamp of last dashboard refresh

### Activity Log Table
- **Event Type**: LOGIN_SUCCESS, LOGIN_FAILED, REGISTRATION_SUCCESS
- **Email**: User email address (for successful events)
- **IP Address**: Source IP of the request
- **Timestamp**: Local time of the event

## 📁 Log Files Location

### Security Logs
```
/server/logs/security.log
```
Contains:
- Failed login attempts
- Security events
- Suspicious activity

### Activity Logs  
```
/server/logs/activity.log
```
Contains:
- Successful logins
- New registrations
- General user activity

## 🔍 Sample Log Entries

### Security Log (Failed Attempts)
```
[2026-03-22T12:25:00.000Z] LOGIN_FAILED: {"email":"user@example.com","ip":"192.168.1.100","userAgent":"Mozilla/5.0...","reason":"Invalid password","timestamp":"2026-03-22T12:25:00.000Z"}
```

### Activity Log (Successful Events)
```
[2026-03-22T12:25:00.000Z] LOGIN_SUCCESS: {"email":"user@example.com","ip":"192.168.1.100","userAgent":"Mozilla/5.0...","timestamp":"2026-03-22T12:25:00.000Z","level":5}
```

## 🛡️ Security Features

### No Password Logging
- **Passwords are NEVER logged** or stored in plain text
- Only email addresses, IPs, and timestamps are recorded
- All sensitive data is protected

### Rate Limiting Protection
- **5 attempts per 15 minutes** per IP address
- **Automatic blocking** of excessive failed attempts
- **AI analysis** of login patterns

### Console Monitoring
- **Real-time console output** for immediate visibility
- **Security events** marked with 🔒 SECURITY prefix
- **Activity events** marked with 📊 ACTIVITY prefix

## 📱 Dashboard Auto-Updates

### Live Monitoring
- **30-second auto-refresh** for real-time updates
- **File system watching** for instant log updates
- **Manual refresh** button available

### Visual Indicators
- **Live indicator** (pulsing dot) shows active monitoring
- **Color-coded status** for quick security assessment
- **Empty state** messages when no activity

## 🔧 Customization

### Dashboard Styling
The dashboard uses CSS Grid and Flexbox for responsive design:
- **Dark theme** with accent colors
- **Hover effects** on log entries
- **Scrollable** activity log with custom scrollbar

### Log Monitor Configuration
The `log-monitor.js` file can be customized:
- **Update frequency**: Modify the 30-second refresh interval
- **Log parsing**: Adjust regex patterns for different log formats
- **Statistics**: Add new metrics to track

## 🚨 Security Best Practices

### Log File Security
- **Store logs outside web root** (already implemented)
- **Set appropriate file permissions**
- **Regular log rotation** to prevent disk space issues

### Monitoring Best Practices
- **Review failed attempts** regularly for security threats
- **Monitor IP addresses** for unusual patterns
- **Check success rates** for system health

### Production Considerations
- **Use environment variables** for API keys and secrets
- **Enable HTTPS** for production deployments
- **Implement log rotation** for long-term monitoring

## 📞 Troubleshooting

### Dashboard Not Loading
1. Ensure the authentication server is running
2. Check that `dashboard.html` exists in the server directory
3. Verify browser console for any errors

### No Activity Showing
1. Perform some login/register actions to generate logs
2. Check that log files exist in `/server/logs/`
3. Verify the log monitor is running

### Dashboard Not Updating
1. Refresh the browser page manually
2. Check that the log monitor process is active
3. Verify file permissions on log directory

## 🎯 Next Steps

1. **Start monitoring**: Run `npm run dashboard` to see the system in action
2. **Test authentication**: Try logging in and registering to generate activity
3. **Monitor security**: Watch for failed attempts and suspicious patterns
4. **Customize**: Modify the dashboard or log monitor to suit your needs

---

**Black Vortex Monitoring System** - Keep your game secure and track user activity in real-time!