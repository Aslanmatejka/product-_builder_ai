# Installing FreeCAD and KiCad for Real Geometry Generation

This guide will help you install FreeCAD and KiCad to enable **real parametric geometry generation** instead of mock mode.

## Why Install These Tools?

Without FreeCAD and KiCad, the system runs in **mock mode**:

- Generates simple box geometry (12 triangles)
- Creates placeholder files
- Good for testing, but not production-ready

With FreeCAD and KiCad installed, you get:

- **Parametric CAD models** with fillets, mounting holes, ventilation, hollow walls
- **Real PCB layouts** with copper layers, silkscreen, solder mask, drill files
- **Manufacturing-ready exports** (STEP, STL, Gerbers)

---

## Installing FreeCAD

### Windows

1. **Download FreeCAD 0.21 or later:**

   ```
   https://www.freecad.org/downloads.php
   ```

   - Choose: `FreeCAD-0.21.x-Windows-x86_64-installer.exe`

2. **Install FreeCAD:**
   - Run the installer
   - **IMPORTANT:** Check "Add Python to PATH" during installation
   - Default install location: `C:\Program Files\FreeCAD 0.21\`

3. **Add FreeCAD Python modules to your PATH:**

   Open PowerShell as Administrator and run:

   ```powershell
   # Add FreeCAD to Python path
   $freecadPath = "C:\Program Files\FreeCAD 0.21\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$freecadPath", "Machine")

   # Restart your terminal after this
   ```

4. **Verify Installation:**

   ```powershell
   python -c "import FreeCAD; print(FreeCAD.Version())"
   ```

   If you see version info, FreeCAD Python is ready! If not, try:

   ```powershell
   # Use FreeCAD's bundled Python
   cd "C:\Program Files\FreeCAD 0.21\bin"
   .\python.exe -c "import FreeCAD; print(FreeCAD.Version())"
   ```

### macOS

1. **Install via Homebrew:**

   ```bash
   brew install --cask freecad
   ```

2. **Or download manually:**

   ```
   https://www.freecad.org/downloads.php
   ```

   - Choose: `FreeCAD-0.21.x-macOS-arm64.dmg` (Apple Silicon)
   - Or: `FreeCAD-0.21.x-macOS-x86_64.dmg` (Intel)

3. **Add to Python path:**

   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export PYTHONPATH="/Applications/FreeCAD.app/Contents/Resources/lib:$PYTHONPATH"
   ```

4. **Verify:**
   ```bash
   python3 -c "import FreeCAD; print(FreeCAD.Version())"
   ```

### Linux (Ubuntu/Debian)

1. **Install from repository:**

   ```bash
   sudo add-apt-repository ppa:freecad-maintainers/freecad-stable
   sudo apt update
   sudo apt install freecad freecad-python3
   ```

2. **Verify:**
   ```bash
   python3 -c "import FreeCAD; print(FreeCAD.Version())"
   ```

---

## Installing KiCad

### Windows

1. **Download KiCad 7 or later:**

   ```
   https://www.kicad.org/download/windows/
   ```

   - Choose: `kicad-7.x.x-x86_64.exe`

2. **Install KiCad:**
   - Run the installer
   - **IMPORTANT:** Install Python scripting support (checked by default)
   - Default location: `C:\Program Files\KiCad\`

3. **Add KiCad Python to PATH:**

   Open PowerShell as Administrator:

   ```powershell
   # Add KiCad Python modules
   $kicadPath = "C:\Program Files\KiCad\7.0\bin"
   $kicadPython = "C:\Program Files\KiCad\7.0\lib\python3\site-packages"

   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$kicadPath", "Machine")
   [Environment]::SetEnvironmentVariable("PYTHONPATH", $kicadPython, "Machine")

   # Restart terminal
   ```

4. **Verify:**
   ```powershell
   python -c "import pcbnew; print(pcbnew.Version())"
   ```

### macOS

1. **Download KiCad:**

   ```
   https://www.kicad.org/download/macos/
   ```

   - Choose the appropriate version for your Mac

2. **Install the DMG**

3. **Add to Python path:**

   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export PYTHONPATH="/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/Current/lib/python3.x/site-packages:$PYTHONPATH"
   ```

