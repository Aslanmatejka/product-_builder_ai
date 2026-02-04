import React, { useState, useRef, useEffect } from 'react';
import PromptInput from './components/PromptInput';
import BuildStatus from './components/BuildStatus';
import CanvasView from './components/CanvasView';
import { buildProduct } from './api';
import './App.css';

function App() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [stlUrl, setStlUrl] = useState(null);
  const [pcbComponentUrl, setPcbComponentUrl] = useState(null);
  const [assemblyFiles, setAssemblyFiles] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [aiModel, setAiModel] = useState(process.env.REACT_APP_AI_MODEL_NAME || 'GPT-5.1-Codex');
  const [chatWidth, setChatWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const windowWidth = window.innerWidth;
    const newWidth = (e.clientX / windowWidth) * 100;
    
    // Constrain between 20% and 80%
    if (newWidth >= 20 && newWidth <= 80) {
      setChatWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleBuild = async (prompt) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setStatus('building');

    const buildingMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      status: 'building',
      content: 'Got it! Let me design that for you...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, buildingMessage]);

    try {
      const buildResult = await buildProduct(prompt, currentDesign);
      setResult(buildResult);
      setCurrentDesign(buildResult.design);
      setAiModel(prev => buildResult.aiModel || prev);
      setStatus('success');

      // Handle assembly vs single-part files
      if (buildResult.isAssembly && Array.isArray(buildResult.files)) {
        // Collect all STL URLs from all parts
        const allStlUrls = [];
        buildResult.files.forEach(part => {
          if (part.files) {
            const stlFile = part.files.find(f => f.endsWith('.stl'));
            if (stlFile) {
              const fileName = stlFile.split('/').pop();
              allStlUrls.push(`http://localhost:3001/exports/cad/${fileName}`);
            }
          }
        });
        setAssemblyFiles(allStlUrls);
        // Also set the first one as main STL for compatibility
        if (allStlUrls.length > 0) {
          setStlUrl(allStlUrls[0]);
        }
      } else if (buildResult.files && buildResult.files.stl) {
        // Single-part design
        setAssemblyFiles(null);
        const stlFileUrl = `http://localhost:3001${buildResult.files.stl}`;
        setStlUrl(stlFileUrl);
      }

      // Update PCB component model URL if available
      // component_models can be an array of file paths or an object with component_models array
      let componentModelFiles = buildResult.component_models;
      if (componentModelFiles && !Array.isArray(componentModelFiles)) {
        componentModelFiles = componentModelFiles.component_models || componentModelFiles.files || [];
      }
      
      if (componentModelFiles && Array.isArray(componentModelFiles) && componentModelFiles.length > 0) {
        // Look for STL file in component models
        const pcbStlFile = componentModelFiles.find(f => f && (f.endsWith('_pcb_components.stl') || f.endsWith('.stl')));
        if (pcbStlFile) {
          // Ensure the path starts with /exports/ if it doesn't already
          const filePath = pcbStlFile.startsWith('/') ? pcbStlFile : `/exports/${pcbStlFile}`;
          setPcbComponentUrl(`http://localhost:3001${filePath}`);
        }
      }

      setMessages(prev => prev.map((msg, idx) => 
        idx === prev.length - 1 
          ? { 
              ...msg, 
              status: 'success', 
              content: buildResult.reasoning || "Here's your design!", 
              result: buildResult 
            }
          : msg
      ));
    } catch (err) {
      setStatus('error');

      setMessages(prev => prev.map((msg, idx) => 
        idx === prev.length - 1 
          ? { ...msg, status: 'error', content: err.message }
          : msg
      ));
    }
  };

  return (
    <div className="App">
      <header>
        <div className="header-left">
          <h1>Product Builder</h1>
          <span className="header-subtitle">AI Design Assistant</span>
        </div>
        <div className="header-right">
          <div className="model-status" title="Active AI planning model">
            <span className="model-label">AI Model</span>
            <span className="model-value">{aiModel}</span>
          </div>
          {result && result.files && (
            <div className="export-links">
              {result.files.stl && (
                <a 
                  href={`http://localhost:3001${result.files.stl}`} 
                  download
                  className="export-btn"
                  title="Download STL (3D Print)"
                >
                  📥 STL
                </a>
              )}
              {result.files.step && (
                <a 
                  href={`http://localhost:3001${result.files.step}`} 
                  download
                  className="export-btn"
                  title="Download STEP (CAD Edit)"
                >
                  📦 STEP
                </a>
              )}
              {result.files.pcb && (
                <a 
                  href={`http://localhost:3001${result.files.pcb}`} 
                  download
                  className="export-btn"
                  title="Download PCB Files"
                >
                  ⚡ PCB
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <main style={{ gridTemplateColumns: `${chatWidth}% 8px ${100 - chatWidth}%` }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-content">
                  <h2>👋 Hey there!</h2>
                  <p>Just tell me what you want to make, and I'll design it for you.</p>
                  <p className="welcome-hint">No CAD experience needed—just describe it like you're talking to a friend.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  {message.type === 'user' ? (
                    <div className="message-content user-message">
                      <div className="message-text">{message.content}</div>
                    </div>
                  ) : (
                    <div className="message-content assistant-message">
                      <div className="assistant-content">
                        {message.status === 'building' && (
                          <div className="building-status">
                            <div className="spinner"></div>
                            <span>{message.content}</span>
                          </div>
                        )}
                        {message.status === 'success' && message.result && (
                          <>
                            {message.content && (
                              <div className="ai-reasoning">
                                {message.content}
                              </div>
                            )}
                            <BuildStatus 
                              status="success"
                              error={null}
                              result={message.result}
                            />
                          </>
                        )}
                        {message.status === 'error' && (
                          <div className="error-message">
                            <span>Hmm, I ran into an issue: {message.content}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <PromptInput 
            onBuild={handleBuild} 
            isBuilding={status === 'building'}
            hasExistingDesign={currentDesign !== null}
          />
        </div>

        <div 
          className={`resize-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle-bar"></div>
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <span>3D Preview</span>
            {stlUrl && <span className="preview-status">● Ready</span>}
          </div>
          <CanvasView 
            stlUrl={stlUrl} 
            design={currentDesign} 
            pcbComponentUrl={pcbComponentUrl}
            assemblyFiles={assemblyFiles}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
