const express = require('express');
const path = require('path');
const router = express.Router();
const orchestrator = require('../services/orchestrator');
const aiPlanner = require('../services/aiPlanner');
const MODEL_NAME = process.env.AI_MODEL_NAME || 'GPT-5.1-Codex';

// POST /api/chat - Conversational mode
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory, currentDesign } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Message is required and must be a string' 
      });
    }

    console.log(`💬 Chat message: "${message.substring(0, 50)}..."`);

    const chatResult = await aiPlanner.chatWithEngineer(
      message, 
      conversationHistory || [], 
      currentDesign
    );

    // If AI wants to build, trigger the build process
    if (chatResult.shouldBuild && chatResult.design) {
      console.log('🏗️ AI decided to build the design');
      const buildResult = await orchestrator.buildProductFromDesign(chatResult.design);
      
      res.json({
        success: true,
        shouldBuild: true,
        aiModel: buildResult.aiModel || MODEL_NAME,
        response: chatResult.response,
        buildResult: buildResult
      });
    } else {
      // Just conversational response
      res.json({
        success: true,
        shouldBuild: false,
        response: chatResult.response,
        aiModel: MODEL_NAME
      });
    }

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      message: error.message
    });
  }
});

// POST /api/build - Main build endpoint
router.post('/build', async (req, res) => {
  try {
    const { prompt, previousDesign } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Prompt is required and must be a string' 
      });
    }

    if (prompt.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Prompt is too short. Please provide more details (at least 10 characters).' 
      });
    }

    console.log(`📝 Received build request: "${prompt.substring(0, 50)}..."`);
    if (previousDesign) {
      console.log('🔄 Modifying existing design');
    }

    // Orchestrate the build process (pass previous design if available)
    const result = await orchestrator.buildProduct(prompt, previousDesign);
    
    // Log success metrics
    console.log('\n📊 Build Metrics:');
    if (result.engineFeedback && result.engineFeedback.length > 0) {
      console.log(`   Feedback items: ${result.engineFeedback.length}`);
    }
    if (result.compatibilityChecks && result.compatibilityChecks.length > 0) {
      console.log(`   Compatibility warnings: ${result.compatibilityChecks.length}`);
    }

    // Handle assembly vs single-part response
    let filesResponse;
    let isAssembly = false;
    let assemblyInfo = null;
    
    // Check if this is an assembly build by looking for isAssembly flag in the CAD result
    if (result.files.cad && typeof result.files.cad === 'object' && result.files.cad.isAssembly) {
      // Assembly build - cadFiles is an object with {files: [...], isAssembly: true, assemblyInfo: {...}}
      isAssembly = true;
      assemblyInfo = result.files.cad.assemblyInfo || null;
      filesResponse = result.files.cad.files || [];
    } else if (result.files.cad && Array.isArray(result.files.cad)) {
      // Check if first element is an object with partName (assembly format) or a string (single-part format)
      if (result.files.cad.length > 0 && result.files.cad[0] && typeof result.files.cad[0] === 'object' && result.files.cad[0].partName) {
        // This is actually an assembly - orchestrator returned array of parts directly
        isAssembly = true;
        filesResponse = result.files.cad;
        // Try to extract assembly info if available
        assemblyInfo = result.assemblyInfo || null;
      } else if (result.files.cad.length > 0 && typeof result.files.cad[0] === 'string') {
        // Single-part build with file array [STEP, STL]
        const stepFile = result.files.cad[0];
        const stlFile = result.files.cad[1];
        filesResponse = {
          stl: stlFile ? `/exports/cad/${path.basename(stlFile)}` : null,
          step: stepFile ? `/exports/cad/${path.basename(stepFile)}` : null,
          pcb: result.files.pcb ? `/exports/pcb/${result.buildId}.kicad_pcb` : null
        };
      } else {
        // Fallback to hardcoded paths
        filesResponse = {
          stl: result.files.cad ? `/exports/cad/${result.buildId}.stl` : null,
          step: result.files.cad ? `/exports/cad/${result.buildId}.step` : null,
          pcb: result.files.pcb ? `/exports/pcb/${result.buildId}.kicad_pcb` : null
        };
      }
    } else {
      // Fallback to hardcoded paths
      filesResponse = {
        stl: result.files.cad ? `/exports/cad/${result.buildId}.stl` : null,
        step: result.files.cad ? `/exports/cad/${result.buildId}.step` : null,
        pcb: result.files.pcb ? `/exports/cad/${result.buildId}.kicad_pcb` : null
      };
    }
    
    // Debug logging for assembly detection
    console.log(`\n🔍 Build Response Debug:`);
    console.log(`   - isAssembly: ${isAssembly}`);
    console.log(`   - filesResponse type: ${Array.isArray(filesResponse) ? 'Array' : typeof filesResponse}`);
    if (Array.isArray(filesResponse)) {
      console.log(`   - Number of parts: ${filesResponse.length}`);
      filesResponse.forEach((part, i) => {
        console.log(`   - Part ${i + 1}: ${part.partName || 'Unknown'}`);
      });
    } else {
      console.log(`   - Files: ${JSON.stringify(filesResponse, null, 2)}`);
    }

    res.json({
      success: true,
      buildId: result.buildId,
      aiModel: result.aiModel || MODEL_NAME,
      design: result.designData,
      reasoning: result.reasoning,
      isAssembly: isAssembly,
      files: filesResponse,
      assemblyInfo: assemblyInfo,
      component_models: result.component_models || null,
      feedback: {
        engine: result.engineFeedback || [],
        compatibility: result.compatibilityChecks || []
      },
      metrics: {
        hasWarnings: (result.engineFeedback?.length > 0) || (result.compatibilityChecks?.length > 0),
        totalFeedback: (result.engineFeedback?.length || 0) + (result.compatibilityChecks?.length || 0)
      }
    });

  } catch (error) {
    console.error('❌ Build error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ 
      error: 'Build failed', 
      message: error.message,
      ...(isDev && { details: error.stack })
    });
  }
});

// GET /api/build/:buildId - Get build status/details
router.get('/build/:buildId', (req, res) => {
  // TODO: Implement build status tracking
  res.json({ 
    buildId: req.params.buildId, 
    status: 'completed',
    message: 'Status endpoint not yet implemented' 
  });
});

module.exports = router;
