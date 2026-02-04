# 🏭 Product Builder App

**Version 1.0.0 - MVP Ready** 🚀

AI-powered application that converts natural language product descriptions into manufacturing-ready CAD files using Claude AI + FreeCAD. Chat with AI to design complete products, assemblies, and 3D-printable parts.

## ✨ MVP Features

- 🤖 **AI Design Assistant** - Conversational product design with Claude Sonnet 4
- 📦 **CAD Generation** - Automatic STEP & STL file creation via FreeCAD
- 🎨 **Live 3D Preview** - Real-time visualization with Three.js
- 🔧 **Multi-Part Assemblies** - Complete products with hardware specifications
- 🖨️ **Print-Ready Validation** - Manifold checking, overhang detection, tolerances
- 📋 **Assembly Instructions** - Step-by-step build guides with hardware lists
- 💬 **Natural Language** - Just describe what you want in plain English

## 🎯 Concept

**AI decides WHAT to build. Engineering engines decide HOW to build it.**

```
User Chat → AI Planner (Claude) → Design Constraints → FreeCAD → Manufacturing Files
```

The AI layer **never generates geometry directly**. It outputs structured design constraints that FreeCAD uses to create precise, manufacturing-ready files.

### Example Workflow

1. **Input**: "Create a jewelry box with hinged lid, 150x100x50mm, with compartments"
2. **AI Analysis**: Determines assembly strategy, extracts dimensions, materials, hardware
3. **CAD Generation**: FreeCAD creates each part (base, lid) with proper connections
4. **Output**: Multiple STL files (printable), STEP files (editable), assembly instructions

## 🏗️ Architecture

### 4-Layer MVP System

1. **Frontend (React)** - Conversational UI, 3D preview (Three.js), assembly display
2. **API Server (Express)** - Orchestrates AI planner and CAD engine
3. **AI Planner (Claude Sonnet 4)** - Natural language → structured design constraints
4. **CAD Engine (FreeCAD Python)** - Parametric solid modeling, STL/STEP export

## 📋 Prerequisites

### Required Software

