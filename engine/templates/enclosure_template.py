#!/usr/bin/env python3
"""
Enclosure Template - Electronics enclosures and project boxes
"""

from template_library import ProductTemplate
from typing import Dict, Any, List


class EnclosureTemplate(ProductTemplate):
    """
    Template for electronics enclosures
    Automatically adds mounting holes, vents, cable slots
    """
    
    def __init__(self):
        super().__init__(name='enclosure', category='electronics')
        
        # Keywords for matching
        self.keywords = ['enclosure', 'electronics box', 'project box', 'raspberry pi', 'arduino', 'pcb case']
        
        # Parameter definitions
        self.parameters = {
            'board_length': {
                'type': 'number',
                'description': 'PCB length',
                'min': 30,
                'max': 300,
                'unit': 'mm',
                'required': False
            },
            'board_width': {
                'type': 'number',
                'description': 'PCB width',
                'min': 30,
                'max': 300,
                'unit': 'mm',
                'required': False
            },
            'board_thickness': {
                'type': 'number',
                'description': 'PCB thickness',
                'min': 1.0,
                'max': 5.0,
                'unit': 'mm',
                'required': False
            },
            'clearance': {
                'type': 'number',
                'description': 'Clearance around PCB',
                'min': 2,
                'max': 20,
                'unit': 'mm',
                'required': False
            },
            'component_height': {
                'type': 'number',
                'description': 'Tallest component height',
                'min': 5,
                'max': 50,
                'unit': 'mm',
                'required': False
            },
            'mounting_holes': {
                'type': 'boolean',
                'description': 'Add PCB mounting holes',
                'required': False
            },
            'ventilation': {
                'type': 'boolean',
                'description': 'Add ventilation slots',
                'required': False
            },
            'cable_slots': {
                'type': 'boolean',
                'description': 'Add cable entry slots',
                'required': False
            },
            'has_lid': {
                'type': 'boolean',
                'description': 'Include removable lid',
                'required': False
            },
            'wall_thickness': {
                'type': 'number',
                'description': 'Enclosure wall thickness',
                'min': 1.5,
                'max': 5,
                'unit': 'mm',
                'required': False
            },
            'material': {
                'type': 'string',
                'description': '3D printing material',
                'enum': ['PLA', 'PETG', 'ABS'],
                'required': False
            }
        }
        
        # Default values
        self.defaults = {
            'board_thickness': 1.6,
            'clearance': 5,
            'component_height': 15,
            'mounting_holes': True,
            'ventilation': True,
            'cable_slots': True,
            'has_lid': True,
            'wall_thickness': 2.5,
            'material': 'PLA'
        }
        
        # Design rules
        self.rules = [
            'Clearance should be 3-5mm for standard boards',
            'Add 2mm to component height for safety',
            'Wall thickness 2.5mm for rigidity',
            'Ventilation slots should be 1.5mm wide',
            'M3 standoffs for mounting (3.3mm holes)',
            'Cable slots 10-15mm wide for most cables'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate electronics enclosure design"""
        
        # Calculate enclosure dimensions
        length = params.get('board_length', 100) + 2 * params['clearance']
        width = params.get('board_width', 80) + 2 * params['clearance']
        height = params['component_height'] + params['board_thickness'] + 10  # 10mm base + clearance
        
        design = {
            'product_type': 'enclosure',
            'shape_type': 'box',
            'length': length,
            'width': width,
            'height': height,
            'wall_thickness': params['wall_thickness'],
            'material': params['material'],
            'units': 'mm',
            'board_dimensions': {
                'length': params.get('board_length', 100),
                'width': params.get('board_width', 80),
                'thickness': params['board_thickness']
            }
        }
        
        # Add features
        features = []
        
        # PCB mounting standoffs
        if params['mounting_holes']:
            features.append({
                'type': 'pcb_standoffs',
                'height': 5,
                'hole_diameter': 3.3,  # M3 clearance
                'standoff_diameter': 6,
                'count': 4,
                'pattern': 'corners'
            })
        
        # Ventilation slots
        if params['ventilation']:
            features.append({
                'type': 'ventilation_slots',
                'slot_width': 1.5,
                'slot_length': 20,
                'count': 6,
                'location': 'sides'
            })
        
        # Cable entry slots
        if params['cable_slots']:
            features.append({
                'type': 'cable_slot',
                'width': 12,
                'height': 6,
                'count': 2,
                'location': 'back'
            })
        
        if features:
            design['features'] = features
        
        # Create as assembly if has lid
        if params['has_lid']:
            design['is_assembly'] = True
            design['parts'] = [
                {
                    'part_name': 'enclosure_base',
                    'shape_type': 'box',
                    'length': length,
                    'width': width,
                    'height': height * 0.7,
                    'wall_thickness': params['wall_thickness'],
                    'features': features
                },
                {
                    'part_name': 'enclosure_lid',
                    'shape_type': 'box',
                    'length': length + 0.6,
                    'width': width + 0.6,
                    'height': height * 0.3,
                    'wall_thickness': params['wall_thickness']
                }
            ]
        
        return design


# Predefined board sizes
COMMON_BOARD_SIZES = {
    'raspberry_pi_4': {'length': 85, 'width': 56},
    'raspberry_pi_pico': {'length': 51, 'width': 21},
    'arduino_uno': {'length': 68.6, 'width': 53.4},
    'arduino_nano': {'length': 45, 'width': 18},
    'arduino_mega': {'length': 101.6, 'width': 53.3},
    'esp32': {'length': 51, 'width': 28},
    'esp8266': {'length': 49, 'width': 25},
    'pcb_100x80': {'length': 100, 'width': 80},
    'pcb_100x100': {'length': 100, 'width': 100}
}

def get_board_size(board_name: str) -> Dict[str, float]:
    """Get dimensions for common development boards"""
    return COMMON_BOARD_SIZES.get(board_name.lower().replace(' ', '_'), 
                                   COMMON_BOARD_SIZES['pcb_100x80'])
