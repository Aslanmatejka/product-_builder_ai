# KiCad Libraries Setup

Product Builder now uses KiCad's standard component libraries for professional PCB generation.

## Features

- **Standard Footprints**: Uses official KiCad footprint libraries
- **Component Support**: Resistors, capacitors, LEDs, ICs, connectors, and more
- **Automatic Fallback**: Falls back to simple footprints if libraries aren't found
- **Professional Quality**: Industry-standard component footprints

## Supported Components

| Component Type | KiCad Library              | Package            |
| -------------- | -------------------------- | ------------------ |
| Resistor       | Resistor_SMD               | 0805 (2012 Metric) |
| Capacitor      | Capacitor_SMD              | 0805 (2012 Metric) |
| LED            | LED_SMD                    | 0805 (2012 Metric) |
| Diode          | Diode_SMD                  | SOD-323            |
| Transistor     | Package_TO_SOT_SMD         | SOT-23             |
| IC             | Package_SO                 | SOIC-8             |
| Connector      | Connector_PinHeader_2.54mm | 2-pin header       |
| Switch         | Button_Switch_SMD          | PTS645             |
| Crystal        | Crystal                    | HC49-SD            |
| Inductor       | Inductor_SMD               | 0805 (2012 Metric) |

## Installation

### Windows

KiCad libraries are automatically included when you install KiCad:

1. Download KiCad from https://www.kicad.org/download/
2. Install with default options (includes all standard libraries)
3. Libraries are located at:
   ```
   C:\Program Files\KiCad\{version}\share\kicad\footprints\
   C:\Program Files\KiCad\{version}\share\kicad\symbols\
   ```

### Optional: Custom Library Path

Set environment variables to use custom library locations:

```bash
# PowerShell
$env:KICAD_LIBS_PATH = "C:\path\to\custom\kicad-libs"
$env:KICAD_FOOTPRINT_DIR = "C:\path\to\footprints"
$env:KICAD_SYMBOL_DIR = "C:\path\to\symbols"
```

## Usage

The app automatically uses KiCad libraries when generating PCBs:

1. **Automatic Selection**: Component types are mapped to appropriate KiCad footprints
2. **Professional Output**: Uses industry-standard footprint dimensions
3. **Graceful Fallback**: If a library isn't found, uses simple SMD footprints

### Example

When you request:

```
"Add a 10k resistor and 100nF capacitor"
```

The system will:

- Use `Resistor_SMD:R_0805_2012Metric` for the resistor
- Use `Capacitor_SMD:C_0805_2012Metric` for the capacitor
- Both in professional SMD packages ready for manufacturing

## Verification

Check if KiCad libraries are available:

```powershell
# Check KiCad installation
Get-ChildItem "C:\Program Files\KiCad" -Recurse -Filter "*.kicad_mod" | Select-Object -First 5

# Should show footprint library files (.kicad_mod)
```

## Troubleshooting

### Libraries Not Found

If you see warnings about missing libraries:

1. **Check KiCad Installation**: Make sure KiCad is installed with libraries
2. **Verify Path**: Libraries should be in KiCad's share folder
3. **Fallback Mode**: App will use simple footprints automatically

### Custom Components

To add custom footprints:

1. Create footprints in KiCad's Footprint Editor
2. Save to a custom library
3. Set `KICAD_FOOTPRINT_DIR` environment variable
4. Update the component mapping in `kicad_generator.py`

## Benefits

✅ **Professional PCBs**: Industry-standard footprints
✅ **Manufacturing Ready**: Compatible with all PCB manufacturers
✅ **Accurate Dimensions**: Precise footprint measurements
✅ **Wide Support**: Thousands of components available
✅ **Easy Integration**: Works automatically with KiCad installation

## Next Steps

- Install KiCad from https://www.kicad.org/
- Run a build with PCB components
- Export Gerber files for manufacturing
- Use KiCad to further customize the design
