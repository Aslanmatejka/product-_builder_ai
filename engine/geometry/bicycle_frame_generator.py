#!/usr/bin/env python3
"""
Parametric Bicycle Frame Generator
Generates bicycle frames based on rider height and frame geometry
"""

import sys
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Import FreeCAD modules
try:
    import FreeCAD
    import Part
    import Mesh
    FREECAD_AVAILABLE = True
except ImportError:
    FREECAD_AVAILABLE = False
    print("Warning: FreeCAD not available", file=sys.stderr)


class BicycleFrameGenerator:
    """
    Parametric bicycle frame generator
    Based on standard bicycle geometry and rider anthropometrics
    """
    
    # Standard bicycle geometry ratios (based on rider height)
    GEOMETRY_RATIOS = {
        'stack': 0.32,      # Stack height = rider_height * 0.32
        'reach': 0.24,      # Reach = rider_height * 0.24
        'seat_tube': 0.50,  # Seat tube length
        'top_tube': 0.30,   # Top tube length
        'head_tube': 0.065, # Head tube length
        'chainstay': 0.25,  # Chainstay length (fixed ratio)
        'bb_drop': 70,      # Bottom bracket drop (mm, fixed)
        'head_angle': 72,   # Head tube angle (degrees)
        'seat_angle': 73.5, # Seat tube angle (degrees)
    }
    
    # Tube diameters (mm) based on material
    TUBE_DIAMETERS = {
        'aluminum': {
            'down_tube': 38,
            'top_tube': 32,
            'seat_tube': 32,
            'head_tube': 44,
            'chainstay': 18,
            'seatstay': 16,
        },
        'steel': {
            'down_tube': 32,
            'top_tube': 28,
            'seat_tube': 28,
            'head_tube': 40,
            'chainstay': 16,
            'seatstay': 14,
        },
        'carbon': {
            'down_tube': 40,
            'top_tube': 34,
            'seat_tube': 34,
            'head_tube': 46,
            'chainstay': 20,
            'seatstay': 18,
        }
    }
    
    def __init__(self, rider_height: float, material: str = 'aluminum', units: str = 'mm'):
        """
        Initialize bicycle frame generator
        
        Args:
            rider_height: Rider height in mm or cm
            material: Frame material (aluminum, steel, carbon)
            units: Units for rider height (mm, cm, inches)
        """
        # Convert rider height to mm
        if units == 'cm':
            rider_height *= 10
        elif units == 'inches':
            rider_height *= 25.4
        
        self.rider_height = rider_height
        self.material = material.lower()
        
        # Calculate frame dimensions
        self.dimensions = self._calculate_frame_dimensions()
        self.tube_diameters = self.TUBE_DIAMETERS.get(self.material, self.TUBE_DIAMETERS['aluminum'])
        
        print(f"[BICYCLE] Rider height: {rider_height:.0f}mm", file=sys.stderr)
        print(f"[BICYCLE] Material: {self.material}", file=sys.stderr)
        print(f"[BICYCLE] Seat tube: {self.dimensions['seat_tube']:.0f}mm", file=sys.stderr)
        print(f"[BICYCLE] Top tube: {self.dimensions['top_tube']:.0f}mm", file=sys.stderr)
    
    def _calculate_frame_dimensions(self) -> Dict[str, float]:
        """Calculate all frame dimensions based on rider height"""
        h = self.rider_height
        
        dimensions = {
            'seat_tube': h * self.GEOMETRY_RATIOS['seat_tube'],
            'top_tube': h * self.GEOMETRY_RATIOS['top_tube'],
            'head_tube': h * self.GEOMETRY_RATIOS['head_tube'],
            'chainstay': h * self.GEOMETRY_RATIOS['chainstay'],
            'seatstay': h * self.GEOMETRY_RATIOS['chainstay'] * 0.9,  # Slightly shorter than chainstay
            'bb_drop': self.GEOMETRY_RATIOS['bb_drop'],
            'head_angle': self.GEOMETRY_RATIOS['head_angle'],
            'seat_angle': self.GEOMETRY_RATIOS['seat_angle'],
            'stack': h * self.GEOMETRY_RATIOS['stack'],
            'reach': h * self.GEOMETRY_RATIOS['reach'],
        }
        
        return dimensions
    
    def generate(self, doc_name: str = "BicycleFrame") -> Any:
        """
        Generate the bicycle frame geometry
        
        Args:
            doc_name: FreeCAD document name
            
        Returns:
            FreeCAD compound shape with all frame tubes
        """
        if not FREECAD_AVAILABLE:
            print("[BICYCLE] FreeCAD not available, cannot generate", file=sys.stderr)
            return None
        
        doc = FreeCAD.newDocument(doc_name)
        
        # Generate frame tubes
        tubes = []
        
        # 1. Seat tube (bottom bracket to seat)
        seat_tube = self._create_seat_tube()
        tubes.append(seat_tube)
        
        # 2. Top tube (seat to head tube)
        top_tube = self._create_top_tube()
        tubes.append(top_tube)
        
        # 3. Down tube (head tube to bottom bracket)
        down_tube = self._create_down_tube()
        tubes.append(down_tube)
        
        # 4. Head tube
        head_tube = self._create_head_tube()
        tubes.append(head_tube)
        
        # 5. Chainstays (bottom bracket to rear dropouts)
        chainstay_left, chainstay_right = self._create_chainstays()
        tubes.extend([chainstay_left, chainstay_right])
        
        # 6. Seatstays (seat tube to rear dropouts)
        seatstay_left, seatstay_right = self._create_seatstays()
        tubes.extend([seatstay_left, seatstay_right])
        
        # Create compound
        frame = Part.makeCompound(tubes)
        
        # Add to document
        obj = doc.addObject("Part::Feature", "BicycleFrame")
        obj.Shape = frame
        
        return frame
    
    def _create_seat_tube(self) -> Any:
        """Create seat tube from bottom bracket to seat"""
        diameter = self.tube_diameters['seat_tube']
        length = self.dimensions['seat_tube']
        angle = math.radians(self.dimensions['seat_angle'])
        
        # Create tube along Z-axis, then rotate
        tube = Part.makeCylinder(diameter / 2, length)
        
        # Rotate to seat angle (from vertical)
        tube.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(1, 0, 0), 90 - self.dimensions['seat_angle'])
        
        return tube
    
    def _create_top_tube(self) -> Any:
        """Create top tube from seat to head tube"""
        diameter = self.tube_diameters['top_tube']
        length = self.dimensions['top_tube']
        
        # Position at top of seat tube
        seat_angle = math.radians(self.dimensions['seat_angle'])
        seat_length = self.dimensions['seat_tube']
        
        start_x = seat_length * math.sin(seat_angle)
        start_z = seat_length * math.cos(seat_angle)
        
        # Create tube
        tube = Part.makeCylinder(diameter / 2, length)
        tube.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        tube.translate(FreeCAD.Vector(start_x, 0, start_z))
        
        return tube
    
    def _create_down_tube(self) -> Any:
        """Create down tube from head tube to bottom bracket"""
        diameter = self.tube_diameters['down_tube']
        
        # Calculate down tube length using Pythagorean theorem
        # From (0,0,0) to top of head tube
        head_angle = math.radians(self.dimensions['head_angle'])
        head_length = self.dimensions['head_tube']
        top_tube = self.dimensions['top_tube']
        
        # Head tube top position
        end_x = top_tube + head_length * math.sin(head_angle)
        end_z = head_length * math.cos(head_angle)
        
        length = math.sqrt(end_x**2 + end_z**2)
        angle = math.degrees(math.atan2(end_z, end_x))
        
        # Create tube
        tube = Part.makeCylinder(diameter / 2, length)
        tube.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        tube.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), angle)
        
        return tube
    
    def _create_head_tube(self) -> Any:
        """Create head tube"""
        diameter = self.tube_diameters['head_tube']
        length = self.dimensions['head_tube']
        
        # Position at end of top tube
        top_tube = self.dimensions['top_tube']
        seat_angle = math.radians(self.dimensions['seat_angle'])
        seat_length = self.dimensions['seat_tube']
        
        start_x = seat_length * math.sin(seat_angle) + top_tube
        start_z = seat_length * math.cos(seat_angle)
        
        # Create tube
        tube = Part.makeCylinder(diameter / 2, length)
        tube.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(1, 0, 0), 90 - self.dimensions['head_angle'])
        tube.translate(FreeCAD.Vector(start_x, 0, start_z))
        
        return tube
    
    def _create_chainstays(self) -> Tuple[Any, Any]:
        """Create chainstays (bottom bracket to rear dropouts)"""
        diameter = self.tube_diameters['chainstay']
        length = self.dimensions['chainstay']
        
        # Left and right chainstays
        left = Part.makeCylinder(diameter / 2, length)
        left.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        left.translate(FreeCAD.Vector(0, 40, 0))  # Offset to left
        
        right = Part.makeCylinder(diameter / 2, length)
        right.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        right.translate(FreeCAD.Vector(0, -40, 0))  # Offset to right
        
        # Rotate back slightly (chainstays angle up)
        for stay in [left, right]:
            stay.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), -5)
        
        return left, right
    
    def _create_seatstays(self) -> Tuple[Any, Any]:
        """Create seatstays (seat tube to rear dropouts)"""
        diameter = self.tube_diameters['seatstay']
        length = self.dimensions['seatstay']
        
        # Calculate seatstay position (from seat tube to rear dropout)
        seat_angle = math.radians(self.dimensions['seat_angle'])
        seat_height = self.dimensions['seat_tube'] * 0.7  # Attach 70% up seat tube
        
        start_x = seat_height * math.sin(seat_angle)
        start_z = seat_height * math.cos(seat_angle)
        
        # End at rear dropout (same as chainstay end)
        end_x = -self.dimensions['chainstay']
        end_z = -self.dimensions['chainstay'] * 0.1  # Slight drop
        
        # Calculate seatstay angle
        dx = end_x - start_x
        dz = end_z - start_z
        actual_length = math.sqrt(dx**2 + dz**2)
        angle = math.degrees(math.atan2(dz, dx))
        
        # Left seatstay
        left = Part.makeCylinder(diameter / 2, actual_length)
        left.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        left.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), angle)
        left.translate(FreeCAD.Vector(start_x, 40, start_z))
        
        # Right seatstay
        right = Part.makeCylinder(diameter / 2, actual_length)
        right.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 1, 0), 90)
        right.rotate(FreeCAD.Vector(0, 0, 0), FreeCAD.Vector(0, 0, 1), angle)
        right.translate(FreeCAD.Vector(start_x, -40, start_z))
        
        return left, right
    
    def export(self, frame: Any, build_id: str, output_dir: Path) -> List[str]:
        """
        Export bicycle frame to files
        
        Args:
            frame: FreeCAD frame shape
            build_id: Build identifier
            output_dir: Output directory
            
        Returns:
            List of exported file paths
        """
        if not FREECAD_AVAILABLE or frame is None:
            return []
        
        files = []
        
        # Export STEP
        step_file = output_dir / f"{build_id}.step"
        frame.exportStep(str(step_file))
        files.append(str(step_file))
        print(f"[BICYCLE] Exported STEP: {step_file.name}", file=sys.stderr)
        
        # Export STL
        stl_file = output_dir / f"{build_id}.stl"
        mesh = Mesh.Mesh()
        mesh.addFacets(frame.tessellate(0.1))
        mesh.write(str(stl_file))
        files.append(str(stl_file))
        print(f"[BICYCLE] Exported STL: {stl_file.name}", file=sys.stderr)
        
        # Export OBJ (for visualization)
        obj_file = output_dir / f"{build_id}.obj"
        self._export_obj(mesh, obj_file)
        files.append(str(obj_file))
        print(f"[BICYCLE] Exported OBJ: {obj_file.name}", file=sys.stderr)
        
        return files
    
    def _export_obj(self, mesh, output_path: Path):
        """Export mesh to OBJ format"""
        with open(output_path, 'w') as f:
            f.write("# Bicycle frame generated by Product Builder\n")
            f.write(f"# Rider height: {self.rider_height:.0f}mm\n")
            f.write(f"# Material: {self.material}\n\n")
            
            # Write vertices
            for vertex in mesh.Topology[0]:
                f.write(f"v {vertex[0]} {vertex[1]} {vertex[2]}\n")
            
            # Write faces
            for face in mesh.Topology[1]:
                f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")


