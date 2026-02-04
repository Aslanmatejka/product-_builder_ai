# FreeCAD Python API Implementation

## Overview

The Product Builder uses **FreeCAD's Python API** to generate 3D CAD models programmatically. This allows the AI to design complex parametric parts without manual CAD work.

## Architecture

```
User Prompt → AI Planner → Design JSON → FreeCAD Python API → STEP + STL Files
                                              ↓
                                         FreeCAD Part Module
                                              ↓
                                    Parametric Solid Geometry
```

## Implementation Location

**File**: `engine/cad/freecad_generator.py` (1,713 lines)

**Key Components**:

- FreeCAD Part module for solid modeling
- FreeCAD Mesh module for STL export
- JSON-driven parametric design
- Child process communication (stdin/stdout)

## Installation

### Windows

```powershell
# Download from FreeCAD.org
# Install to: C:\Program Files\FreeCAD 0.21\
# Python will be at: C:\Program Files\FreeCAD 0.21\bin\python.exe
```

### Linux

```bash
sudo apt-get install freecad
pip install freecad
```

### macOS

```bash
brew install freecad
```

## Test FreeCAD Installation

```bash
node test-freecad.js
```

## Supported Shape Types

### Basic Shapes (25+)

- **box**: Rectangular enclosures with walls
- **cylinder**: Cylindrical shapes (shafts, tubes)
- **sphere**: Spherical objects
- **cone**: Conical shapes (funnels)
- **torus**: Donut shapes (rings)
- **pyramid**: Pyramidal structures
- **dome**: Hemispherical domes
- **prism**: Polygonal prisms (hex, oct)

### Advanced Shapes

- **loft**: Smooth transitions between cross-sections

  ```json
  {
    "shape_type": "loft",
    "sections": [
      { "shape": "circle", "size": 30, "z": 0 },
      { "shape": "square", "size": 50, "z": 100 }
    ]
  }
  ```

- **sweep**: Extrude profile along path (helix, arc)

  ```json
  {
    "shape_type": "sweep",
    "profile_shape": "circle",
    "path_type": "helix",
    "radius": 20,
    "height": 100,
    "pitch": 10
  }
  ```

- **revolve**: Rotate 2D profile around axis

  ```json
  {
    "shape_type": "revolve",
    "profile_points": [
      [10, 0],
      [20, 50],
      [15, 100]
    ],
    "angle": 360
  }
  ```

- **organic**: Blob-like sculptural forms

  ```json
  {
    "shape_type": "organic",
    "blob_count": 5,
    "base_size": 50
  }
  ```

- **lattice**: 3D mesh structures
  ```json
  {
    "shape_type": "lattice",
    "size": 100,
    "cell_size": 10,
    "strut_thickness": 2
  }
  ```

### Mechanical Parts

- **gear**: Spur gears with teeth
- **screw**: Threaded fasteners (M3, M4, M5, M6, M8)
- **nut**: Hex nuts
- **bearing**: Ball bearings
- **pulley**: Timing pulleys
- **washer**: Flat washers
- **shaft**: Cylindrical shafts
- **spring**: Coil springs
- **knob**: Control knobs
- **hinge**: Pin hinges

### Everyday Objects

- **phone_stand**: Angled phone holders
- **phone_case**: Custom phone cases
- **bottle**: Water bottles with caps
- **cup**: Mugs and cups
- **vase**: Decorative vases
- **bowl**: Bowls and dishes
- **plate**: Flat plates
- **pen_holder**: Desk organizers
- **cable_organizer**: Cable management
- **card_holder**: Business card holders
- **coaster**: Drink coasters
- **keychain**: Custom keychains
- **planter**: Plant pots
- **funnel**: Funnels

## FreeCAD API Usage Examples

### Creating a Box

```python
import Part
box = Part.makeBox(length, width, height)
inner = Part.makeBox(inner_length, inner_width, inner_height)
inner.translate(FreeCAD.Vector(wall, wall, wall))
hollow_box = box.cut(inner)
```

### Creating a Cylinder

```python
cylinder = Part.makeCylinder(radius, height)
inner = Part.makeCylinder(inner_radius, inner_height)
hollow_cylinder = cylinder.cut(inner)
```

### Creating a Loft

```python
# Create wires at different heights
circle = Part.Wire(Part.makeCircle(30))
square = Part.Wire(Part.makePolygon([...]))

# Loft between sections
shape = Part.makeLoft([circle, square], True)
```

### Creating a Sweep