4. **Verify:**
   ```bash
   python3 -c "import pcbnew; print(pcbnew.Version())"
   ```

### Linux (Ubuntu/Debian)

1. **Add KiCad PPA:**

   ```bash
   sudo add-apt-repository ppa:kicad/kicad-7.0-releases
   sudo apt update
   sudo apt install kicad kicad-libraries
   ```

2. **Install Python bindings:**

   ```bash
   sudo apt install python3-pcbnew
   ```

3. **Verify:**
   ```bash
   python3 -c "import pcbnew; print(pcbnew.Version())"
   ```

---

## Verifying the Full Stack

Once both tools are installed, test the Product Builder:

```powershell
cd product-builder
npm run dev:full
```

Then submit a build request:

```
Prompt: "Raspberry Pi enclosure, 100x70x30mm with ventilation holes and 4 mounting holes"
```

Check the logs - you should see:

```
Generating enclosure...
Dimensions: 100x70x30 mm
Wall thickness: 2 mm
Created hollow enclosure
Applied 1.6mm fillets to 4 edges
Added 4 mounting holes (⌀3mm)
Added 8 ventilation holes (⌀4mm)
Exported STEP: xxxxx.step
Exported STL: xxxxx.stl
```

If you see "Mock CAD generation" - FreeCAD is not available to Python.

---

## Troubleshooting

### FreeCAD "Module not found"

**Windows:**

```powershell
# Check if FreeCAD Python works
cd "C:\Program Files\FreeCAD 0.21\bin"
.\python.exe -c "import FreeCAD; print('OK')"

# If that works, you need to use FreeCAD's Python instead of system Python
# Update the orchestrator to use FreeCAD's Python executable
```

**Solution:** Modify `server/services/orchestrator.js` to use FreeCAD's Python:

```javascript
const pythonCmd =
  process.platform === "win32"
    ? "C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe"
    : "python3";
```

### KiCad "pcbnew not found"

**Check installation:**

```powershell
# Find where pcbnew.py is located
Get-ChildItem "C:\Program Files\KiCad" -Recurse -Filter "pcbnew.py"
```

**Add to PYTHONPATH:**

```powershell
# Set environment variable
$pcbnewPath = "C:\Program Files\KiCad\7.0\lib\python3\site-packages"
[Environment]::SetEnvironmentVariable("PYTHONPATH", $pcbnewPath, "User")
```

### Permission Errors

Run PowerShell as Administrator when setting environment variables.

### Still Using Mock Mode?

1. Restart VS Code / Terminal (environment variables need refresh)
2. Check Python can import the modules:
   ```powershell
   python -c "import FreeCAD, pcbnew; print('Both modules work!')"
   ```
3. Check server logs for specific error messages

---

## Alternative: Use Docker (Advanced)

If you have trouble with local installation, use Docker:

```dockerfile
# Dockerfile.cad-engines
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    freecad \
    freecad-python3 \
    kicad \
    python3-pcbnew \
    python3-pip

WORKDIR /app
COPY engine/ ./engine/
CMD ["python3", "engine/cad/freecad_generator.py"]
```

Build and run:

```bash
docker build -t cad-engines -f Dockerfile.cad-engines .
docker run -v ./exports:/app/exports cad-engines
```

---

## Next Steps

Once installed:

1. ✅ Real FreeCAD geometry with parametric features
2. ✅ Real KiCad PCB layouts with copper layers
3. ✅ Manufacturing-ready exports (STEP, Gerbers)
4. 🚀 Ready for production!

The mock mode will automatically disable when the tools are detected.
