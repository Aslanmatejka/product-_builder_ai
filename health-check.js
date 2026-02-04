#!/usr/bin/env node

/**
 * Health Check Script
 * Verifies all dependencies and configurations are correct
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Product Builder - Health Check\n');

let hasErrors = false;

// Check Node.js version
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher required. Current:', nodeVersion);
  hasErrors = true;
} else {
  console.log('✅ Node.js version:', nodeVersion);
}

// Check .env file
console.log('\n🔐 Checking environment variables...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Copy .env.example to .env and configure.');
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('ANTHROPIC_API_KEY') || envContent.includes('your_api_key_here')) {
    console.error('❌ ANTHROPIC_API_KEY not configured in .env');
    hasErrors = true;
  } else {
    console.log('✅ Environment file configured');
  }
}

// Check required directories
console.log('\n📁 Checking directory structure...');
const requiredDirs = [
  'server',
  'client',
  'engine/cad',
  'exports/cad',
  'docs'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Missing directory: ${dir}`);
    hasErrors = true;
  }
});
console.log('✅ Directory structure OK');

// Check npm dependencies
console.log('\n📚 Checking dependencies...');
try {
  const packageJson = require('./package.json');
  const deps = [...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})];
  
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ node_modules not found. Run: npm install');
    hasErrors = true;
  } else {
    console.log('✅ Server dependencies installed');
  }
  
  const clientNodeModules = path.join(__dirname, 'client', 'node_modules');
  if (!fs.existsSync(clientNodeModules)) {
    console.error('❌ Client dependencies not found. Run: cd client && npm install');
    hasErrors = true;
  } else {
    console.log('✅ Client dependencies installed');
  }
} catch (error) {
  console.error('❌ Error checking dependencies:', error.message);
  hasErrors = true;
}

// Check FreeCAD
console.log('\n🔧 Checking FreeCAD...');
const freecadPaths = [
  'C:\\Program Files\\FreeCAD 1.0\\bin\\python.exe',
  'C:\\Program Files\\FreeCAD 0.22\\bin\\python.exe',
  'C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe'
];

let freecadFound = false;
for (const fcPath of freecadPaths) {
  if (fs.existsSync(fcPath)) {
    console.log('✅ FreeCAD found:', fcPath);
    freecadFound = true;
    break;
  }
}

if (!freecadFound) {
  console.warn('⚠️  FreeCAD not found in standard locations.');
  console.warn('   Download from: https://www.freecad.org/downloads.php');
  console.warn('   CAD generation will fail without FreeCAD.');
}

// PCB/KiCad features removed - CAD-only MVP
console.log('\n✨ MVP Mode: CAD Generation Only');
console.log('   PCB/Electronics features removed for MVP focus');

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ HEALTH CHECK FAILED');
  console.log('\nPlease fix the errors above before running the app.');
  process.exit(1);
} else if (!freecadFound) {
  console.log('⚠️  HEALTH CHECK PASSED WITH WARNINGS');
  console.log('\nApp will run but CAD generation requires FreeCAD.');
  process.exit(0);
} else {
  console.log('✅ HEALTH CHECK PASSED');
  console.log('\nAll systems ready! Run: npm run dev:full');
  process.exit(0);
}
