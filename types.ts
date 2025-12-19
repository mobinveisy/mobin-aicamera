
export enum ParticleShape {
  Sphere = 'Sphere',
  Heart = 'Heart',
  Flower = 'Flower',
  Saturn = 'Saturn',
  Buddha = 'Buddha',
  Fireworks = 'Fireworks'
}

export interface ParticleSettings {
  shape: ParticleShape;
  color: string;
  particleCount: number;
}

export interface HandState {
  tension: number;
  isExploding: boolean;
  isActive: boolean;
}
