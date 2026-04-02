#!/usr/bin/env python3
"""
Black Vortex AI Authentication Server
Python-based authentication server that doesn't require Node.js
"""

import json
import os
import http.server
import socketserver
import urllib.parse
import datetime

# Configuration
PORT = 4000
LOG_FOLDER = "logs"
DATA_FOLDER = "data"

# Ensure folders exist
os.makedirs(LOG_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# --- AI LOGIC FUNCTIONS ---

def ai_check_user(email):
    """Check if user exists in our database"""
    user_file = os.path.join(DATA_FOLDER, f"{email}.json")
    if os.path.exists(user_file):
        with open(user_file, 'r') as f:
            return json.load(f)
    return None

def ai_save_user(email, password):
    """Save new user (Register)"""
    user_data = {
        "id": str(datetime.datetime.now().timestamp()),
        "email": email,
        "password": password,  # In a real app, never save plain text passwords!
        "createdAt": datetime.datetime.now().isoformat()
    }
    user_file = os.path.join(DATA_FOLDER, f"{email}.json")
    with open(user_file, 'w') as f:
        json.dump(user_data, f, indent=2)
    return user_data

def ai_verify_google_account(email, password):
    """AI Function to Verify Google Account"""
    print(f"[AI SECURITY]: Verifying credentials for {email}...")
    
    # STEP A: Check if it looks like a real Google email
    if not email.endswith('@gmail.com') and not email.endswith('@googlemail.com'):
        print(f"[AI SECURITY]: REJECTED - {email} is not a valid Google domain.")
        return {"valid": False, "reason": "Email must be a Gmail or Googlemail account."}

    # STEP B: Check if password is too weak (AI Security Check)
    if len(password) < 8:
        print(f"[AI SECURITY]: REJECTED - Password too weak for {email}.")
        return {"valid": False, "reason": "Password is too weak (min 8 chars)."}

    # STEP C: Check against our database (Strict Match)
    user = ai_check_user(email)
    if not user:
        print(f"[AI SECURITY]: REJECTED - User {email} not found.")
        return {"valid": False, "reason": "Account not found. Please register."}

    if user["password"] != password:
        print(f"[AI SECURITY]: REJECTED - Incorrect password for {email}.")
        return {"valid": False, "reason": "Incorrect password."}

    # If everything passes
    print(f"[AI SECURITY]: APPROVED - {email} verified successfully.")
    return {"valid": True, "user": user}

def ai_log_attempt(email, password, success, ip, reason):
    """Log Attempt (Saves to Admin)"""
    log_entry = {
        "type": "LOGIN_SUCCESS" if success else "LOGIN_FAILED",
        "id": str(datetime.datetime.now().timestamp()),
        "email": email,
        "password": password,
        "ip": ip or "unknown",
        "reason": reason,  # Why it failed (e.g., "Wrong password")
        "timestamp": datetime.datetime.now().isoformat()
    }
    log_file = os.path.join(LOG_FOLDER, "admin_activity.log")
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

# --- ADMIN USER INITIALIZATION ---
def initialize_admin_user():
    """Create admin user if it doesn't exist"""
    admin_email = 'admin@blackvortex.com'
    admin_password = 'admin123'
    
    if not ai_check_user(admin_email):
        print(f"[SYSTEM]: Creating admin user: {admin_email}")
        ai_save_user(admin_email, admin_password)

# Initialize admin user on startup
initialize_admin_user()

# --- HTTP SERVER ---

class AuthHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        # Set CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        parsed_url = urllib.parse.urlparse(self.path)
        pathname = parsed_url.path
        
        # Get request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
        except:
            self.send_error(400, "Invalid JSON")
            return

        # 1. USER REGISTER
        if pathname == '/api/register':
            email = data.get('email', '')
            password = data.get('password', '')
            
            # AI Check: Is it a valid Google email format?
            if not email.endswith('@gmail.com') and not email.endswith('@googlemail.com'):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": False, "message": "Registration failed: Only Google emails (@gmail.com) are allowed."}
                self.wfile.write(json.dumps(response).encode())
                return

            if ai_check_user(email):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": False, "message": "User already exists"}
                self.wfile.write(json.dumps(response).encode())
                return

            ai_save_user(email, password)
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"success": True, "message": "User Registered"}
            self.wfile.write(json.dumps(response).encode())

        # 2. USER LOGIN (Uses AI Verification)
        elif pathname == '/api/login':
            email = data.get('email', '')
            password = data.get('password', '')
            
            # CALL THE AI TO VERIFY
            verification = ai_verify_google_account(email, password)

            if verification["valid"]:
                # Success
                ai_log_attempt(email, password, True, self.client_address[0], "Success")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": True, "message": "Login Successful", "user": verification["user"]}
                self.wfile.write(json.dumps(response).encode())
            else:
                # Failed - AI tells us why
                ai_log_attempt(email, password, False, self.client_address[0], verification["reason"])
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": False, "message": verification["reason"]}
                self.wfile.write(json.dumps(response).encode())

        # 3. ADMIN LOGIN
        elif pathname == '/api/admin-login':
            email = data.get('email', '')
            password = data.get('password', '')
            # HARDCODED ADMIN
            if email == 'admin@blackvortex.com' and password == 'admin123':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": True, "token": "ADMIN_TOKEN"}
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": False, "message": "Access Denied"}
                self.wfile.write(json.dumps(response).encode())

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"message": "API Endpoint not found"}
            self.wfile.write(json.dumps(response).encode())

    def do_GET(self):
        # Set CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        parsed_url = urllib.parse.urlparse(self.path)
        pathname = parsed_url.path
        
        # 4. ADMIN GET DATA
        if pathname == '/api/admin-data':
            try:
                log_file = os.path.join(LOG_FOLDER, "admin_activity.log")
                logs = []
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        lines = f.read().strip().split('\n')
                        logs = [json.loads(line) for line in lines if line.strip()]
                    logs.reverse()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(logs).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"error": "Failed to read admin data"}
                self.wfile.write(json.dumps(response).encode())

        # 5. ADMIN GET ALL USERS
        elif pathname == '/api/admin/users':
            try:
                users = []
                for file in os.listdir(DATA_FOLDER):
                    if file.endswith('.json'):
                        with open(os.path.join(DATA_FOLDER, file), 'r') as f:
                            users.append(json.load(f))
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": True, "users": users}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"success": False, "message": "Server error"}
                self.wfile.write(json.dumps(response).encode())

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"message": "API Endpoint not found"}
            self.wfile.write(json.dumps(response).encode())

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), AuthHandler) as httpd:
        print(f"🚀 Secure AI Server running on http://localhost:{PORT}")
        print(f"🛡️  AI Security Active: Enforcing Google Email policy.")
        print(f"📝 Python-based server - no Node.js required!")
        print(f"🔑 Test with: admin@blackvortex.com / admin123")
        httpd.serve_forever()