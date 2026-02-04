#!/usr/bin/env python3
"""
Hook Template - Wall hooks and hangers
"""

from template_library import ProductTemplate
from typing import Dict, Any


class HookTemplate(ProductTemplate):
    """
    Template for wall hooks and hangers
    For clothing, tools, keys, etc.
    """
    
    def __init__(self):
        super().__init__(name='hook', category='organization')
        
        # Keywords for matching
        self.keywords = ['hook', 'hanger', 'wall hook', 'coat hook', 'key hook', 'tool hook']
        
        # Parameter definitions
        self.parameters = {
            'hook_type': {
                'type': 'string',
                'description': 'Type of hook',
                'enum': ['simple', 'double', 'coat', 'tool', 'key', 'adhesive'],
                'required': False
            },
            'hook_depth': {
                'type': 'number',
                'description': 'How far hook extends from wall',
                'min': 20,
                'max': 100,
                'unit': 'mm',
                'required': False
            },
            'hook_width': {
                'type': 'number',
                'description': 'Width of hook opening',
                'min': 10,
                'max': 80,
                'unit': 'mm',
                'required': False
            },
            'hook_count': {
                'type': 'number',
                'description': 'Number of hooks',
                'min': 1,
                'max': 10,
                'required': False
            },
            'mounting_type': {
                'type': 'string',
                'description': 'How to mount on wall',
                'enum': ['screw', 'adhesive', 'magnetic', 'command_strip'],
                'required': False
            },
            'load_capacity': {
                'type': 'string',
                'description': 'Expected load',
                'enum': ['light', 'medium', 'heavy'],
                'required': False
            },
            'material': {
                'type': 'string',
                'description': '3D printing material',
                'enum': ['PLA', 'PETG', 'ABS', 'Nylon'],
                'required': False
            }
        }
        
        # Default values
        self.defaults = {
            'hook_type': 'simple',
            'hook_depth': 40,
            'hook_width': 30,
            'hook_count': 1,
            'mounting_type': 'screw',
            'load_capacity': 'medium',
            'material': 'PETG'
        }
        
        # Design rules
        self.rules = [
            'Light load (<500g): 2mm wall, PLA acceptable',
            'Medium load (500g-2kg): 3mm wall, PETG recommended',
            'Heavy load (>2kg): 4mm wall, Nylon/PETG, metal insert',
            'Hook curve radius: 5-10mm for smooth hanging',
            'Screw holes: M4 (4.5mm) or M5 (5.5mm)',
            'Adhesive base: minimum 30x30mm contact area',
            'Print orientation: hook standing up for strength'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate hook design"""
        
        hook_type = params['hook_type']
        depth = params['hook_depth']
        width = params['hook_width']
        load = params['load_capacity']
        
        # Calculate wall thickness based on load
        wall_thickness_map = {'light': 2, 'medium': 3, 'heavy': 4}
        wall_thickness = wall_thickness_map[load]
        
        design = {
            'product_type': 'hook',
            'hook_type': hook_type,
            'hook_depth': depth,
            'hook_width': width,
            'hook_count': params['hook_count'],
            'wall_thickness': wall_thickness,
            'load_capacity': load,
            'material': params['material'],
            'units': 'mm'
        }
        
        # Base plate dimensions
        if params['hook_count'] == 1:
            base_width = width + 20
        else:
            base_width = (width + 20) * params['hook_count']
        
        base_height = 60
        
        design['base_width'] = base_width
        design['base_height'] = base_height
        design['base_thickness'] = wall_thickness
        
        # Hook geometry
        design['hook_radius'] = 8  # Curve radius
        design['hook_angle'] = 90  # Degrees
        
        # Add features
        features = []
        
        # Mounting
        if params['mounting_type'] == 'screw':
            hole_diameter = 4.5 if load == 'light' else 5.5
            features.append({
                'type': 'mounting_holes',
                'diameter': hole_diameter,
                'count': 2 if base_width < 80 else 3,
                'pattern': 'vertical',
                'countersink': True
            })
        elif params['mounting_type'] == 'adhesive':
            features.append({
                'type': 'adhesive_base',
                'width': max(30, base_width * 0.8),
                'height': max(30, base_height * 0.8),
                'texture': 'smooth'
            })
        
        # Reinforcement for heavy loads
        if load == 'heavy':
            features.append({
                'type': 'gusset',
                'angle': 45,
                'thickness': wall_thickness,
                'height': depth * 0.5
            })
        
        if features:
            design['features'] = features
        
        # Print settings
        design['print_settings'] = {
            'orientation': 'hook_vertical',
            'layer_height': 0.2,
            'infill_percentage': 50 if load == 'heavy' else 30,
            'wall_line_count': 4 if load == 'heavy' else 3,
            'support_enabled': False
        }
        
        return design


# Common hook sizes
HOOK_SIZES = {
    'key_hook': {'depth': 25, 'width': 20, 'load': 'light'},
    'coat_hook': {'depth': 50, 'width': 40, 'load': 'medium'},
    'tool_hook': {'depth': 60, 'width': 50, 'load': 'heavy'},
    'towel_hook': {'depth': 40, 'width': 35, 'load': 'medium'},
    'bag_hook': {'depth': 45, 'width': 40, 'load': 'medium'}
}

# Load capacity guidelines
LOAD_CAPACITY = {
    'light': {'max_kg': 0.5, 'examples': 'Keys, small bags, lightweight items'},
    'medium': {'max_kg': 2.0, 'examples': 'Coats, towels, medium bags'},
    'heavy': {'max_kg': 5.0, 'examples': 'Heavy coats, tool belts, backpacks'}
}
