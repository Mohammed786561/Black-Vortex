const fs = require('fs');
const path = require('path');

class LogMonitor {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.securityLogFile = path.join(this.logsDir, 'security.log');
        this.activityLogFile = path.join(this.logsDir, 'activity.log');
        
        // Ensure logs directory exists
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    // Parse log entries from file
    parseLogEntries(filePath) {
        if (!fs.existsSync(filePath)) {
            return [];
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        return lines.map(line => {
            try {
                // Extract timestamp and JSON data
                const match = line.match(/\[(.*?)\]\s+(.*?):\s+(.*)/);
                if (match) {
                    const [, timestamp, event, jsonData] = match;
                    const data = JSON.parse(jsonData);
                    return {
                        timestamp: new Date(timestamp),
                        event: event,
                        data: data
                    };
                }
            } catch (e) {
                console.warn('Failed to parse log line:', line);
            }
            return null;
        }).filter(entry => entry !== null);
    }

    // Get statistics from logs
    getStatistics() {
        const securityLogs = this.parseLogEntries(this.securityLogFile);
        const activityLogs = this.parseLogEntries(this.activityLogFile);

        // Count events
        const stats = {
            totalUsers: 0, // This would need to be tracked separately
            successfulLogins: 0,
            googleLogins: 0,
            failedAttempts: 0,
            newRegistrations: 0,
            uniqueIPs: new Set(),
            recentActivity: []
        };

        // Process security logs (failed attempts)
        securityLogs.forEach(entry => {
            if (entry.event === 'LOGIN_FAILED') {
                stats.failedAttempts++;
                if (entry.data.ip) stats.uniqueIPs.add(entry.data.ip);
            }
        });

        const googleLoginUsers = [];
        const seenGoogleEmails = new Set();
        // Process activity logs (successful events)
        activityLogs.forEach(entry => {
            if (entry.event === 'LOGIN_SUCCESS') {
                stats.successfulLogins++;
                if (entry.data.ip) stats.uniqueIPs.add(entry.data.ip);
            } else if (entry.event === 'REGISTRATION_SUCCESS') {
                stats.newRegistrations++;
                if (entry.data.ip) stats.uniqueIPs.add(entry.data.ip);
            } else if (entry.event === 'GOOGLE_LOGIN_SUCCESS') {
                stats.googleLogins++;
                stats.successfulLogins++; // Also count as a successful login
                if (entry.data.ip) stats.uniqueIPs.add(entry.data.ip);
                if (!seenGoogleEmails.has(entry.data.email)) {
                    googleLoginUsers.push({
                        email: entry.data.email,
                        ip: entry.data.ip,
                        timestamp: entry.timestamp
                    });
                    seenGoogleEmails.add(entry.data.email);
                }
            }
        });

        // Combine and sort recent activity
        const allActivity = [
            ...securityLogs.map(log => ({ ...log, status: 'failed' })),
            ...activityLogs.map(log => ({ ...log, status: 'success' }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

        stats.recentActivity = allActivity;
        stats.uniqueIPCount = stats.uniqueIPs.size;

        // Calculate success rate
        const totalAttempts = stats.successfulLogins + stats.failedAttempts;
        stats.successRate = totalAttempts > 0 ? Math.round((stats.successfulLogins / totalAttempts) * 100) : 0;
        stats.googleLoginUsers = googleLoginUsers.sort((a, b) => b.timestamp - a.timestamp);

        return stats;
    }

    // Generate HTML dashboard with real data
    generateDashboardHTML() {
        const stats = this.getStatistics();
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Black Vortex - Real-Time Admin Dashboard</title>
    <style>
        :root {
            --bg-color: #1a1a2e;
            --card-bg: #16213e;
            --text-color: #ffffff;
            --accent-color: #e94560;
            --success-color: #2ed573;
            --warning-color: #ffa502;
            --danger-color: #ff4757;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid var(--accent-color);
            padding-bottom: 20px;
        }

        .dashboard-title {
            font-size: 2rem;
            color: var(--accent-color);
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .refresh-btn {
            background-color: var(--accent-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
        }

        .refresh-btn:hover {
            transform: scale(1.05);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background-color: var(--card-bg);
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid var(--accent-color);
            display: flex;
            flex-direction: column;
        }

        .stat-label {
            font-size: 0.9rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--text-color);
        }

        .stat-icon {
            font-size: 2rem;
            align-self: flex-end;
            opacity: 0.5;
        }

        .charts-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .chart-card {
            background-color: var(--card-bg);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #444;
        }

        .chart-title {
            font-size: 1.2rem;
            margin-bottom: 20px;
            color: var(--accent-color);
        }

        .log-container {
            background-color: var(--card-bg);
            border-radius: 10px;
            border: 1px solid #444;
            max-height: 400px;
            overflow-y: auto;
        }

        .log-header {
            padding: 15px;
            background-color: #222;
            border-bottom: 1px solid #444;
            font-weight: bold;
            display: grid;
            grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
            gap: 10px;
        }

        .log-entry {
            padding: 10px 15px;
            border-bottom: 1px solid #333;
            display: grid;
            grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
            gap: 10px;
            font-size: 0.9rem;
        }

        .log-entry:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }

        .log-success { border-left: 4px solid var(--success-color); }
        .log-failed { border-left: 4px solid var(--danger-color); }
        .log-register { border-left: 4px solid var(--warning-color); }
        .log-google { border-left: 4px solid #4285F4; }

        .status-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .badge-success { background-color: rgba(46, 213, 115, 0.2); color: var(--success-color); }
        .badge-failed { background-color: rgba(255, 71, 87, 0.2); color: var(--danger-color); }
        .badge-register { background-color: rgba(255, 165, 2, 0.2); color: var(--warning-color); }
        .badge-google { background-color: rgba(66, 133, 244, 0.2); color: #4285F4; }

        .log-header-3-col {
            padding: 15px;
            background-color: #222;
            border-bottom: 1px solid #444;
            font-weight: bold;
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 10px;
        }
        .log-entry-3-col {
            padding: 10px 15px;
            border-bottom: 1px solid #333;
            display: grid;
            grid-template-columns: 2fr 1fr 2fr;
            gap: 10px;
            font-size: 0.9rem;
        }

        .empty-state {
            text-align: center;
            color: #666;
            padding: 40px;
            font-style: italic;
        }

        .footer-note {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
        }

        .live-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background-color: var(--success-color);
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #222;
        }

        ::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1 class="dashboard-title"><span class="live-indicator"></span>Real-Time Admin Dashboard</h1>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Data</button>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-label">Successful Logins</span>
            <span class="stat-value" style="color: var(--success-color)">${stats.successfulLogins}</span>
            <span class="stat-icon">✅</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">Failed Attempts</span>
            <span class="stat-value" style="color: var(--danger-color)">${stats.failedAttempts}</span>
            <span class="stat-icon">❌</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">Google Logins</span>
            <span class="stat-value" style="color: #4285F4;">${stats.googleLogins}</span>
            <span class="stat-icon" style="color: #4285F4; font-weight: bold;">G</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">New Registrations</span>
            <span class="stat-value" style="color: var(--warning-color)">${stats.newRegistrations}</span>
            <span class="stat-icon">📝</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">Unique IPs</span>
            <span class="stat-value">${stats.uniqueIPCount}</span>
            <span class="stat-icon">🌐</span>
        </div>
    </div>

    <div class="charts-section">
        <div class="chart-card">
            <div class="chart-title">Login Success Rate</div>
            <div style="text-align: center; margin-top: 40px;">
                <div style="font-size: 3rem; font-weight: bold; color: ${stats.successRate >= 80 ? 'var(--success-color)' : 'var(--danger-color)'};">${stats.successRate}%</div>
                <div style="color: #666; margin-top: 10px;">Success Rate</div>
                <div style="color: #888; font-size: 0.9rem; margin-top: 5px;">
                    ${stats.successfulLogins} successes / ${stats.successfulLogins + stats.failedAttempts} total attempts
                </div>
            </div>
        </div>
        <div class="chart-card">
            <div class="chart-title">Security Overview</div>
            <div style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Security Status:</span>
                    <span style="color: ${stats.failedAttempts === 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: bold;">
                        ${stats.failedAttempts === 0 ? 'SECURE' : 'ATTENTION NEEDED'}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Recent Activity:</span>
                    <span>${stats.recentActivity.length} events</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Last Update:</span>
                    <span>${new Date().toLocaleString()}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="chart-card">
        <div class="chart-title">Recent Activity Log</div>
        <div class="log-container">
            <div class="log-header">
                <div>Event</div>
                <div>Email</div>
                <div>Password</div>
                <div>IP Address</div>
                <div>Time</div>
            </div>
            <div id="log-entries">
                ${stats.recentActivity.length === 0 ? 
                    '<div class="empty-state">No activity logged yet. Start the server and users will appear here.</div>' :
                    stats.recentActivity.map(entry => `
                        <div class="log-entry log-${entry.status}">
                            <div>
                                <span class="status-badge badge-${entry.status}">${entry.event}</span>
                            </div>
                            <div>${entry.data.email || 'N/A'}</div>
                            <div style="font-family: monospace; color: var(--warning-color);">${entry.data.password || '***'}</div>
                            <div>${entry.data.ip || 'N/A'}</div>
                            <div>${entry.timestamp.toLocaleString()}</div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    </div>

    <div class="chart-card" style="margin-top: 30px;">
        <div class="chart-title">Users Logged In With Google</div>
        <div class="log-container">
            <div class="log-header-3-col">
                <div>Email</div>
                <div>Last IP</div>
                <div>First Google Login</div>
            </div>
            <div id="google-logins-list">
                ${stats.googleLoginUsers.length === 0 ? 
                    '<div class="empty-state">No Google logins recorded yet.</div>' :
                    stats.googleLoginUsers.map(user => `
                        <div class="log-entry-3-col">
                            <div>${user.email}</div>
                            <div>${user.ip}</div>
                            <div>${user.timestamp.toLocaleString()}</div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    </div>

    <div class="footer-note">
        Note: This dashboard reads real-time data from the server log files. 
        <br>Current Status: ${stats.recentActivity.length === 0 ? 'No activity yet' : 'Monitoring active'}
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
        `;
    }

    // Save dashboard to file
    saveDashboard() {
        const html = this.generateDashboardHTML();
        const dashboardPath = path.join(__dirname, 'dashboard.html');
        fs.writeFileSync(dashboardPath, html);
        console.log(`Dashboard updated: ${dashboardPath}`);
        return dashboardPath;
    }

    // Start monitoring
    start() {
        console.log('🔍 Starting log monitor...');
        
        // Initial dashboard generation
        this.saveDashboard();
        
        // Watch for changes and update dashboard
        const watcher = fs.watch(this.logsDir, (eventType, filename) => {
            if (filename && (filename.includes('security.log') || filename.includes('activity.log'))) {
                console.log(`📝 Log file changed: ${filename}`);
                this.saveDashboard();
            }
        });

        console.log('📊 Dashboard will auto-update when logs change');
        console.log('🌐 Open dashboard.html in your browser to view real-time statistics');
        
        return watcher;
    }
}

// Export for use in other modules
module.exports = LogMonitor;

// If run directly, start monitoring
if (require.main === module) {
    const monitor = new LogMonitor();
    monitor.start();
}