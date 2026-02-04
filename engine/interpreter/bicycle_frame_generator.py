#!/usr/bin/env python3
"""
Bicycle Frame Generator for Interpreter
Wrapper to make bicycle generator compatible with interpreter
"""

import sys
from pathlib import Path

# Add geometry directory to path
script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(script_dir.parent / 'geometry'))

from bicycle_frame_generator import generate_bicycle_frame

# Re-export for interpreter
__all__ = ['generate_bicycle_frame']
