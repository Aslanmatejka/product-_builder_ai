"""
CAD Design Language (DSL) Parser and Executor
Executes sequential CAD operations using FreeCAD Python API

Operations:
  - Sketch (Rectangle, Circle, Polygon)
  - Extrude, Revolve, Loft, Sweep
  - Cut, Fuse, Common (Boolean ops)
  - Fillet, Chamfer
  - Pattern (Linear, Circular)
  - AddLegs, AddHoles, AddSupports (parametric features)
"""

import FreeCAD
import Part
import Sketch
import math
from typing import List, Dict, Any


class CADOperationExecutor:
    """Execute sequential CAD operations"""
    
    def __init__(self, doc_name="Design"):
        self.doc = FreeCAD.newDocument(doc_name)
        self.current_shape = None
        self.sketches = {}
        self.features = []
        self.operations_log = []
        
    def execute_operations(self, design_data: Dict[str, Any]):
        """Execute all operations in sequence"""
        operations = design_data.get('operations', [])
        units = design_data.get('units', 'mm')
        
        for idx, op in enumerate(operations):
            op_type = op.get('type')
            print(f"Executing operation {idx + 1}: {op_type}", file=sys.stderr)
            
            try:
                if op_type == 'SketchRectangle':
                    self._sketch_rectangle(op)
                elif op_type == 'SketchCircle':
                    self._sketch_circle(op)
                elif op_type == 'SketchPolygon':
                    self._sketch_polygon(op)
                elif op_type == 'Extrude':
                    self._extrude(op)
                elif op_type == 'Revolve':
                    self._revolve(op)
                elif op_type == 'Cut':
                    self._cut(op)
                elif op_type == 'Fuse':
                    self._fuse(op)
                elif op_type == 'Fillet':
                    self._fillet(op)
                elif op_type == 'Chamfer':
                    self._chamfer(op)
                elif op_type == 'AddLegs':
                    self._add_legs(op)
                elif op_type == 'AddHoles':
                    self._add_holes(op)
                elif op_type == 'AddSupports':
                    self._add_supports(op)
                elif op_type == 'LinearPattern':
                    self._linear_pattern(op)
                elif op_type == 'CircularPattern':
                    self._circular_pattern(op)
                elif op_type == 'Shell':
                    self._shell(op)
                else:
                    print(f"Warning: Unknown operation type: {op_type}", file=sys.stderr)
                    
                self.operations_log.append({
                    'index': idx + 1,
                    'type': op_type,
                    'status': 'success'
                })
                
            except Exception as e:
                print(f"Error in operation {idx + 1} ({op_type}): {e}", file=sys.stderr)
                self.operations_log.append({
                    'index': idx + 1,
                    'type': op_type,
                    'status': 'failed',
                    'error': str(e)
                })
                raise
        
        return self.current_shape
    
    def _sketch_rectangle(self, op: Dict):
        """Create rectangular sketch"""
        width = op.get('width', 100)
        height = op.get('height', 100)
        centered = op.get('centered', True)
        
        if centered:
            x, y = -width/2, -height/2
        else:
            x, y = 0, 0
        
        points = [
            FreeCAD.Vector(x, y, 0),
            FreeCAD.Vector(x + width, y, 0),
            FreeCAD.Vector(x + width, y + height, 0),
            FreeCAD.Vector(x, y + height, 0),
            FreeCAD.Vector(x, y, 0)
        ]
        
        wire = Part.makePolygon(points)
        face = Part.Face(wire)
        self.current_shape = face
        print(f"  Created rectangle: {width}x{height}mm", file=sys.stderr)
    
    def _sketch_circle(self, op: Dict):
        """Create circular sketch"""
        radius = op.get('radius', op.get('diameter', 100) / 2)
        
        circle = Part.makeCircle(radius)
        wire = Part.Wire(circle)
        face = Part.Face(wire)
        self.current_shape = face
        print(f"  Created circle: radius={radius}mm", file=sys.stderr)
    
    def _sketch_polygon(self, op: Dict):
        """Create polygon sketch from points"""
        points_data = op.get('points', [])
        closed = op.get('closed', True)
        
        points = [FreeCAD.Vector(p[0], p[1], 0) for p in points_data]
        if closed and points[0] != points[-1]:
            points.append(points[0])
        
        wire = Part.makePolygon(points)
        face = Part.Face(wire)
        self.current_shape = face
        print(f"  Created polygon: {len(points_data)} points", file=sys.stderr)
    
    def _extrude(self, op: Dict):
        """Extrude current sketch"""
        if not self.current_shape:
            raise ValueError("No sketch to extrude")
        
        height = op.get('height', 10)
        direction = op.get('direction', [0, 0, 1])
        
        vec = FreeCAD.Vector(direction[0] * height, direction[1] * height, direction[2] * height)
        extruded = self.current_shape.extrude(vec)
        self.current_shape = extruded
        print(f"  Extruded: height={height}mm", file=sys.stderr)
    
    def _revolve(self, op: Dict):
        """Revolve current sketch around axis"""
        if not self.current_shape:
            raise ValueError("No sketch to revolve")
        
        angle = op.get('angle', 360)
        axis = op.get('axis', [0, 0, 1])
        
        axis_vec = FreeCAD.Vector(axis[0], axis[1], axis[2])
        revolved = self.current_shape.revolve(FreeCAD.Vector(0, 0, 0), axis_vec, angle)
        self.current_shape = revolved
        print(f"  Revolved: angle={angle}°", file=sys.stderr)
    
    def _cut(self, op: Dict):
        """Boolean cut operation"""
        # Create tool shape based on operation parameters
        tool_type = op.get('tool_type', 'box')
        
        if tool_type == 'box':
            length = op.get('length', 10)
            width = op.get('width', 10)
            height = op.get('height', 10)
            position = op.get('position', [0, 0, 0])
            tool = Part.makeBox(length, width, height)
            tool.translate(FreeCAD.Vector(position[0], position[1], position[2]))
        elif tool_type == 'cylinder':
            radius = op.get('radius', 5)
            height = op.get('height', 10)
            position = op.get('position', [0, 0, 0])
            tool = Part.makeCylinder(radius, height)
            tool.translate(FreeCAD.Vector(position[0], position[1], position[2]))
        else:
            raise ValueError(f"Unknown tool type: {tool_type}")
        
        self.current_shape = self.current_shape.cut(tool)
        print(f"  Cut: {tool_type}", file=sys.stderr)
    
    def _fuse(self, op: Dict):
        """Boolean fuse operation"""
        # Similar to cut but for addition
        tool_type = op.get('tool_type', 'box')
        
        if tool_type == 'box':
            length = op.get('length', 10)
            width = op.get('width', 10)
            height = op.get('height', 10)
            position = op.get('position', [0, 0, 0])
            tool = Part.makeBox(length, width, height)
            tool.translate(FreeCAD.Vector(position[0], position[1], position[2]))
        
        self.current_shape = self.current_shape.fuse(tool)
        print(f"  Fused: {tool_type}", file=sys.stderr)
    
    def _fillet(self, op: Dict):
        """Fillet edges"""
        if not self.current_shape:
            raise ValueError("No shape to fillet")
        
        radius = op.get('radius', 1)
        edge_indices = op.get('edges', None)
        
        if edge_indices is None:
            # Fillet all edges
            edges = self.current_shape.Edges
        else:
            # Fillet specific edges
            edges = [self.current_shape.Edges[i] for i in edge_indices]
        
        self.current_shape = self.current_shape.makeFillet(radius, edges)
        print(f"  Filleted: radius={radius}mm, edges={len(edges)}", file=sys.stderr)
    
    def _chamfer(self, op: Dict):
        """Chamfer edges"""
        if not self.current_shape:
            raise ValueError("No shape to chamfer")
        
        distance = op.get('distance', 1)
        edge_indices = op.get('edges', None)
        
        if edge_indices is None:
            edges = self.current_shape.Edges
        else:
            edges = [self.current_shape.Edges[i] for i in edge_indices]
        
        self.current_shape = self.current_shape.makeChamfer(distance, edges)
        print(f"  Chamfered: distance={distance}mm, edges={len(edges)}", file=sys.stderr)
    
    def _add_legs(self, op: Dict):
        """Add legs to furniture"""
        count = op.get('count', 4)
        height = op.get('height', 700)
        radius = op.get('radius', 25)
        inset = op.get('inset', 50)
        
        # Get bounding box of current shape
        bbox = self.current_shape.BoundBox
        
        # Calculate leg positions (corners with inset)
        positions = []
        if count == 4:
            positions = [
                (bbox.XMin + inset, bbox.YMin + inset),
                (bbox.XMax - inset, bbox.YMin + inset),
                (bbox.XMax - inset, bbox.YMax - inset),
                (bbox.XMin + inset, bbox.YMax - inset)
            ]
        
        # Create legs
        for x, y in positions:
            leg = Part.makeCylinder(radius, height)
            leg.translate(FreeCAD.Vector(x, y, bbox.ZMin - height))
            self.current_shape = self.current_shape.fuse(leg)
        
        print(f"  Added {count} legs: height={height}mm, radius={radius}mm", file=sys.stderr)
    
    def _add_holes(self, op: Dict):
        """Add mounting holes"""
        positions = op.get('positions', [])
        diameter = op.get('diameter', 3)
        depth = op.get('depth', 10)
        
        for pos in positions:
            x, y, z = pos
            hole = Part.makeCylinder(diameter / 2, depth)
            hole.translate(FreeCAD.Vector(x, y, z))
            self.current_shape = self.current_shape.cut(hole)
        
        print(f"  Added {len(positions)} holes: ⌀{diameter}mm", file=sys.stderr)
    
    def _add_supports(self, op: Dict):
        """Add structural supports"""
        count = op.get('count', 2)
        thickness = op.get('thickness', 5)
        height = op.get('height', 50)
        
        bbox = self.current_shape.BoundBox
        spacing = (bbox.YMax - bbox.YMin) / (count + 1)
        
        for i in range(count):
            y = bbox.YMin + spacing * (i + 1)
            support = Part.makeBox(bbox.XMax - bbox.XMin, thickness, height)
            support.translate(FreeCAD.Vector(bbox.XMin, y - thickness/2, bbox.ZMin))
            self.current_shape = self.current_shape.fuse(support)
        
        print(f"  Added {count} supports: thickness={thickness}mm", file=sys.stderr)
    
    def _linear_pattern(self, op: Dict):
        """Create linear pattern of features"""
        direction = op.get('direction', [1, 0, 0])
        spacing = op.get('spacing', 10)
        count = op.get('count', 3)
        
        original = self.current_shape
        vec = FreeCAD.Vector(direction[0] * spacing, direction[1] * spacing, direction[2] * spacing)
        
        for i in range(1, count):
            copy = original.copy()
            copy.translate(vec.multiply(i))
            self.current_shape = self.current_shape.fuse(copy)
        
        print(f"  Linear pattern: {count} instances, spacing={spacing}mm", file=sys.stderr)
    
    def _circular_pattern(self, op: Dict):
        """Create circular pattern of features"""
        axis = op.get('axis', [0, 0, 1])
        count = op.get('count', 6)
        radius = op.get('radius', 50)
        
        original = self.current_shape
        angle_step = 360 / count
        
        for i in range(1, count):
            copy = original.copy()
            copy.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(axis[0], axis[1], axis[2]), angle_step * i)
            self.current_shape = self.current_shape.fuse(copy)
        
        print(f"  Circular pattern: {count} instances, radius={radius}mm", file=sys.stderr)
    
    def _shell(self, op: Dict):
        """Hollow out the shape"""
        thickness = op.get('thickness', 2)
        
        # Remove top face to create hollow shell
        faces_to_remove = op.get('faces_to_remove', [0])  # Usually top face
        faces = [self.current_shape.Faces[i] for i in faces_to_remove]
        
        self.current_shape = self.current_shape.makeThickness(faces, -thickness, 0.01)
        print(f"  Shell: thickness={thickness}mm", file=sys.stderr)


