const Anthropic = require('@anthropic-ai/sdk');
const { TEMPLATE_TRAINING } = require('./templateTraining');

// Validate API key on startup
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
  console.error('❌ ANTHROPIC_API_KEY is not set in .env file');
  console.error('   Please add your API key to the .env file');
  console.error('   Get your API key from: https://console.anthropic.com/');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Manufacturing constraints
const MANUFACTURING_CONSTRAINTS = {
  mm: {
    min_wall_thickness: 1.5,
    max_dimension: 2000,  // Increased for bicycle frames and larger products
    min_dimension: 5,
    recommended_wall_thickness: 2.5
  },
  inches: {
    min_wall_thickness: 0.06,
    max_dimension: 80,
    min_dimension: 0.2,
    recommended_wall_thickness: 0.1
  }
};

const DESIGN_SCHEMA_PROMPT = `You are a mechanical design AI that converts user prompts into precise 3D printable designs.

OUTPUT FORMAT:
- You MUST output ONLY valid JSON (no markdown, no explanations, no code blocks)
- Start with { and end with }
- No text before or after the JSON

CORE DESIGN PRINCIPLES:
1. Extract exact dimensions from user prompt (if user says "100mm" use 100, if "10cm" convert to 100)
2. Use standard units: "mm" (default) or "inches" if user specifies
3. Apply smart defaults for missing values
4. Ensure structural integrity (minimum 2mm walls for PLA/PETG, 3mm for TPU)
5. Make it printable (avoid impossible overhangs, use supports where needed)

SHAPE TYPES:
- "box" → length, width, height
- "cylinder" → diameter, height (or length)
- "sphere" → diameter
- "cone" → diameter (base), height
- "phone_stand" → angle (60), slot_width (12), base_length, base_width, height
- "loft" → sections: [{shape, size, z}, ...] (smooth transitions)
- "sweep" → profile_shape, path_type, radius, height (curved extrusions)
- "revolve" → profile_points: [[x,z], ...], angle (lathed shapes)
- "organic" → blob_count, base_size (sculptural forms)
- "lattice" → size, cell_size, strut_thickness (lightweight structures)

MATERIALS (auto-select based on use case):
- "PLA": Default, easy to print, decorative/prototype use
- "PETG": Waterproof, outdoor, functional parts, strong
- "TPU": Flexible, rubber-like, grips, gaskets
- "ABS": Heat resistant, durable (needs heated bed)
- "Nylon": Gears, bearings, high wear applications

MATERIAL AUTO-SELECTION:
- "waterproof", "outdoor" → PETG
- "flexible", "soft", "rubber" → TPU
- "heat", "hot" → ABS or Nylon
- "gears", "mechanical" → Nylon
- "decorative", "prototype" → PLA

SMART DEFAULTS:
- wall_thickness: 2.5mm (structural), 2mm (enclosures), 3mm (TPU)
- clearance: 0.3mm (sliding fit), 0.1mm (press-fit)
- corner_radius: 2mm (external), 1mm (internal)
- mounting_holes: M3 (small <100mm), M4 (medium <200mm), M5 (large)

FEATURES (add when appropriate):
- "chamfer" → rounds sharp edges (0.5-1mm)
- "mounting_holes" → { enabled: true, diameter: 3.3, count: 4, pattern: "corners" }
- "ventilation" → adds cooling holes for electronics
- "cable_slot" → strain relief for cables
- "grip_texture" → improves handling
- "drainage_holes" → for planters, outdoor use

CUTOUTS (for ports, windows, etc):
[{
  "type": "usb_c" | "hdmi" | "power_jack" | "led" | "button" | "window",
  "position": "front" | "back" | "left" | "right" | "top" | "bottom",
  "width": number (for rectangular),
  "height": number (for rectangular),
  "diameter": number (for circular)
}]

ASSEMBLY (for complex products):
When product is complex, large, or has moving parts:
{
  "is_assembly": true,
  "parts": [
    {
      "name": "Base",
      "shape_type": "box",
      "length": 100, "width": 80, "height": 30,
      "features": ["mounting_holes"]
    },
    {
      "name": "Lid",
      "shape_type": "box",
      "length": 100, "width": 80, "height": 10,
      "features": ["snap_fit_tabs"]
    }
  ],
  "assembly_method": "snap-fit" | "screws" | "press-fit" | "magnets",
  "hardware": [{"type": "M3_screw", "length": 12, "quantity": 4}]
}

ASSEMBLY TRIGGERS:
- Product >200mm → split into parts
- "with lid", "openable" → create base + lid
- "hinged", "foldable" → create panels + hinge
- Electronics enclosure → create shell + lid with access

FASTENER SIZING:
- M3 screws: Small parts (<100mm), boss diameter 7mm min
- M4 screws: Medium parts (100-200mm), boss diameter 8mm min
- M5 screws: Large parts (>200mm), boss diameter 10mm min
- Hole clearance: +0.3mm for screws (M3 → 3.3mm hole)

EXAMPLES:

User: "box 50x40x30mm"
{
  "product_type": "storage box",
  "shape_type": "box",
  "length": 50,
  "width": 40,
  "height": 30,
  "wall_thickness": 2,
  "units": "mm",
  "material": "PLA",
  "features": ["chamfer"],
  "pcb_required": false
}

User: "waterproof container for electronics"
{
  "product_type": "waterproof enclosure",
  "shape_type": "box",
  "length": 120,
  "width": 80,
  "height": 50,
  "wall_thickness": 3,
  "units": "mm",
  "material": "PETG",
  "features": ["gasket_groove", "ventilation"],
  "is_assembly": true,
  "parts": [
    {"name": "Base", "shape_type": "box", "length": 120, "width": 80, "height": 40, "features": ["gasket_groove"]},
    {"name": "Lid", "shape_type": "box", "length": 120, "width": 80, "height": 10, "features": ["gasket_fit"]}
  ],
  "assembly_method": "screws",
  "hardware": [{"type": "M3_screw", "length": 15, "quantity": 6}],
  "pcb_required": false
}

User: "phone stand"
{
  "product_type": "phone stand",
  "shape_type": "phone_stand",
  "angle": 60,
  "slot_width": 12,
  "base_length": 100,
  "base_width": 80,
  "height": 120,
  "wall_thickness": 3,
  "units": "mm",
  "material": "PLA",
  "features": ["cable_slot", "non_slip_base"],
  "cutouts": [{
    "type": "charging_slot",
    "position": "bottom",
    "width": 15,
    "height": 5
  }],
  "pcb_required": false
}

User: "flexible grip 30mm diameter, 80mm long"
{
  "product_type": "grip handle",
  "shape_type": "cylinder",
  "diameter": 30,
  "length": 80,
  "wall_thickness": 3,
  "units": "mm",
  "material": "TPU",
  "features": ["grip_texture"],
  "pcb_required": false
}

User: "gear, 20 teeth, 5mm shaft"
{
  "product_type": "gear",
  "shape_type": "gear",
  "teeth_count": 20,
  "module": 1.5,
  "bore_diameter": 5,
  "thickness": 6,
  "units": "mm",
  "material": "Nylon",
  "pcb_required": false
}

CAD DESIGN LANGUAGE (OPERATIONS-BASED):
When user wants precise CAD control or mentions specific operations, use this format:
{
  "product": "Table",
  "units": "mm",
  "material": "Wood",
  "tolerance": 0.2,
  "use_design_language": true,
  "operations": [
    {"type": "SketchRectangle", "width": 1200, "height": 600, "centered": true},
    {"type": "Extrude", "height": 20},
    {"type": "AddLegs", "count": 4, "height": 700, "radius": 25, "inset": 50},
    {"type": "Fillet", "radius": 5}
  ],
  "export": ["STEP", "STL"]
}

DESIGN LANGUAGE OPERATIONS:
- SketchRectangle: {width, height, centered}
- SketchCircle: {radius or diameter}
- SketchPolygon: {points: [[x,y], ...], closed}
- Extrude: {height, direction: [x,y,z]}
- Revolve: {angle, axis: [x,y,z]}
- Cut: {tool_type, position, dimensions}
- Fuse: {tool_type, position, dimensions}
- Fillet: {radius, edges: [indices]}
- Chamfer: {distance, edges: [indices]}
- AddLegs: {count, height, radius, inset}
- AddHoles: {positions: [[x,y,z], ...], diameter, depth}
- AddSupports: {count, thickness, height}
- LinearPattern: {direction: [x,y,z], spacing, count}
- CircularPattern: {axis: [x,y,z], count, radius}
- Shell: {thickness, faces_to_remove: [indices]}

USE DESIGN LANGUAGE WHEN:
- User mentions "sketch", "extrude", "fillet", "chamfer", "pattern"
- User describes step-by-step CAD operations
- User wants precise control over geometry creation
- Product is complex furniture, mechanical part, or technical design

USE TRADITIONAL JSON WHEN:
- Simple "box", "cylinder", "phone stand" requests
- User just describes dimensions
- Quick prototypes and basic shapes

DESIGN THINKING (internal, don't output):
1. What is the PURPOSE? (storage, mechanical, electronics, decorative)
2. What SIZE makes sense? (user specified or infer from purpose)
3. What MATERIAL fits the use case? (strength, flexibility, waterproof)
4. Does it need ASSEMBLY? (too large, complex, moving parts)
5. What FEATURES improve functionality? (holes, slots, texture)
6. Is it PRINTABLE? (wall thickness, overhangs, supports)

${TEMPLATE_TRAINING}

CRITICAL RULES:
1. Use EXACT dimensions from user prompt
2. Units default to "mm" unless user specifies inches
3. Wall thickness ≥ 2mm for rigid materials, ≥ 3mm for TPU
4. Output ONLY JSON (no markdown, no explanations)
5. Be precise with numbers (no ranges, no approximations)
6. Include product_type (or product), units, material
7. For operations-based: set "use_design_language": true
8. Check if prompt matches a TEMPLATE first, then use template parameters

DIMENSION INFERENCE:
- "small box" → 60x50x40mm
- "medium box" → 100x80x60mm
- "large box" → 150x120x80mm
- "phone stand" → 100x80x120mm
- "container" → 120x90x70mm
- If user gives ONE dimension for "box", make it cubic
- If user gives TWO dimensions, infer third as ~75% of largest

JSON SCHEMA (TRADITIONAL FORMAT):
{
  "product_type": "string (describe what it is)",
  "shape_type": "string (box, cylinder, sphere, phone_stand, etc.)",
  "units": "mm" or "inches",
  "material": "PLA" | "PETG" | "TPU" | "ABS" | "Nylon",
  
  // Dimensions (include based on shape_type):
  "length": number,
  "width": number,
  "height": number,
  "diameter": number (for cylinders/spheres),
  "wall_thickness": number,
  
  // Optional:
  "features": ["chamfer", "mounting_holes", "ventilation", etc.],
  "cutouts": [{type, position, width, height, diameter}],
  "mounting_holes": {enabled: bool, diameter: number, count: number, pattern: "corners"},
  
  // Assembly (if complex):
  "is_assembly": boolean,
  "parts": [{name, shape_type, dimensions...}],
  "assembly_method": "screws" | "snap-fit" | "magnets",
  "hardware": [{type, length, quantity}],
  
  // Always include:
  "pcb_required": false
}`;

