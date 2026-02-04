const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const aiPlanner = require('./aiPlanner');
const validator = require('./validator');

const AI_MODEL_NAME = process.env.AI_MODEL_NAME || 'GPT-5.1-Codex';

/**
 * Orchestrator - Coordinates AI planner, CAD generator, and PCB generator
 */

/**
 * Detect FreeCAD Python executable on Windows
 */
function getFreeCADPython() {
  if (process.platform !== 'win32') {
    return 'python3'; // On Linux/Mac, use system Python
  }

  // Common FreeCAD installation paths on Windows
  const possiblePaths = [
    'C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe',
    'C:\\Program Files\\FreeCAD 0.22\\bin\\python.exe',
    'C:\\Program Files\\FreeCAD 1.0\\bin\\python.exe',
    'C:\\Program Files (x86)\\FreeCAD 0.21\\bin\\python.exe',
    'C:\\Program Files (x86)\\FreeCAD 0.22\\bin\\python.exe',
  ];

  for (const pythonPath of possiblePaths) {
    if (fs.existsSync(pythonPath)) {
      console.log(`  ✓ Found FreeCAD Python: ${pythonPath}`);
      return pythonPath;
    }
  }

  // Fallback to system Python
  console.log('  ⚠️  FreeCAD Python not found in standard locations, using system Python');
  return 'python';
}

/**
 * Check if design is compatible with available engines
 * Returns array of compatibility warnings
 */
function checkEngineCompatibility(designData) {
  const issues = [];
  
  // Check FreeCAD compatibility
  const freecadPython = getFreeCADPython();
  if (freecadPython === 'python') {
    issues.push('FreeCAD not found - using fallback Python (may have limited CAD features)');
  }
  
  // Check KiCad compatibility
  if (designData.pcb_required) {
    const kicadPython = getKiCADPython();
    if (kicadPython === 'python') {
      issues.push('KiCad not found - PCB generation will be skipped');
    }
    
    // Check if PCB components are specified properly
    if (!designData.pcb_details || !designData.pcb_details.components || designData.pcb_details.components.length === 0) {
      issues.push('PCB required but no components specified - will generate basic board layout');
    }
  }
  
  // Check for overly complex features
  if (designData.cutouts && designData.cutouts.length > 20) {
    issues.push(`High cutout count (${designData.cutouts.length}) - CAD generation may be slow`);
  }
  
  // Check for extremely small or large dimensions
  const maxDim = Math.max(designData.length || 0, designData.width || 0, designData.height || 0);
  const minDim = Math.min(designData.length || 0, designData.width || 0, designData.height || 0);
  
  if (designData.units === 'mm') {
    if (maxDim > 400) {
      issues.push(`Large dimensions (max: ${maxDim}mm) - may exceed standard 3D printer build volume`);
    }
    if (minDim < 10 && minDim > 0) {
      issues.push(`Very small dimensions (min: ${minDim}mm) - may be difficult to manufacture`);
    }
  }
  
  return issues;
}

/**
 * Detect KiCad Python executable on Windows
 */
function getKiCADPython() {
  if (process.platform !== 'win32') {
    return 'python3'; // On Linux/Mac, use system Python
  }

  // Common KiCad installation paths on Windows
  const possiblePaths = [
    'C:\\Program Files\\KiCad\\9.0\\bin\\python.exe',
    'C:\\Program Files\\KiCad\\8.0\\bin\\python.exe',
    'C:\\Program Files\\KiCad\\7.0\\bin\\python.exe',
    'C:\\Program Files (x86)\\KiCad\\9.0\\bin\\python.exe',
    'C:\\Program Files (x86)\\KiCad\\8.0\\bin\\python.exe',
    'C:\\Program Files (x86)\\KiCad\\7.0\\bin\\python.exe',
  ];

  for (const pythonPath of possiblePaths) {
    if (fs.existsSync(pythonPath)) {
      console.log(`  ✓ Found KiCad Python: ${pythonPath}`);
      return pythonPath;
    }
  }

  // Fallback to system Python
  console.log('  ⚠️  KiCad Python not found in standard locations, using system Python');
  return 'python';
}

