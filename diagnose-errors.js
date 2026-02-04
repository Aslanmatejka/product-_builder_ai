#!/usr/bin/env node

/**
 * Error Diagnostic Script
 * Checks for common configuration and setup issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Product Builder - Error Diagnostics\n');
console.log('='.repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check .env file
console.log('\n1. Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('   → This will cause "AI planning failed" errors');
  console.error('   → Solution: Copy .env.example to .env and add your ANTHROPIC_API_KEY');
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('ANTHROPIC_API_KEY') || envContent.includes('your_api_key_here')) {
    console.error('❌ ANTHROPIC_API_KEY not configured in .env');
    console.error('   → This will cause authentication errors');
    hasErrors = true;
  } else {
    console.log('✅ .env file configured');
  }
}

// Check node_modules
console.log('\n2. Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found');
  console.error('   → Solution: Run "npm install"');
  hasErrors = true;
} else {
  console.log('✅ Server dependencies installed');
}

const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
if (!fs.existsSync(clientNodeModules)) {
  console.error('❌ Client node_modules not found');
  console.error('   → Solution: Run "cd client && npm install"');
  hasErrors = true;
} else {
  console.log('✅ Client dependencies installed');
}

// Check FreeCAD
console.log('\n3. Checking CAD tools...');
const freecadPaths = [
  'C:\\Program Files\\FreeCAD 1.0\\bin\\python.exe',
  'C:\\Program Files\\FreeCAD 0.22\\bin\\python.exe',
  'C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe',
];

let freecadFound = false;
for (const fcPath of freecadPaths) {
  if (fs.existsSync(fcPath)) {
    console.log(`✅ FreeCAD found: ${fcPath}`);
    freecadFound = true;
    break;
  }
}

if (!freecadFound) {
  console.warn('⚠️  FreeCAD not found in standard locations');
  console.warn('   → CAD generation will fail');
  console.warn('   → Solution: Install FreeCAD from https://www.freecad.org/downloads.php');
  hasWarnings = true;
}

// Check KiCad (optional)
console.log('\n4. Checking PCB tools (optional)...');
const kicadPaths = [
  'C:\\Program Files\\KiCad\\9.0\\bin\\python.exe',
  'C:\\Program Files\\KiCad\\8.0\\bin\\python.exe',
];

let kicadFound = false;
for (const kcPath of kicadPaths) {
  if (fs.existsSync(kcPath)) {
    console.log(`✅ KiCad found: ${kcPath}`);
    kicadFound = true;
    break;
  }
}

if (!kicadFound) {
  console.log('ℹ️  KiCad not found (optional for PCB generation)');
}

// Check critical files
console.log('\n5. Checking critical files...');
const criticalFiles = [
  'server/index.js',
  'server/routes/build.js',
  'server/services/orchestrator.js',
  'server/services/aiPlanner.js',
  'client/src/App.jsx',
  'engine/cad/freecad_generator.py',
];

let missingFiles = [];
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing critical files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  hasErrors = true;
} else {
  console.log('✅ All critical files present');
}

// Check exports directory
console.log('\n6. Checking export directories...');
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
  console.warn('⚠️  exports directory not found');
  console.warn('   → Solution: Run "mkdir exports\\cad exports\\pcb"');
  hasWarnings = true;
} else {
  console.log('✅ Exports directory exists');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('\n❌ ERRORS FOUND - Please fix these issues');
  console.log('\nQuick fixes:');
  if (!fs.existsSync(envPath)) {
    console.log('   1. Create .env file: copy .env.example to .env');
    console.log('   2. Add your ANTHROPIC_API_KEY to .env');
  }
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('   3. Install dependencies: npm install');
  }
  if (!fs.existsSync(clientNodeModules)) {
    console.log('   4. Install client dependencies: cd client && npm install');
  }
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS FOUND - App will work but some features may be limited');
  process.exit(0);
} else {
  console.log('\n✅ NO ERRORS FOUND - System ready!');
  process.exit(0);
}
