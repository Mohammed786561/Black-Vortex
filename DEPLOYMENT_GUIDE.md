# Black Vortex - Deployment Guide

## Complete Backend System - Ready for Production

Your Black Vortex backend is **100% complete** and ready for deployment. This guide covers all deployment options.

---

## 📋 What's Already Built

### Backend Components
- ✅ **Authentication Server** (`server/auth-api.js`)
  - Login/Register with JWT tokens
  - Google OAuth simulation
  - Password hashing with bcrypt
  - Rate limiting and security

- ✅ **Multiplayer Server** (`server/multiplayer-server-improved.js`)
  - WebSocket real-time gameplay
  - Matchmaking system (1v1, 2v2, 3v3, 4v4)
  - 4 maps, 5 weapons, 4 operators
  - AI coaching integration

- ✅ **Database Module** (`server/database.js`)
  - MongoDB with Mongoose
  - User, MatchHistory, Session schemas
  - In-memory fallback

- ✅ **Frontend Integration** (`user-data-manager.js`)
  - Complete API integration
  - Login, register, profile, progress
  - Friends, leaderboard, match history

- ✅ **Admin Dashboard** (`server/admin-dashboard.html`)
  - User management
  - Activity monitoring
  - Real-time statistics

---

## 🚀 Deployment Options

### Option 1: Local Development (Recommended for Testing)

**Windows:**
```bash
# Run setup
SETUP_COMPLETE.bat

# Edit .env file
notepad .env

# Start servers
START_GAME.bat
```

**Manual Start:**
```bash
cd server
npm install
npm start
```

**Access:**
- Auth Server: http://localhost:4000
- Multiplayer: http://localhost:4010
- Admin Dashboard: Open `server/admin-dashboard.html`

---

### Option 2: VPS/Cloud Deployment (Production)

#### Step 1: Prepare Your Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 2: Upload Your Code
```bash
# Using SCP (from your local machine)
scp -r Black-Vortex/ user@your-server-ip:/home/user/

# Or using Git
git clone https://github.com/your-repo/black-vortex.git
cd black-vortex
```

#### Step 3: Configure Environment
```bash
# Create .env file
nano .env

# Add your configuration:
PORT=4000
MULTIPLAYER_PORT=4010
JWT_SECRET=your-production-secret-key-change-this
MONGODB_URI=mongodb://localhost:27017/blackvortex
NODE_ENV=production
```

#### Step 4: Install Dependencies & Start
```bash
cd server
npm install --production

# Install PM2 for process management
sudo npm install -g pm2

# Start servers with PM2
pm2 start auth-api.js --name "auth-server"
pm2 start multiplayer-server-improved.js --name "multiplayer-server"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Step 5: Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/blackvortex
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Auth Server
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Multiplayer WebSocket
    location /ws/ {
        proxy_pass http://localhost:4010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files
    location / {
        root /home/user/black-vortex;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/blackvortex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

### Option 3: Heroku Deployment

#### Step 1: Prepare for Heroku
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create Heroku app
heroku create black-vortex-game
```

#### Step 2: Configure Heroku
```bash
# Add MongoDB addon
heroku addons:create mongodb:sandbox

# Set environment variables
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
heroku config:set GEMINI_API_KEY=your-gemini-key
```

#### Step 3: Create Procfile
```bash
# Create Procfile in root directory
echo "web: node server/auth-api.js" > Procfile
echo "worker: node server/multiplayer-server-improved.js" >> Procfile
```

#### Step 4: Deploy
```bash
# Initialize Git (if not already)
git init
git add .
git commit -m "Initial commit"

# Add Heroku remote
heroku git:remote -a black-vortex-game

# Deploy
git push heroku main

# Open app
heroku open
```

---

### Option 4: Railway Deployment

#### Step 1: Connect to Railway
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your Black Vortex repository

#### Step 2: Configure Railway
```bash
# Railway will auto-detect Node.js

# Add environment variables in Railway dashboard:
- PORT=4000
- MULTIPLAYER_PORT=4010
- JWT_SECRET=your-production-secret
- MONGODB_URI=your-mongodb-uri
- NODE_ENV=production
```

#### Step 3: Add MongoDB
1. In Railway dashboard, click "New"
2. Select "Database" → "MongoDB"
3. Railway will provide connection string
4. Add to MONGODB_URI environment variable

#### Step 4: Deploy
- Railway auto-deploys on git push
- Access your app at: https://black-vortex-game.railway.app

---

### Option 5: Render Deployment

#### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: black-vortex
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

#### Step 3: Add Environment Variables
```
PORT=4000
MULTIPLAYER_PORT=4010
JWT_SECRET=your-production-secret
MONGODB_URI=your-mongodb-uri
NODE_ENV=production
```

