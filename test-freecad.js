/**
 * FreeCAD Python API Test Script
 * Tests the FreeCAD integration and verifies it's working correctly
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detect FreeCAD Python
function getFreeCADPython() {
  if (process.platform !== 'win32') {
    return 'python3';
  }

  const possiblePaths = [
    'C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe',
    'C:\\Program Files\\FreeCAD 0.22\\bin\\python.exe',
    'C:\\Program Files\\FreeCAD 1.0\\bin\\python.exe',
    'C:\\Program Files (x86)\\FreeCAD 0.21\\bin\\python.exe',
  ];

  for (const pythonPath of possiblePaths) {
    if (fs.existsSync(pythonPath)) {
      console.log(`✅ Found FreeCAD Python: ${pythonPath}`);
      return pythonPath;
    }
  }

  console.log('⚠️  FreeCAD Python not found, using system Python');
  return 'python';
}

// Test FreeCAD installation
function testFreeCADInstallation() {
  return new Promise((resolve, reject) => {
    const pythonCmd = getFreeCADPython();
    const testScript = 'import FreeCAD; import Part; import Mesh; print("FreeCAD version:", FreeCAD.Version()[0:3])';
    
    console.log('\n🧪 Testing FreeCAD installation...');
    const proc = spawn(pythonCmd, ['-c', testScript]);
    
    let output = '';
    let error = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FreeCAD Python API is working!');
        console.log(`   ${output.trim()}`);
        resolve(true);
      } else {
        console.log('❌ FreeCAD Python API not available');
        console.log(`   Error: ${error}`);
        console.log('\n📥 Install FreeCAD from: https://www.freecad.org/downloads.php');
        resolve(false);
      }
    });
  });
}

// Test CAD generation
function testCADGeneration() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'engine', 'cad', 'freecad_generator.py');
    const pythonCmd = getFreeCADPython();
    
    console.log('\n🧪 Testing CAD generation with simple box...');
    
    const testDesign = {
      product_type: 'test box',
      shape_type: 'box',
      length: 50,
      width: 40,
      height: 30,
      wall_thickness: 2,
      units: 'mm',
      material: 'PLA',
      features: [],
      pcb_required: false
    };
    
    const proc = spawn(pythonCmd, [scriptPath, 'test-build']);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdin.write(JSON.stringify(testDesign));
    proc.stdin.end();
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`   ${data.toString().trim()}`);
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          console.log('✅ CAD generation successful!');
          console.log(`   Files: ${result.files.join(', ')}`);
          resolve(true);
        } catch (e) {
          console.log('❌ CAD generation produced invalid output');
          console.log(`   Output: ${stdout}`);
          resolve(false);
        }
      } else {
        console.log('❌ CAD generation failed');
        console.log(`   Exit code: ${code}`);
        resolve(false);
      }
    });
  });
}

// Test advanced shapes
function testAdvancedShapes() {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'engine', 'cad', 'freecad_generator.py');
    const pythonCmd = getFreeCADPython();
    
    console.log('\n🧪 Testing advanced shape (loft)...');
    
    const testDesign = {
      product_type: 'vase',
      shape_type: 'loft',
      sections: [
        { shape: 'circle', size: 30, z: 0 },
        { shape: 'square', size: 40, z: 50 },
        { shape: 'circle', size: 25, z: 100 }
      ],
      wall_thickness: 2,
      units: 'mm',
      material: 'PLA',
      pcb_required: false
    };
    
    const proc = spawn(pythonCmd, [scriptPath, 'test-loft']);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdin.write(JSON.stringify(testDesign));
    proc.stdin.end();
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Advanced shapes working!');
        resolve(true);
      } else {
        console.log('⚠️  Advanced shapes need FreeCAD installed');
        resolve(false);
      }
    });
  });
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   FreeCAD Python API Integration Test');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const freeCADInstalled = await testFreeCADInstallation();
  
  if (!freeCADInstalled) {
    console.log('\n⚠️  FreeCAD not installed - CAD features will be limited');
    console.log('   The builder will still work but generate placeholder files');
    return;
  }
  
  const cadWorking = await testCADGeneration();
  const advancedWorking = await testAdvancedShapes();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   FreeCAD Installation: ${freeCADInstalled ? '✅' : '❌'}`);
  console.log(`   Basic CAD Generation: ${cadWorking ? '✅' : '❌'}`);
  console.log(`   Advanced Shapes:      ${advancedWorking ? '✅' : '⚠️ '}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (freeCADInstalled && cadWorking) {
    console.log('🎉 FreeCAD Python API is fully functional!');
    console.log('\n📚 Supported Shape Types:');
    console.log('   Basic: box, cylinder, sphere, cone, torus, pyramid');
    console.log('   Advanced: loft, sweep, revolve, organic, lattice');
    console.log('   Mechanical: gear, screw, nut, bearing, pulley');
    console.log('   Everyday: phone_stand, bottle, cup, vase, bowl\n');
  }
}

runTests().catch(console.error);
