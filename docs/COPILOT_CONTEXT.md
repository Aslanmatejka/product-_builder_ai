
This document is your blueprint for building a **Product Builder App** that converts user descriptions into real CAD and PCB files using AI planning + engineering engines.

---

# 1. High‑Level Concept

The app does **not** directly generate geometry using AI. Instead it works in layers:

User Prompt → AI Planner → Structured Design Data → CAD/PCB Engines → Manufacturing Files

AI decides **what to build**.
Engineering engines decide **how it is built**.

---

# 2. System Architecture (Logical Layers)

## Layer 1 — Frontend (UI)

* Text input for product idea
* Build button
* Progress indicator
* Download section for STL / STEP / GERBER
* Canvas preview of 3D model

## Layer 2 — API Server (Orchestrator)

* Receives product description
* Sends prompt to AI model (Claude)
* Validates structured output
* Calls CAD + PCB engines
* Returns file paths and preview data

## Layer 3 — AI Planner

* Converts natural language → structured JSON/DSL
* Enforces design schema rules
* No geometry creation here

## Layer 4 — Engineering Engines

### CAD Engine

* FreeCAD Python scripting
* Generates STEP + STL
* Parametric solids only

### PCB Engine

* KiCad scripting
* Generates Gerber files
* Handles components and routing

## Layer 5 — Storage / Exports

* CAD folder
* PCB folder
* Temporary build cache

---

# 3. Project Folder Structure

```
product-builder/
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── PromptInput.jsx
│   │       ├── BuildStatus.jsx
│   │       └── CanvasView.jsx
│
├── server/                 # Node API
│   ├── index.js
│   ├── routes/
│   │   └── build.js
│   ├── services/
│   │   ├── aiPlanner.js
│   │   ├── validator.js
│   │   └── orchestrator.js
│
├── engine/                 # Python Engineering Layer
│   ├── cad/
│   │   └── freecad_generator.py
│   ├── pcb/
│   │   └── kicad_generator.py
│   └── parser/
│       └── schema.py
│
├── exports/
│   ├── cad/
│   └── pcb/
│
├── docs/
│   └── COPILOT_CONTEXT.md
└── package.json
```

---

# 4. VS Code Setup Instructions

## Install Extensions

* GitHub Copilot
* Copilot Chat
* Python
* Docker (optional)
* ESLint

## Install System Tools

* Node.js
* Python 3.11+
* FreeCAD
* KiCad

---

# 5. How to Instruct Copilot Per File

## server/index.js

"Create an Express server with JSON parsing, CORS, and a /build POST endpoint using clean architecture."

## server/services/orchestrator.js

"Coordinate AI planner, CAD generator, and PCB generator using async child processes."

## engine/cad/freecad_generator.py

"Generate parametric CAD solids from structured JSON constraints and export STEP and STL."

## engine/pcb/kicad_generator.py

"Generate PCB layout and export Gerber files using KiCad scripting."

---

# 6. AI Design Schema (Example)

The AI must output structured data like:

```
{
  "product_type": "battery_cover",
  "units": "mm",
  "length": 80,
  "width": 40,
  "height": 10,
  "wall_thickness": 2,
  "features": ["fillet", "screw_holes"]
}
```

This data feeds the CAD engine.

---

# 7. Canvas View (3D Preview Layer)

## Purpose

Display generated STL/STEP in browser.

## Tools

* Three.js
* React Three Fiber

## Canvas Component Responsibilities

* Load STL file from server
* Rotate / Zoom / Pan
* Toggle wireframe/solid
* Show bounding box dimensions

## Canvas Data Flow

Backend STL → API URL → React Canvas Component → Three.js Renderer

---

# 8. Validation Layer

Before generation, check:

* Units defined
* Dimensions exist
* Wall thickness safe
* PCB trace width valid

---

# 9. MVP Build Order

1. Backend server
2. AI planner integration
3. CAD generator only
4. STL export
5. Canvas preview
6. PCB generator
7. Validation rules