async function buildProduct(userPrompt, previousDesign = null) {
  const buildId = uuidv4();
  console.log(`\n🏗️  Starting build ${buildId}`);
  if (previousDesign) {
    console.log('🔄 Modifying existing design');
  }

  try {
    // Step 1: AI Planning (with optional previous design context)
    console.log('\n📋 Step 1: AI Planning');
    const designData = await aiPlanner.generateDesignFromPrompt(userPrompt, previousDesign);
    
    // generateDesignFromPrompt now returns the design directly, not wrapped in {design: ..., reasoning: ...}
    const reasoning = null; // Reasoning is handled internally by the AI now

    // Step 2: Validation
    console.log('\n✓ Step 2: Validating design data');
    validator.validateDesignData(designData);

    // Step 3: Pre-flight check - Verify engine compatibility
    console.log('\n🔍 Step 3: Pre-flight Engine Compatibility Check');
    const compatibilityIssues = checkEngineCompatibility(designData);
    if (compatibilityIssues.length > 0) {
      console.log('   ⚠️ Compatibility warnings:');
      compatibilityIssues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ Design compatible with all engines');
    }

    // Step 4: CAD Generation
    console.log('\n🔧 Step 4: CAD Generation');
    let cadResult;
    
    // Use Geometry Interpreter for advanced routing
    const useInterpreter = designData.use_design_language || 
                          designData.product_type?.toLowerCase().includes('bicycle') ||
                          designData.product_type?.toLowerCase().includes('bike');
    
    if (useInterpreter) {
      console.log('   🚀 Using Geometry Pipeline Interpreter');
      cadResult = await runGeometryInterpreter(buildId, designData);
    } else if (designData.assembly && designData.assembly.is_assembly && designData.assembly.parts) {
      console.log(`   📦 Multi-part assembly detected: ${designData.assembly.parts.length} parts`);
      cadResult = await runAssemblyCADGenerator(buildId, designData);
    } else {
      console.log('   🔩 Single part design');
      cadResult = await runCADGenerator(buildId, designData);
    }
    
    // For assemblies, preserve the full structure; for single parts, just extract files array
    const cadFiles = cadResult.isAssembly ? cadResult : cadResult.files;
    const cadFeedback = cadResult.feedback || [];
    
    // Log any CAD generation feedback
    if (cadFeedback.length > 0) {
      console.log('   📊 CAD Generation Feedback:');
      cadFeedback.forEach(fb => console.log(`      ${fb}`));
    }

    // Step 5: PCB Generation (if required)
    let pcbFiles = null;
    let pcbFeedback = [];
    let componentModels = null;
    if (designData.pcb_required) {
      console.log('\n⚡ Step 5: PCB Generation');
      try {
        const pcbResult = await runPCBGenerator(buildId, designData);
        pcbFiles = pcbResult.files;
        pcbFeedback = pcbResult.feedback || [];
        
        if (pcbFeedback.length > 0) {
          console.log('   📊 PCB Generation Feedback:');
          pcbFeedback.forEach(fb => console.log(`      ${fb}`));
        }

        // Step 6: Generate 3D models for PCB components
        if (pcbResult.component_file) {
          console.log('\n🎨 Step 6: Generating 3D Component Models');
          try {
            const componentResult = await runComponentModelGenerator(buildId, designData, pcbResult.component_file);
            componentModels = componentResult;
            const componentCount = componentResult.component_models?.length || 0;
            if (componentCount > 0) {
              console.log(`  ✓ Generated 3D models for ${componentCount} components`);
            } else {
              console.log(`  ⚠️  No component models generated (using fallback geometry)`);
            }
          } catch (error) {
            console.log(`  ⚠️  Component 3D model generation failed: ${error.message}`);
            console.log('  💡 Build will continue without component 3D models');
            // Don't fail the build - continue without component models
            componentModels = { component_models: [] };
          }
        }
      } catch (error) {
        // If KiCad is not available, log warning but don't fail the build
        if (error.message.includes('KiCad Python API is not installed')) {
          console.log('  ⚠️  KiCad not available - PCB generation skipped');
          console.log('  💡 Install KiCad to enable PCB layout generation');
        } else {
          // For other errors, still fail the build
          throw error;
        }
      }
    } else {
      console.log('\n⚡ Step 5: PCB Generation - Skipped (not required)');
    }

    console.log(`\n✅ Build ${buildId} completed successfully\n`);

    // Compile feedback from all engines
    const allFeedback = [...cadFeedback, ...pcbFeedback];

    return {
      buildId,
      designData,
      reasoning,
      files: {
        cad: cadFiles,
        pcb: pcbFiles
      },
      component_models: componentModels?.component_models || null,
      engineFeedback: allFeedback,
      compatibilityChecks: compatibilityIssues,
      aiModel: AI_MODEL_NAME
    };

  } catch (error) {
    console.error(`\n❌ Build ${buildId} failed:`, error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('FreeCAD')) {
      throw new Error(`CAD Generation Error: ${error.message}\n\nMake sure FreeCAD is installed correctly. Visit https://www.freecad.org/downloads.php`);
    } else if (error.message.includes('AI planning failed')) {
      throw new Error(`AI Planning Error: ${error.message}\n\nPlease check your ANTHROPIC_API_KEY in .env file.`);
    } else if (error.message.includes('Validation failed')) {
      throw new Error(`Design Validation Error: ${error.message}\n\nPlease provide more specific dimensions and requirements.`);
    }
    
    throw error;
  }
}

