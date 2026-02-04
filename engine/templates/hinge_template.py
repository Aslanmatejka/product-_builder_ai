#!/usr/bin/env python3
"""
Hinge Template - Living hinges and pin hinges
"""

from template_library import ProductTemplate
from typing import Dict, Any
import math


class HingeTemplate(ProductTemplate):
    """
    Template for hinges - living hinges and pin hinges
    For boxes, lids, folding mechanisms
    """
    
    def __init__(self):
        super().__init__(name='hinge', category='mechanism')
        
        # Keywords for matching
        self.keywords = ['hinge', 'living hinge', 'pin hinge', 'folding', 'pivot']
        
        # Parameter definitions
        self.parameters = {
            'hinge_type': {
                'type': 'string',
                'description': 'Type of hinge',
                'enum': ['living', 'pin', 'snap', 'piano'],
                'required': False
            },
            'hinge_length': {
                'type': 'number',
                'description': 'Length of hinge',
                'min': 20,
                'max': 300,
                'unit': 'mm',
                'required': False
            },
            'hinge_width': {
                'type': 'number',
                'description': 'Width of hinge connection',
                'min': 5,
                'max': 30,
                'unit': 'mm',
                'required': False
            },
            'flex_thickness': {
                'type': 'number',
                'description': 'Thickness of flexing part (living hinge)',
                'min': 0.3,
                'max': 1.5,
                'unit': 'mm',
                'required': False
            },
            'pin_diameter': {
                'type': 'number',
                'description': 'Pin diameter (pin hinge)',
                'min': 2,
                'max': 10,
                'unit': 'mm',
                'required': False
            },
            'rotation_angle': {
                'type': 'number',
                'description': 'Maximum rotation angle',
                'min': 90,
                'max': 180,
                'unit': 'degrees',
                'required': False
            },
            'material': {
                'type': 'string',
                'description': '3D printing material',
                'enum': ['PLA', 'PETG', 'TPU', 'Nylon'],
                'required': False
            }
        }
        
        # Default values
        self.defaults = {
            'hinge_type': 'living',
            'hinge_length': 50,
            'hinge_width': 10,
            'flex_thickness': 0.4,
            'pin_diameter': 3,
            'rotation_angle': 180,
            'material': 'PLA'
        }
        
        # Design rules
        self.rules = [
            'Living hinge: 0.3-0.5mm thickness for PLA',
            'Living hinge: Print perpendicular to bend direction',
            'Pin hinge: Pin diameter + 0.2mm clearance',
            'Pin hinge: Use TPU pins for easy insertion',
            'Snap hinge: 0.8-1.2mm wall thickness',
            'Piano hinge: Multiple knuckles for strength'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate hinge design"""
        
        hinge_type = params['hinge_type']
        length = params['hinge_length']
        width = params['hinge_width']
        
        design = {
            'product_type': 'hinge',
            'hinge_type': hinge_type,
            'length': length,
            'width': width,
            'rotation_angle': params['rotation_angle'],
            'material': params['material'],
            'units': 'mm'
        }
        
        # Type-specific designs
        if hinge_type == 'living':
            # Living hinge - thin flexible section
            design['shape_type'] = 'living_hinge'
            design['flex_thickness'] = params['flex_thickness']
            design['flex_width'] = 2  # Width of flexible section
            design['body_thickness'] = 3  # Thickness of rigid parts
            
            # Calculate number of flex lines for large hinges
            if length > 100:
                design['flex_lines'] = int(length / 50)
            else:
                design['flex_lines'] = 1
            
        elif hinge_type == 'pin':
            # Pin hinge - cylindrical knuckles with pin
            design['shape_type'] = 'pin_hinge'
            design['pin_diameter'] = params['pin_diameter']
            design['knuckle_diameter'] = params['pin_diameter'] * 2.5
            design['knuckle_count'] = max(3, int(length / 15))
            design['clearance'] = 0.2
            
            # Create as assembly (hinge body + pin)
            design['is_assembly'] = True
            design['parts'] = [
                {
                    'part_name': 'hinge_body_1',
                    'knuckles': design['knuckle_count'] // 2 + 1
                },
                {
                    'part_name': 'hinge_body_2',
                    'knuckles': design['knuckle_count'] // 2
                },
                {
                    'part_name': 'hinge_pin',
                    'diameter': params['pin_diameter'] - 0.2,
                    'length': length + 2
                }
            ]
            
        elif hinge_type == 'snap':
            # Snap-fit hinge
            design['shape_type'] = 'snap_hinge'
            design['wall_thickness'] = 1.0
            design['snap_arm_length'] = 8
            design['snap_catch_depth'] = 0.5
            
        elif hinge_type == 'piano':
            # Piano hinge - continuous with many knuckles
            design['shape_type'] = 'piano_hinge'
            design['pin_diameter'] = params['pin_diameter']
            design['knuckle_diameter'] = params['pin_diameter'] * 2
            design['knuckle_spacing'] = 5
            design['knuckle_count'] = int(length / 5)
        
        # Print orientation guidance
        if hinge_type == 'living':
            design['print_orientation'] = 'flat_perpendicular_to_hinge'
        elif hinge_type == 'pin':
            design['print_orientation'] = 'knuckles_vertical'
        
        design['print_settings'] = {
            'layer_height': 0.15 if hinge_type == 'living' else 0.2,
            'infill_percentage': 100 if hinge_type == 'living' else 30,
            'wall_line_count': 3,
            'support_enabled': hinge_type == 'pin'
        }
        
        return design


# Material recommendations
HINGE_MATERIALS = {
    'living': {
        'PLA': {'flex_thickness': 0.4, 'max_cycles': 50, 'flexibility': 'medium'},
        'PETG': {'flex_thickness': 0.5, 'max_cycles': 100, 'flexibility': 'high'},
        'TPU': {'flex_thickness': 0.8, 'max_cycles': 1000, 'flexibility': 'very_high'},
        'Nylon': {'flex_thickness': 0.6, 'max_cycles': 500, 'flexibility': 'very_high'}
    },
    'pin': {
        'PLA': {'clearance': 0.2, 'strength': 'medium'},
        'PETG': {'clearance': 0.25, 'strength': 'high'},
        'Nylon': {'clearance': 0.3, 'strength': 'very_high'}
    }
}

# Common hinge applications
HINGE_APPLICATIONS = {
    'box_lid': {'type': 'living', 'angle': 180, 'length': 80},
    'tool_case': {'type': 'pin', 'angle': 180, 'length': 120},
    'phone_stand': {'type': 'snap', 'angle': 90, 'length': 50},
    'laptop_stand': {'type': 'pin', 'angle': 120, 'length': 200},
    'organizer_lid': {'type': 'living', 'angle': 180, 'length': 100}
}