import sys
import json

def execute_design_language(design_data, build_id, output_dir):
    """Execute CAD design language and export files"""
    from pathlib import Path
    
    print(f"=== Executing CAD Design Language ===", file=sys.stderr)
    print(f"Product: {design_data.get('product', 'Unknown')}", file=sys.stderr)
    print(f"Operations: {len(design_data.get('operations', []))}", file=sys.stderr)
    
    # Execute operations
    executor = CADOperationExecutor(f"Build_{build_id}")
    shape = executor.execute_operations(design_data)
    
    if not shape:
        raise ValueError("No shape created - operations may have failed")
    
    # Add to document
    obj = executor.doc.addObject("Part::Feature", "Design")
    obj.Shape = shape
    
    # Export files
    step_file = output_dir / f"{build_id}.step"
    stl_file = output_dir / f"{build_id}.stl"
    
    Part.export([obj], str(step_file))
    print(f"  Exported STEP: {step_file.name}", file=sys.stderr)
    
    import Mesh
    mesh = Mesh.Mesh()
    mesh.addFacets(shape.tessellate(0.1))
    mesh.write(str(stl_file))
    print(f"  Exported STL: {stl_file.name}", file=sys.stderr)
    print(f"  Triangles: {len(mesh.Facets)}", file=sys.stderr)
    
    FreeCAD.closeDocument(executor.doc.Name)
    
    return [str(step_file.name), str(stl_file.name)]
