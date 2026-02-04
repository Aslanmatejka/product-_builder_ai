#!/usr/bin/env python3
"""
Phone Stand Template - Phone and tablet holders
"""

from template_library import ProductTemplate
from typing import Dict, Any
import math


class PhoneStandTemplate(ProductTemplate):
    """
    Template for phone and tablet stands
    Angled support with slot for device
    """
    
    def __init__(self):
        super().__init__(name='phone_stand', category='accessory')
        
        # Keywords for matching
        self.keywords = ['phone stand', 'tablet stand', 'phone holder', 'tablet holder', 'device stand']
        
        # Parameter definitions
        self.parameters = {
            'device_width': {
                'type': 'number',
                'description': 'Device width (for slot)',
                'min': 60,
                'max': 300,
                'unit': 'mm',
                'required': False
            },
            'device_thickness': {
                'type': 'number',
                'description': 'Device thickness',
                'min': 5,
                'max': 20,
                'unit': 'mm',
                'required': False
            },
            'angle': {
                'type': 'number',
                'description': 'Viewing angle in degrees',
                'min': 30,
                'max': 80,
                'unit': 'degrees',
                'required': False
            },
            'slot_width': {
                'type': 'number',
                'description': 'Width of device slot',
                'min': 8,
                'max': 20,
                'unit': 'mm',
                'required': False
            },
            'cable_slot': {
                'type': 'boolean',
                'description': 'Add charging cable slot',
                'required': False
            },
            'anti_slip': {
                'type': 'boolean',
                'description': 'Add anti-slip texture',
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
            'device_width': 80,  # Standard phone width
            'device_thickness': 10,
            'angle': 60,
            'slot_width': 12,
            'cable_slot': True,
            'anti_slip': True,
            'material': 'PLA'
        }
        
        # Design rules
        self.rules = [
            'Angle 60-70° optimal for desk viewing',
            'Angle 45-50° optimal for typing',
            'Slot width = device thickness + 2mm clearance',
            'Base should extend forward to prevent tipping',
            'Cable slot 8mm wide for most cables',
            'TPU pads recommended for anti-slip'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate phone stand design"""
        
        angle = params['angle']
        slot_width = params['slot_width']
        device_width = params['device_width']
        
        # Calculate dimensions based on angle
        # Base must be wide enough to prevent tipping
        base_depth = 100  # Front to back
        base_width = device_width + 40  # Extra width for stability
        stand_height = 80
        
        # Calculate back support height based on angle
        angle_rad = math.radians(angle)
        back_height = stand_height / math.sin(angle_rad)
        
        design = {
            'product_type': 'phone_stand',
            'shape_type': 'phone_stand',
            'base_length': base_depth,
            'base_width': base_width,
            'height': stand_height,
            'angle': angle,
            'slot_width': slot_width,
            'material': params['material'],
            'units': 'mm'
        }
        
        # Add features
        features = []
        
        # Device slot
        features.append({
            'type': 'device_slot',
            'width': slot_width,
            'depth': 30,
            'angle': angle
        })
        
        # Cable management slot
        if params['cable_slot']:
            features.append({
                'type': 'cable_slot',
                'width': 8,
                'height': 6,
                'location': 'back_center'
            })
        
        # Anti-slip pads
        if params['anti_slip']:
            features.append({
                'type': 'anti_slip_pattern',
                'pattern': 'honeycomb',
                'depth': 0.5,
                'location': ['base_bottom', 'device_slot']
            })
        
        if features:
            design['features'] = features
        
        # Print orientation recommendation
        design['print_settings'] = {
            'orientation': 'upside_down',
            'support_needed': False,
            'layer_height': 0.2,
            'infill_percentage': 20,
            'wall_line_count': 3
        }
        
        return design


# Common device sizes
DEVICE_SIZES = {
    'phone_small': {'width': 65, 'thickness': 8},   # iPhone SE, small Android
    'phone_standard': {'width': 75, 'thickness': 9},  # iPhone 13, most phones
    'phone_large': {'width': 85, 'thickness': 10},   # iPhone 14 Pro Max, large phones
    'tablet_small': {'width': 150, 'thickness': 10}, # iPad Mini
    'tablet_standard': {'width': 180, 'thickness': 12}, # iPad, 10" tablets
    'tablet_large': {'width': 250, 'thickness': 12}  # iPad Pro 12.9"
}

# Optimal angles for different uses
ANGLE_PRESETS = {
    'typing': 45,
    'viewing': 60,
    'video': 70,
    'vertical': 80
}
