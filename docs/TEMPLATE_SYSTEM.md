# Template & Rule System Documentation

## Overview

The **Template & Rule System** trains and guides the AI with predefined templates, parameter tables, and rule libraries. This reduces errors and ensures consistent, high-quality designs.

## Architecture

```
User Prompt → Rule Engine → Template Matcher → Parameter Extractor → AI → Design
```

### Components

1. **Template Library** (`engine/templates/template_library.py`)
   - Base class for all product templates
   - Parameter validation and defaults
   - Schema generation for AI training

2. **Product Templates** (`engine/templates/`)
   - `box_template.py` - Containers, cases, enclosures
   - `gear_template.py` - Mechanical gears and gear trains
   - `bicycle_template.py` - Bicycle frames and components

3. **Rule Engine** (`engine/rules/design_rules.py`)
   - Pattern matching for product identification
   - Parameter extraction from natural language
   - Rule-based design generation

4. **AI Training** (`server/services/templateTraining.js`)
   - Template documentation for AI
   - Example inputs/outputs
   - Parameter modification guidelines

## Templates

### Box Template

**Use Cases**: Storage boxes, electronics enclosures, cases, containers

**Parameters**:

```python
{
  'length': (10-500mm),
  'width': (10-500mm),
  'height': (5-300mm),
  'wall_thickness': (1.5-10mm),
  'has_lid': boolean,
  'corner_radius': (0-20mm),
  'material': ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'],
  'units': ['mm', 'cm', 'inches']
}
```

**Common Sizes**:

- Small: 50x50x30mm
- Medium: 100x80x50mm
- Large: 150x120x80mm
- Raspberry Pi: 95x70x30mm
- Arduino Uno: 75x55x25mm

**Example**:

```
Input: "box 100x80x50mm"
Output: {
  "product_type": "box",
  "template_used": "box",
  "length": 100,
  "width": 80,
  "height": 50,
  "wall_thickness": 2,
  "units": "mm"
}
```

### Gear Template

**Use Cases**: Spur gears, helical gears, bevel gears, worm gears

**Parameters**:

```python
{
  'teeth': (8-200),
  'module': (0.5-10mm),
  'pressure_angle': [14.5, 20, 25],
  'thickness': (3-50mm),
  'bore_diameter': (0-50mm),
  'gear_type': ['spur', 'helical', 'bevel', 'worm'],
  'helix_angle': (0-45°),
  'material': ['PLA', 'PETG', 'ABS', 'Nylon']
}
```

**Common Configurations**:

- Small: 20 teeth, module 2mm
- Medium: 40 teeth, module 2mm
- Large: 60 teeth, module 3mm

**Standard Modules**: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0mm

**Gear Formulas**:

```python
pitch_diameter = module * teeth
outer_diameter = pitch_diameter + (2 * module)
root_diameter = pitch_diameter - (2.5 * module)
```

**Example**:

```
Input: "gear 30 teeth module 2"
Output: {
  "product_type": "gear",
  "template_used": "gear",
  "teeth": 30,
  "module": 2.0,
  "pressure_angle": 20,
  "thickness": 10,
  "bore_diameter": 5
}
```

### Bicycle Template

**Use Cases**: Bicycle frames, handlebars, seats

**Parameters**:

```python
{
  'rider_height': (140-210cm),
  'bicycle_type': ['road', 'mountain', 'city', 'bmx', 'touring'],
  'material': ['aluminum', 'steel', 'carbon'],
  'wheel_size': [26, 27.5, 29, 700],
  'units': ['mm', 'cm', 'inches']
}
```

**Bicycle Types**:

- **Road**: Aggressive geometry, 700c wheels, 73° head angle
- **Mountain**: Relaxed geometry, 27.5-29" wheels, 67° head angle
- **City**: Upright position, comfortable, 70° head angle
- **BMX**: Short wheelbase, 20" wheels, 74° head angle

**Frame Geometry**:

```python
# Road bike
seat_tube = rider_height * 0.52
stack = rider_height * 0.30
reach = rider_height * 0.26

# Mountain bike
seat_tube = rider_height * 0.48
stack = rider_height * 0.34
reach = rider_height * 0.22
```

**Example**:

