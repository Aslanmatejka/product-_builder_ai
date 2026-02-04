# Product Builder - Quick Start Guide

## 🎯 Goal

Get the Product Builder app running in under 5 minutes!

## ✅ Prerequisites Check

Before starting, verify you have:

- [ ] **Node.js installed** - Run `node --version` (need v16+)
- [ ] **Python installed** - Run `python --version` (need 3.11+)
- [ ] **Anthropic API key** - Get from https://console.anthropic.com/

**Optional** (for actual CAD/PCB generation):

- [ ] FreeCAD installed
- [ ] KiCad installed

> **Note**: The app works without FreeCAD/KiCad by creating mock files for testing

## 🚀 Setup Steps

### 1. Install Dependencies (2 minutes)

```powershell
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment (1 minute)

```powershell
# Copy environment template
cp .env.example .env

# Edit .env in VS Code
code .env
```

Add your Anthropic API key to the `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...your-key-here
```

### 3. Start the App (1 minute)

**Option A: One command to run everything**

```powershell
npm run dev:full
```

**Option B: Run servers separately**

Terminal 1 - Backend:

```powershell
npm start
```

Terminal 2 - Frontend:

```powershell
npm run client
```

### 4. Open Browser

Navigate to: **http://localhost:3000**

## 🧪 Test It Out

Try this prompt:

```
Create a battery cover for 4 AA batteries,
80mm x 40mm x 10mm, with screw holes in
corners and rounded edges
```

Click **"Build Product"** and watch it work!

## 📁 What Gets Generated

After a successful build, check these folders:

- `exports/cad/` - STL and STEP files
- `exports/pcb/` - Gerber files (if PCB required)

## 🐛 Common Issues

### Port already in use

```powershell
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Can't find Python

```powershell
# Verify Python path
where python
python --version
```

### API Key issues

- Verify key starts with `sk-ant-`
- Check for extra spaces in .env
- Restart server after changing .env

## 🎉 Success Indicators

You'll know it's working when you see:

1. ✅ Frontend loads at localhost:3000
2. ✅ Backend shows "Product Builder API running on port 3001"
3. ✅ Build request shows progress spinner
4. ✅ Files appear in exports/ folder
5. ✅ 3D preview shows in canvas

## 📖 Next Steps

- Read [README.md](README.md) for full documentation
- Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for development guidance
- Review [docs/COPILOT_CONTEXT.md](docs/COPILOT_CONTEXT.md) for architecture details

---

Need help? Check server console logs for detailed error messages.
