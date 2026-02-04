#!/usr/bin/env python3
"""
OpenCascade Adapter for Geometry Interpreter
Direct OpenCascade Technology (OCCT) API for high-performance CAD
"""

import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import OpenCascade modules
try:
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeSphere
    from OCC.Core.BRepFilletAPI import BRepFilletAPI_MakeFillet
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.StlAPI import StlAPI_Writer
    from OCC.Core.STEPControl import STEPControl_Writer, STEPControl_AsIs
    from OCC.Core.gp import gp_Pnt, gp_Vec, gp_Ax2, gp_Dir
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_EDGE
    OPENCASCADE_AVAILABLE = True
except ImportError:
    OPENCASCADE_AVAILABLE = False
    print("Warning: OpenCascade (pythonocc) not available", file=sys.stderr)


class OpenCascadeAdapter:
    """Adapter for direct OpenCascade Technology API"""
    
    def __init__(self):
        """Initialize OpenCascade adapter"""
        self.available = OPENCASCADE_AVAILABLE
        
        if not self.available:
            print("[OpenCascade] Module not available - falling back to FreeCAD", file=sys.stderr)
    
    def generate_geometry(self, design_data: Dict[str, Any], 
                         build_id: str, output_dir: Path) -> Dict[str, Any]:
        """
        Generate geometry using OpenCascade API
        
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
        shape = None
        
        if shape_type == 'box':
            shape = BRepPrimAPI_MakeBox(length, width, height).Shape()
        
        elif shape_type == 'cylinder':
            diameter = self._get_dimension(design_data, 'diameter', 50)
            radius = diameter / 2
            ax2 = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
            shape = BRepPrimAPI_MakeCylinder(ax2, radius, height).Shape()
        
        elif shape_type == 'sphere':
            diameter = self._get_dimension(design_data, 'diameter', 50)
            radius = diameter / 2
            shape = BRepPrimAPI_MakeSphere(radius).Shape()
        
        else:
            # Fall back to FreeCAD for complex shapes
            print(f"[OpenCascade] Shape {shape_type} not supported, using FreeCAD", file=sys.stderr)
            from freecad_adapter import FreeCADAdapter
            adapter = FreeCADAdapter()
            return adapter.generate_geometry(design_data, build_id, output_dir)
        
        # Export files
        files = self._export_shape(shape, build_id, output_dir)
        
        return {
            'success': True,
            'files': files,
            'engine': 'opencascade',
            'shape_type': shape_type,
            'build_id': build_id
        }
    
    def execute_operations(self, design_data: Dict[str, Any], 
                          build_id: str, output_dir: Path) -> Dict[str, Any]:
        """
        Execute design language operations
        
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
        
        # OpenCascade doesn't have a simple operation chain API
        # Fall back to FreeCAD for design language
        print("[OpenCascade] Design language not supported, using FreeCAD", file=sys.stderr)
        from freecad_adapter import FreeCADAdapter
        adapter = FreeCADAdapter()
        return adapter.execute_operations(design_data, build_id, output_dir)
    
    def export_geometry(self, geometry: Any, output_path: Path, format: str) -> bool:
        """
        Export OpenCascade shape to file
        
        Args:
            geometry: TopoDS_Shape object
            output_path: Output file path
            format: Export format (stl, step, etc.)
            
        Returns:
            True if successful
        """
        if not self.available:
            return False
        
        format = format.lower()
        
        try:
            if format == 'step':
                writer = STEPControl_Writer()
                writer.Transfer(geometry, STEPControl_AsIs)
                writer.Write(str(output_path))
            
            elif format == 'stl':
                # Mesh the shape first
                mesh = BRepMesh_IncrementalMesh(geometry, 0.1)
                mesh.Perform()
                
                writer = StlAPI_Writer()
                writer.Write(geometry, str(output_path))
            
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            return True
        except Exception as e:
            print(f"[OpenCascade] Export failed: {e}", file=sys.stderr)
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
    
    def _export_shape(self, shape, build_id: str, output_dir: Path) -> List[str]:
        """Export OpenCascade shape to STEP and STL"""
        files = []
        
        # Export STEP
        step_file = output_dir / f"{build_id}.step"
        self.export_geometry(shape, step_file, 'step')
        files.append(str(step_file))
        
        # Export STL
        stl_file = output_dir / f"{build_id}.stl"
        self.export_geometry(shape, stl_file, 'stl')
        files.append(str(stl_file))
        
        return files