async function generateDesignFromPrompt(userPrompt, previousDesign = null) {
  try {
    console.log(`🤖 Generating design from: "${userPrompt}"`);

    let promptContent = `USER REQUEST: "${userPrompt}"

OUTPUT: Only the JSON design specification (no explanations, no markdown, just pure JSON).`;

    if (previousDesign) {
      promptContent = `EXISTING DESIGN:
- Product: ${previousDesign.product_type}
- Size: ${previousDesign.length || previousDesign.diameter}×${previousDesign.width || ''}×${previousDesign.height}${previousDesign.units}
- Material: ${previousDesign.material}

USER'S MODIFICATION REQUEST: "${userPrompt}"

OUTPUT: Complete updated JSON design (no explanations, just JSON).`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      temperature: 0.3,
      system: DESIGN_SCHEMA_PROMPT,
      messages: [{ role: 'user', content: promptContent }]
    });

    const response = message.content[0].text;
    console.log('✅ Claude response received');
    console.log('📄 First 200 chars:', response.substring(0, 200));

    // Parse JSON response
    let designData;
    try {
      const cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      designData = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully');
      
      // Validate we got an object with at least some data
      if (!designData || typeof designData !== 'object') {
        throw new Error('AI returned invalid data structure');
      }
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('📄 Raw response:', response);
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}\n\nAI Response: ${response.substring(0, 500)}`);
    }

    // Auto-correct common issues
    designData = autoCorrectDesign(designData);

    console.log(`✅ Design finalized: ${designData.product_type} (${designData.shape_type})`);
    
    return designData;

  } catch (error) {
    console.error('❌ AI Planning error:', error);
    throw error;
  }
}

function autoCorrectDesign(design) {
  if (!design || typeof design !== 'object') {
    console.error('❌ Invalid design object received');
    throw new Error('AI returned invalid design data');
  }

  const corrected = { ...design };
  
  // Auto-add units if missing
  if (!corrected.units) {
    corrected.units = 'mm';
    console.log('   🔧 Auto-added units: mm');
  }

  // Get constraints after ensuring units exist
  const constraints = MANUFACTURING_CONSTRAINTS[corrected.units] || MANUFACTURING_CONSTRAINTS.mm;

  // Auto-add product_type if missing
  if (!corrected.product_type) {
    corrected.product_type = 'custom part';
    console.log('   🔧 Auto-added product_type: custom part');
  }

  // Auto-add shape_type if missing
  if (!corrected.shape_type) {
    corrected.shape_type = 'box';
    console.log('   🔧 Auto-added shape_type: box');
  }

  // Auto-add material if missing
  if (!corrected.material) {
    corrected.material = 'PLA';
    console.log('   🔧 Auto-added material: PLA');
  }

  // Auto-correct wall thickness
  if (corrected.wall_thickness && corrected.wall_thickness < constraints.min_wall_thickness) {
    corrected.wall_thickness = constraints.recommended_wall_thickness;
    console.log(`   🔧 Auto-corrected wall thickness to ${corrected.wall_thickness}${corrected.units}`);
  } else if (!corrected.wall_thickness) {
    corrected.wall_thickness = constraints.recommended_wall_thickness;
    console.log(`   🔧 Auto-added wall thickness: ${corrected.wall_thickness}${corrected.units}`);
  }

  // Ensure pcb_required is boolean
  if (typeof corrected.pcb_required !== 'boolean') {
    corrected.pcb_required = false;
  }

  return corrected;
}

async function chatWithEngineer(userMessage, conversationHistory = [], currentDesign = null) {
  try {
    const systemPrompt = `You are a friendly mechanical design assistant. Have a conversation with the user about their design needs.

When you have enough details to build something, respond with JSON in this format:
{
  "shouldBuild": true,
  "design": {<full design spec>}
}

For regular conversation:
{
  "shouldBuild": false,
  "response": "Your conversational response here"
}

Ask clarifying questions if needed. Be helpful and concise.`;

    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    let contextMessage = userMessage;
    if (currentDesign) {
      contextMessage = `[Current design: ${JSON.stringify(currentDesign)}]\n\nUser: ${userMessage}`;
    }
    
    messages.push({ role: 'user', content: contextMessage });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    const aiResponse = response.content[0].text;
    
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed;
    } catch {
      return {
        shouldBuild: false,
        response: aiResponse
      };
    }

  } catch (error) {
    console.error('❌ Chat error:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

module.exports = {
  generateDesignFromPrompt,
  chatWithEngineer,
  MANUFACTURING_CONSTRAINTS
};
