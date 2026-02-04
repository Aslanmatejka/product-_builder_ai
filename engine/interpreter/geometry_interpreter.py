#!/usr/bin/env python3
"""
Geometry Pipeline Interpreter
Converts AI-generated design instructions into executable CAD commands
Routes to appropriate CAD engine: FreeCAD, CadQuery, or OpenCascade
"""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add parent directory to path
script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(script_dir.parent))


class GeometryInterpreter:
    """
    Main interpreter that converts design instructions into CAD geometry
    Supports multiple CAD engines and export formats
    """
    
    SUPPORTED_ENGINES = ['freecad', 'cadquery', 'opencascade']
    SUPPORTED_EXPORTS = ['stl', 'step', 'obj', 'iges', 'brep']
    
    def __init__(self, engine: str = 'freecad'):
        """
        Initialize the geometry interpreter
        
        Args:
            engine: CAD engine to use ('freecad', 'cadquery', 'opencascade')
        """
        self.engine = engine.lower()
        if self.engine not in self.SUPPORTED_ENGINES:
            raise ValueError(f"Unsupported engine: {engine}. Use one of: {self.SUPPORTED_ENGINES}")
        
        self.adapter = None
        self._initialize_adapter()
    
    def _initialize_adapter(self):
        """Initialize the appropriate CAD engine adapter"""
        try:
            if self.engine == 'freecad':
                from freecad_adapter import FreeCADAdapter
                self.adapter = FreeCADAdapter()
            elif self.engine == 'cadquery':
                from cadquery_adapter import CadQueryAdapter
                self.adapter = CadQueryAdapter()
            elif self.engine == 'opencascade':
                from opencascade_adapter import OpenCascadeAdapter
                self.adapter = OpenCascadeAdapter()
        except ImportError as e:
            print(f"Warning: Failed to load {self.engine} adapter: {e}", file=sys.stderr)
            print(f"Falling back to FreeCAD adapter", file=sys.stderr)
            from freecad_adapter import FreeCADAdapter
            self.adapter = FreeCADAdapter()
            self.engine = 'freecad'
    
    def interpret(self, design_data: Dict[str, Any], build_id: str, output_dir: Path) -> Dict[str, Any]:
        """
        Main interpretation method - converts design to geometry
        
        Args:
            design_data: Structured design instructions from AI
            build_id: Unique build identifier
            output_dir: Directory for output files
            
        Returns:
            Dict with success status, files, and metadata
        """
        print(f"[INTERPRETER] Using {self.engine} engine", file=sys.stderr)
        print(f"[INTERPRETER] Design type: {design_data.get('product_type', 'unknown')}", file=sys.stderr)
        
        # Determine geometry type and route appropriately
        product_type = design_data.get('product_type', '').lower()
        
        # Check if this is a specialized geometry
        if self._is_specialized_geometry(product_type):
            return self._generate_specialized_geometry(design_data, build_id, output_dir)
        
        # Check if using design language (operations-based)
        if design_data.get('use_design_language') or design_data.get('operations'):
            return self._execute_design_language(design_data, build_id, output_dir)
        
        # Standard geometry generation
        return self._generate_standard_geometry(design_data, build_id, output_dir)
    
    def _is_specialized_geometry(self, product_type: str) -> bool:
        """Check if product requires specialized geometry generator"""
        specialized_types = [
            'bicycle', 'bike', 'bicycle_frame',
            'gear', 'gear_set', 'transmission',
            'spring', 'coil',
            'thread', 'screw', 'bolt',
            'bearing', 'pulley'
        ]
        return any(spec in product_type for spec in specialized_types)
    
    def _generate_specialized_geometry(self, design_data: Dict[str, Any], 
                                      build_id: str, output_dir: Path) -> Dict[str, Any]:
        """Generate specialized parametric geometry (bicycle frames, gears, etc.)"""
        product_type = design_data.get('product_type', '').lower()
        
        print(f"[INTERPRETER] Generating specialized geometry: {product_type}", file=sys.stderr)
        
        try:
            # Import specialized generators
            if 'bicycle' in product_type or 'bike' in product_type:
                from bicycle_frame_generator import generate_bicycle_frame
                result = generate_bicycle_frame(design_data, build_id, output_dir)
                # Check if generation was successful
                if result.get('success'):
                    return result
                else:
                    print(f"[INTERPRETER] Specialized generator failed: {result.get('error', 'Unknown error')}", file=sys.stderr)
                    print(f"[INTERPRETER] Falling back to standard geometry generation", file=sys.stderr)
        except Exception as e:
            print(f"[INTERPRETER] Error in specialized generator: {e}", file=sys.stderr)
            print(f"[INTERPRETER] Falling back to standard geometry generation", file=sys.stderr)
        
        # Fall back to standard generation if specialized handler not found or failed
        print(f"[INTERPRETER] No specialized handler for {product_type}, using standard", file=sys.stderr)
        return self._generate_standard_geometry(design_data, build_id, output_dir)
    
    def _execute_design_language(self, design_data: Dict[str, Any], 
                                 build_id: str, output_dir: Path) -> Dict[str, Any]:
        """Execute design language operations (Sketch → Extrude → Fillet)"""
        print(f"[INTERPRETER] Executing design language operations", file=sys.stderr)
        
        operations = design_data.get('operations', [])
        print(f"[INTERPRETER] Operations count: {len(operations)}", file=sys.stderr)
        
        # Use adapter to execute operations
        result = self.adapter.execute_operations(design_data, build_id, output_dir)
        result['design_language'] = True
        result['operations_count'] = len(operations)
        
        return result
    
    def _generate_standard_geometry(self, design_data: Dict[str, Any], 
                                   build_id: str, output_dir: Path) -> Dict[str, Any]:
        """Generate standard geometry from shape_type and dimensions"""
        shape_type = design_data.get('shape_type', 'box')
        print(f"[INTERPRETER] Generating standard shape: {shape_type}", file=sys.stderr)
        
        # Use adapter to generate geometry
        result = self.adapter.generate_geometry(design_data, build_id, output_dir)
        result['shape_type'] = shape_type
        
        return result
    
    def export(self, geometry: Any, output_path: Path, format: str) -> bool:
        """
        Export geometry to specified format
        
        Args:
            geometry: CAD geometry object
            output_path: Output file path
            format: Export format (stl, step, obj, etc.)
            
        Returns:
            True if successful
        """
        format = format.lower()
        if format not in self.SUPPORTED_EXPORTS:
            raise ValueError(f"Unsupported export format: {format}")
        
        return self.adapter.export_geometry(geometry, output_path, format)
    
    @staticmethod
    def select_optimal_engine(design_data: Dict[str, Any]) -> str:
        """
        Auto-select the best CAD engine for the design
        
        Args:
            design_data: Design instructions
            
        Returns:
            Engine name ('freecad', 'cadquery', 'opencascade')
        """
        product_type = design_data.get('product_type', '').lower()
        
        # CadQuery is great for parametric assemblies and code-first CAD
        if design_data.get('is_assembly') or 'assembly' in product_type:
            return 'cadquery'
        
        # OpenCascade for high-performance batch processing
        if design_data.get('batch_mode') or design_data.get('optimization_required'):
            return 'opencascade'
        
        # FreeCAD is the default - most versatile, GUI available
        return 'freecad'


