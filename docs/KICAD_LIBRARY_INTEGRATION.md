# KiCad Library Integration

## Overview

The Product Builder is now connected to comprehensive KiCad component libraries with symbols, footprints, and 3D models.

## Architecture

### 1. KiCad Library Structure

```
kicad_libs/
├── symbols/         # 230+ symbol libraries (.kicad_sym files)
├── footprints/      # 180+ footprint libraries (.pretty directories)
└── 3dmodels/        # 100+ 3D model libraries (.3dshapes directories)
```

### 2. Integration Components

#### **kicad_lib_mapper.js**

Central component library mapping file that:

- Maps component types to KiCad symbols and footprints
- Provides multiple footprint options per component (SMD sizes, THT)
- Includes electrical specifications (values, ratings, types)
- Exports helper functions for component expansion

**Key Functions:**

- `getSymbolLibrary(componentType)` - Get symbol library path
- `getFootprint(componentType, size)` - Get footprint with optional size
- `getComponentSpecs(componentType)` - Get full component specifications
- `expandComponentsWithLibraries(components)` - Expand component list with library data
- `getRecommendedComponents(projectType)` - Get starter components for project types

#### **AI Planner Integration** (aiPlanner.js)

- Imports KiCad library mapper
- Uses `COMPONENT_LIBRARY` for AI prompts
- Calls `expandComponentsWithLibraries()` to enhance PCB specifications
- Provides component details in design reasoning

#### **PCB Generator Integration** (kicad_generator.py)

- Points to local `kicad_libs/` directory
- Uses `componentSpecs` enhanced with real footprints
- Attempts to load footprints from local libraries
- Falls back to built-in KiCad libraries
- Creates simple footprints as final fallback

## Supported Components

### Passive Components

- **Resistors**: 0402, 0603, 0805, 1206, THT
- **Capacitors**: 0402, 0603, 0805, 1206, THT, Tantalum, Electrolytic
- **Inductors**: 0603, 0805, 1206
- **LEDs**: 0603, 0805, 1206, 3mm THT, 5mm THT
- **Diodes**: SOD-323, SOD-123, SMA, DO-41
- **Crystals**: HC49, 3225 (common frequencies: 8MHz, 12MHz, 16MHz, 32.768kHz)

### Semiconductors

- **Transistors (BJT)**: SOT-23, TO-92 (2N3904, BC547, 2N3906)
- **MOSFETs**: SOT-23 (2N7002, BSS138, IRLML6344)
- **Voltage Regulators**: SOT-223, TO-220 (LM7805, LM1117, AMS1117)
- **Op-Amps**: SOIC-8, DIP-8 (LM358, LM324, TL072)

### Microcontrollers

- **ATmega**: TQFP-32, DIP-28 (ATmega328P, ATmega168, ATmega32U4)
- **STM32**: LQFP-48, LQFP-64 (STM32F103, STM32F401, STM32L4)

### Sensors

- **Temperature**: TO-92, SOT-23 (DS18B20, LM35, TMP36, DHT22)
- **Motion/IMU**: QFN-24 (MPU6050, MPU9250, ICM-20948)
- **Pressure**: LGA-8 (BMP180, BMP280, BME280)

### Connectors

- **USB-C**: 16-pin receptacle
- **USB Micro-B**: 5-pin receptacle
- **Pin Headers**: 2.54mm pitch (1x2, 1x3, 1x4, 2x3, etc.)

### Switches

- **Tactile**: SMD (PTS645 series), THT (6mm)

## Usage Examples

### JavaScript (AI Planner)

```javascript
const { expandComponentsWithLibraries } = require("./kicad_lib_mapper");

// Expand simple component list
const components = ["resistor", "capacitor", "led"];
const expanded = expandComponentsWithLibraries(
  components.map((c) => ({ type: c })),
);

// Result includes footprint, symbol, and specs:
// [
//   {
//     type: 'resistor',
//     symbol: 'Device:R',
//     footprint: 'Resistor_SMD:R_0805_2012Metric',
//     specs: { values: ['100', '220', '1K', ...], ... }
//   },
//   ...
// ]
```

### Python (PCB Generator)

```python
# Component specs are automatically enhanced by AI planner
design_data = {
    'componentSpecs': [
        {
            'type': 'resistor',
            'footprint': 'Resistor_SMD:R_0805_2012Metric',
            'symbol': 'Device:R',
            'value': '10K'
        }
    ]
}

# Generator will try to load from local libraries:
# 1. kicad_libs/footprints/Resistor_SMD.pretty/R_0805_2012Metric.kicad_mod
# 2. KiCad built-in libraries
# 3. Fallback to simple footprint generation
```

## Component Library Reference

### COMPONENT_LIBRARY Structure

```javascript
{
  component_type: {
    symbol: 'Library:Symbol_Name',
    footprints: {
      'size_1': 'Library:Footprint_1',
      'size_2': 'Library:Footprint_2'
    },
    defaultFootprint: 'Library:Default',
    values: ['common', 'values'],
    common: ['common', 'parts'],
    specs: { additional: 'specifications' }
  }
}
```

## Benefits

1. **Real Component Data**: Uses actual KiCad library components instead of generic placeholders
2. **Multiple Footprint Options**: Supports different sizes (0402, 0603, 0805, etc.)
3. **Comprehensive Coverage**: 40+ component types with full specifications
4. **Graceful Degradation**: Falls back to simpler footprints if libraries unavailable
5. **Project Templates**: Recommended component sets for common project types
6. **3D Model Support**: Links to 3D models for realistic PCB visualization

## Project Type Recommendations

### Arduino Projects

- ATmega328P (TQFP-32)
- 10K resistors (x4)
- 0.1uF capacitors (x4)
- 10uF capacitors (x2)
- Green LED
- 16MHz crystal
- Pin headers

### Sensor Modules

- 4.7K resistors (x2)
- 0.1uF capacitors (x2)
- 4-pin header
- Status LED

### Power Supplies

- AMS1117-3.3 regulator
- 10uF capacitors (x2)
- 0.1uF capacitors (x2)
- 1N4007 diode
- Status LED
- 1K resistor

## Future Enhancements

1. **Symbol Library Loading**: Load symbols for schematic generation
2. **3D Model Integration**: Use 3D models for realistic PCB renders
3. **BOM Generation**: Auto-generate bill of materials with part numbers
4. **Supplier Integration**: Link to suppliers (DigiKey, Mouser, LCSC)
5. **Custom Libraries**: Support for user-defined component libraries
6. **Auto-routing**: Intelligent trace routing based on component placement
