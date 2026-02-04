import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import './CanvasView.css';

function STLModel({ url, onError, onLoad, retrySignal, wireframe, color = '#4a9eff', position = [0, 0, 0] }) {
  const { camera } = useThree();
  const meshRef = useRef();
  const hasLoadedRef = useRef(false);
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    if (!url) return;

    let isCancelled = false;
    hasLoadedRef.current = false;
    setGeometry(null);

    const loader = new STLLoader();
    loader.load(
      url,
      (loadedGeometry) => {
        if (isCancelled) return;
        setGeometry(loadedGeometry);
      },
      undefined,
      (error) => {
        if (isCancelled) return;
        console.error('❌ STL loading error:', error);
        if (onError && !hasLoadedRef.current) {
          onError(error);
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [url, retrySignal, onError]);

  useEffect(() => {
    if (meshRef.current && geometry && !hasLoadedRef.current) {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      geometry.translate(-center.x, -center.y, -center.z);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;

      camera.position.set(cameraDistance, cameraDistance, cameraDistance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      hasLoadedRef.current = true;
      if (onLoad) onLoad();
    }
  }, [geometry, camera, onLoad]);

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial 
        color={color}
        metalness={0.3} 
        roughness={0.4}
        wireframe={wireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CanvasView({ stlUrl, design, pcbComponentUrl, assemblyFiles }) {
  const [wireframe, setWireframe] = useState(false);
  const [showElectronics, setShowElectronics] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const prevUrlRef = useRef(null);

  const hasPCB = design?.pcb_required && (design?.pcb_details || pcbComponentUrl);
  const hasAssembly = assemblyFiles && Array.isArray(assemblyFiles) && assemblyFiles.length > 0;

  const handleModelError = useCallback(() => {
    setLoadError(true);
    setIsLoading(false);
  }, []);

  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (stlUrl && stlUrl !== prevUrlRef.current) {
      setLoadError(false);
      setIsLoading(true);
      setRetryKey((prev) => prev + 1);
      prevUrlRef.current = stlUrl;
    }
  }, [stlUrl]);

  useEffect(() => {
    if (!stlUrl) return undefined;

    let retryTimer;
    const scheduleRetry = () => {
      retryTimer = setTimeout(() => setRetryKey((prev) => prev + 1), 1000);
    };

    const checkFile = async () => {
      try {
        const response = await fetch(stlUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`⚠️ STL file not yet available (${response.status}). Will retry...`);
          scheduleRetry();
        }
      } catch (error) {
        console.warn('⚠️ STL file check failed:', error.message);
        scheduleRetry();
      }
    };

    checkFile();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [stlUrl, retryKey]);

  if (!stlUrl) {
    return (
      <div className="canvas-placeholder">
        <p>3D preview will appear here after build completes</p>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <div className="canvas-controls">
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Solid' : '📐 Wireframe'}
        </button>
        {hasPCB && (
          <button onClick={() => setShowElectronics(!showElectronics)}>
            {showElectronics ? '📦 Hide PCB' : '⚡ Show PCB'}
          </button>
        )}
      </div>
      
      {isLoading && !loadError && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#8b8d98',
          fontSize: '0.9rem'
        }}>
          Loading 3D model...
        </div>
      )}
      
      <Canvas key={retryKey}>
        <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={50} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <hemisphereLight intensity={0.4} groundColor="#1a1d24" />
        
        {hasAssembly ? (
          // Render all assembly parts
          assemblyFiles.map((partUrl, idx) => (
            <STLModel 
              key={`part-${idx}`}
              url={partUrl} 
              retrySignal={retryKey}
              wireframe={wireframe}
              onError={handleModelError}
              onLoad={idx === 0 ? handleModelLoad : undefined}
              color={idx === 0 ? '#4a9eff' : idx === 1 ? '#ff9b4a' : '#4aff9b'}
              position={[idx * 10, 0, 0]}
            />
          ))
        ) : (
          // Single part design
          <STLModel 
            url={stlUrl} 
            retrySignal={retryKey}
            wireframe={wireframe}
            onError={handleModelError}
            onLoad={handleModelLoad}
          />
        )}

        {hasPCB && showElectronics && pcbComponentUrl && (
          <STLModel 
            url={pcbComponentUrl} 
            retrySignal={retryKey}
            wireframe={wireframe}
            onError={() => console.warn('PCB component model failed to load')}
            onLoad={() => console.log('PCB components loaded')}
            color="#1a5d1a"
            position={[0, 0, -5]}
          />
        )}
        
        <OrbitControls 
          makeDefault 
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={1000}
        />
        <Grid 
          infiniteGrid 
          cellSize={10} 
          cellThickness={0.5} 
          sectionSize={100}
          fadeDistance={400}
          sectionColor="#2d3139"
          cellColor="#1a1d24"
        />
      </Canvas>
      
      {loadError && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(237, 75, 75, 0.1)',
          border: '1px solid rgba(237, 75, 75, 0.3)',
          borderRadius: '6px',
          padding: '0.75rem 1.25rem',
          fontSize: '0.85rem',
          color: '#ed4b4b',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          ⚠️ STL file could not be loaded. The file may still be generating.
          <button 
            onClick={() => {
              setLoadError(false);
              setIsLoading(true);
              setRetryKey((prev) => prev + 1);
            }}
            style={{
              marginLeft: '1rem',
              background: 'rgba(237, 75, 75, 0.2)',
              border: '1px solid rgba(237, 75, 75, 0.5)',
              borderRadius: '4px',
              padding: '0.25rem 0.75rem',
              color: '#ed4b4b',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default CanvasView;