def generate_bicycle_frame(design_data: Dict[str, Any], build_id: str, 
                          output_dir: Path) -> Dict[str, Any]:
    """
    Generate bicycle frame from design data
    
    Args:
        design_data: Design with rider_height, material, etc.
        build_id: Build identifier
        output_dir: Output directory
        
    Returns:
        Result dict with files and metadata
    """
    # Extract parameters
    rider_height = design_data.get('rider_height', 180)  # Default 180cm
    units = design_data.get('units', 'cm')
    material = design_data.get('material', 'aluminum')
    
    # Handle rider height from dimensions
    if 'height' in design_data and rider_height == 180:
        rider_height = design_data['height']
    
    print(f"[BICYCLE] Generating frame for {rider_height}{units} rider", file=sys.stderr)
    
    try:
        # Create generator
        generator = BicycleFrameGenerator(rider_height, material, units)
        
        # Generate frame
        frame = generator.generate(f"Frame_{build_id}")
        
        # Export files
        files = generator.export(frame, build_id, output_dir)
        
        return {
            'success': True,
            'files': files,
            'product_type': 'bicycle_frame',
            'rider_height': generator.rider_height,
            'material': material,
            'dimensions': generator.dimensions,
            'build_id': build_id
        }
    
    except Exception as e:
        print(f"[BICYCLE] Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }


if __name__ == "__main__":
    # Test bicycle frame generation
    if len(sys.argv) < 2:
        print("Usage: python bicycle_frame_generator.py <build_id>")
        print("  Reads design JSON from stdin")
        sys.exit(1)
    
    build_id = sys.argv[1]
    
    # Read design from stdin
    try:
        design_data = json.loads(sys.stdin.read())
    except json.JSONDecodeError as e:
        print(json.dumps({'success': False, 'error': f'Invalid JSON: {e}'}))
        sys.exit(1)
    
    # Set output directory
    output_dir = Path(__file__).parent.parent.parent / 'exports' / 'cad'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate frame
    result = generate_bicycle_frame(design_data, build_id, output_dir)
    print(json.dumps(result))
