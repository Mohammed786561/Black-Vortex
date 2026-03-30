# ⚠️ IMPORTANT: Install Node.js First!

## The Problem

The backend servers **cannot run** because **Node.js is not installed** on your system.

## What is Node.js?

Node.js is a JavaScript runtime that allows you to run JavaScript code on your computer (not just in browsers). The Black Vortex backend servers are written in JavaScript and require Node.js to run.

## How to Install Node.js

### Step 1: Download Node.js
1. Go to https://nodejs.org/
2. Download the **LTS version** (recommended for most users)
3. Choose the Windows Installer (.msi) for your system (64-bit)

### Step 2: Install Node.js
1. Run the downloaded .msi file
2. Follow the installation wizard
3. **IMPORTANT**: Make sure "Add to PATH" is checked during installation
4. Complete the installation

### Step 3: Verify Installation
Open a **new** Command Prompt or PowerShell window and run:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

### Step 4: Restart Your Computer
After installing Node.js, restart your computer to ensure the PATH changes take effect.

## After Installing Node.js

Once Node.js is installed, you can start the Black Vortex servers:

### Option 1: One-Click Start (Easiest)
Double-click `START_GAME.bat` in the root directory.

### Option 2: Manual Start
```bash
cd server
npm install
npm start
```

### Option 3: Practice Mode (No Server Needed)
Just open `ultimate-black-vortex-fps.html` in your browser - this works without any servers!

## Quick Test After Installation

To verify everything is working:

1. Install Node.js (steps above)
2. Open Command Prompt
3. Run:
   ```bash
   cd path\to\Black Vortex\server
   npm install
   npm start
   ```
4. You should see:
   ```
   🚀 Black Vortex multiplayer server running on http://localhost:4010
   ```

## Troubleshooting

### "node is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js and make sure "Add to PATH" is checked
- Restart your computer after installation

### "npm is not recognized"
- Same as above - Node.js includes npm
- Reinstall Node.js

### Installation fails
- Make sure you have administrator privileges
- Temporarily disable antivirus during installation
- Download the installer again from nodejs.org

## System Requirements

- **Operating System**: Windows 10 or later
- **Disk Space**: ~100 MB for Node.js
- **RAM**: Minimal (Node.js is lightweight)
- **Internet**: Required for downloading and npm install

## Why Do I Need Node.js?

The Black Vortex game has two parts:

1. **Frontend** (HTML/CSS/JavaScript)
   - Runs in your browser
   - No installation needed
   - Practice mode works immediately

2. **Backend** (Node.js servers)
   - Runs on your computer
   - Handles multiplayer matchmaking
   - Manages player authentication
   - Requires Node.js to be installed

## Still Having Issues?

If you've installed Node.js but still see errors:

1. **Restart your computer** (important!)
2. Open a **new** Command Prompt window
3. Try the commands again
4. Check that `node --version` shows a version number

---

**Bottom Line**: Install Node.js from https://nodejs.org/ and the backend will work! 🚀