```python
# Create profile
circle = Part.Wire(Part.makeCircle(radius))

# Create path (helix)
helix = Part.makeHelix(pitch, height, radius)

# Sweep profile along path
shape = circle.makePipeShell([helix])
```

### Adding Features

#### Chamfers

```python
edges = shape.Edges
chamfered = shape.makeChamfer(1.0, edges)
```

#### Fillets

```python
edges = shape.Edges
filleted = shape.makeFillet(2.0, edges)
```

#### Boolean Operations

```python
# Cut
result = shape1.cut(shape2)

# Fuse
result = shape1.fuse(shape2)

# Common (intersection)
result = shape1.common(shape2)
```

## Exporting Files

### STEP Export (CAD interchange)

```python
Part.export([obj], str(step_file))
```

### STL Export (3D printing)

```python
import Mesh
mesh = Mesh.Mesh()
mesh.addFacets(shape.tessellate(0.1))
mesh.write(str(stl_file))
```

## Integration with Node.js

### Calling from Orchestrator

```javascript
const { spawn } = require("child_process");
const pythonCmd = getFreeCADPython();
const proc = spawn(pythonCmd, ["engine/cad/freecad_generator.py", buildId]);

// Send design JSON via stdin
proc.stdin.write(JSON.stringify(designData));
proc.stdin.end();

// Receive result via stdout
proc.stdout.on("data", (data) => {
  const result = JSON.parse(data);
  console.log("CAD files:", result.files);
});
```

## Design JSON Schema

```json
{
  "product_type": "enclosure",
  "shape_type": "box",
  "length": 100,
  "width": 80,
  "height": 50,
  "wall_thickness": 2.5,
  "units": "mm",
  "material": "PLA",
  "features": ["chamfer", "mounting_holes", "ventilation"],
  "cutouts": [
    {
      "type": "usb_c",
      "position": "front",
      "width": 9,
      "height": 3.5
    }
  ],
  "mounting_holes": {
    "enabled": true,
    "diameter": 3.3,
    "count": 4,
    "pattern": "corners"
  }
}
```

## Print Analysis

The generator provides automatic 3D printability analysis:

```
=== RECOMMENDED PRINT SETTINGS ===
Material: PLA
Layer Height: 0.2mm
Infill: 20%
Wall Line Count: 3
Print Speed: 50mm/s
Estimated Time: 2.5 hours
Estimated Material: 45g

=== GEOMETRY ANALYSIS ===
✓ Geometry is manifold (watertight)
✓ No significant overhangs detected
✓ Printable without supports
```

## Error Handling

### FreeCAD Not Installed

```
Warning: FreeCAD not available. Install FreeCAD for actual CAD generation.
```

### Invalid Dimensions

```
WARNING: Wall thickness 1.0mm is below recommended minimum 2.5mm for PLA
  Increasing to 2.5mm for printability
```

### Non-Manifold Geometry

```
WARNING: Geometry is not valid - may have errors
⚠️  Non-manifold geometry detected - may not print correctly
```

## Performance

- **Simple box**: ~2 seconds
- **Complex assembly**: ~5-10 seconds
- **Advanced loft/sweep**: ~3-5 seconds

## Limitations

1. **Maximum dimensions**: 500mm (limited by validator)
2. **Minimum wall thickness**: 1.5mm (PLA), 3mm (TPU)
3. **File size**: STL files can be large for complex shapes
4. **Tessellation**: Curved surfaces use 0.1mm tolerance

## Troubleshooting

### "FreeCAD not found"

- Install FreeCAD from https://www.freecad.org/downloads.php
- Add to PATH or update `getFreeCADPython()` in orchestrator.js

### "CAD generation failed: 'length'"

- Ensure design JSON has required dimensions
- Check `autoCorrectDesign()` is adding defaults

### "Geometry is not valid"

- Check wall thickness > 0
- Verify dimensions are positive
- Ensure cutouts don't exceed part size

## Future Enhancements

- [ ] Parametric constraints (proportional sizing)
- [ ] Assembly constraints (mates, joints)
- [ ] Sketches with constraints
- [ ] Pattern features (linear, circular arrays)
- [ ] Shell operations (hollow complex shapes)
- [ ] Thread modeling (helical features)
- [ ] Surface operations (offset, thicken)
- [ ] Import existing STEP files
- [ ] Topology optimization
- [ ] FEM analysis integration

## Resources

- **FreeCAD Python API**: https://wiki.freecad.org/Python_scripting_tutorial
- **Part Module**: https://wiki.freecad.org/Part_Module
- **Mesh Module**: https://wiki.freecad.org/Mesh_Scripting
- **Examples**: https://wiki.freecad.org/Code_snippets
