
export enum Persona {
  SECURITY = 'security',
  SCALABILITY = 'scalability',
  UI_UX = 'ui/ux',
}

export interface CodeFile {
  name: string;
  content: string;
}

export interface Issue {
  id: string;
  persona: Persona;
  content: string;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'error' | 'done';
