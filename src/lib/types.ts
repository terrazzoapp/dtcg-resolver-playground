// placeholder for an actual DTCG type
export type DTCGTokens = Record<string, any>;

export interface Resolver {
  name?: string;
  version: '2025-10-01';
  description?: string;
  tokens: (string | TokenSet | Modifier)[];
}

export interface ResolverImpl<T extends Record<string, any>> {
  tokens: T;
  getTokens: (id: string) => T;
  apply(
    values: Record<string, string>,
  ): T & { $extensions?: { modified: string[] } };
}

export interface TokenSet {
  type: 'set';
  name: string;
  sources: string[];
  meta?: Record<string, unknown>;
}

export interface Modifier {
  type: 'modifier';
  name: string;
  context: Record<string, string[]>;
  default?: string;
  meta?: Record<string, unknown>;
}

export type Preset = 'figma-sds' | 'github-primer';
