"""
Design Schema Validator - Validates design JSON structure
"""

from typing import Dict, Any, List
import json


class ValidationError(Exception):
    """Custom exception for schema validation errors"""
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message)


REQUIRED_FIELDS = ['product_type', 'units', 'length', 'width', 'height']

ALLOWED_UNITS = ['mm', 'inches']

ALLOWED_PCB_LAYERS = [1, 2, 4]


def validate_design_schema(design_data: Dict[str, Any]) -> bool:
    """
    Validate design data against schema requirements
    
    Args:
        design_data: Design specification dictionary
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If validation fails
    """
    
    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in design_data:
            raise ValidationError(f"Missing required field: {field}", field)
    
    # Validate units
    if design_data['units'] not in ALLOWED_UNITS:
        raise ValidationError(
            f"Invalid units '{design_data['units']}'. Must be one of: {', '.join(ALLOWED_UNITS)}",
            'units'
        )
    
    # Validate numeric fields
    numeric_fields = ['length', 'width', 'height']
    if 'wall_thickness' in design_data:
        numeric_fields.append('wall_thickness')
    
    for field in numeric_fields:
        if field in design_data:
            value = design_data[field]
            if not isinstance(value, (int, float)) or value <= 0:
                raise ValidationError(
                    f"{field} must be a positive number, got: {value}",
                    field
                )
    
    # Validate PCB details if present
    if design_data.get('pcb_required'):
        if 'pcb_details' not in design_data:
            raise ValidationError(
                "pcb_details required when pcb_required is true",
                'pcb_details'
            )
        
        pcb = design_data['pcb_details']
        
        if 'width' not in pcb or 'height' not in pcb:
            raise ValidationError(
                "PCB width and height are required",
                'pcb_details'
            )
        
        if 'layers' in pcb and pcb['layers'] not in ALLOWED_PCB_LAYERS:
            raise ValidationError(
                f"PCB layers must be one of: {ALLOWED_PCB_LAYERS}",
                'pcb_details.layers'
            )
    
    return True


def load_and_validate(json_string: str) -> Dict[str, Any]:
    """
    Load JSON string and validate against schema
    
    Args:
        json_string: JSON string to parse and validate
        
    Returns:
        Validated design data dictionary
        
    Raises:
        ValidationError: If validation fails
        json.JSONDecodeError: If JSON is malformed
    """
    design_data = json.loads(json_string)
    validate_design_schema(design_data)
    return design_data


if __name__ == '__main__':
    # Test schema validation
    test_design = {
        "product_type": "battery_cover",
        "units": "mm",
        "length": 80,
        "width": 40,
        "height": 10,
        "wall_thickness": 2,
        "features": ["fillet", "screw_holes"],
        "pcb_required": False
    }
    
    try:
        validate_design_schema(test_design)
        print("✓ Schema validation passed")
    except ValidationError as e:
        print(f"✗ Validation failed: {e}")