- **Node.js** (v16 or higher)
- **FreeCAD 1.0** (required for CAD generation) - [Download](https://www.freecad.org/downloads.php)
- **KiCad 8.0** (optional for PCB layout) - [Download](https://www.kicad.org/download/)

### API Keys

- **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=your_key_here
```

### 3. Run the Application

**Option A: Run both servers concurrently**

```bash
npm run dev:full
```

**Option B: Run servers separately**

```bash
# Terminal 1 - Backend server
npm start

# Terminal 2 - Frontend client
npm run client
```

### 4. Open Browser

Navigate to `http://localhost:3000`

## 💡 Usage Examples

### Simple Enclosures (CAD Only)

- "Create a battery cover for 4 AA batteries, 80mm x 40mm x 10mm, with screw holes in corners and rounded edges"
- "Small case, 100x60x25mm with ventilation holes"
- "Raspberry Pi case with mounting posts and LED cutouts"

### Electronics Projects (CAD + PCB)

- **"ESP32 temperature sensor enclosure with circuit board"** → Generates both enclosure and PCB
- **"Arduino Uno project case with electronics"** → Creates housing + PCB layout
- **"IoT device with WiFi and sensors"** → Full electronics project
- **"LED controller with 4 indicator lights"** → Enclosure with LED PCB
- **"Custom smart home controller"** → Complete electronics package

### PCB-Only Projects

- "PCB for Arduino shield, 2-layer, 68x53mm"
- "Sensor breakout board with I2C interface"
- "Power supply PCB with voltage regulator"

💡 **Tip**: For electronics projects, just mention the electronics components (Arduino, ESP32, sensors, LEDs) and the AI will automatically generate BOTH the enclosure AND the PCB!

## 📁 Project Structure

```
product-builder/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── PromptInput.jsx
│   │       ├── BuildStatus.jsx
│   │       └── CanvasView.jsx
│   └── package.json
│
├── server/                 # Node.js API
│   ├── index.js
│   ├── routes/
│   │   └── build.js
│   └── services/
│       ├── aiPlanner.js       # Claude API integration
│       ├── validator.js       # Design validation
│       └── orchestrator.js    # Child process coordination
│
├── engine/                 # Python Engineering Layer
│   ├── cad/
│   │   └── freecad_generator.py
│   ├── pcb/
│   │   └── kicad_generator.py
│   └── parser/
│       └── schema.py
│
├── exports/                # Generated files
│   ├── cad/               # STL, STEP files
│   └── pcb/               # Gerber files
│
├── .github/
│   └── copilot-instructions.md
└── package.json
```

## 🔧 Development Workflow

### Backend (Node.js)

```bash
# Start with auto-reload
npm run dev

# Test a single build endpoint
curl -X POST http://localhost:3001/api/build \
  -H "Content-Type: application/json" \
  -d '{"prompt": "battery cover 80x40x10mm"}'
```

### Python Engines

Test CAD generator directly:

```bash
echo '{"product_type":"enclosure","units":"mm","length":80,"width":40,"height":10,"wall_thickness":2}' | \
  python engine/cad/freecad_generator.py test-123
```

### Frontend (React)

```bash
cd client
npm start  # Runs on http://localhost:3000
```

## 🏗️ System Requirements

Before running the application, you **must install**:

1. **FreeCAD** - For parametric CAD model generation
2. **KiCad** - For PCB layout and Gerber file generation

**📖 Complete installation guide:** [docs/INSTALL_CAD_TOOLS.md](docs/INSTALL_CAD_TOOLS.md)

The application will fail with a clear error message if these tools are not installed.

## 🎨 AI Design Schema

The AI planner outputs structured JSON like this:

```json
{
  "product_type": "battery_cover",
  "units": "mm",
  "length": 80,
  "width": 40,
  "height": 10,
  "wall_thickness": 2,
  "features": ["fillet", "screw_holes"],
  "material": "PLA",
  "mounting_holes": {
    "diameter": 3,
    "count": 4,
    "pattern": "corners"
  },
  "pcb_required": false
}
```

## 🔒 Validation Rules

Before generation, the system validates:

- ✅ Units defined (`mm` or `inches`)
- ✅ Dimensions within reasonable ranges
- ✅ Wall thickness ≥ 1.5mm (manufacturability)
- ✅ PCB trace width ≥ 0.15mm
- ✅ PCB layers (1, 2, or 4 only)

## 🐛 Troubleshooting

### FreeCAD or KiCad Not Found

If you see errors like:

```
FreeCAD is not installed or not available in Python path
KiCad Python API is not installed or not available
```

**Solution:** Install the required tools following [docs/INSTALL_CAD_TOOLS.md](docs/INSTALL_CAD_TOOLS.md)

Verify installation:

```bash
python -c "import FreeCAD; print('FreeCAD OK')"
python -c "import pcbnew; print('KiCad OK')"
```

### CORS errors in browser

### Mock Mode vs Real Mode

Check the server logs when you submit a build:

**Mock Mode (FreeCAD not available):**

```
Warning: FreeCAD not available, using mock mode
Creating mock STEP file...
Creating mock STL file...
```

**Real Mode (FreeCAD working):**

```
Generating enclosure...
Dimensions: 100x70x30 mm
Wall thickness: 2 mm
Created hollow enclosure
Applied 1.6mm fillets to 4 edges
Added 4 mounting holes (⌀3mm)
Exported STEP: xxxxx.step
Exported STL: xxxxx.stl
```

### Installing FreeCAD and KiCad

For **production-quality CAD/PCB files**, install these tools:

**📖 Full installation guide:** [docs/INSTALL_CAD_TOOLS.md](docs/INSTALL_CAD_TOOLS.md)

Quick verification:

```bash
# Test if Python can import the modules
python -c "import FreeCAD; print('FreeCAD OK')"
python -c "import pcbnew; print('KiCad OK')"
```

### CORS errors in browser

- Ensure backend is running on port 3001
- Check proxy setting in `client/package.json`

### AI returns invalid JSON

- Check Anthropic API key in `.env`
- Verify API quota/credits
- Check server logs for detailed error messages

## 📊 MVP Build Order

Following the architecture blueprint:

1. ✅ Backend server
2. ✅ AI planner integration
3. ✅ CAD generator (STL/STEP export)
4. ✅ Validation layer
5. ✅ 3D Canvas preview
6. ✅ PCB generator
7. ✅ Full integration

## 🛠️ Tech Stack

- **Frontend**: React, Three.js, React Three Fiber
- **Backend**: Node.js, Express
- **AI**: Claude 4 Sonnet (Anthropic)
- **CAD**: FreeCAD Python API
- **PCB**: KiCad Python API
- **3D Rendering**: WebGL via Three.js

## 📝 License

MIT

## 🤝 Contributing

This is a blueprint-driven project. Follow the architecture principles in `docs/COPILOT_CONTEXT.md` and `.github/copilot-instructions.md` when contributing.

---

**Built with AI assistance** • Powered by Claude, FreeCAD, and KiCad
