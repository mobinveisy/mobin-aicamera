
import React from 'react';
import { 
  Heart, 
  Circle, 
  Wind, 
  Zap, 
  Layers, 
  Infinity as InfinityIcon,
  Palette
} from 'lucide-react';
import { ParticleShape, ParticleSettings, HandState } from '../types';

interface ControlsProps {
  settings: ParticleSettings;
  setSettings: React.Dispatch<React.SetStateAction<ParticleSettings>>;
  handState: HandState;
}

const SHAPES = [
  { id: ParticleShape.Sphere, label: 'Origin', icon: Circle },
  { id: ParticleShape.Heart, label: 'Empathy', icon: Heart },
  { id: ParticleShape.Flower, label: 'Growth', icon: Wind },
  { id: ParticleShape.Saturn, label: 'Order', icon: Layers },
  { id: ParticleShape.Buddha, label: 'Zen', icon: InfinityIcon },
  { id: ParticleShape.Fireworks, label: 'Sparks', icon: Zap },
];

const COLORS = [
  '#4ade80', // Emerald
  '#60a5fa', // Blue
  '#f87171', // Red
  '#fbbf24', // Amber
  '#c084fc', // Purple
  '#ffffff', // White
];

const Controls: React.FC<ControlsProps> = ({ settings, setSettings, handState }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 flex flex-col items-center gap-6 z-40 pointer-events-auto">
      
      {/* Tension Monitor */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="flex justify-between w-64 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
          <span>Relaxed</span>
          <span>Tension</span>
          <span>Contracted</span>
        </div>
        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 transition-all duration-100"
            style={{ width: `${handState.tension * 100}%` }}
          />
          {handState.isExploding && (
            <div className="absolute inset-0 bg-white animate-pulse" />
          )}
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Shape Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {SHAPES.map((shape) => {
            const Icon = shape.icon;
            const isActive = settings.shape === shape.id;
            return (
              <button
                key={shape.id}
                onClick={() => setSettings(prev => ({ ...prev, shape: shape.id }))}
                className={`
                  group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300
                  ${isActive ? 'bg-white/15 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5'}
                `}
              >
                <Icon 
                  size={20} 
                  className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/40'}`} 
                />
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-white' : 'text-white/30'}`}>
                  {shape.label}
                </span>
                {isActive && (
                  <div className="absolute -inset-1 bg-white/10 rounded-2xl blur-md -z-10 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-px w-full md:h-12 md:w-px bg-white/10" />

        {/* Color Palette */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-white/40" />
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSettings(prev => ({ ...prev, color }))}
                  className={`
                    w-6 h-6 rounded-full border-2 transition-transform duration-300
                    ${settings.color === color ? 'scale-125 border-white shadow-lg' : 'border-transparent scale-100 hover:scale-110'}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
      
      <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-medium animate-pulse">
        {handState.isActive ? "Gesture Detected • Open hand to expand" : "Waiting for Gesture..."}
      </p>
    </div>
  );
};

export default Controls;