```
Input: "bicycle frame for 180cm rider aluminum"
Output: {
  "product_type": "bicycle_frame",
  "template_used": "bicycle",
  "rider_height": 180,
  "bicycle_type": "city",
  "material": "aluminum",
  "seat_tube": 900,
  "top_tube": 540,
  "head_tube": 117
}
```

## Rule Engine

### Pattern Matching

The rule engine uses regex patterns to match products:

```python
rules = {
  'box': [r'\bbox\b', r'\bcontainer\b', r'\bcase\b', r'\benclosure\b'],
  'gear': [r'\bgear\b', r'\bcog\b', r'\bsprocket\b', r'\b\d+\s*teeth\b'],
  'bicycle': [r'\bbicycle\b', r'\bbike\b', r'\bframe\b', r'\brider\b']
}
```

### Parameter Extraction

**Dimensions**:

```python
"100x80x50mm" → {length: 100, width: 80, height: 50, units: "mm"}
"10cm x 8cm x 5cm" → {length: 100, width: 80, height: 50, units: "mm"}
```

**Rider Height**:

```python
"180cm rider" → {rider_height: 180, units: "cm"}
"6 foot tall" → {rider_height: 183, units: "cm"}
```

**Teeth Count**:

```python
"20 teeth" → {teeth: 20}
"gear with 40 teeth" → {teeth: 40}
```

**Material**:

```python
"aluminum" → {material: "aluminum"}
"steel frame" → {material: "steel"}
```

## AI Training

### How AI Uses Templates

1. **Match Prompt to Template**

   ```
   User: "box 100x80x50mm"
   → AI recognizes "box" keyword
   → Selects BOX_TEMPLATE
   ```

2. **Extract Parameters**

   ```
   → Parse "100x80x50mm"
   → Extract: length=100, width=80, height=50, units="mm"
   ```

3. **Apply Defaults**

   ```
   → wall_thickness = 2mm (from template)
   → material = "PLA" (from template)
   → has_lid = false (from template)
   ```

4. **Output Complete Design**
   ```json
   {
     "product_type": "box",
     "template_used": "box",
     "length": 100,
     "width": 80,
     "height": 50,
     "wall_thickness": 2,
     "material": "PLA"
   }
   ```

### Gradual Parameter Modification

The AI can modify designs iteratively:

**Turn 1**:

```
User: "box 100x80x50mm"
AI: Creates basic box
```

**Turn 2**:

```
User: "add a lid"
AI: Keeps dimensions, modifies has_lid=true
```

**Turn 3**:

```
User: "make walls thicker"
AI: Keeps dimensions and lid, modifies wall_thickness=3mm
```

## Usage Examples

### Example 1: Box with Lid

```bash
# Test rule engine
python engine/rules/design_rules.py

Prompt: "storage container 15cm x 10cm x 8cm with lid"
✓ Product: box
✓ Confidence: 0.75
  Parameters: {length: 150, width: 100, height: 80, has_lid: true}
```

### Example 2: Gear Set

```bash
Prompt: "spur gear module 2 with 30 teeth"
✓ Product: gear
✓ Confidence: 0.85
  Parameters: {teeth: 30, module: 2.0, gear_type: "spur"}
```

### Example 3: Bicycle Frame

```bash
Prompt: "mountain bike frame for 175cm rider"
✓ Product: bicycle
✓ Confidence: 0.90
  Parameters: {rider_height: 175, bicycle_type: "mountain"}
```

## Adding New Templates

### Step 1: Create Template Class

```python
# engine/templates/enclosure_template.py
from template_library import ProductTemplate

class EnclosureTemplate(ProductTemplate):
    def __init__(self):
        super().__init__(name='enclosure', category='electronics')

        self.parameters = {
            'board_length': {'type': 'number', 'min': 50, 'max': 200},
            'board_width': {'type': 'number', 'min': 30, 'max': 150},
            'clearance': {'type': 'number', 'min': 2, 'max': 10}
        }

        self.defaults = {
            'clearance': 5,
            'wall_thickness': 2.5
        }

    def _build_design(self, params):
        # Calculate enclosure dimensions
        length = params['board_length'] + 2 * params['clearance']
        width = params['board_width'] + 2 * params['clearance']

        return {
            'product_type': 'enclosure',
            'length': length,
            'width': width,
            'height': 30,
            'wall_thickness': params['wall_thickness']
        }
```

