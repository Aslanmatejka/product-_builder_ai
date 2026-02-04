/**
 * Validation layer for design data before passing to engineering engines
 */

const VALIDATION_RULES = {
  units: {
    allowed: ['mm', 'inches'],
    message: 'Units must be either "mm" or "inches"'
  },
  wall_thickness: {
    min_mm: 1.5,
    min_inches: 0.06,
    message: 'Wall thickness too thin for manufacturing'
  },
  dimensions: {
    min_mm: 1,
    min_inches: 0.04,
    max_mm: 2000,  // Increased for bicycle frames and larger products
    max_inches: 80,
    message: 'Dimensions out of reasonable range'
  },
  pcb_trace_width: {
    min_mm: 0.15,
    min_inches: 0.006,
    message: 'PCB trace width too narrow for standard manufacturing'
  }
};

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function validateDesignData(designData) {
  const errors = [];

  // Check required fields - base requirements
  const baseRequiredFields = ['product_type', 'units'];
  for (const field of baseRequiredFields) {
    if (!designData[field]) {
      errors.push({ field, message: `Missing required field: ${field}` });
    }
  }

  // For assemblies, skip dimension validation on the parent object
  // Dimensions are on the individual parts instead
  if (designData.is_assembly && designData.parts && Array.isArray(designData.parts)) {
    console.log(`✓ Assembly detected with ${designData.parts.length} parts - validating each part`);
    
    // Validate each part has required dimensions
    designData.parts.forEach((part, idx) => {
      if (!part.name) {
        errors.push({ field: `parts[${idx}].name`, message: `Part ${idx + 1} missing name` });
      }
      if (!part.shape_type) {
        errors.push({ field: `parts[${idx}].shape_type`, message: `Part ${idx + 1} missing shape_type` });
      }
      // Each part should have at least one dimension
      if (!part.length && !part.width && !part.height && !part.diameter && !part.size) {
        errors.push({ field: `parts[${idx}]`, message: `Part ${idx + 1} (${part.name || 'unnamed'}) missing dimensions` });
      }
    });
  } else {
    // Single-part design - validate dimensions on the parent object
    const shapeType = designData.shape_type || 'box';
    const cylindricalShapes = ['cylinder', 'shaft', 'bottle', 'cup', 'pen_holder', 'planter', 'coaster'];
    const sphericalShapes = ['sphere', 'dome', 'bowl'];
    const conicalShapes = ['cone', 'vase', 'funnel'];
    const gearShapes = ['gear', 'spur_gear', 'helical_gear', 'bevel_gear'];
    const customShapes = ['phone_stand', 'cable_clip', 'cable_holder', 'cable_spiral', 'cable_channel', 
                          'living_hinge', 'pin_hinge', 'snap_hinge', 'piano_hinge', 'hook'];
    
    if (cylindricalShapes.includes(shapeType)) {
      // Cylindrical shapes need diameter and length/height
      if (!designData.diameter && !designData.width) {
        errors.push({ field: 'diameter', message: 'Cylindrical shapes require diameter' });
      }
      if (!designData.length && !designData.height) {
        errors.push({ field: 'length', message: 'Cylindrical shapes require length or height' });
      }
    } else if (sphericalShapes.includes(shapeType)) {
      // Spherical shapes just need diameter
      if (!designData.diameter && !designData.width) {
        errors.push({ field: 'diameter', message: 'Spherical shapes require diameter' });
      }
    } else if (conicalShapes.includes(shapeType)) {
      // Conical shapes need base/top diameter and height
      if (!designData.diameter_base && !designData.base_diameter && !designData.diameter) {
        errors.push({ field: 'diameter', message: 'Conical shapes require diameter' });
      }
      if (!designData.height && !designData.length) {
        errors.push({ field: 'height', message: 'Conical shapes require height' });
      }
    } else if (gearShapes.includes(shapeType)) {
      // Gears need teeth and module (or diameter)
      if (!designData.teeth) {
        errors.push({ field: 'teeth', message: 'Gears require teeth count' });
      }
      if (!designData.module && !designData.diameter) {
        errors.push({ field: 'module', message: 'Gears require module or diameter' });
      }
    } else if (customShapes.includes(shapeType)) {
      // Custom template shapes - require at least some dimensions
      if (!designData.length && !designData.width && !designData.height && 
          !designData.diameter && !designData.base_length && !designData.base_width &&
          !designData.hook_depth && !designData.hinge_length) {
        errors.push({ field: 'dimensions', message: `Shape type '${shapeType}' requires dimensions` });
      }
    } else if (shapeType === 'box') {
      // Box shapes need length, width, height
      const dimensionFields = ['length', 'width', 'height'];
      for (const field of dimensionFields) {
        if (!designData[field] && designData[field] !== 0) {
          errors.push({ field, message: `Missing required dimension: ${field}` });
        }
      }
    }
    // For advanced shapes (loft, sweep, revolve, etc.), just check they have SOME dimensions
    else if (!designData.length && !designData.width && !designData.height && !designData.diameter && !designData.size) {
      errors.push({ field: 'dimensions', message: `Shape type '${shapeType}' requires at least one dimension` });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Validation failed: ${errors.map(e => e.message).join(', ')}`,
      errors[0].field
    );
  }

  // Validate units
  if (!VALIDATION_RULES.units.allowed.includes(designData.units)) {
    throw new ValidationError(VALIDATION_RULES.units.message, 'units');
  }

  const isMetric = designData.units === 'mm';

  // Validate dimensions (only check dimensions that are present)
  const dims = ['length', 'width', 'height', 'diameter', 'size'];
  for (const dim of dims) {
    const value = designData[dim];
    if (value !== undefined && value !== null) {
      const min = isMetric ? VALIDATION_RULES.dimensions.min_mm : VALIDATION_RULES.dimensions.min_inches;
      const max = isMetric ? VALIDATION_RULES.dimensions.max_mm : VALIDATION_RULES.dimensions.max_inches;

      if (value < min || value > max) {
        throw new ValidationError(
          `${dim} (${value}${designData.units}) ${VALIDATION_RULES.dimensions.message}`,
          dim
        );
      }
    }
  }

  // Validate wall thickness if present
  if (designData.wall_thickness) {
    const minWall = isMetric 
      ? VALIDATION_RULES.wall_thickness.min_mm 
      : VALIDATION_RULES.wall_thickness.min_inches;

    if (designData.wall_thickness < minWall) {
      throw new ValidationError(
        `Wall thickness (${designData.wall_thickness}${designData.units}) ${VALIDATION_RULES.wall_thickness.message}`,
        'wall_thickness'
      );
    }
  }

  // Validate PCB details if present
  if (designData.pcb_required && designData.pcb_details) {
    const pcb = designData.pcb_details;
    
    if (!pcb.width || !pcb.height) {
      throw new ValidationError('PCB dimensions (width, height) required when pcb_required is true', 'pcb_details');
    }

    if (pcb.layers && ![1, 2, 4].includes(pcb.layers)) {
      throw new ValidationError('PCB layers must be 1, 2, or 4', 'pcb_details.layers');
    }
  }

  console.log('✅ Design data validation passed');
  return true;
}

module.exports = {
  validateDesignData,
  ValidationError,
  VALIDATION_RULES
};
