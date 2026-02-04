// Template-based AI training prompt
// This enhances the AI with predefined templates and parameter tables

const TEMPLATE_TRAINING = `
TEMPLATE-BASED DESIGN SYSTEM:
The system uses predefined templates for common products. When the user's prompt matches a template, use that template's parameter structure.

CRITICAL ASSEMBLY RULES:
- When is_assembly=true, ALL parts MUST have: name, part_name, shape_type, and dimensions (length/width/height/diameter)
- Each part in the parts[] array must be a complete, valid component
- Never create parts without shape_type or dimensions
- Bicycle frames ALWAYS use is_assembly=true with 6 cylinder parts

AVAILABLE TEMPLATES:

1. BOX TEMPLATE (containers, cases, storage):
   Parameters: { length, width, height, wall_thickness, has_lid, corner_radius, material, units }
   Common sizes: Small (50x50x30), Medium (100x80x50), Large (150x120x80), Raspberry Pi (95x70x30)
   Example: "box 100x80x50mm" → {"product_type":"box","length":100,"width":80,"height":50,"wall_thickness":2,"units":"mm"}

2. GEAR TEMPLATE (mechanical gears):
   Parameters: { teeth, module, pressure_angle, thickness, bore_diameter, gear_type, material }
   Standard modules: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0
   Example: "gear 20 teeth" → {"product_type":"gear","teeth":20,"module":2.0,"thickness":10,"bore_diameter":5}

3. BICYCLE TEMPLATE (bicycle frames):
   Parameters: { rider_height, bicycle_type, material, wheel_size, units }
   Types: road, mountain, city, bmx, touring
   IMPORTANT: Bicycle frames are ASSEMBLIES with 6 tube parts. Each part MUST have:
   - name, part_name, shape_type (cylinder), diameter, length, wall_thickness
   Example: "bicycle frame for 180cm rider" → {
     "product_type":"bicycle_frame","shape_type":"bicycle_frame","rider_height":180,
     "bicycle_type":"city","material":"aluminum","units":"mm","is_assembly":true,
     "length":600,"width":200,"height":900,
     "parts":[
       {"name":"seat_tube","part_name":"seat_tube","shape_type":"cylinder","diameter":32,"length":875,"wall_thickness":2},
       {"name":"top_tube","part_name":"top_tube","shape_type":"cylinder","diameter":32,"length":525,"wall_thickness":2},
       {"name":"down_tube","part_name":"down_tube","shape_type":"cylinder","diameter":38,"length":960,"wall_thickness":2},
       {"name":"head_tube","part_name":"head_tube","shape_type":"cylinder","diameter":44,"length":114,"wall_thickness":2},
       {"name":"chainstay_left","part_name":"chainstay_left","shape_type":"cylinder","diameter":32,"length":437,"wall_thickness":2},
       {"name":"chainstay_right","part_name":"chainstay_right","shape_type":"cylinder","diameter":32,"length":437,"wall_thickness":2}
     ]
   }

4. ENCLOSURE TEMPLATE (electronics enclosures, PCB cases):
   Parameters: { board_length, board_width, component_height, mounting_holes, ventilation, cable_slots, has_lid }
   Common boards: raspberry_pi_4 (85x56), arduino_uno (68.6x53.4), esp32 (51x28)
   Example: "raspberry pi enclosure" → {"product_type":"enclosure","board_length":85,"board_width":56,"component_height":15,"mounting_holes":true,"has_lid":true}

5. PHONE STAND TEMPLATE (phone/tablet holders):
   Parameters: { device_width, device_thickness, angle, cable_slot, anti_slip }
   Device sizes: phone_standard (75mm), phone_large (85mm), tablet_standard (180mm)
   Angles: typing (45°), viewing (60°), video (70°)
   Example: "phone stand 60 degrees" → {"product_type":"phone_stand","device_width":80,"angle":60,"cable_slot":true}

6. CABLE ORGANIZER TEMPLATE (cable management):
   Parameters: { cable_diameter, cable_count, organizer_type, mounting_type, length }
   Types: clip, holder, spiral, box, channel
   Cable sizes: usb_c (4mm), hdmi (7mm), ethernet (6mm)
   Example: "cable clip for 3 usb cables" → {"product_type":"cable_organizer","organizer_type":"clip","cable_diameter":4,"cable_count":3}

7. HINGE TEMPLATE (living hinges, pin hinges):
   Parameters: { hinge_type, hinge_length, flex_thickness, pin_diameter, rotation_angle }
   Types: living, pin, snap, piano
   Example: "living hinge 50mm" → {"product_type":"hinge","hinge_type":"living","hinge_length":50,"flex_thickness":0.4}

8. HOOK TEMPLATE (wall hooks, hangers):
   Parameters: { hook_type, hook_depth, hook_width, hook_count, mounting_type, load_capacity }
   Types: simple, double, coat, tool, key
   Load: light (<500g), medium (500g-2kg), heavy (>2kg)
   Example: "coat hook" → {"product_type":"hook","hook_type":"coat","hook_depth":50,"hook_width":40,"load_capacity":"medium"}

RULE-BASED MATCHING:
Use these rules to match user prompts to templates:

if prompt contains ("box", "container", "storage"):
  use BOX_TEMPLATE
  
if prompt contains ("gear", "cog", "sprocket", "teeth"):
  use GEAR_TEMPLATE
  
if prompt contains ("bicycle", "bike", "frame", "rider"):
  use BICYCLE_TEMPLATE
  
if prompt contains ("enclosure", "electronics", "pcb case", "raspberry pi", "arduino", "esp32"):
  use ENCLOSURE_TEMPLATE
  
if prompt contains ("phone stand", "tablet stand", "phone holder", "device holder"):
  use PHONE_STAND_TEMPLATE
  
if prompt contains ("cable", "cord", "organizer", "clip", "cable management"):
  use CABLE_ORGANIZER_TEMPLATE
  
if prompt contains ("hinge", "living hinge", "pin hinge", "folding"):
  use HINGE_TEMPLATE
  
if prompt contains ("hook", "hanger", "wall hook", "coat hook", "key hook"):
  use HOOK_TEMPLATE
  
if no template matches:
  use CUSTOM_DESIGN

PARAMETER EXTRACTION RULES:
- Dimensions "100x80x50mm" → length:100, width:80, height:50, units:"mm"
- "20 teeth" → teeth:20
- "180cm rider" → rider_height:180, units:"cm"
- "module 2" → module:2.0
- "aluminum" → material:"aluminum"

TEMPLATE USAGE EXAMPLES:

Input: "box 100x80x50mm"
Output: {"product_type":"box","template_used":"box","shape_type":"box","length":100,"width":80,"height":50,"wall_thickness":2,"units":"mm","material":"PLA"}

Input: "gear with 30 teeth module 2"
Output: {"product_type":"gear","template_used":"gear","teeth":30,"module":2.0,"pressure_angle":20,"thickness":10,"bore_diameter":5,"material":"PLA"}

Input: "bicycle frame for 180cm rider aluminum"
Output: {
  "product_type":"bicycle_frame","template_used":"bicycle","shape_type":"bicycle_frame",
  "rider_height":180,"bicycle_type":"city","material":"aluminum","units":"mm","is_assembly":true,
  "length":600,"width":200,"height":900,
  "parts":[
    {"name":"seat_tube","part_name":"seat_tube","shape_type":"cylinder","diameter":32,"length":875,"wall_thickness":2},
    {"name":"top_tube","part_name":"top_tube","shape_type":"cylinder","diameter":32,"length":525,"wall_thickness":2},
    {"name":"down_tube","part_name":"down_tube","shape_type":"cylinder","diameter":38,"length":960,"wall_thickness":2},
    {"name":"head_tube","part_name":"head_tube","shape_type":"cylinder","diameter":44,"length":114,"wall_thickness":2},
    {"name":"chainstay_left","part_name":"chainstay_left","shape_type":"cylinder","diameter":32,"length":437,"wall_thickness":2},
    {"name":"chainstay_right","part_name":"chainstay_right","shape_type":"cylinder","diameter":32,"length":437,"wall_thickness":2}
  ]
}

Input: "storage container 15cm x 10cm x 8cm"
Output: {"product_type":"box","template_used":"box","shape_type":"box","length":150,"width":100,"height":80,"wall_thickness":2.5,"units":"mm","material":"PLA"}

Input: "spur gear 40 teeth"
Output: {"product_type":"gear","template_used":"gear","teeth":40,"module":2.0,"pressure_angle":20,"thickness":12,"bore_diameter":6,"gear_type":"spur","material":"Nylon"}

AI PARAMETER MODIFICATION:
The AI can gradually modify template parameters based on context:

1. START with template defaults
2. EXTRACT user-specified values from prompt
3. INFER missing values from context
4. VALIDATE against template rules
5. OUTPUT complete design

Example modification process:
User: "box 100x80x50mm"
→ Template: box
→ Extract: length=100, width=80, height=50, units=mm
→ Apply defaults: wall_thickness=2, material=PLA, has_lid=false
→ Output: Complete box design

User: "make it with a lid"
→ Keep: length=100, width=80, height=50
→ Modify: has_lid=true
→ Output: Box design with lid (as assembly)

User: "thicker walls"
→ Keep: length=100, width=80, height=50, has_lid=true
→ Modify: wall_thickness=3.0
→ Output: Reinforced box with lid
`;

module.exports = { TEMPLATE_TRAINING };
