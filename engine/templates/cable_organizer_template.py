#!/usr/bin/env python3
"""
Cable Organizer Template - Cable management solutions
"""

from template_library import ProductTemplate
from typing import Dict, Any


class CableOrganizerTemplate(ProductTemplate):
    """
    Template for cable organizers and management
    Clips, holders, and routing solutions
    """
    
    def __init__(self):
        super().__init__(name='cable_organizer', category='organization')
        
        # Keywords for matching
        self.keywords = ['cable organizer', 'cable clip', 'cable holder', 'cable management', 'cord organizer']
        
        # Parameter definitions
        self.parameters = {
            'cable_diameter': {
                'type': 'number',
                'description': 'Cable diameter',
                'min': 2,
                'max': 20,
                'unit': 'mm',
                'required': False
            },
            'cable_count': {
                'type': 'number',
                'description': 'Number of cables',
                'min': 1,
                'max': 10,
                'required': False
            },
            'organizer_type': {
                'type': 'string',
                'description': 'Type of organizer',
                'enum': ['clip', 'holder', 'spiral', 'box', 'channel'],
                'required': False
            },
            'mounting_type': {
                'type': 'string',
                'description': 'How to mount',
                'enum': ['adhesive', 'screw', 'magnetic', 'desk_edge'],
                'required': False
            },
            'length': {
                'type': 'number',
                'description': 'Organizer length',
                'min': 20,
                'max': 200,
                'unit': 'mm',
                'required': False
            },
            'material': {
                'type': 'string',
                'description': '3D printing material',
                'enum': ['PLA', 'PETG', 'TPU'],
                'required': False
            }
        }
        
        # Default values
        self.defaults = {
            'cable_diameter': 5,  # USB cable size
            'cable_count': 3,
            'organizer_type': 'clip',
            'mounting_type': 'adhesive',
            'length': 50,
            'material': 'PLA'
        }
        
        # Design rules
        self.rules = [
            'Cable slot = cable diameter + 1mm clearance',
            'Clip should grip 50-70% of cable circumference',
            'TPU recommended for flexible cable routing',
            'Adhesive base: 20x20mm minimum contact area',
            'Screw holes: M3 (3.3mm clearance)',
            'Desk edge clip: 20-40mm jaw opening'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate cable organizer design"""
        
        organizer_type = params['organizer_type']
        cable_diameter = params['cable_diameter']
        cable_count = params['cable_count']
        
        # Base design
        design = {
            'product_type': 'cable_organizer',
            'organizer_type': organizer_type,
            'cable_diameter': cable_diameter,
            'cable_count': cable_count,
            'material': params['material'],
            'units': 'mm'
        }
        
        # Type-specific designs
        if organizer_type == 'clip':
            # Simple cable clip
            slot_diameter = cable_diameter + 1
            design['shape_type'] = 'cable_clip'
            design['length'] = 30
            design['width'] = 20
            design['height'] = 15
            design['slot_diameter'] = slot_diameter
            design['slot_count'] = cable_count
            
        elif organizer_type == 'holder':
            # Desktop cable holder
            design['shape_type'] = 'cable_holder'
            design['base_length'] = params['length']
            design['base_width'] = 30
            design['holder_height'] = cable_diameter * 2
            design['slot_count'] = cable_count
            
        elif organizer_type == 'spiral':
            # Spiral cable wrap
            design['shape_type'] = 'cable_spiral'
            design['inner_diameter'] = cable_diameter * 1.5
            design['spiral_length'] = params['length']
            design['pitch'] = cable_diameter * 2
            design['wall_thickness'] = 1.5
            
        elif organizer_type == 'box':
            # Cable storage box
            design['shape_type'] = 'box'
            design['length'] = params['length']
            design['width'] = params['length'] * 0.8
            design['height'] = 40
            design['wall_thickness'] = 2
            design['has_lid'] = True
            
        elif organizer_type == 'channel':
            # Cable routing channel
            design['shape_type'] = 'cable_channel'
            design['length'] = params['length']
            design['width'] = cable_diameter * cable_count + 10
            design['height'] = cable_diameter * 1.5
            design['wall_thickness'] = 2
        
        # Add mounting features
        features = []
        
        if params['mounting_type'] == 'adhesive':
            features.append({
                'type': 'adhesive_base',
                'length': 25,
                'width': 25,
                'texture': 'smooth'
            })
        elif params['mounting_type'] == 'screw':
            features.append({
                'type': 'mounting_holes',
                'diameter': 3.3,
                'count': 2,
                'spacing': 20
            })
        elif params['mounting_type'] == 'magnetic':
            features.append({
                'type': 'magnet_slot',
                'diameter': 10,
                'depth': 3,
                'count': 2
            })
        elif params['mounting_type'] == 'desk_edge':
            features.append({
                'type': 'desk_clamp',
                'jaw_opening': 30,
                'grip_depth': 15
            })
        
        if features:
            design['features'] = features
        
        return design


# Common cable sizes
CABLE_SIZES = {
    'usb_micro': 3,
    'usb_c': 4,
    'lightning': 3.5,
    'hdmi': 7,
    'ethernet': 6,
    'power_small': 5,
    'power_laptop': 8,
    'power_thick': 12
}

# Organizer types and use cases
ORGANIZER_USE_CASES = {
    'clip': 'Desktop cable routing, wall mounting',
    'holder': 'Desk edge organization, multiple cables',
    'spiral': 'Cable bundling, length management',
    'box': 'Cable storage, charging station',
    'channel': 'Under-desk routing, wall channels'
}
