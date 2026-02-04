#!/usr/bin/env python3
"""
Box Template - Rectangular containers, cases, enclosures
"""

from template_library import ProductTemplate
from typing import Dict, Any, List


class BoxTemplate(ProductTemplate):
    """
    Template for box-like products
    Common uses: storage boxes, cases, enclosures, containers
    """
    
    def __init__(self):
        super().__init__(name='box', category='container')
        
        # Keywords for matching
        self.keywords = ['box', 'container', 'case', 'enclosure', 'housing', 'cover']
        
        # Parameter definitions
        self.parameters = {
            'length': {
                'type': 'number',
                'description': 'Length of the box',
                'min': 10,
                'max': 500,
                'unit': 'mm',
                'required': True
            },
            'width': {
                'type': 'number',
                'description': 'Width of the box',
                'min': 10,
                'max': 500,
                'unit': 'mm',
                'required': True
            },
            'height': {
                'type': 'number',
                'description': 'Height of the box',
                'min': 5,
                'max': 300,
                'unit': 'mm',
                'required': True
            },
            'wall_thickness': {
                'type': 'number',
                'description': 'Thickness of walls',
                'min': 1.5,
                'max': 10,
                'unit': 'mm',
                'required': False
            },
            'has_lid': {
                'type': 'boolean',
                'description': 'Whether to include a lid',
                'required': False
            },
            'corner_radius': {
                'type': 'number',
                'description': 'Radius for rounded corners',
                'min': 0,
                'max': 20,
                'unit': 'mm',
                'required': False
            },
            'material': {
                'type': 'string',
                'description': '3D printing material',
                'enum': ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'],
                'required': False
            },
            'units': {
                'type': 'string',
                'description': 'Measurement units',
                'enum': ['mm', 'cm', 'inches'],
                'required': False
            }
        }
        
        # Default values
        self.defaults = {
            'wall_thickness': 2.0,
            'has_lid': False,
            'corner_radius': 2.0,
            'material': 'PLA',
            'units': 'mm'
        }
        
        # Design rules
        self.rules = [
            'Wall thickness must be at least 1.5mm for 3D printing',
            'Corner radius should be 1-5mm for best results',
            'Lid clearance: 0.2mm for tight fit, 0.5mm for easy fit',
            'For electronics enclosure: add vent holes and cable slots',
            'For storage: consider internal dividers'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete box design from parameters"""
        
        # Basic box design
        design = {
            'product_type': 'box',
            'shape_type': 'box',
            'length': params['length'],
            'width': params['width'],
            'height': params['height'],
            'wall_thickness': params['wall_thickness'],
            'material': params['material'],
            'units': params['units']
        }
        
        # Add features based on parameters
        features = []
        
        # Rounded corners
        if params['corner_radius'] > 0:
            features.append({
                'type': 'fillet',
                'edges': 'vertical',
                'radius': params['corner_radius']
            })
        
        # Lid
        if params['has_lid']:
            # Create as assembly with separate lid
            design['is_assembly'] = True
            design['parts'] = [
                {
                    'part_name': 'box_body',
                    'shape_type': 'box',
                    'length': params['length'],
                    'width': params['width'],
                    'height': params['height'],
                    'wall_thickness': params['wall_thickness'],
                    'open_top': True
                },
                {
                    'part_name': 'box_lid',
                    'shape_type': 'box',
                    'length': params['length'] + 0.4,  # 0.2mm clearance each side
                    'width': params['width'] + 0.4,
                    'height': params['height'] * 0.2,  # Lid is 20% of box height
                    'wall_thickness': params['wall_thickness']
                }
            ]
        
        if features:
            design['features'] = features
        
        # Add print settings recommendations
        design['print_settings'] = {
            'layer_height': 0.2,
            'infill_percentage': 15 if params['wall_thickness'] >= 2 else 20,
            'wall_line_count': 3,
            'support_enabled': False,
            'adhesion_type': 'brim' if params['length'] > 100 else 'skirt'
        }
        
        return design
    
    def suggest_variations(self, base_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest design variations for user"""
        variations = []
        
        # Variation 1: With lid
        if not base_params.get('has_lid'):
            var1 = dict(base_params)
            var1['has_lid'] = True
            variations.append({
                'name': 'With Lid',
                'params': var1,
                'description': 'Add a removable lid'
            })
        
        # Variation 2: Thicker walls
        if base_params.get('wall_thickness', 2) < 3:
            var2 = dict(base_params)
            var2['wall_thickness'] = 3.0
            variations.append({
                'name': 'Reinforced',
                'params': var2,
                'description': 'Stronger walls (3mm thick)'
            })
        
        # Variation 3: Rounded corners
        if base_params.get('corner_radius', 0) == 0:
            var3 = dict(base_params)
            var3['corner_radius'] = 3.0
            variations.append({
                'name': 'Rounded',
                'params': var3,
                'description': 'Smooth rounded corners'
            })
        
        return variations


# Parameter tables for common box sizes
COMMON_BOX_SIZES = {
    'small': {'length': 50, 'width': 50, 'height': 30},
    'medium': {'length': 100, 'width': 80, 'height': 50},
    'large': {'length': 150, 'width': 120, 'height': 80},
    'card_box': {'length': 95, 'width': 68, 'height': 40},  # Standard playing cards
    'business_card': {'length': 95, 'width': 60, 'height': 25},
    'raspberry_pi': {'length': 95, 'width': 70, 'height': 30},
    'arduino_uno': {'length': 75, 'width': 55, 'height': 25},
    'battery_box_aa': {'length': 60, 'width': 55, 'height': 20},
    'battery_box_9v': {'length': 55, 'width': 30, 'height': 20}
}

def get_common_size(size_name: str) -> Dict[str, float]:
    """Get dimensions for common box sizes"""
    return COMMON_BOX_SIZES.get(size_name, COMMON_BOX_SIZES['medium'])
