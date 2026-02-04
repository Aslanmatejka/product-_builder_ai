#!/usr/bin/env python3
"""
CadQuery Adapter for Geometry Interpreter
Provides unified interface to CadQuery CAD engine
"""

import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import CadQuery
try:
    import cadquery as cq
    CADQUERY_AVAILABLE = True
except ImportError:
    CADQUERY_AVAILABLE = False
    print("Warning: CadQuery not available", file=sys.stderr)


class CadQueryAdapter:
    """Adapter for CadQuery CAD engine"""
    
    def __init__(self):
        """Initialize CadQuery adapter"""
        self.available = CADQUERY_AVAILABLE
        
        if not self.available:
            print("[CadQuery] Module not available - falling back to FreeCAD", file=sys.stderr)
    
    def generate_geometry(self, design_data: Dict[str, Any], 
                         build_id: str, output_dir: Path) -> Dict[str, Any]:
        """
        Generate geometry using CadQuery
        
        Args:
            design_data: Design instructions
            build_id: Build identifier
            output_dir: Output directory
            
        Returns:
            Result dict with files and metadata
        """
        if not self.available:
            # Fall back to FreeCAD
            from freecad_adapter import FreeCADAdapter
            adapter = FreeCADAdapter()
            return adapter.generate_geometry(design_data, build_id, output_dir)
        
        shape_type = design_data.get('shape_type', 'box')
        units = design_data.get('units', 'mm')
        
        # Convert dimensions
        length = self._get_dimension(design_data, 'length', 100)
        width = self._get_dimension(design_data, 'width', 100)
        height = self._get_dimension(design_data, 'height', 100)
        
        # Generate geometry based on shape type
        result_obj = None
        
        if shape_type == 'box':
            result_obj = cq.Workplane("XY").box(length, width, height)
        
        elif shape_type == 'cylinder':
            diameter = self._get_dimension(design_data, 'diameter', 50)
            radius = diameter / 2
            result_obj = cq.Workplane("XY").cylinder(height, radius)
        
        elif shape_type == 'sphere':
            diameter = self._get_dimension(design_data, 'diameter', 50)
            radius = diameter / 2
            result_obj = cq.Workplane("XY").sphere(radius)
        
        else:
            # Fall back to FreeCAD for complex shapes
            print(f"[CadQuery] Shape {shape_type} not supported, using FreeCAD", file=sys.stderr)
            from freecad_adapter import FreeCADAdapter
            adapter = FreeCADAdapter()
            return adapter.generate_geometry(design_data, build_id, output_dir)
        
        # Export files
        files = self._export_cadquery_object(result_obj, build_id, output_dir)
        
        return {
            'success': True,
            'files': files,
            'engine': 'cadquery',
            'shape_type': shape_type,
            'build_id': build_id
        }
    
    def execute_operations(self, design_data: Dict[str, Any], 
                          build_id: str, output_dir: Path) -> Dict[str, Any]:
        """
        Execute design language operations using CadQuery
        
        Args:
            design_data: Design with operations array
            build_id: Build identifier
            output_dir: Output directory
            
        Returns:
            Result dict with files and metadata
        """
        if not self.available:
            # Fall back to FreeCAD
            from freecad_adapter import FreeCADAdapter
            adapter = FreeCADAdapter()
            return adapter.execute_operations(design_data, build_id, output_dir)
        
        operations = design_data.get('operations', [])
        
        # Start with a workplane
        result = cq.Workplane("XY")
        
        # Execute operations sequentially
        for idx, op in enumerate(operations):
            op_type = op.get('type')
            
            if op_type == 'SketchRectangle':
                width = op.get('width', 100)
                height = op.get('height', 100)
                result = result.rect(width, height)
            
            elif op_type == 'SketchCircle':
                radius = op.get('radius', 50)
                result = result.circle(radius)
            
            elif op_type == 'Extrude':
                height = op.get('height', 10)
                result = result.extrude(height)
            
            elif op_type == 'Fillet':
                radius = op.get('radius', 2)
                result = result.edges().fillet(radius)
            
            elif op_type == 'Chamfer':
                distance = op.get('distance', 2)
                result = result.edges().chamfer(distance)
            
            else:
                print(f"[CadQuery] Operation {op_type} not supported", file=sys.stderr)
        
        # Export files
        files = self._export_cadquery_object(result, build_id, output_dir)
        
        return {
            'success': True,
            'files': files,
            'engine': 'cadquery',
            'design_language': True,
            'operations_count': len(operations),
            'build_id': build_id
        }
    
    def export_geometry(self, geometry: Any, output_path: Path, format: str) -> bool:
        """
        Export CadQuery object to file
        
        Args:
            geometry: CadQuery Workplane object
            output_path: Output file path
            format: Export format (stl, step, obj, etc.)
            
        Returns:
            True if successful
        """
        if not self.available:
            return False
        
        format = format.lower()
        
        try:
            if format == 'step':
                cq.exporters.export(geometry, str(output_path))
            elif format == 'stl':
                cq.exporters.export(geometry, str(output_path))
            elif format in ['obj', 'svg', 'dxf']:
                cq.exporters.export(geometry, str(output_path))
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            return True
        except Exception as e:
            print(f"[CadQuery] Export failed: {e}", file=sys.stderr)
            return False
    
    def _get_dimension(self, design_data: Dict[str, Any], key: str, default: float) -> float:
        """Get dimension from design data with fallback"""
        value = design_data.get(key, design_data.get('size', default))
        
        # Convert to mm if needed
        units = design_data.get('units', 'mm')
        if units == 'inches':
            value *= 25.4
        elif units == 'cm':
            value *= 10
        
        return value
    
    def _export_cadquery_object(self, obj, build_id: str, output_dir: Path) -> List[str]:
        """Export CadQuery object to STEP and STL"""
        files = []
        
        # Export STEP
        step_file = output_dir / f"{build_id}.step"
        cq.exporters.export(obj, str(step_file))
        files.append(str(step_file))
        
        # Export STL
        stl_file = output_dir / f"{build_id}.stl"
        cq.exporters.export(obj, str(stl_file))
        files.append(str(stl_file))
        
        # Export OBJ (for visualization)
        try:
            obj_file = output_dir / f"{build_id}.obj"
            cq.exporters.export(obj, str(obj_file), tolerance=0.1)
            files.append(str(obj_file))
        except:
            print("[CadQuery] OBJ export not supported, skipping", file=sys.stderr)
        
        return files
