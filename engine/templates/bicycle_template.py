#!/usr/bin/env python3
"""
Bicycle Template - Bicycle frames and components
"""

from template_library import ProductTemplate
from typing import Dict, Any


class BicycleTemplate(ProductTemplate):
    """
    Template for bicycle products
    Supports: frames, handlebars, seats, accessories
    """
    
    def __init__(self):
        super().__init__(name='bicycle', category='sports_equipment')
        
        # Keywords for matching
        self.keywords = ['bicycle', 'bike', 'frame', 'cycle']
        
        # Parameter definitions
        self.parameters = {
            'rider_height': {
                'type': 'number',
                'description': 'Rider height (cm)',
                'min': 140,
                'max': 210,
                'unit': 'cm',
                'required': True
            },
            'bicycle_type': {
                'type': 'string',
                'description': 'Type of bicycle',
                'enum': ['road', 'mountain', 'city', 'bmx', 'touring'],
                'required': False
            },
            'material': {
                'type': 'string',
                'description': 'Frame material',
                'enum': ['aluminum', 'steel', 'carbon'],
                'required': False
            },
            'wheel_size': {
                'type': 'number',
                'description': 'Wheel diameter in inches',
                'enum': [26, 27.5, 29, 700],
                'unit': 'inches',
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
            'bicycle_type': 'city',
            'material': 'aluminum',
            'wheel_size': 700,  # 700c road wheels
            'units': 'cm'
        }
        
        # Design rules based on bicycle type
        self.rules = [
            'Road bikes: aggressive geometry, 700c wheels',
            'Mountain bikes: relaxed geometry, 27.5-29" wheels',
            'City bikes: upright position, comfortable',
            'BMX: short wheelbase, 20" wheels',
            'Frame size = rider_height * 0.67 for road bikes',
            'Frame size = rider_height * 0.59 for mountain bikes'
        ]
        
        # Geometry ratios by bicycle type
        self.geometry_ratios = {
            'road': {
                'stack': 0.30,
                'reach': 0.26,
                'seat_tube': 0.52,
                'head_angle': 73,
                'seat_angle': 74
            },
            'mountain': {
                'stack': 0.34,
                'reach': 0.22,
                'seat_tube': 0.48,
                'head_angle': 67,
                'seat_angle': 74
            },
            'city': {
                'stack': 0.36,
                'reach': 0.20,
                'seat_tube': 0.50,
                'head_angle': 70,
                'seat_angle': 73
            },
            'bmx': {
                'stack': 0.28,
                'reach': 0.18,
                'seat_tube': 0.45,
                'head_angle': 74,
                'seat_angle': 71
            }
        }
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete bicycle frame design from parameters"""
        
        rider_height = params['rider_height']
        bicycle_type = params['bicycle_type']
        material = params['material']
        
        # Get geometry ratios for this type
        ratios = self.geometry_ratios.get(bicycle_type, self.geometry_ratios['city'])
        
        # Convert rider height to mm
        if params['units'] == 'cm':
            rider_height_mm = rider_height * 10
        else:
            rider_height_mm = rider_height  # Assume mm
        
        # Calculate frame dimensions
        seat_tube_length = rider_height_mm * ratios['seat_tube']
        top_tube_length = rider_height_mm * 0.30
        head_tube_length = rider_height_mm * 0.065
        chainstay_length = rider_height_mm * 0.25
        
        # Material-specific tube diameters
        tube_diameters = {
            'aluminum': {'down': 38, 'top': 32, 'seat': 32, 'head': 44},
            'steel': {'down': 32, 'top': 28, 'seat': 28, 'head': 40},
            'carbon': {'down': 40, 'top': 34, 'seat': 34, 'head': 46}
        }
        
        tube_dims = tube_diameters.get(material, tube_diameters['aluminum'])
        
        # Create as assembly with frame tubes
        design = {
            'product_type': 'bicycle_frame',
            'shape_type': 'bicycle_frame',
            'bicycle_type': bicycle_type,
            'rider_height': rider_height,
            'material': material,
            'wheel_size': params['wheel_size'],
            'units': 'mm',  # Always use mm for internal calculations
            
            # Overall bounding box dimensions for validator
            'length': top_tube_length + head_tube_length,  # Approximate overall length
            'width': 200,  # Approximate handlebar width
            'height': seat_tube_length + 100,  # Seat tube + seat post
            
            # Frame geometry (in mm)
            'seat_tube': seat_tube_length,
            'stack': rider_height_mm * ratios['stack'],
            'reach': rider_height_mm * ratios['reach'],
            'head_angle': ratios['head_angle'],
            'seat_angle': ratios['seat_angle'],
            'top_tube': top_tube_length,
            'head_tube': head_tube_length,
            'chainstay': chainstay_length,
            'bb_drop': 70,  # Standard bottom bracket drop
            
            # Tube diameters
            'tube_diameters': tube_dims,
            
            # Create as assembly with individual tubes
            'is_assembly': True,
            'parts': [
                {
                    'name': 'seat_tube',
                    'part_name': 'seat_tube',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['seat'],
                    'length': seat_tube_length,
                    'wall_thickness': 2.0
                },
                {
                    'name': 'top_tube',
                    'part_name': 'top_tube',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['top'],
                    'length': top_tube_length,
                    'wall_thickness': 2.0
                },
                {
                    'name': 'down_tube',
                    'part_name': 'down_tube',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['down'],
                    'length': seat_tube_length * 1.1,  # Slightly longer than seat tube
                    'wall_thickness': 2.0
                },
                {
                    'name': 'head_tube',
                    'part_name': 'head_tube',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['head'],
                    'length': head_tube_length,
                    'wall_thickness': 2.0
                },
                {
                    'name': 'chainstay_left',
                    'part_name': 'chainstay_left',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['seat'],
                    'length': chainstay_length,
                    'wall_thickness': 2.0
                },
                {
                    'name': 'chainstay_right',
                    'part_name': 'chainstay_right',
                    'shape_type': 'cylinder',
                    'diameter': tube_dims['seat'],
                    'length': chainstay_length,
                    'wall_thickness': 2.0
                }
            ]
        }
        
        # Riding position description
        position_map = {
            'road': 'Aggressive racing position, aerodynamic',
            'mountain': 'Upright trail position, better control',
            'city': 'Comfortable upright position, easy visibility',
            'bmx': 'Low aggressive position for tricks'
        }
        design['riding_position'] = position_map.get(bicycle_type, 'Balanced position')
        
        return design
    
    def recommend_size(self, rider_height: float, bicycle_type: str = 'city') -> str:
        """
        Recommend frame size based on rider height
        
        Args:
            rider_height: Rider height in cm
            bicycle_type: Type of bicycle
            
        Returns:
            Frame size category (XS, S, M, L, XL, XXL)
        """
        # Road bike sizing
        if bicycle_type == 'road':
            if rider_height < 155:
                return 'XS (47-49cm)'
            elif rider_height < 165:
                return 'S (50-52cm)'
            elif rider_height < 175:
                return 'M (53-55cm)'
            elif rider_height < 185:
                return 'L (56-58cm)'
            elif rider_height < 195:
                return 'XL (59-61cm)'
            else:
                return 'XXL (62-64cm)'
        
        # Mountain bike sizing
        elif bicycle_type == 'mountain':
            if rider_height < 160:
                return 'XS (13-14")'
            elif rider_height < 170:
                return 'S (15-16")'
            elif rider_height < 180:
                return 'M (17-18")'
            elif rider_height < 190:
                return 'L (19-20")'
            else:
                return 'XL (21-22")'
        
        # City bike sizing
        else:
            if rider_height < 160:
                return 'Small (48-52cm)'
            elif rider_height < 175:
                return 'Medium (53-57cm)'
            elif rider_height < 190:
                return 'Large (58-62cm)'
            else:
                return 'Extra Large (63-66cm)'


# Parameter tables for common rider heights
COMMON_RIDER_HEIGHTS = {
    'child_120cm': 120,
    'child_140cm': 140,
    'teen_160cm': 160,
    'adult_small_165cm': 165,
    'adult_medium_175cm': 175,
    'adult_large_185cm': 185,
    'adult_xlarge_195cm': 195
}

# Standard wheel sizes by bicycle type
STANDARD_WHEEL_SIZES = {
    'bmx': 20,
    'kids': 20,
    'mountain_old': 26,
    'mountain_modern': 27.5,
    'mountain_large': 29,
    'road': 700,
    'city': 700
}
