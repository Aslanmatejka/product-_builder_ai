# Assembly File Loading Fix

## Issue

Assembly builds were generating part-specific files (e.g., `6e578f17-82d7-4ce5-81ec-c3e041cd8ae2_part1_Base.stl`) but the frontend was requesting a single base filename (`6e578f17-82d7-4ce5-81ec-c3e041cd8ae2.stl`), causing 404 errors and WebGL context loss.

## Root Cause

The backend route (`server/routes/build.js`) was hardcoding filenames as `/exports/cad/${buildId}.stl` instead of checking if the build was an assembly and returning the actual part files.

## Fix Applied

Updated `server/routes/build.js` to:

1. **Detect assembly builds** by checking `result.files.cad.isAssembly`
2. **Return part file arrays** for assemblies instead of single file paths
3. **Include assembly metadata** (`assemblyInfo`) with hardware, steps, tools, and timing
4. **Maintain backward compatibility** with single-part builds

## Changes Made

### server/routes/build.js

- Added `path` module import
- Added assembly detection logic
- Response now includes:
  - `isAssembly`: Boolean flag
  - `files`: Array of parts (for assembly) or object with stl/step paths (for single-part)
  - `assemblyInfo`: Assembly metadata (parts count, hardware, steps, etc.)

### Frontend Compatibility

The frontend (`client/src/App.jsx`) already had assembly handling logic:

- Checks `buildResult.isAssembly`
- Extracts STL URLs from `buildResult.files` array
- Passes multiple files to `CanvasView` for multi-part 3D rendering

## File Structure

**Assembly Build:**

```javascript
{
  isAssembly: true,
  files: [
    {
      partName: "Base",
      partNumber: 1,
      quantity: 1,
      files: ["buildId_part1_Base.step", "buildId_part1_Base.stl"],
      material: "PETG"
    },
    {
      partName: "Lid",
      partNumber: 2,
      quantity: 1,
      files: ["buildId_part2_Lid.step", "buildId_part2_Lid.stl"],
      material: "PETG"
    }
  ],
  assemblyInfo: {
    totalParts: 2,
    hardware: [],
    assemblySteps: ["Step 1: ...", "Step 2: ..."],
    toolsRequired: [],
    assemblyTime: 1,
    totalPrintTime: 8
  }
}
```

**Single-Part Build:**

```javascript
{
  isAssembly: false,
  files: {
    stl: "/exports/cad/buildId.stl",
    step: "/exports/cad/buildId.step",
    pcb: null
  },
  assemblyInfo: null
}
```

## Testing

1. **Assembly Build Test:** Create a multi-part design (e.g., "box for storing eggs")
   - Should generate multiple part files
   - 3D viewer should display all parts side-by-side
   - No 404 errors

2. **Single-Part Build Test:** Create simple enclosure (e.g., "box 50x50x20mm")
   - Should generate single STL/STEP files
   - 3D viewer should display single part
   - Download links work correctly

## Status

✅ **Fixed and Tested**

- Assembly file loading working correctly
- No more 404 errors for part files
- WebGL context stable
- Multi-part 3D preview functional

## Date

February 3, 2026
