# 🚀 Product Builder - MVP Ready

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Transform text descriptions into manufacturing-ready CAD files using AI + FreeCAD

## ✨ Features

- 🤖 **AI-Powered Design** - Natural language to 3D models
- 📦 **Parametric CAD** - Professional STEP & STL files
- 🎨 **Live 3D Preview** - Instant visualization
- 🔧 **Smart Features** - Holes, vents, cutouts, fillets
- ⚡ **Fast** - Builds in seconds
- 🎯 **Production Ready** - MVP validated and tested

## 🎬 Quick Start (3 Steps)

### Windows

```bash
# 1. Configure API key
copy .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 2. Run the app
start.bat
```

### Mac/Linux

```bash
# 1. Configure API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 2. Make script executable & run
chmod +x start.sh
./start.sh
```

The app opens at **http://localhost:3000** 🎉

## 📋 Prerequisites

### Required

- ✅ **Node.js 16+** - [Download](https://nodejs.org/)
- ✅ **FreeCAD 1.0** - [Download](https://www.freecad.org/downloads.php)
- ✅ **Anthropic API Key** - [Get Key](https://console.anthropic.com/)

### Optional

- ⚡ **KiCad 8.0** - For PCB generation [Download](https://www.kicad.org/download/)

## 🛠️ Manual Installation

```bash
# Install dependencies
npm run install:all

# Configure environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run health check
npm run health-check

# Start development servers
npm run dev:full
```

## 💡 Usage Examples

### Simple Enclosure

```
Electronics case, 100x60x25mm with rounded edges
```

### With Features

```
Raspberry Pi case, 95x65x30mm, with mounting holes,
LED on front (5mm), USB port on side, ventilation,
and smooth edges
```

### Complex Design

```
IoT device enclosure, 120x80x30mm, with power LED (3mm),
status LED (5mm), reset button (8mm), USB-C port on back,
ventilation grid on top, 4 mounting holes, rounded edges,
2.5mm wall thickness, PLA material
```

## 📂 Output Files

Each build generates:

- **`.step`** - Editable in any CAD software (FreeCAD, Fusion 360, SolidWorks)
- **`.stl`** - Ready for 3D printing (Cura, PrusaSlicer, etc.)
- **3D Preview** - Interactive browser visualization

## 🏗️ Architecture

```
┌─────────────┐
│   React UI  │ ← User describes product
└──────┬──────┘
       │
┌──────▼──────┐
│ Express API │ ← Orchestrates pipeline
└──────┬──────┘
       │
┌──────▼──────┐
│  Claude AI  │ ← Extracts design specs
└──────┬──────┘
       │
┌──────▼──────┐
│   FreeCAD   │ ← Generates 3D models
└──────┬──────┘
       │
┌──────▼──────┐
│ STEP + STL  │ ← Manufacturing files
└─────────────┘
```

## 🔧 Supported Features

| Feature            | Example                            |
| ------------------ | ---------------------------------- |
| **Mounting Holes** | `with 4 mounting holes in corners` |
| **Ventilation**    | `with ventilation grid on front`   |
| **LED Cutouts**    | `LED on front (5mm diameter)`      |
| **Port Cutouts**   | `USB-C port on side (9x3mm)`       |
| **Buttons**        | `reset button on top (8mm)`        |
| **Rounded Edges**  | `with smooth rounded edges`        |
| **Wall Thickness** | `2.5mm wall thickness`             |
| **Material**       | `PLA material`                     |

## 📊 Project Structure

```
product-builder/
├── server/              # Express API
│   ├── index.js        # Main server
│   ├── routes/         # API endpoints
│   └── services/       # AI, validation, orchestration
├── client/             # React frontend
│   └── src/
│       ├── components/ # UI components
│       └── api.js      # Backend client
├── engine/             # CAD/PCB generators
│   ├── cad/           # FreeCAD Python scripts
│   └── pcb/           # KiCad Python scripts
├── exports/           # Generated files
│   ├── cad/          # STEP & STL files
│   └── pcb/          # Gerber files
└── docs/             # Documentation
```

## 🧪 Testing

```bash
# Run health check
npm run health-check

# Test with example prompt
# Open http://localhost:3000 and try:
"Electronics enclosure, 100x60x25mm with ventilation and mounting holes"
```

## 🐛 Troubleshooting

### "Cannot connect to server"

✅ Make sure both servers are running: `npm run dev:full`

### "AI planning failed"

✅ Check your `ANTHROPIC_API_KEY` in `.env`
✅ Verify you have API credits

### "CAD generation failed"

✅ Install FreeCAD 1.0: https://www.freecad.org/downloads.php
✅ Check installation: `C:\Program Files\FreeCAD 1.0\`

### "Preview not showing"

✅ Wait for "✅ Build Complete!" message
✅ Check browser console for errors
✅ Try refreshing the page

## 📚 Documentation

- **[Usage Guide](docs/USAGE_GUIDE.md)** - Complete user manual
- **[Quick Start](QUICK_START.md)** - Fast reference card
- **[Improvements](IMPROVEMENTS.md)** - Full feature list

## 🚀 npm Scripts

```bash
npm start              # Start production server
npm run dev           # Start dev server with auto-reload
npm run client        # Start React dev server
npm run dev:full      # Start both servers
npm run health-check  # Verify setup
npm run install:all   # Install all dependencies
npm run build:client  # Build React for production
```

## 🔐 Environment Variables

Required in `.env`:

```bash
ANTHROPIC_API_KEY=your_api_key_here  # Required
PORT=3001                             # Optional (default: 3001)
NODE_ENV=development                  # Optional
```

## 🎯 MVP Status

✅ Core functionality working
✅ AI integration validated
✅ 3D preview operational
✅ Error handling robust
✅ Documentation complete
✅ Health checks implemented
✅ Production ready

## 📝 License

MIT

## 🤝 Contributing

This is an MVP. For production deployment:

1. Add authentication
2. Implement rate limiting
3. Add file storage cleanup
4. Set up monitoring
5. Add analytics

## 📞 Support

- 📖 Check [docs/USAGE_GUIDE.md](docs/USAGE_GUIDE.md)
- 🔍 Run `npm run health-check`
- 💬 Review error messages in console

---

**Ready to build!** Run `start.bat` (Windows) or `./start.sh` (Mac/Linux) 🚀
