
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleShape, ParticleSettings, HandState } from './types';
import ParticleSystem from './components/ParticleSystem';
import HandTracker from './components/HandTracker';
import Controls from './components/Controls';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ParticleSettings>({
    shape: ParticleShape.Sphere,
    color: '#4ade80',
    particleCount: 2000
  });

  const [handState, setHandState] = useState<HandState>({
    tension: 0,
    isExploding: false,
    isActive: false
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-radial-at-t from-zinc-900 via-black to-black opacity-60 z-0" />
      
      {/* Header */}
      <header className="absolute top-8 left-10 z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/20">
            <Layers className="text-white/80" size={20} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-black tracking-tighter leading-none italic uppercase">
              Zen<span className="text-white/40 not-italic">Particles</span>
            </h1>
            <p className="text-white/30 text-[9px] uppercase tracking-[0.4em] mt-1 font-bold">
              Immersive Flow Synthesis
            </p>
          </div>
        </div>
      </header>

      {/* Hand Tracker Preview & Logic */}
      <HandTracker onHandUpdate={setHandState} />

      {/* Main 3D Scene */}
      <div className="absolute inset-0 z-10">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            maxDistance={20} 
            minDistance={4}
            autoRotate
            autoRotateSpeed={0.5}
          />
          
          <Suspense fallback={null}>
            <ParticleSystem 
              settings={settings} 
              handState={handState} 
            />
          </Suspense>

          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
        </Canvas>
      </div>

      {/* UI Controls */}
      <Controls 
        settings={settings} 
        setSettings={setSettings} 
        handState={handState} 
      />

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none border-[30px] border-black z-20" />
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] z-20" />
    </div>
  );
};

export default App;
