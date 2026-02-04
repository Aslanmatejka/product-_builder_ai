# Geometry Pipeline Documentation

## Overview

The **Geometry Pipeline** transforms user prompts into professional CAD geometry through a multi-layer architecture:

```
User Prompt → AI Planner → Interpreter Layer → CAD Engine → Export
```

## Architecture

### 1. **AI Planner** (`server/services/aiPlanner.js`)

- Converts natural language to structured design instructions
- Example input: `"Design a bicycle frame for 180cm rider aluminum"`
- Example output:
  ```json
  {
    "product_type": "bicycle_frame",
    "rider_height": 180,
    "material": "aluminum",
    "units": "cm"
  }
  ```

### 2. **Interpreter Layer** (`engine/interpreter/geometry_interpreter.py`)

- Routes designs to appropriate CAD engine
- Auto-selects engine based on design requirements:
  - **FreeCAD**: Default, most versatile (25+ shapes)
  - **CadQuery**: Parametric assemblies, code-first CAD
  - **OpenCascade**: High-performance batch processing
- Detects specialized geometries (bicycles, gears, etc.)

### 3. **CAD Adapters**

Three adapter modules provide unified interface:

#### **FreeCAD Adapter** (`freecad_adapter.py`)

- Default engine, production-ready
- Supports all shape types
- Exports: STEP, STL, OBJ

#### **CadQuery Adapter** (`cadquery_adapter.py`)

- Python-based parametric CAD
- Great for assemblies
- Exports: STEP, STL, OBJ

#### **OpenCascade Adapter** (`opencascade_adapter.py`)

- Direct OCCT API access
- High-performance geometry
- Exports: STEP, STL

### 4. **Specialized Geometry Generators**

#### **Bicycle Frame Generator** (`engine/geometry/bicycle_frame_generator.py`)

Parametric bicycle frame based on rider anthropometrics:

**Input**:

```json
{
  "product_type": "bicycle_frame",
  "rider_height": 180,
  "material": "aluminum",
  "units": "cm"
}
```

**Features**:

- Calculates frame geometry from rider height
- Standard bicycle ratios (stack, reach, seat tube, etc.)
- Material-specific tube diameters (aluminum, steel, carbon)
- 7 frame tubes: seat, top, down, head, chainstays (2), seatstays (2)
- Professional frame angles (head: 72°, seat: 73.5°)

**Geometry Calculations**:

```python
seat_tube = rider_height * 0.50    # 900mm for 180cm rider
top_tube = rider_height * 0.30     # 540mm
head_tube = rider_height * 0.065   # 117mm
chainstay = rider_height * 0.25    # 450mm
```

**Tube Diameters**:

- **Aluminum**: down tube 38mm, top tube 32mm, seat tube 32mm
- **Steel**: down tube 32mm, top tube 28mm, seat tube 28mm
- **Carbon**: down tube 40mm, top tube 34mm, seat tube 34mm

### 5. **Export Formats**

All geometry exports to three formats:

1. **STEP** (.step) - Manufacturing, CAD import
2. **STL** (.stl) - 3D printing
3. **OBJ** (.obj) - Visualization (Unity, Blender, Three.js)

## Usage

### Example 1: Simple Prompt

```
User: "Design a bicycle frame for 180cm rider aluminum"
```

**Pipeline Flow**:

1. AI Planner → `{product_type: "bicycle_frame", rider_height: 180, material: "aluminum"}`
2. Interpreter → Detects "bicycle" → Routes to bicycle generator
3. Bicycle Generator → Calculates frame geometry → Creates 7 tubes
4. Export → STEP, STL, OBJ files

### Example 2: Design Language

```
User: "Create a table 1200x600mm with 4 legs using sketch and extrude"
```

**Pipeline Flow**:

1. AI Planner → `{use_design_language: true, operations: [...]}`
2. Interpreter → Detects design language → Routes to FreeCAD adapter
3. FreeCAD Adapter → Executes operations sequentially
4. Export → STEP, STL, OBJ files