/**
 * Run CAD generator Python script as child process
 */
function runCADGenerator(buildId, designData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', 'engine', 'cad', 'freecad_generator.py');
    const outputDir = path.join(__dirname, '..', '..', 'exports', 'cad');

    console.log(`  → Running FreeCAD generator...`);

    // Use FreeCAD's Python on Windows
    const pythonCmd = getFreeCADPython();
    const pythonProcess = spawn(pythonCmd, [scriptPath, buildId]);

    let stdout = '';
    let stderr = '';

    // Send design JSON to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(designData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`  [CAD] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`  [CAD ERROR] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`CAD generator failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        console.log(`  ✓ CAD files generated: ${result.files.join(', ')}`);
        
        // Extract feedback from stderr (generator logs)
        const feedback = [];
        const printSettings = {};
        
        if (stderr) {
          const lines = stderr.split('\n');
          let inPrintSettings = false;
          
          lines.forEach(line => {
            // Capture warnings and notes
            if (line.includes('Warning:') || line.includes('Note:') || line.includes('⚠')) {
              feedback.push(line.trim());
            }
            
            // Capture print analysis
            if (line.includes('=== RECOMMENDED PRINT SETTINGS ===')) {
              inPrintSettings = true;
            } else if (line.includes('=== END ANALYSIS ===')) {
              inPrintSettings = false;
            } else if (inPrintSettings && line.includes(':')) {
              const [key, value] = line.split(':').map(s => s.trim());
              if (key && value) {
                printSettings[key] = value;
              }
            }
            
            // Capture geometry validation
            if (line.includes('✓') || line.includes('Geometry is manifold')) {
              printSettings.isManifold = true;
            }
            if (line.includes('overhangs detected')) {
              printSettings.needsSupports = line.includes('No significant') ? false : true;
            }
          });
        }
        
        resolve({
          files: result.files,
          feedback: feedback,
          printSettings: printSettings,
          triangleCount: result.triangle_count,
          fileSize: result.file_size
        });
      } catch (error) {
        reject(new Error(`Failed to parse CAD generator output: ${error.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start CAD generator: ${error.message}`));
    });
  });
}

/**
 * Run CAD generator for multi-part assemblies
 */
async function runAssemblyCADGenerator(buildId, designData) {
  const parts = designData.assembly.parts;
  const allFiles = [];
  const allFeedback = [];
  let totalTriangles = 0;
  
  console.log(`   → Generating ${parts.length} parts...`);
  
  // Generate each part sequentially
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partId = `${buildId}_part${part.part_number}_${part.part_name.replace(/\s+/g, '_')}`;
    
    console.log(`   → Part ${part.part_number}/${parts.length}: ${part.part_name}`);
    
    // Create part-specific design data
    const partDesignData = {
      ...part.dimensions,
      units: designData.units || 'mm',
      wall_thickness: part.wall_thickness || designData.wall_thickness || 2,
      material: part.material || designData.material || 'PLA',
      product_type: part.part_name,
      shape_type: part.shape_type || designData.shape_type || 'box',
      features: part.features || [],
      cutouts: part.cutouts || [],
      mounting_holes: part.mounting_holes || {},
    };
    
    try {
      const partResult = await runCADGenerator(partId, partDesignData);
      allFiles.push({
        partName: part.part_name,
        partNumber: part.part_number,
        quantity: part.quantity || 1,
        files: partResult.files,
        material: part.material || designData.material || 'PLA'
      });
      allFeedback.push(...partResult.feedback);
      totalTriangles += partResult.triangleCount || 0;
    } catch (error) {
      console.error(`   ✗ Failed to generate part ${part.part_name}: ${error.message}`);
      allFeedback.push(`Warning: Part ${part.part_name} generation failed`);
    }
  }
  
  console.log(`   ✓ Generated ${allFiles.length}/${parts.length} parts successfully`);
  
  return {
    files: allFiles,
    feedback: allFeedback,
    printSettings: designData.assembly.print_settings || {},
    triangleCount: totalTriangles,
    isAssembly: true,
    assemblyInfo: {
      totalParts: parts.length,
      hardware: designData.assembly.hardware || [],
      assemblySteps: designData.assembly.assembly_steps || [],
      toolsRequired: designData.assembly.tools_required || [],
      assemblyTime: designData.assembly.assembly_time_minutes || 0,
      totalPrintTime: designData.assembly.total_print_time_hours || 0
    }
  };
}

/**
 * Run Geometry Interpreter (supports FreeCAD, CadQuery, OpenCascade)
 */
