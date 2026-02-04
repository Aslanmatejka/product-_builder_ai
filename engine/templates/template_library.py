#!/usr/bin/env python3
"""
Product Template Library
Provides predefined templates for common products with parameter tables
"""

import json
from typing import Dict, List, Any, Optional
from pathlib import Path


class ProductTemplate:
    """Base class for product templates"""
    
    def __init__(self, name: str, category: str):
        self.name = name
        self.category = category
        self.parameters = {}
        self.rules = []
        self.defaults = {}
    
    def get_schema(self) -> Dict[str, Any]:
        """Return template schema with parameter definitions"""
        return {
            'name': self.name,
            'category': self.category,
            'parameters': self.parameters,
            'rules': self.rules,
            'defaults': self.defaults
        }
    
    def validate_parameters(self, params: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate parameters against template rules
        Returns (is_valid, error_messages)
        """
        errors = []
        
        # Check required parameters
        for param_name, param_def in self.parameters.items():
            if param_def.get('required', False) and param_name not in params:
                errors.append(f"Missing required parameter: {param_name}")
        
        # Validate parameter values
        for param_name, param_value in params.items():
            if param_name not in self.parameters:
                continue
            
            param_def = self.parameters[param_name]
            
            # Type checking
            expected_type = param_def.get('type')
            if expected_type == 'number' and not isinstance(param_value, (int, float)):
                errors.append(f"{param_name} must be a number")
            elif expected_type == 'string' and not isinstance(param_value, str):
                errors.append(f"{param_name} must be a string")
            
            # Range checking
            if 'min' in param_def and param_value < param_def['min']:
                errors.append(f"{param_name} must be >= {param_def['min']}")
            if 'max' in param_def and param_value > param_def['max']:
                errors.append(f"{param_name} must be <= {param_def['max']}")
            
            # Enum checking
            if 'enum' in param_def and param_value not in param_def['enum']:
                errors.append(f"{param_name} must be one of: {param_def['enum']}")
        
        return len(errors) == 0, errors
    
    def apply_defaults(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply default values to missing parameters"""
        result = dict(params)
        for param_name, default_value in self.defaults.items():
            if param_name not in result:
                result[param_name] = default_value
        return result
    
    def generate_design(self, user_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate complete design from user parameters
        This is the main method that templates override
        """
        # Apply defaults
        params = self.apply_defaults(user_params)
        
        # Validate
        is_valid, errors = self.validate_parameters(params)
        if not is_valid:
            raise ValueError(f"Invalid parameters: {', '.join(errors)}")
        
        # Generate design (to be overridden by subclasses)
        return self._build_design(params)
    
    def _build_design(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Override this method in subclasses"""
        raise NotImplementedError("Template must implement _build_design()")


class TemplateLibrary:
    """Central registry of product templates"""
    
    def __init__(self):
        self.templates = {}
        self.categories = {}
        self._load_builtin_templates()
    
    def _load_builtin_templates(self):
        """Load built-in templates"""
        # Import and register built-in templates
        try:
            from box_template import BoxTemplate
            self.register(BoxTemplate())
        except ImportError:
            pass
        
        try:
            from gear_template import GearTemplate
            self.register(GearTemplate())
        except ImportError:
            pass
        
        try:
            from bicycle_template import BicycleTemplate
            self.register(BicycleTemplate())
        except ImportError:
            pass
        
        try:
            from enclosure_template import EnclosureTemplate
            self.register(EnclosureTemplate())
        except ImportError:
            pass
        
        try:
            from phone_stand_template import PhoneStandTemplate
            self.register(PhoneStandTemplate())
        except ImportError:
            pass
        
        try:
            from cable_organizer_template import CableOrganizerTemplate
            self.register(CableOrganizerTemplate())
        except ImportError:
            pass
        
        try:
            from hinge_template import HingeTemplate
            self.register(HingeTemplate())
        except ImportError:
            pass
        
        try:
            from hook_template import HookTemplate
            self.register(HookTemplate())
        except ImportError:
            pass
    
    def register(self, template: ProductTemplate):
        """Register a new template"""
        self.templates[template.name] = template
        
        # Add to category index
        if template.category not in self.categories:
            self.categories[template.category] = []
        self.categories[template.category].append(template.name)
    
    def get(self, name: str) -> Optional[ProductTemplate]:
        """Get template by name"""
        return self.templates.get(name)
    
    def list_templates(self) -> List[str]:
        """List all available template names"""
        return list(self.templates.keys())
    
    def list_categories(self) -> Dict[str, List[str]]:
        """List templates grouped by category"""
        return dict(self.categories)
    
    def find_template(self, product_type: str) -> Optional[ProductTemplate]:
        """
        Find best matching template for product type
        Uses fuzzy matching and keywords
        """
        product_lower = product_type.lower()
        
        # Direct match
        if product_lower in self.templates:
            return self.templates[product_lower]
        
        # Keyword matching
        for template_name, template in self.templates.items():
            keywords = [template_name, template.category]
            if hasattr(template, 'keywords'):
                keywords.extend(template.keywords)
            
            if any(keyword in product_lower for keyword in keywords):
                return template
        
        return None
    
    def get_all_schemas(self) -> Dict[str, Any]:
        """Get schemas for all templates (for AI training)"""
        return {
            name: template.get_schema() 
            for name, template in self.templates.items()
        }
    
    def export_for_ai(self, output_path: Path):
        """Export template library as JSON for AI training"""
        schemas = self.get_all_schemas()
        
        # Add metadata
        export_data = {
            'template_count': len(self.templates),
            'categories': self.categories,
            'templates': schemas,
            'usage_guide': {
                'description': 'Product templates with predefined parameters',
                'how_to_use': [
                    '1. Match user prompt to template category',
                    '2. Extract parameters from user requirements',
                    '3. Apply template with parameters',
                    '4. AI can modify parameters within valid ranges'
                ],
                'example': {
                    'user_prompt': 'box 100x50x30mm',
                    'template': 'box',
                    'parameters': {
                        'length': 100,
                        'width': 50,
                        'height': 30,
                        'units': 'mm'
                    }
                }
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)


# Global library instance
_library = None

def get_library() -> TemplateLibrary:
    """Get the global template library instance"""
    global _library
    if _library is None:
        _library = TemplateLibrary()
    return _library


def apply_template(product_type: str, user_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point: Apply template to user parameters
    
    Args:
        product_type: Type of product (e.g., "box", "gear", "bicycle")
        user_params: User-provided parameters
        
    Returns:
        Complete design specification
    """
    library = get_library()
    template = library.find_template(product_type)
    
    if template is None:
        raise ValueError(f"No template found for product type: {product_type}")
    
    return template.generate_design(user_params)


if __name__ == "__main__":
    # Export templates for AI training
    library = get_library()
    output_path = Path(__file__).parent / 'templates_for_ai.json'
    library.export_for_ai(output_path)
    print(f"Exported {len(library.templates)} templates to {output_path}")
    print(f"Categories: {list(library.categories.keys())}")
    print(f"Templates: {library.list_templates()}")
