declare module 'node-random-name' {
  export default function random_name(options?: {
    first?: boolean;
    last?: boolean;
    gender?: 'male' | 'female';
    random?: () => number;
  }): string;
} 