### Step 2: Register Template

In `template_library.py`:

```python
def _load_builtin_templates(self):
    from enclosure_template import EnclosureTemplate
    self.register(EnclosureTemplate())
```

### Step 3: Add Rules

In `design_rules.py`:

```python
self.product_rules['enclosure'] = [
    r'\benclosure\b',
    r'\belectronics\s+box\b',
    r'\bproject\s+box\b'
]
```

### Step 4: Train AI

Add to `templateTraining.js`:

```javascript
NEW_TEMPLATE (description):
   Parameters: { param1, param2, param3 }
   Example: "prompt example" → {...}
```

## New Templates Added

### Enclosure Template

**Use Cases**: Electronics enclosures, PCB cases, project boxes

**Parameters**: board_length, board_width, component_height, mounting_holes, ventilation, cable_slots, has_lid

**Common Boards**: Raspberry Pi 4 (85x56), Arduino Uno (68.6x53.4), ESP32 (51x28)

**Example**: `"raspberry pi enclosure"` → Complete enclosure with standoffs, ventilation, lid

### Phone Stand Template

**Use Cases**: Phone holders, tablet stands, device docks

**Parameters**: device_width, device_thickness, angle, cable_slot, anti_slip

**Angles**: typing (45°), viewing (60°), video (70°), vertical (80°)

**Example**: `"phone stand 60 degrees"` → Angled stand with cable slot

### Cable Organizer Template

**Use Cases**: Cable clips, cord management, desk organization

**Parameters**: cable_diameter, cable_count, organizer_type (clip/holder/spiral/box/channel), mounting_type

**Cable Sizes**: USB-C (4mm), HDMI (7mm), Ethernet (6mm)

**Example**: `"cable clip for 3 usb cables"` → Multi-cable clip organizer

### Hinge Template

**Use Cases**: Living hinges, pin hinges, folding mechanisms

**Parameters**: hinge_type (living/pin/snap/piano), hinge_length, flex_thickness, pin_diameter, rotation_angle

**Materials**: PLA (0.4mm flex), PETG (0.5mm), TPU (0.8mm)

**Example**: `"living hinge 50mm"` → Flexible hinge for box lids

### Hook Template

**Use Cases**: Wall hooks, coat hangers, tool holders

**Parameters**: hook_type (simple/double/coat/tool/key), hook_depth, hook_width, load_capacity (light/medium/heavy)

**Load Capacity**: Light (<500g), Medium (500g-2kg), Heavy (>2kg)

**Example**: `"coat hook"` → Wall-mounted coat hanger

## Benefits

1. **Consistency**: All templates follow same parameter structure
2. **Validation**: Parameters checked against valid ranges
3. **Defaults**: Smart defaults for common use cases
4. **Extensibility**: Easy to add new templates (8 templates currently)
5. **AI Guidance**: Templates guide AI to produce correct output
6. **Error Reduction**: Rule-based matching prevents mistakes
7. **User Friendly**: Simple prompts like "box 100mm" work perfectly

## Testing

```bash
# Test template library (8 templates)
python engine/templates/template_library.py

# Test rule engine
python engine/rules/design_rules.py

# Test through API
curl -X POST http://localhost:3001/api/build \
  -H "Content-Type: application/json" \
  -d '{"prompt":"box 100x80x50mm with lid"}'

curl -X POST http://localhost:3001/api/build \
  -d '{"prompt":"phone stand 60 degrees"}'

curl -X POST http://localhost:3001/api/build \
  -d '{"prompt":"raspberry pi enclosure"}'
```

## Template Summary

Currently implemented templates (8 total):

1. **Box** - Storage containers and cases
2. **Gear** - Mechanical gears and transmissions
3. **Bicycle** - Bicycle frames with rider sizing
4. **Enclosure** - Electronics PCB cases
5. **Phone Stand** - Device holders at various angles
6. **Cable Organizer** - Cable management solutions
7. **Hinge** - Living and pin hinges
8. **Hook** - Wall hooks and hangers
