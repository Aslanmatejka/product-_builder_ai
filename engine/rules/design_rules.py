#!/usr/bin/env python3
"""
Design Rules Engine
Matches user prompts to templates and applies design rules
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import sys

# Add templates to path
script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(script_dir.parent / 'templates'))

from template_library import get_library, apply_template


class RuleEngine:
    """
    Rule-based system for matching user prompts to product templates
    """
    
    def __init__(self):
        self.template_library = get_library()
        self.product_rules = self._build_product_rules()
        self.parameter_extractors = self._build_parameter_extractors()
    
    def _build_product_rules(self) -> Dict[str, List[str]]:
        """
        Build product matching rules
        Maps keywords/patterns to product templates
        """
        return {
            'box': [
                r'\bbox\b',
                r'\bcontainer\b',
                r'\bcase\b',
                r'\bstorage\b',
                r'\bcover\b'
            ],
            'gear': [
                r'\bgear\b',
                r'\bcog\b',
                r'\bsprocket\b',
                r'\btransmission\b',
                r'\bgearbox\b',
                r'\b\d+\s*teeth\b'
            ],
            'bicycle': [
                r'\bbicycle\b',
                r'\bbike\b',
                r'\bframe\b',
                r'\bcycle\b',
                r'\brider\b'
            ],
            'enclosure': [
                r'\benclosure\b',
                r'\belectronics\s+(box|enclosure|case)\b',
                r'\bproject\s+box\b',
                r'\bpcb\s+(case|enclosure|box)\b',
                r'\braspberry\s+pi\b',
                r'\barduino\b',
                r'\besp32\b',
                r'\besp8266\b'
            ],
            'phone_stand': [
                r'\bphone\s+stand\b',
                r'\btablet\s+stand\b',
                r'\bphone\s+holder\b',
                r'\btablet\s+holder\b',
                r'\bdevice\s+(stand|holder)\b'
            ],
            'cable_organizer': [
                r'\bcable\s+(organizer|clip|holder|management)\b',
                r'\bcord\s+(organizer|clip|holder)\b',
                r'\bcable\s+routing\b',
                r'\bwire\s+(organizer|management)\b'
            ],
            'hinge': [
                r'\bhinge\b',
                r'\bliving\s+hinge\b',
                r'\bpin\s+hinge\b',
                r'\bfolding\b',
                r'\bpivot\b'
            ],
            'hook': [
                r'\bhook\b',
                r'\bhanger\b',
                r'\bwall\s+hook\b',
                r'\bcoat\s+hook\b',
                r'\bkey\s+hook\b',
                r'\btool\s+hook\b'
            ]
        }
    
    def _build_parameter_extractors(self) -> Dict[str, callable]:
        """
        Build parameter extraction functions
        Each function extracts specific parameters from text
        """
        return {
            'dimensions': self._extract_dimensions,
            'material': self._extract_material,
            'quantity': self._extract_quantity,
            'rider_height': self._extract_rider_height,
            'teeth_count': self._extract_teeth_count,
            'units': self._extract_units
        }
    
    def match_product(self, user_prompt: str) -> Tuple[Optional[str], float]:
        """
        Match user prompt to product template
        
        Args:
            user_prompt: User's natural language prompt
            
        Returns:
            (template_name, confidence_score)
        """
        prompt_lower = user_prompt.lower()
        
        best_match = None
        best_score = 0.0
        
        # Check each product's rules
        for product_name, patterns in self.product_rules.items():
            score = 0.0
            matches = 0
            
            for pattern in patterns:
                if re.search(pattern, prompt_lower):
                    matches += 1
                    score += 1.0
            
            # Normalize score
            if len(patterns) > 0:
                score = score / len(patterns)
            
            # Boost score if multiple patterns match
            if matches > 1:
                score *= 1.5
            
            if score > best_score:
                best_score = score
                best_match = product_name
        
        return best_match, best_score
    
    def extract_parameters(self, user_prompt: str, product_type: str) -> Dict[str, Any]:
        """
        Extract parameters from user prompt
        
        Args:
            user_prompt: User's natural language prompt
            product_type: Matched product type
            
        Returns:
            Dictionary of extracted parameters
        """
        params = {}
        
        # Run all extractors
        for extractor_name, extractor_func in self.parameter_extractors.items():
            result = extractor_func(user_prompt)
            if result is not None:
                params.update(result)
        
        # Product-specific extractions
        if product_type == 'gear':
            params.update(self._extract_gear_params(user_prompt))
        elif product_type == 'bicycle':
            params.update(self._extract_bicycle_params(user_prompt))
        
        return params
    
    def _extract_dimensions(self, text: str) -> Optional[Dict[str, float]]:
        """Extract dimensions like '100x80x50mm' or '10cm x 8cm x 5cm'"""
        # Pattern: number x number x number with optional units
        pattern = r'(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)\s*(mm|cm|inch|inches)?'
        match = re.search(pattern, text)
        
        if match:
            length = float(match.group(1))
            width = float(match.group(2))
            height = float(match.group(3))
            units = match.group(4) or 'mm'
            
            return {
                'length': length,
                'width': width,
                'height': height,
                'units': units
            }
        
        return None
    
    def _extract_material(self, text: str) -> Optional[Dict[str, str]]:
        """Extract material mentions"""
        materials = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'aluminum', 'steel', 'carbon']
        text_lower = text.lower()
        
        for material in materials:
            if material.lower() in text_lower:
                return {'material': material}
        
        return None
    
    def _extract_units(self, text: str) -> Optional[Dict[str, str]]:
        """Extract measurement units"""
        if 'mm' in text or 'millimeter' in text.lower():
            return {'units': 'mm'}
        elif 'cm' in text or 'centimeter' in text.lower():
            return {'units': 'cm'}
        elif 'inch' in text.lower():
            return {'units': 'inches'}
        
        return None
    
    def _extract_quantity(self, text: str) -> Optional[Dict[str, int]]:
        """Extract quantity like 'make 5 boxes'"""
        pattern = r'\b(?:make|create|generate|print)\s+(\d+)\b'
        match = re.search(pattern, text.lower())
        
        if match:
            return {'quantity': int(match.group(1))}
        
        return None
    
    def _extract_rider_height(self, text: str) -> Optional[Dict[str, float]]:
        """Extract rider height like '180cm rider'"""
        pattern = r'(\d+\.?\d*)\s*(cm|inch|inches)?\s*(?:tall|rider|height)'
        match = re.search(pattern, text.lower())
        
        if match:
            height = float(match.group(1))
            units = match.group(2) or 'cm'
            return {
                'rider_height': height,
                'units': units
            }
        
        return None
    
    def _extract_teeth_count(self, text: str) -> Optional[Dict[str, int]]:
        """Extract gear teeth count like '20 teeth'"""
        pattern = r'(\d+)\s*teeth'
        match = re.search(pattern, text.lower())
        
        if match:
            return {'teeth': int(match.group(1))}
        
        return None
    
    def _extract_gear_params(self, text: str) -> Dict[str, Any]:
        """Extract gear-specific parameters"""
        params = {}
        
        # Module
        module_pattern = r'module\s+(\d+\.?\d*)'
        match = re.search(module_pattern, text.lower())
        if match:
            params['module'] = float(match.group(1))
        
        # Gear type
        if 'spur' in text.lower():
            params['gear_type'] = 'spur'
        elif 'helical' in text.lower():
            params['gear_type'] = 'helical'
        elif 'bevel' in text.lower():
            params['gear_type'] = 'bevel'
        
        return params
    
    def _extract_bicycle_params(self, text: str) -> Dict[str, Any]:
        """Extract bicycle-specific parameters"""
        params = {}
        
        # Bicycle type
        if 'road' in text.lower():
            params['bicycle_type'] = 'road'
        elif 'mountain' in text.lower() or 'mtb' in text.lower():
            params['bicycle_type'] = 'mountain'
        elif 'city' in text.lower():
            params['bicycle_type'] = 'city'
        elif 'bmx' in text.lower():
            params['bicycle_type'] = 'bmx'
        
        return params
    
    def apply_rules(self, user_prompt: str) -> Dict[str, Any]:
        """
        Main entry point: Apply all rules to generate design
        
        Args:
            user_prompt: User's natural language prompt
            
        Returns:
            Complete design specification
        """
        # Step 1: Match to product template
        product_type, confidence = self.match_product(user_prompt)
        
        if product_type is None or confidence < 0.15:  # Lowered threshold for single keyword matches
            return {
                'success': False,
                'error': 'Could not match prompt to a product template',
                'prompt': user_prompt,
                'suggestions': list(self.product_rules.keys())
            }
        
        print(f"[RULES] Matched product: {product_type} (confidence: {confidence:.2f})", file=sys.stderr)
        
        # Step 2: Extract parameters
        params = self.extract_parameters(user_prompt, product_type)
        print(f"[RULES] Extracted parameters: {params}", file=sys.stderr)
        
        # Step 3: Apply template
        try:
            design = apply_template(product_type, params)
            design['template_used'] = product_type
            design['template_confidence'] = confidence
            design['extracted_params'] = params
            design['success'] = True
            
            return design
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'product_type': product_type,
                'params': params
            }


# Global rule engine instance
_engine = None

def get_engine() -> RuleEngine:
    """Get the global rule engine instance"""
    global _engine
    if _engine is None:
        _engine = RuleEngine()
    return _engine


def process_prompt(user_prompt: str) -> Dict[str, Any]:
    """
    Main entry point: Process user prompt through rule engine
    
    Args:
        user_prompt: User's natural language prompt
        
    Returns:
        Design specification or error
    """
    engine = get_engine()
    return engine.apply_rules(user_prompt)


if __name__ == "__main__":
    # Test the rule engine
    test_prompts = [
        "box 100x80x50mm",
        "gear with 20 teeth",
        "bicycle frame for 180cm rider aluminum",
        "create a storage container 15cm x 10cm x 8cm",
        "spur gear module 2 with 30 teeth"
    ]
    
    engine = get_engine()
    
    for prompt in test_prompts:
        print(f"\n{'='*60}")
        print(f"Prompt: {prompt}")
        print(f"{'='*60}")
        
        result = process_prompt(prompt)
        
        if result.get('success'):
            print(f"✓ Product: {result.get('template_used')}")
            print(f"✓ Confidence: {result.get('template_confidence', 0):.2f}")
            print(f"✓ Design generated successfully")
            print(f"  Parameters: {result.get('extracted_params')}")
        else:
            print(f"✗ Error: {result.get('error')}")
