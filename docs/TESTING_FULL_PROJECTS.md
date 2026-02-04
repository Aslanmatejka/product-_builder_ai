# Testing Full Electronics Projects

This document shows how to test that the app generates BOTH CAD and PCB files for electronics projects.

## Test Cases

### 1. Arduino Project (Should generate CAD + PCB)

**Prompt:** "Create enclosure for Arduino Uno with sensor"

**Expected Output:**

- ✅ CAD files: `.stl` and `.step` (enclosure)
- ✅ PCB file: `.kicad_pcb` (circuit board)
- ✅ UI shows "PCB Layout: 2-layer board • X component types"

### 2. ESP32 Temperature Sensor (Should generate CAD + PCB)

**Prompt:** "ESP32 temperature sensor housing with WiFi"

**Expected Output:**

- ✅ CAD files for enclosure
- ✅ PCB with components: microcontroller, temperature_sensor, resistor, capacitor, voltage_regulator, connector
- ✅ Sensor cutout in enclosure front
- ✅ USB cutout on side

### 3. LED Controller (Should generate CAD + PCB)

**Prompt:** "Box with 4 LEDs on the front panel"

**Expected Output:**

- ✅ CAD enclosure with 4 LED cutouts
- ✅ PCB with LED and resistor components
- ✅ Both files downloadable

### 4. Simple Box (Should generate CAD only, NO PCB)

**Prompt:** "Small storage box 50x50x30mm"

**Expected Output:**

- ✅ CAD files only
- ❌ NO PCB file
- ❌ pcb_required: false in design

## How to Test

1. Start the app: `.\start-dev.ps1`
2. Enter one of the test prompts above
3. Check the build output:
   - Look for "Step 5: PCB Generation" in server logs
   - Verify UI shows PCB info in Design Summary
   - Download and check all files are present

## Debugging PCB Generation

If PCB is NOT being generated for electronics projects:

1. **Check server logs** - Look for:

   ```
   ⚡ Step 5: PCB Generation
   → Running KiCad generator...
   ```

2. **Check design JSON** - In browser console or server logs:

   ```json
   {
     "pcb_required": true,
     "pcb_details": {
       "width": 80,
       "height": 60,
       "layers": 2,
       "components": ["microcontroller", "resistor", ...]
     }
   }
   ```

3. **Check AI response** - The AI should recognize electronics keywords:
   - Arduino, ESP32, Raspberry Pi
   - Sensor, LED, microcontroller
   - Circuit, PCB, electronics

4. **Check file paths** - PCB should be at:
   - Server: `exports/pcb/<buildId>.kicad_pcb`
   - Download URL: `/exports/pcb/<buildId>.kicad_pcb`

## Common Issues

### PCB Not Generated

**Problem:** User asks for Arduino enclosure, only gets CAD files

**Solution:** Enhanced AI prompt to always trigger `pcb_required: true` for electronics keywords

**Check:** Search server logs for "pcb_required" - should be `true` for electronics

### PCB File Not Downloadable

**Problem:** PCB generated but download link broken

**Solution:** Fixed path in `server/routes/build.js` - was `/exports/cad/` now `/exports/pcb/`

**Check:** File should exist at `product-builder/exports/pcb/<buildId>.kicad_pcb`

### KiCad Not Available Warning

**Problem:** "KiCad Python API not available - PCB generation skipped"

**Solution:** Install KiCad 8.0 or newer with Python support

**Check:** Run `python -c "import pcbnew; print('OK')"` should print "OK"