function runGeometryInterpreter(buildId, designData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', 'engine', 'interpreter', 'geometry_interpreter.py');
    const pythonCmd = getFreeCADPython();
    
    console.log(`  → Running Geometry Interpreter (engine: auto-select)...`);
    
    const pythonProcess = spawn(pythonCmd, [scriptPath, buildId]);
    
    let stdout = '';
    let stderr = '';
    
    // Send design JSON to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(designData));
    pythonProcess.stdin.end();
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`  [INTERPRETER] ${data.toString().trim()}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`  ✗ Geometry Interpreter failed with code ${code}`);
        if (stderr) console.error(`  [ERROR] ${stderr}`);
        reject(new Error(`Geometry Interpreter failed: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        
        if (!result.success) {
          throw new Error(result.error || 'Unknown interpreter error');
        }
        
        console.log(`  ✓ Generated ${result.files.length} files`);
        if (result.engine) {
          console.log(`  ✓ Engine used: ${result.engine}`);
        }
        if (result.design_language) {
          console.log(`  ✓ Design language operations: ${result.operations_count}`);
        }
        
        resolve({
          files: result.files,
          feedback: result.feedback || [],
          engine: result.engine,
          design_language: result.design_language
        });
      } catch (error) {
        console.error(`  ✗ Failed to parse interpreter output: ${error.message}`);
        reject(new Error(`Geometry Interpreter output parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Run PCB generator Python script as child process
 */
function runPCBGenerator(buildId, designData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', 'engine', 'pcb', 'kicad_generator.py');
    const outputDir = path.join(__dirname, '..', '..', 'exports', 'pcb');

    console.log(`  → Running KiCad generator...`);

    // Use KiCad's Python on Windows
    const pythonCmd = getKiCADPython();
    const pythonProcess = spawn(pythonCmd, [scriptPath, buildId]);

    let stdout = '';
    let stderr = '';

    // Send design JSON to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(designData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`  [PCB] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`  [PCB ERROR] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PCB generator failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        console.log(`  ✓ PCB files generated: ${result.files.join(', ')}`);
        
        // Extract feedback from stderr
        const feedback = [];
        if (stderr) {
          const lines = stderr.split('\n');
          lines.forEach(line => {
            if (line.includes('Warning:') || line.includes('Note:')) {
              feedback.push(line.trim());
            }
          });
        }
        
        resolve({
          files: result.files,
          feedback: feedback,
          componentCount: result.component_count,
          layerCount: result.layers,
          component_file: result.component_file || null
        });
      } catch (error) {
        reject(new Error(`Failed to parse PCB generator output: ${error.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start PCB generator: ${error.message}`));
    });
  });
}

/**
 * Run component model generator to create 3D models for PCB components
 */
function runComponentModelGenerator(buildId, designData, componentFile) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', 'engine', 'cad', 'freecad_generator.py');

    console.log(`  → Running component 3D model generator...`);

    // Use FreeCAD's Python
    const pythonCmd = getFreeCADPython();
    // Resolve component file path (might be relative)
    const componentFilePath = path.isAbsolute(componentFile) 
      ? componentFile 
      : path.join(__dirname, '..', '..', componentFile);
    // Pass special flag to trigger component model generation mode
    const pythonProcess = spawn(pythonCmd, [scriptPath, buildId, '--components', componentFilePath]);

    let stdout = '';
    let stderr = '';

    // Send design JSON to Python script
    pythonProcess.stdin.write(JSON.stringify(designData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`  [COMPONENT] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`  [COMPONENT ERROR] ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Component model generator exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || 'Component model generation failed'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse component model generator output: ${error.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start component model generator: ${error.message}`));
    });
  });
}

module.exports = {
  buildProduct,
  buildProductFromDesign
};

/**
 * Build product from pre-generated design data (skip AI planning)
 */
async function buildProductFromDesign(designData) {
  const buildId = uuidv4();
  console.log(`\n🏗️  Building from design data ${buildId}`);
  const reasoningMessage = 'Build generated from provided design data (AI planning skipped).';

  try {
    // Skip AI Planning, use provided design
    console.log('\n✓ Using provided design data');

    // Validation
    console.log('\n✓ Validating design data');
    validator.validateDesignData(designData);

    // CAD Generation
    console.log('\n🔧 CAD Generation');
    const cadFiles = await runCADGenerator(buildId, designData);

    // PCB generation disabled - CAD modeling focus only

    console.log('\n✅ Build completed successfully!');
    return {
      buildId,
      design: designData,
      reasoning: reasoningMessage,
      files: {
        cad: cadFiles,
        pcb: pcbFiles
      },
      aiModel: AI_MODEL_NAME
    };

  } catch (error) {
    console.error(`\n❌ Build ${buildId} failed:`, error.message);
    throw error;
  }
}