def interpret_design(design_data: Dict[str, Any], build_id: str, 
                    output_dir: Path, engine: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point for geometry interpretation
    
    Args:
        design_data: Design instructions from AI
        build_id: Unique build identifier
        output_dir: Output directory path
        engine: CAD engine to use (auto-selected if None)
        
    Returns:
        Result dict with success, files, and metadata
    """
    # Auto-select engine if not specified
    if engine is None:
        engine = GeometryInterpreter.select_optimal_engine(design_data)
        print(f"[INTERPRETER] Auto-selected engine: {engine}", file=sys.stderr)
    
    # Create interpreter and execute
    interpreter = GeometryInterpreter(engine)
    return interpreter.interpret(design_data, build_id, output_dir)


if __name__ == "__main__":
    # Command-line interface for testing
    if len(sys.argv) < 2:
        print("Usage: python geometry_interpreter.py <build_id> [--engine freecad|cadquery|opencascade]")
        sys.exit(1)
    
    build_id = sys.argv[1]
    
    # Parse engine argument
    engine = None
    if '--engine' in sys.argv:
        idx = sys.argv.index('--engine')
        if idx + 1 < len(sys.argv):
            engine = sys.argv[idx + 1]
    
    # Read design from stdin
    try:
        design_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {e}'
        }))
        sys.exit(1)
    
    # Set output directory
    output_dir = script_dir.parent.parent / 'exports' / 'cad'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Interpret and generate geometry
    try:
        result = interpret_design(design_data, build_id, output_dir, engine)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'traceback': __import__('traceback').format_exc()
        }))
        sys.exit(1)
