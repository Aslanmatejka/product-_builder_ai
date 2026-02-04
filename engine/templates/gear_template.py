#!/usr/bin/env python3
"""
Gear Template - Mechanical gears and gear trains
"""

from template_library import ProductTemplate
from typing import Dict, Any, List, List
import math


class GearTemplate(ProductTemplate):
    """
    Template for gear products
    Supports: spur gears, helical gears, bevel gears, worm gears
    """
    
    def __init__(self):
        super().__init__(name='gear', category='mechanical')
        
        # Keywords for matching
        self.keywords = ['gear', 'cog', 'sprocket', 'transmission', 'gearbox']
        
        # Parameter definitions
        self.parameters = {
            'teeth': {
                'type': 'number',
                'description': 'Number of teeth',
                'min': 8,
                'max': 200,
                'required': True
            },
            'module': {
                'type': 'number',
                'description': 'Gear module (tooth size)',
                'min': 0.5,
                'max': 10,
                'unit': 'mm',
                'required': False
            },
            'pressure_angle': {
                'type': 'number',
                'description': 'Pressure angle in degrees',
                'enum': [14.5, 20, 25],
                'unit': 'degrees',
                'required': False
            },
            'thickness': {
                'type': 'number',
                'description': 'Gear thickness',
                'min': 3,
                'max': 50,
                'unit': 'mm',
                'required': False
            },
            'bore_diameter': {
                'type': 'number',
                'description': 'Central hole diameter for shaft',
                'min': 0,
                'max': 50,
                'unit': 'mm',
                'required': False
            },
            'gear_type': {
                'type': 'string',
                'description': 'Type of gear',
                'enum': ['spur', 'helical', 'bevel', 'worm'],
                'required': False
            },
            'helix_angle': {
                'type': 'number',
                'description': 'Helix angle for helical gears',
                'min': 0,
                'max': 45,
                'unit': 'degrees',
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
            'module': 2.0,
            'pressure_angle': 20,
            'thickness': 10,
            'bore_diameter': 5,
            'gear_type': 'spur',
            'helix_angle': 0,
            'material': 'PLA'
        }
        
        # Design rules
        self.rules = [
            'Minimum 8 teeth to avoid undercutting',
            'Module = pitch diameter / number of teeth',
            'Pressure angle 20° is standard for most applications',
            'Thickness should be at least 3x module for strength',
            'Add 0.1-0.2mm backlash for 3D printed gears',
            'Nylon recommended for load-bearing gears'
        ]
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete gear design from parameters"""
        
        # Calculate gear dimensions
        module = params['module']
        teeth = params['teeth']
        
        # Standard gear formulas
        pitch_diameter = module * teeth
        addendum = module
        dedendum = 1.25 * module
        outer_diameter = pitch_diameter + 2 * addendum
        root_diameter = pitch_diameter - 2 * dedendum
        
        design = {
            'product_type': 'gear',
            'shape_type': 'gear',
            'teeth': teeth,
            'module': module,
            'pressure_angle': params['pressure_angle'],
            'thickness': params['thickness'],
            'bore_diameter': params['bore_diameter'],
            'gear_type': params['gear_type'],
            'material': params['material'],
            'units': 'mm',
            
            # Calculated dimensions
            'pitch_diameter': pitch_diameter,
            'outer_diameter': outer_diameter,
            'root_diameter': root_diameter,
            'addendum': addendum,
            'dedendum': dedendum
        }
        
        # Add type-specific parameters
        if params['gear_type'] == 'helical':
            design['helix_angle'] = params['helix_angle']
        
        # Features
        features = []
        
        # Central bore for shaft
        if params['bore_diameter'] > 0:
            features.append({
                'type': 'cylinder_cutout',
                'diameter': params['bore_diameter'],
                'depth': params['thickness']
            })
        
        # Add keyway for shaft (standard feature)
        if params['bore_diameter'] >= 5:
            keyway_width = params['bore_diameter'] * 0.25
            features.append({
                'type': 'keyway',
                'width': keyway_width,
                'depth': keyway_width * 0.5
            })
        
        if features:
            design['features'] = features
        
        # Print settings for gears
        design['print_settings'] = {
            'layer_height': 0.15,  # Fine layers for smooth teeth
            'infill_percentage': 50,  # High infill for strength
            'wall_line_count': 4,
            'support_enabled': False,
            'adhesion_type': 'brim',
            'print_speed': 40  # Slower for precision
        }
        
        return design
    
    def calculate_mating_gear(self, driver_params: Dict[str, Any], 
                             gear_ratio: float) -> Dict[str, Any]:
        """
        Calculate parameters for a mating gear given desired gear ratio
        
        Args:
            driver_params: Parameters of the driver gear
            gear_ratio: Desired speed ratio (output/input)
            
        Returns:
            Parameters for mating gear
        """
        driver_teeth = driver_params['teeth']
        module = driver_params['module']
        
        # Calculate driven gear teeth
        driven_teeth = int(driver_teeth * gear_ratio)
        
        # Ensure minimum teeth
        if driven_teeth < 8:
            driven_teeth = 8
        
        mating_params = dict(driver_params)
        mating_params['teeth'] = driven_teeth
        
        return mating_params
    
    def design_gear_train(self, input_rpm: float, output_rpm: float, 
                         stages: int = 1) -> List[Dict[str, Any]]:
        """
        Design a multi-stage gear train for speed reduction/increase
        
        Args:
            input_rpm: Input speed in RPM
            output_rpm: Desired output speed in RPM
            stages: Number of gear stages
            
        Returns:
            List of gear parameters for each stage
        """
        total_ratio = output_rpm / input_rpm
        stage_ratio = total_ratio ** (1 / stages)
        
        gears = []
        current_teeth = 20  # Start with 20-tooth pinion
        
        for i in range(stages * 2):  # Each stage has 2 gears
            if i % 2 == 0:  # Driver (pinion)
                teeth = current_teeth
            else:  # Driven (gear)
                teeth = int(current_teeth * stage_ratio)
            
            gears.append({
                'teeth': teeth,
                'module': 2.0,
                'stage': i // 2 + 1,
                'role': 'pinion' if i % 2 == 0 else 'gear'
            })
        
        return gears


# Parameter tables for common gear configurations
COMMON_GEAR_RATIOS = {
    'speed_reducer_2_1': {'driver_teeth': 20, 'driven_teeth': 40, 'ratio': 2.0},
    'speed_reducer_3_1': {'driver_teeth': 20, 'driven_teeth': 60, 'ratio': 3.0},
    'speed_reducer_5_1': {'driver_teeth': 20, 'driven_teeth': 100, 'ratio': 5.0},
    'speed_increaser_1_2': {'driver_teeth': 40, 'driven_teeth': 20, 'ratio': 0.5},
    'timing_1_1': {'driver_teeth': 30, 'driven_teeth': 30, 'ratio': 1.0}
}

STANDARD_MODULES = [0.5, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]

def get_standard_module(desired_module: float) -> float:
    """Round to nearest standard module size"""
    return min(STANDARD_MODULES, key=lambda x: abs(x - desired_module))
