#!/usr/bin/env node
/**
 * Setup Validation Script
 * Verifies the Product Builder environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Product Builder - Setup Validation\n');

let hasErrors = false;

// Check 1: Node.js version
console.log('✓ Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 16) {
  console.log(`  ❌ Node.js ${nodeVersion} detected. Need v16 or higher.`);
  hasErrors = true;
} else {
  console.log(`  ✓ Node.js ${nodeVersion}`);
}

// Check 2: Python availability
console.log('\n✓ Checking Python...');
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
  console.log(`  ✓ ${pythonVersion}`);
} catch (error) {
  console.log('  ⚠️  Python not found in PATH. Required for CAD/PCB generation.');
}

// Check 3: Environment variables
console.log('\n✓ Checking environment variables...');
require('dotenv').config();
if (process.env.ANTHROPIC_API_KEY) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key.startsWith('sk-ant-')) {
    console.log('  ✓ ANTHROPIC_API_KEY configured');
  } else {
    console.log('  ❌ ANTHROPIC_API_KEY format invalid (should start with sk-ant-)');
    hasErrors = true;
  }
} else {
  console.log('  ❌ ANTHROPIC_API_KEY not set in .env file');
  hasErrors = true;
}

// Check 4: Required directories
console.log('\n✓ Checking directory structure...');
const requiredDirs = [
  'server',
  'server/routes',
  'server/services',
  'engine',
  'engine/cad',
  'engine/pcb',
  'engine/parser',
  'exports',
  'exports/cad',
  'exports/pcb',
  'client',
  'client/src',
  'client/src/components'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(`  ✓ ${dir}/`);
  } else {
    console.log(`  ❌ Missing directory: ${dir}/`);
    hasErrors = true;
  }
});

// Check 5: Required files
console.log('\n✓ Checking critical files...');
const requiredFiles = [
  'server/index.js',
  'server/routes/build.js',
  'server/services/orchestrator.js',
  'server/services/aiPlanner.js',
  'server/services/validator.js',
  'engine/cad/freecad_generator.py',
  'engine/pcb/kicad_generator.py',
  'engine/parser/schema.py',
  'client/src/App.jsx',
  'client/package.json',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ❌ Missing file: ${file}`);
    hasErrors = true;
  }
});

// Check 6: Dependencies
console.log('\n✓ Checking server dependencies...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('  ✓ node_modules/ exists');
} else {
  console.log('  ⚠️  Run "npm install" to install dependencies');
}

console.log('\n✓ Checking client dependencies...');
if (fs.existsSync(path.join(__dirname, 'client', 'node_modules'))) {
  console.log('  ✓ client/node_modules/ exists');
} else {
  console.log('  ⚠️  Run "cd client && npm install" to install client dependencies');
}

// Check 7: Optional dependencies
console.log('\n✓ Checking optional dependencies...');
try {
  execSync('python -c "import FreeCAD"', { encoding: 'utf-8', stdio: 'ignore' });
  console.log('  ✓ FreeCAD Python module available');
} catch {
  console.log('  ⚠️  FreeCAD not available (will use mock mode)');
}

try {
  execSync('python -c "import pcbnew"', { encoding: 'utf-8', stdio: 'ignore' });
  console.log('  ✓ KiCad Python module available');
} catch {
  console.log('  ⚠️  KiCad not available (will use mock mode)');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup validation failed. Fix errors above.\n');
  process.exit(1);
} else {
  console.log('✅ Setup validation passed!');
  console.log('\n🚀 Ready to run:');
  console.log('   npm run dev:full    (run both servers)');
  console.log('   npm start           (backend only)');
  console.log('   npm run client      (frontend only)\n');
  process.exit(0);
}
