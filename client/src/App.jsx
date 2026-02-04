import React, { useState, useRef, useEffect, useCallback } from 'react';
import PromptInput from './components/PromptInput';
import BuildStatus from './components/BuildStatus';
import CanvasView from './components/CanvasView';
import { buildProduct, getAllProjects, getProject, deleteProject } from './api';
import './App.css';

function App() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [stlUrl, setStlUrl] = useState(null);
  const [pcbComponentUrl, setPcbComponentUrl] = useState(null);
  const [assemblyFiles, setAssemblyFiles] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [aiModel, setAiModel] = useState(process.env.REACT_APP_AI_MODEL_NAME || 'GPT-5.1-Codex');
  const [chatWidth, setChatWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getAllProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProject = async (projectId) => {
    try {
      const response = await getProject(projectId);
      const { project, builds, messages: projectMessages } = response;

      setCurrentProjectId(project.id);
      setCurrentDesign(project.design_data);

      const formattedMessages = projectMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      if (builds.length > 0) {
        const latestBuild = builds[0];
        if (latestBuild.status === 'success') {
          setResult({
            design: latestBuild.design_data,
            files: latestBuild.files,
            component_models: latestBuild.component_models,
            isAssembly: latestBuild.is_assembly,
            aiModel: latestBuild.ai_model
          });

          if (latestBuild.is_assembly && latestBuild.files && Array.isArray(latestBuild.files)) {
            const allStlUrls = [];
            latestBuild.files.forEach(part => {
              if (part.files) {
                const stlFile = part.files.find(f => f.endsWith('.stl'));
                if (stlFile) {
                  const fileName = stlFile.split('/').pop();
                  allStlUrls.push(`http://localhost:3001/exports/cad/${fileName}`);
                }
              }
            });
            setAssemblyFiles(allStlUrls);
            if (allStlUrls.length > 0) {
              setStlUrl(allStlUrls[0]);
            }
          } else if (latestBuild.files && latestBuild.files.stl) {
            setAssemblyFiles(null);
            const stlFileUrl = `http://localhost:3001${latestBuild.files.stl}`;
            setStlUrl(stlFileUrl);
          }
        }

        const buildMessages = builds.map((build, idx) => ({
          id: `build-${build.id}`,
          type: 'assistant',
          status: build.status,
          content: build.status === 'success' ? "Here's your design!" : build.error_message,
          timestamp: new Date(build.completed_at || build.created_at),
          result: build.status === 'success' ? {
            design: build.design_data,
            files: build.files,
            component_models: build.component_models,
            isAssembly: build.is_assembly
          } : null
        }));

        setMessages([...formattedMessages, ...buildMessages]);
      } else {
        setMessages(formattedMessages);
      }

      setShowProjects(false);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await deleteProject(projectId);
      await loadProjects();

      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setMessages([]);
        setCurrentDesign(null);
        setResult(null);
        setStlUrl(null);
        setAssemblyFiles(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const startNewProject = () => {
    setCurrentProjectId(null);
    setMessages([]);
    setCurrentDesign(null);
    setResult(null);
    setStlUrl(null);
    setAssemblyFiles(null);
    setPcbComponentUrl(null);
    setShowProjects(false);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const windowWidth = window.innerWidth;
    const newWidth = (e.clientX / windowWidth) * 100;

    if (newWidth >= 20 && newWidth <= 80) {
      setChatWidth(newWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      const buildResult = await buildProduct(prompt, currentDesign, currentProjectId);
      setResult(buildResult);
      setCurrentDesign(buildResult.design);
      setCurrentProjectId(buildResult.projectId);
      setAiModel(prev => buildResult.aiModel || prev);
      setStatus('success');

      await loadProjects();

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
          <button
            className="projects-btn"
            onClick={() => setShowProjects(!showProjects)}
            title="View projects"
          >
            📁 Projects
          </button>
          {currentProjectId && (
            <button
              className="new-project-btn"
              onClick={startNewProject}
              title="Start new project"
            >
              ✨ New
            </button>
          )}
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

      {showProjects && (
        <div className="projects-sidebar">
          <div className="projects-header">
            <h3>Projects</h3>
            <button onClick={() => setShowProjects(false)} className="close-btn">×</button>
          </div>
          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="no-projects">No projects yet</div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className={`project-item ${currentProjectId === project.id ? 'active' : ''}`}
                >
                  <div
                    className="project-info"
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="project-name">{project.name}</div>
                    <div className="project-date">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="delete-project-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
