# 📖 Product Builder Usage Guide

## How to Write Effective Prompts

### Basic Structure

Good prompts include:

1. **Product type** (enclosure, case, holder, cover, etc.)
2. **Dimensions** with units (mm or inches)
3. **Features** (mounting holes, vents, cutouts, edges)
4. **Material preference** (optional)

### Example Prompts

#### ✅ Good Prompts

```
"Create a Raspberry Pi enclosure, 100x60x25mm, with mounting holes in corners,
LED cutout on front panel, ventilation holes, and rounded edges"
```

```
"Battery holder for 4 AA batteries, 80x50x20mm, with screw holes and smooth edges,
2.5mm wall thickness, PLA material"
```

```
"Electronics case, 120x80x30mm, with USB port cutout on side, power jack on back,
status LED hole on front, and mounting posts inside"
```

#### ❌ Vague Prompts (AI will try its best, but results may vary)

```
"Make me a box"  ← Missing dimensions and features
```

```
"Enclosure for my project"  ← No specifications
```

```
"Something like an Arduino case"  ← Unclear dimensions
```

## Supported Features

### 🔩 Mounting Holes

Keywords: `mounting holes`, `screw holes`, `corners`, `grid pattern`

Example: "with 4 mounting holes in corners, M3 size"

AI will create:

- Holes at specified locations (default: corners)
- Standard diameters (3mm for M3, 4mm for M4)
- Proper offset from edges

### 🌬️ Ventilation

Keywords: `ventilation`, `vent holes`, `vents`, `airflow`

Example: "with ventilation holes on front panel"

AI will create:

- Grid pattern of circular holes
- Standard 4mm diameter
- Optimal spacing for airflow

### ✂️ Cutouts (New!)

Keywords: `LED`, `button`, `USB port`, `power jack`, `cable cutout`

Specify location: `on front`, `on back`, `on top`, `on side`

Examples:

- "LED cutout on front panel, 5mm diameter"
- "USB port cutout on side, 8mm x 4mm"
- "Power jack hole on back"

AI will create:

- Circular cutouts for LEDs, buttons
- Rectangular cutouts for ports, connectors
- Positioned on specified panel

### 🔄 Rounded Edges

Keywords: `rounded edges`, `fillet`, `smooth edges`

Example: "with smooth rounded edges"

AI will create:

- Fillets on vertical edges
- Radius based on wall thickness
- Professional finish

### 📐 Wall Thickness

Specify directly or AI will choose sensible defaults:

- Metric: 2.0-3.0mm (recommended)
- Imperial: 0.08-0.12 inches

Example: "with 2.5mm wall thickness"

## Material Selection

Supported materials (AI adjusts parameters accordingly):

- **PLA** - Good for prototypes, easy to print
- **ABS** - Strong, heat resistant
- **PETG** - Durable, flexible
- **Aluminum** - For CNC machining

## Output Files

Each build generates:

### CAD Files

- **`.step`** - Editable in any CAD software (FreeCAD, Fusion 360, SolidWorks)
- **`.stl`** - Ready for 3D printing (Cura, PrusaSlicer, etc.)

### PCB Files (if requested)

- **`.kicad_pcb`** - KiCad project file
- Gerber files for manufacturing

## 3D Preview

The live 3D preview shows:

- Auto-centered and scaled model
- All features (holes, vents, cutouts)
- Realistic lighting
- Interactive rotation (mouse drag)

## Tips for Best Results

### 1. Be Specific

✅ "100x60x25mm"  
❌ "about this big"

### 2. Use Standard Units

✅ "mm" or "inches"  
❌ "centimeters" or "feet"

### 3. Specify Important Features

✅ "with mounting holes, ventilation, and LED cutout"  
❌ "make it nice"

### 4. Mention Wall Thickness for Strength

✅ "2.5mm wall thickness"  
❌ (AI will default to 2.5mm)

### 5. Indicate Position for Cutouts

✅ "LED on front, USB on side"  
❌ "LED and USB somewhere"

## Common Use Cases

### Electronics Enclosure

```
"Electronics enclosure, 100x70x30mm, with mounting holes, ventilation on front,
power jack on back, status LED on top, 2mm wall thickness, rounded edges"
```

### Battery Holder

```
"Battery holder for 4 AA batteries, 80x50x20mm, with lid mounting holes
in corners, smooth edges"
```

### Raspberry Pi Case

```
"Raspberry Pi 4 case, 95x65x30mm, with mounting posts, GPIO access on top,
HDMI cutouts on side, USB ports on another side, SD card access on end,
ventilation holes, rounded edges"
```

### Custom PCB Enclosure

```
"PCB enclosure, 120x80x25mm, with mounting posts inside, LED indicators
on front panel (3 LEDs, 5mm), power switch cutout, cable gland hole on side,
ventilation on top, 2.5mm walls"
```

## Troubleshooting

### "AI planning failed"

- Check your ANTHROPIC_API_KEY in `.env`
- Ensure you have API credits

### "CAD generation failed"

- Verify FreeCAD is installed
- Check Windows path: `C:\Program Files\FreeCAD 1.0\`

### "Preview not showing"

- Wait for build to complete (green checkmark)
- Check browser console for errors
- Try refreshing the page

### "Model looks wrong"

- Review AI-extracted specifications in build status
- Make prompt more specific
- Try different wording for features

## Advanced Features

### Mounting Hole Patterns

- `corners` - 4 holes at corners (default)
- `grid` - Array of holes (specify count)

### Custom Dimensions

Specify any dimension:

- Length, width, height
- Hole diameters
- Cutout sizes
- Wall thickness

### Multiple Cutouts

List multiple cutouts:

```
"with LED on front (5mm), power button on top (8mm), USB-C port on back (9mm x 3mm)"
```

## Need Help?

1. Check example prompts in the app
2. Review this guide
3. Experiment with variations
4. Check console logs for detailed feedback

Happy building! 🚀
