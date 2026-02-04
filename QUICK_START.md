# 🚀 Quick Start Guide - Product Builder

## In 3 Simple Steps

### 1. Describe Your Product

Type a description including:

- Product type (case, enclosure, holder, etc.)
- Dimensions with units (100x60x25mm)
- Features you want (holes, vents, cutouts, etc.)

### 2. Click "Build Product"

AI analyzes → FreeCAD generates → Files ready

### 3. Download & Use

- **STL file** → Send to 3D printer
- **STEP file** → Edit in CAD software

---

## ⚡ Example Prompts (Click to Use!)

### Simple Enclosure

```
Electronics enclosure, 100x60x25mm with ventilation holes and rounded edges
```

### With Cutouts

```
Raspberry Pi case, 95x65x30mm, with LED on front (5mm), USB ports on side,
ventilation holes, and mounting holes in corners
```

### Battery Holder

```
AA battery holder, 80x50x20mm, with mounting holes and smooth edges,
2.5mm wall thickness
```

### Custom Device

```
IoT sensor case, 70x50x30mm, with button on top (8mm), LED on front (5mm),
USB-C port on back (9x3mm), ventilation, and rounded edges
```

---

## 🔧 Supported Features

| Feature            | Keywords                             | Example                            |
| ------------------ | ------------------------------------ | ---------------------------------- |
| **Mounting Holes** | `mounting holes`, `screw holes`      | "with 4 mounting holes in corners" |
| **Ventilation**    | `ventilation`, `vent holes`, `vents` | "with ventilation on front"        |
| **Rounded Edges**  | `rounded`, `fillet`, `smooth edges`  | "with smooth rounded edges"        |
| **LED Cutouts**    | `LED`, `indicator`                   | "LED on front, 5mm diameter"       |
| **Port Cutouts**   | `USB`, `HDMI`, `power jack`          | "USB-C port on side, 9x3mm"        |
| **Buttons**        | `button`, `switch`                   | "button on top, 8mm"               |
| **Wall Thickness** | `wall thickness`, `2mm walls`        | "2.5mm wall thickness"             |
| **Material**       | `PLA`, `ABS`, `PETG`                 | "PLA material"                     |

---

## 📐 Dimensions Guide

### Units

- **Metric**: Use `mm` (recommended)
- **Imperial**: Use `inches`

### Format

Always specify: `Length x Width x Height`

Examples:

- `100x60x25mm` ✅
- `4x2x1 inches` ✅
- `about this big` ❌

### Standard Sizes

- **Small case**: 60-100mm
- **Medium enclosure**: 100-150mm
- **Large box**: 150-250mm

---

## 🎯 Tips for Best Results

### 1. Be Specific

✅ **Good**: "100x60x25mm with 2.5mm walls"
❌ **Vague**: "small box"

### 2. Specify Positions

✅ **Good**: "LED on front, USB on side"
❌ **Vague**: "LED and USB somewhere"

### 3. Include Features

✅ **Good**: "ventilation, mounting holes, rounded edges"
❌ **Minimal**: "just a box"

### 4. Mention Material

✅ **Good**: "PLA material for 3D printing"
❌ **Omit**: (AI will default to PLA)

### 5. Use Standard Sizes

✅ **Good**: "M3 mounting holes" or "5mm LED"
❌ **Custom**: Unusual sizes may not fit standards

---

## 📥 Output Files

### What You Get

Every build generates:

1. **`.step` file** (CAD format)
   - Open in FreeCAD, Fusion 360, SolidWorks
   - Fully editable parametric model
   - Industry standard format

2. **`.stl` file** (3D Print format)
   - Import into Cura, PrusaSlicer, Simplify3D
   - Ready for 3D printing
   - High-quality mesh (2x resolution)

3. **3D Preview** (Interactive)
   - Rotate with mouse
   - Verify design before download
   - See all features instantly

---

## 🐛 Common Issues

### "AI planning failed"

→ Check `.env` file has valid `ANTHROPIC_API_KEY`

### "CAD generation failed"

→ Ensure FreeCAD is installed: `C:\Program Files\FreeCAD 1.0\`

### "Preview not showing"

→ Wait for green checkmark "Build Complete!" message

### Model looks wrong

→ Make prompt more specific with exact dimensions

---

## 💡 Pro Tips

1. **Start Simple**: Test with basic box first
2. **Add Features Gradually**: Add one feature at a time
3. **Check Examples**: Use the 5 clickable examples
4. **Review Specs**: Check the design summary table
5. **Iterate**: Rebuild with tweaks if needed

---

## 🎨 Material Recommendations

| Material | Best For                          | Temp   | Strength  |
| -------- | --------------------------------- | ------ | --------- |
| **PLA**  | Prototypes, indoor use            | Low    | Medium    |
| **ABS**  | Functional parts, heat resistance | High   | High      |
| **PETG** | Outdoor, durable items            | Medium | Very High |
| **TPU**  | Flexible parts                    | Low    | Flexible  |

---

## 📏 Wall Thickness Guide

| Thickness     | Use Case                          |
| ------------- | --------------------------------- |
| **1.5-2.0mm** | Lightweight, simple boxes         |
| **2.0-2.5mm** | Standard enclosures (recommended) |
| **2.5-3.0mm** | Strong, durable cases             |
| **3.0mm+**    | Heavy-duty applications           |

---

## 🏆 Example Projects

### Beginner

"Simple electronics box, 80x50x30mm with rounded edges"

### Intermediate

"Arduino case, 90x60x25mm, with mounting holes, LED cutout, and ventilation"

### Advanced

"Raspberry Pi 4 complete enclosure, 95x65x30mm, with GPIO access on top,
HDMI ports on side, USB ports on side, SD card access on end, power LED
on front (5mm), status LED on front (3mm), ventilation grid on top,
mounting posts inside, and rounded edges"

---

## 🎯 Ready to Build!

1. Open the app: `http://localhost:3000`
2. Type or click an example
3. Hit "🚀 Build Product"
4. Download your files
5. Print or edit!

**That's it! Start creating! 🎉**

---

## 📞 Need More Help?

- 📖 Full guide: `docs/USAGE_GUIDE.md`
- 🔧 Improvements: `IMPROVEMENTS.md`
- 📋 Installation: `README.md`
- 💻 Source: Check the `engine/cad/` folder

Happy building! 🏭
