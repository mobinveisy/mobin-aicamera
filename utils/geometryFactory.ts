
import { ParticleShape } from '../types';

export const generateGeometry = (type: ParticleShape, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  const size = 3;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    let x = 0, y = 0, z = 0;

    switch (type) {
      case ParticleShape.Sphere: {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 2.5 * Math.pow(Math.random(), 1/3);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }

      case ParticleShape.Heart: {
        const t = Math.random() * Math.PI * 2;
        const p = Math.random() * Math.PI * 2;
        // 3D Heart formula
        const r = Math.pow(Math.random(), 0.5) * 0.15;
        x = 16 * Math.pow(Math.sin(t), 3) * r;
        y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;
        z = Math.sin(p) * 0.5;
        break;
      }

      case ParticleShape.Flower: {
        // Phyllotaxis arrangement (Golden angle)
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const r = 2.5 * Math.sqrt(i / count);
        const theta = i * goldenAngle;
        x = r * Math.cos(theta);
        y = r * Math.sin(theta);
        z = (Math.random() - 0.5) * 0.5 * (1 - r / 2.5);
        break;
      }

      case ParticleShape.Saturn: {
        if (Math.random() > 0.6) {
          // Ring
          const theta = Math.random() * Math.PI * 2;
          const r = 2.5 + Math.random() * 1.5;
          x = r * Math.cos(theta);
          y = (Math.random() - 0.5) * 0.1;
          z = r * Math.sin(theta);
        } else {
          // Core Sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 1.8 * Math.pow(Math.random(), 1/3);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        }
        break;
      }

      case ParticleShape.Buddha: {
        const rand = Math.random();
        if (rand < 0.25) {
          // Head
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          x = 0.5 * Math.sin(phi) * Math.cos(theta);
          y = 0.5 * Math.sin(phi) * Math.sin(theta) + 1.8;
          z = 0.5 * Math.cos(phi);
        } else if (rand < 0.7) {
          // Body (Ellipsoid)
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          x = 1.2 * Math.sin(phi) * Math.cos(theta);
          y = 1.8 * Math.sin(phi) * Math.sin(theta) + 0.3;
          z = 0.8 * Math.cos(phi);
        } else {
          // Base (Torus)
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 2;
          const R = 1.5;
          const r = 0.4;
          x = (R + r * Math.cos(phi)) * Math.cos(theta);
          y = r * Math.sin(phi) - 1.2;
          z = (R + r * Math.cos(phi)) * Math.sin(theta);
        }
        break;
      }

      case ParticleShape.Fireworks: {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 4 * Math.random();
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};
