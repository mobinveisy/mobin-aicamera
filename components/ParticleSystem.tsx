
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ParticleShape, HandState, ParticleSettings } from '../types';
import { generateGeometry } from '../utils/geometryFactory';

const TRAIL_LENGTH = 5;

const vertexShader = `
  uniform float uTime;
  uniform float uTension;
  uniform float uExplosion;
  uniform vec3 uColor;

  attribute vec3 targetPos;
  attribute float randomness;
  attribute float pScale;
  attribute float trailIdx;

  varying float vTrailIdx;
  varying vec3 vColor;
  varying float vOpacity;

  // Simple 3D Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vTrailIdx = trailIdx;
    
    // Lag trail based on trailIdx
    float lag = trailIdx * 0.08;
    float time = uTime - lag;

    // Organic turbulence
    float noise = snoise(targetPos * 0.5 + time * 0.2) * randomness;
    
    // Inverted Tension: Hand OPEN (0) -> High expansion (1.0), Hand FIST (1) -> Low expansion (0.0)
    float expansion = 1.0 - uTension;
    
    // Breathing effect
    float breathing = sin(uTime * 1.5 + randomness * 6.28) * 0.05;
    
    vec3 pos = targetPos * (1.0 + expansion * 0.5 + breathing);
    pos += noise * expansion * 1.5;

    // Explosion blast
    if (uExplosion > 0.01) {
      pos += normalize(pos) * uExplosion * 10.0 * (1.0 - lag * 2.0);
    }
    
    // Gravity pull when relaxed (high uTension means fist, but let's say low expansion = relaxed)
    float gravity = max(0.0, uTension - 0.5) * 0.5;
    pos.y -= gravity * lag * 5.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (10.0 * pScale * (1.0 - lag * 0.5)) * (300.0 / -mvPosition.z);
    
    vColor = uColor;
    vOpacity = 1.0 - (trailIdx / float(${TRAIL_LENGTH}));
  }
`;

const fragmentShader = `
  varying float vTrailIdx;
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glow
    float glow = smoothstep(0.5, 0.1, dist);
    
    // Core white hot center
    float core = smoothstep(0.2, 0.0, dist);
    
    vec3 finalColor = mix(vColor, vec3(1.0), core * 0.8);
    
    gl_FragColor = vec4(finalColor, glow * vOpacity);
  }
`;

interface ParticleSystemProps {
  settings: ParticleSettings;
  handState: HandState;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ settings, handState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const totalCount = settings.particleCount * TRAIL_LENGTH;

  // Attributes
  const attributes = useMemo(() => {
    const targetPos = generateGeometry(settings.shape, settings.particleCount);
    
    const fullTargetPos = new Float32Array(totalCount * 3);
    const randomness = new Float32Array(totalCount);
    const pScale = new Float32Array(totalCount);
    const trailIdx = new Float32Array(totalCount);

    for (let i = 0; i < settings.particleCount; i++) {
      const baseIdx = i * TRAIL_LENGTH;
      const r = Math.random();
      const s = 0.5 + Math.random();

      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const idx = (baseIdx + t);
        
        fullTargetPos[idx * 3] = targetPos[i * 3];
        fullTargetPos[idx * 3 + 1] = targetPos[i * 3 + 1];
        fullTargetPos[idx * 3 + 2] = targetPos[i * 3 + 2];
        
        randomness[idx] = r;
        pScale[idx] = s;
        trailIdx[idx] = t;
      }
    }

    return { fullTargetPos, randomness, pScale, trailIdx };
  }, [settings.shape, settings.particleCount]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTension: { value: 0 },
    uExplosion: { value: 0 },
    uColor: { value: new THREE.Color(settings.color) }
  }), []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(settings.color);
    }
  }, [settings.color]);

  const explosionRef = useRef(0);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth tension
      materialRef.current.uniforms.uTension.value += (handState.tension - materialRef.current.uniforms.uTension.value) * 0.1;
      
      // Handle explosion
      if (handState.isExploding) {
        explosionRef.current = 1.0;
      }
      explosionRef.current *= 0.94; // Decay
      materialRef.current.uniforms.uExplosion.value = explosionRef.current;
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={totalCount}
          array={attributes.fullTargetPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-targetPos"
          count={totalCount}
          array={attributes.fullTargetPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-randomness"
          count={totalCount}
          array={attributes.randomness}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-pScale"
          count={totalCount}
          array={attributes.pScale}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-trailIdx"
          count={totalCount}
          array={attributes.trailIdx}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleSystem;
