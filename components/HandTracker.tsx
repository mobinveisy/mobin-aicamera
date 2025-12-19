
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { HandState } from '../types';

interface HandTrackerProps {
  onHandUpdate: (state: HandState) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevTensionRef = useRef(0);

  const initTracker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 30 } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          requestAnimationFrame(predictLoop);
        };
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to access camera or load hand tracking model.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initTracker();
    return () => {
      landmarkerRef.current?.close();
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [initTracker]);

  const predictLoop = () => {
    if (!landmarkerRef.current || !videoRef.current || videoRef.current.paused) return;

    const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
    
    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // Calculate Tension
      // wrist: 0
      // finger tips: 4, 8, 12, 16, 20
      // palm center proxy: 9
      const wrist = landmarks[0];
      const fingerTips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
      
      // palm size: distance between wrist and middle finger base (9)
      const palmSize = Math.sqrt(
        Math.pow(landmarks[9].x - wrist.x, 2) + 
        Math.pow(landmarks[9].y - wrist.y, 2)
      );

      const avgDist = fingerTips.reduce((acc, tip) => {
        const dist = Math.sqrt(
          Math.pow(tip.x - wrist.x, 2) + 
          Math.pow(tip.y - wrist.y, 2)
        );
        return acc + dist;
      }, 0) / 5;

      // Tension logic: avgDist/palmSize roughly 2.0+ for open, 1.0 or less for fist
      // Normalize to 0 (open) - 1 (fist)
      const ratio = avgDist / palmSize;
      let tension = Math.max(0, Math.min(1, (2.2 - ratio) / 1.2));

      // Clap Detection: rapid tension increase
      const isExploding = (tension - prevTensionRef.current) > 0.45 && tension > 0.8;
      
      prevTensionRef.current = tension;

      onHandUpdate({
        tension,
        isExploding,
        isActive: true
      });
    } else {
      onHandUpdate({ tension: 0, isExploding: false, isActive: false });
    }

    requestAnimationFrame(predictLoop);
  };

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="relative w-48 h-36 bg-neutral-900/80 rounded-xl overflow-hidden border border-white/20 backdrop-blur-md shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <RefreshCw className="animate-spin mb-2" size={20} />
            <span className="text-xs">Initializing AI...</span>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center pointer-events-auto">
            <CameraOff className="mb-2" size={24} />
            <span className="text-[10px] leading-tight mb-2">{error}</span>
            <button 
              onClick={() => initTracker()}
              className="bg-white/10 hover:bg-white/20 transition px-3 py-1 rounded text-[10px] font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover scale-x-[-1]" 
            muted 
            playsInline
          />
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
          <Camera size={10} className="text-emerald-400" />
          <span className="text-[9px] text-white/80 font-medium uppercase tracking-wider">Live Vision</span>
        </div>
      </div>
    </div>
  );
};

export default HandTracker;