### Example 3: Direct CAD

```
User: "Box 100x80x50mm"
```

**Pipeline Flow**:

1. AI Planner → `{shape_type: "box", length: 100, width: 80, height: 50}`
2. Interpreter → Standard geometry → Routes to FreeCAD
3. FreeCAD → Creates box primitive
4. Export → STEP, STL, OBJ files

## Integration Points

### Orchestrator Integration

The orchestrator (`server/services/orchestrator.js`) automatically selects the pipeline:

```javascript
// Use Geometry Interpreter for:
// - Design language operations
// - Bicycle frames
// - Other specialized geometries
const useInterpreter =
  designData.use_design_language ||
  designData.product_type?.includes("bicycle");

if (useInterpreter) {
  cadResult = await runGeometryInterpreter(buildId, designData);
} else {
  cadResult = await runCADGenerator(buildId, designData);
}
```

### Engine Auto-Selection

The interpreter auto-selects the best engine:

```python
def select_optimal_engine(design_data):
    # CadQuery for assemblies
    if design_data.get('is_assembly'):
        return 'cadquery'

    # OpenCascade for batch processing
    if design_data.get('batch_mode'):
        return 'opencascade'

    # FreeCAD default (most versatile)
    return 'freecad'
```

## File Structure

```
engine/
├── interpreter/
│   ├── geometry_interpreter.py      # Main interpreter
│   ├── freecad_adapter.py           # FreeCAD adapter
│   ├── cadquery_adapter.py          # CadQuery adapter
│   ├── opencascade_adapter.py       # OpenCascade adapter
│   └── bicycle_frame_generator.py   # Bicycle wrapper
├── geometry/
│   └── bicycle_frame_generator.py   # Bicycle implementation
└── cad/
    ├── freecad_generator.py         # FreeCAD main generator
    └── design_language.py           # Operations executor
```

## Testing

### Test Bicycle Frame

```bash
echo '{"product_type":"bicycle_frame","rider_height":180,"material":"aluminum","units":"cm"}' | \
python engine/interpreter/geometry_interpreter.py test-bike-123
```

### Test Design Language

```bash
echo '{"use_design_language":true,"operations":[{"type":"SketchRectangle","width":100,"height":50},{"type":"Extrude","height":10}]}' | \
python engine/interpreter/geometry_interpreter.py test-ops-456
```

### Test Standard Shape

```bash
echo '{"shape_type":"box","length":100,"width":80,"height":50,"units":"mm"}' | \
python engine/interpreter/geometry_interpreter.py test-box-789
```

## Adding New Specialized Geometries

To add a new specialized geometry (e.g., gear sets):

1. **Create generator**: `engine/geometry/gear_generator.py`
2. **Add detection**: In `geometry_interpreter.py`:
   ```python
   def _is_specialized_geometry(self, product_type):
       specialized_types = [
           'bicycle', 'bike',
           'gear', 'gear_set',  # ADD THIS
       ]
       return any(spec in product_type for spec in specialized_types)
   ```
3. **Add routing**: In `_generate_specialized_geometry()`:
   ```python
   if 'gear' in product_type:
       from gear_generator import generate_gear_set
       return generate_gear_set(design_data, build_id, output_dir)
   ```

## Benefits

1. **Flexible**: Multiple CAD engines for different use cases
2. **Extensible**: Easy to add new geometries or engines
3. **Smart Routing**: Auto-selects best engine for each design
4. **Professional Output**: STEP for CAD, STL for printing, OBJ for viz
5. **Parametric**: Bicycle frames scale with rider height
6. **Production-Ready**: Exports industry-standard formats

## Future Enhancements

- **Gear Generator**: Parametric involute gears
- **Thread Generator**: ISO metric threads for bolts/screws
- **Spring Generator**: Compression/extension/torsion springs
- **Bearing Generator**: Ball bearings with races
- **Assembly Optimizer**: Auto-arrange parts for printing
- **Topology Optimization**: AI-driven material reduction