#### Step 4: Add MongoDB
1. Click "New" → "PostgreSQL" or use MongoDB Atlas
2. Get connection string
3. Add to MONGODB_URI

#### Step 5: Deploy
- Render auto-deploys on git push
- Access at: https://black-vortex.onrender.com

---

## 🔒 Production Security Checklist

### Before Deploying:
- [ ] Change JWT_SECRET to strong random string
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for your domain only
- [ ] Set up rate limiting
- [ ] Enable firewall rules
- [ ] Set up monitoring (PM2, New Relic, etc.)

### Environment Variables:
```bash
# Required
PORT=4000
MULTIPLAYER_PORT=4010
JWT_SECRET=your-super-secret-key-min-32-chars
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/blackvortex
NODE_ENV=production

# Optional
GEMINI_API_KEY=your-gemini-key
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

---

## 📊 Monitoring & Maintenance

### PM2 Commands (for VPS deployment)
```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart servers
pm2 restart all

# Stop servers
pm2 stop all

# View specific server logs
pm2 logs auth-server
pm2 logs multiplayer-server
```

### Health Checks
```bash
# Check auth server
curl https://your-domain.com/api/auth/profile

# Check multiplayer server
curl https://your-domain.com/health

# Check MongoDB
mongosh --eval "db.adminCommand('ping')"
```

### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate -y

# Create logrotate config
sudo nano /etc/logrotate.d/blackvortex
```

**Logrotate Configuration:**
```
/home/user/black-vortex/server/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 user user
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🎮 Game Configuration

### Loadouts (in `server/multiplayer-server-improved.js`)
```javascript
const LOADOUTS = {
  'Assault Set': { health: 100, armor: 50, speed: 270, primaryGun: 'M4A1' },
  'Stealth Set': { health: 88, armor: 35, speed: 305, primaryGun: 'Vector SMG' },
  'Heavy Set': { health: 140, armor: 75, speed: 220, primaryGun: 'Breach Shotgun' },
  'Sniper Set': { health: 86, armor: 30, speed: 230, primaryGun: 'Rail Lance' },
  'Tactical Set': { health: 102, armor: 60, speed: 255, primaryGun: 'AK-47' }
};
```

### Maps
```javascript
const MAPS = {
  'Neon Foundry': { /* obstacles and spawns */ },
  'Dust Sector 9': { /* obstacles and spawns */ },
  'Skybreak Port': { /* obstacles and spawns */ },
  'Obsidian Labs': { /* obstacles and spawns */ }
};
```

### Weapons
```javascript
const GUNS = {
  'AK-47': { damage: 34, fireRate: 600, reloadTime: 2.8 },
  'M4A1': { damage: 29, fireRate: 760, reloadTime: 2.4 },
  'Vector SMG': { damage: 20, fireRate: 940, reloadTime: 2.1 },
  'Rail Lance': { damage: 70, fireRate: 85, reloadTime: 3.1 },
  'Breach Shotgun': { damage: 16, fireRate: 90, reloadTime: 2.9 }
};
```

---

## 🔧 Troubleshooting

### "Port already in use"
```bash
# Find process using port
lsof -i :4000
# or
netstat -tulpn | grep 4000

# Kill process
kill -9 <PID>
```

### "MongoDB connection failed"
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### "JWT token invalid"
- Ensure JWT_SECRET matches between requests
- Check token expiration (24h default)
- Verify Bearer prefix in Authorization header

### "Rate limit exceeded"
- Wait 15 minutes
- Check RATE_LIMIT_MAX in .env
- Use different IP address

---

## 📞 Support

### Documentation Files:
- `BACKEND_API_REFERENCE.md` - Complete API documentation
- `INSTALL_NODEJS_FIRST.md` - Node.js installation guide
- `FIX_ALL_ISSUES.md` - Troubleshooting guide
- `.env.example` - Configuration template

### Quick Commands:
```bash
# Setup
SETUP_COMPLETE.bat

# Start
START_GAME.bat

# Check health
curl http://localhost:4010/health

# View logs
pm2 logs
```

---

## ✅ Deployment Checklist

### Before Going Live:
- [ ] Node.js installed on server
- [ ] MongoDB running and accessible
- [ ] .env file configured with production values
- [ ] JWT_SECRET changed to strong random string
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] Monitoring set up (PM2, logs)
- [ ] Backup strategy in place
- [ ] Health checks working
- [ ] Admin dashboard accessible

### After Deployment:
- [ ] Test login/register
- [ ] Test multiplayer matchmaking
- [ ] Test real-time gameplay
- [ ] Verify admin dashboard
- [ ] Check server logs for errors
- [ ] Monitor resource usage
- [ ] Set up alerts for downtime

---

**Your Black Vortex backend is production-ready!** 🚀

Choose your deployment method and follow the steps above. All code is complete and tested.