# Quick Start Guide - Full Electronics Projects

## 🎯 Goal

Generate BOTH enclosure (CAD) AND circuit board (PCB) for electronics projects.

## ✅ How It Works

Just mention **any electronics component** in your prompt, and the app will automatically generate both files!

## 📝 Example Prompts

### Arduino Projects

```
"Create enclosure for Arduino Uno"
"Arduino Nano case with sensor"
"Arduino project box with display window"
```

**Output:** CAD enclosure + PCB with microcontroller, resistors, capacitors, LEDs

### ESP32/IoT Projects

```
"ESP32 temperature sensor housing"
"WiFi smart switch enclosure"
"IoT device with ESP8266"
```

**Output:** CAD enclosure + PCB with microcontroller, sensors, WiFi module, power components

### Sensor Projects

```
"Temperature sensor housing"
"Motion detector case with PIR sensor"
"Light sensor module enclosure"
```

**Output:** CAD housing + PCB with sensor, microcontroller, support components

### LED Projects

```
"Box with 4 LEDs on front"
"LED indicator panel"
"RGB LED controller case"
```

**Output:** CAD box with LED cutouts + PCB with LEDs and current-limiting resistors

### Custom Electronics

```
"Custom circuit board enclosure, 100x80mm"
"Electronics project case with buttons and display"
"Smart home controller with sensors"
```

**Output:** CAD enclosure sized correctly + PCB with all mentioned components

## 🔍 What You'll Get

### CAD Files (Enclosure)

- ✅ `.stl` - 3D printable file
- ✅ `.step` - Editable CAD format
- ✅ Live 3D preview in browser

### PCB Files (Circuit Board)

- ✅ `.kicad_pcb` - KiCad PCB layout
- ✅ Proper component footprints (0805, SOT-23, etc.)
- ✅ 2-layer or 4-layer design
- ✅ Components placed and connected

## 📊 Build Status

Watch for these indicators:

**During Build:**

```
✅ Analyzing your requirements with AI
⏳ Generating parametric CAD model
⏳ Generating PCB layout          ← PCB step appears!
⏳ Creating 3D preview
⏳ Exporting manufacturing files
```

**After Build:**

```
Design Summary:
  PCB Layout: ⚡ 2-layer board • 6 component types

Download Files:
  🔺 enclosure.stl - 3D Print Ready
  📦 enclosure.step - CAD Editable
  ⚡ circuit.kicad_pcb - PCB Manufacturing   ← PCB file!
```

## 🚫 CAD-Only Projects (No PCB)

If you DON'T want a PCB, just describe a simple mechanical part:

```
"Storage box 50x50x30mm"
"Battery cover for remote"
"Phone stand"
"Simple enclosure with no electronics"
```

These will only generate CAD files (no PCB).

## 🔧 Troubleshooting

### PCB Not Generated?

**Check your prompt contains:**

- Electronics component names (resistor, LED, sensor, etc.)
- Microcontroller names (Arduino, ESP32, etc.)
- Electronics keywords (circuit, PCB, electronics)

**Check server logs for:**

```
⚡ Step 5: PCB Generation
```

**If you see "PCB Generation - Skipped":**

- Your prompt was interpreted as mechanical-only
- Try adding electronics keywords: "with circuit board", "Arduino", "LED", etc.

### KiCad Warning?

If you see:

```
⚠️ KiCad not available - PCB generation skipped
💡 Install KiCad to enable PCB layout generation
```

You need to install KiCad 8.0+:

- Download: https://www.kicad.org/download/
- Install with Python support
- Restart the server

## 💡 Pro Tips

1. **Be specific about components:**
   - ❌ "Smart device"
   - ✅ "ESP32 with temperature sensor and OLED display"

2. **Mention the board if needed:**
   - ✅ "Arduino Uno enclosure with circuit board"
   - ✅ "Include PCB for the electronics"

3. **Size matters:**
   - PCB will be sized to fit inside the enclosure
   - Enclosure will be sized for the specified board (Arduino Uno = 68x53mm + clearance)

4. **For custom PCBs:**
   - ✅ "2-layer PCB, 100x80mm with ESP32"
   - ✅ "4-layer board for high-speed signals"

## 📚 More Info

- Full documentation: [README.md](../README.md)
- Testing guide: [TESTING_FULL_PROJECTS.md](TESTING_FULL_PROJECTS.md)
- Fix summary: [PCB_CAD_FIX_SUMMARY.md](PCB_CAD_FIX_SUMMARY.md)
