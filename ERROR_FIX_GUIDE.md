# 🔧 Error Fix Guide

## Common Errors and Solutions

### 1. ❌ "AI planning failed" or "ANTHROPIC_API_KEY is not configured"

**Problem:** Missing or invalid API key

**Solution:**
```bash
# Create .env file if it doesn't exist
copy .env.example .env

# Edit .env and add your API key:
ANTHROPIC_API_KEY=your_actual_api_key_here
```

Get your API key from: https://console.anthropic.com/

---

### 2. ❌ "Cannot connect to server" or "ECONNRESET"

**Problem:** Backend server not running or crashed

**Solution:**
```bash
# Make sure backend is running
npm run dev

# Check if port 3001 is in use
netstat -ano | findstr :3001

# If port is busy, kill the process or restart
```

---

### 3. ❌ "CAD Generation Error" or "FreeCAD not found"

**Problem:** FreeCAD not installed or not in standard location

**Solution:**
1. Install FreeCAD from: https://www.freecad.org/downloads.php
2. Install to default location: `C:\Program Files\FreeCAD 1.0\`
3. Restart the server after installation

---

### 4. ❌ "PCB Generation Error" or "KiCad not found"

**Problem:** KiCad not installed (optional, but needed for PCB generation)

**Solution:**
1. Install KiCad from: https://www.kicad.org/download/
2. Install to default location: `C:\Program Files\KiCad\9.0\`
3. Note: This is optional - app works without it for CAD-only projects

---

### 5. ❌ "Module not found" or "Cannot find module"

**Problem:** Dependencies not installed

**Solution:**
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

---

### 6. ❌ "EADDRINUSE: address already in use :::3001"

**Problem:** Port 3001 is already in use

**Solution:**
```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id <PID>

# Or restart your computer
```

---

### 7. ❌ "Server returned 500" or "Internal Server Error"

**Problem:** Server error during build process

**Check:**
1. Look at server terminal for detailed error message
2. Check browser console (F12) for error details
3. Verify .env file has valid API key
4. Check if FreeCAD/KiCad are installed

**Common causes:**
- Missing API key
- FreeCAD/KiCad not installed
- Invalid design parameters
- Python script errors

---

### 8. ❌ "No module named 'ImportPart'"

**Problem:** Component 3D model generation failing

**Solution:**
- This is a **non-critical** error
- The app will continue and use fallback geometry
- Your CAD and PCB files will still be generated correctly
- Component models will be simple boxes instead of detailed 3D models

---

## Quick Diagnostic Steps

1. **Check .env file exists and has API key:**
   ```bash
   type .env
   ```

2. **Check if server is running:**
   ```bash
   npm run dev
   ```

3. **Check if client is running:**
   ```bash
   cd client
   npm start
   ```

4. **Check server logs:**
   - Look at the terminal where `npm run dev` is running
   - Look for error messages with ❌ or ERROR

5. **Check browser console:**
   - Press F12 in browser
   - Look at Console tab for errors
   - Look at Network tab for failed requests

---

## Still Having Issues?

1. **Share the exact error message** from:
   - Server terminal
   - Browser console (F12)
   - Network tab (F12 → Network)

2. **Check these files exist:**
   - `.env` (with valid API key)
   - `node_modules/` (run `npm install`)
   - `client/node_modules/` (run `cd client && npm install`)

3. **Verify installations:**
   - FreeCAD: `C:\Program Files\FreeCAD 1.0\bin\python.exe`
   - KiCad (optional): `C:\Program Files\KiCad\9.0\bin\python.exe`

---

## Need More Help?

Check the server terminal output - it shows detailed error messages with:
- ❌ for errors
- ⚠️ for warnings
- ✅ for success

The error messages are designed to tell you exactly what's wrong and how to fix it.
