// placeholder for an actual DTCG type
export type DTCGTokens = Record<string, any>;

export interface Resolver {
  name?: string;
  description?: string;
  sets: TokenSet[];
  modifiers?: Modifier[];
}

export interface ResolverImpl<T extends Record<string, any>> {
  tokens: T;
  getTokens: (id: T) => T;
  apply(values: Record<string, string>): T;
}

export interface TokenSet {
  name: string;
  values: string[];
}

export interface Modifier {
  name?: string;
  values: Array<{
    name: string;
    values: string[];
  }>;
  meta?: Record<string, unknown>;
}

export type Preset = 'figma-sds' | 'github-primer';
