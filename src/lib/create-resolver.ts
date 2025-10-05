/**
 * ⚠️ WARNING! This is just an implementation of the resolver spec
 * for demo purposes. It is subject to change, or possibly fall out
 * of sync with the specification. In case of a deviation, prefer
 * the official specification over this example library.
 */
import z from 'zod/v4';
import { mergeTokenSets } from './set.js';
import type { DTCGTokens, Modifier, Resolver, ResolverImpl } from './types.js';
import { getTokenIDs, mergeTokens } from './utils.js';

const tokenMapSchema = z.looseObject({});

function validateTokenMap<T extends Record<string, any>>(tokenMap: unknown): T {
  return tokenMapSchema.parse(tokenMap) as T;
}
const tokenSetSchema = z.object({
  type: z.literal('set', { error: 'Unsupported type' }),
  name: z.string({ error: 'Missing "name"' }),
  sources: z.array(z.string({ error: 'Expected string' }), {
    error: 'Missing "sources"',
  }),
});
const modifierSetSchema = z.object({
  type: z.literal('modifier', { error: 'Unsupported type' }),
  name: z.string({ error: 'Missing "name"' }),
  context: z.record(
    z.string({ error: 'Expected string' }),
    z.array(z.string({ error: 'Expected string' })),
    {
      error: 'Missing "context"',
    },
  ),
  default: z.optional(z.string({ error: 'Expected string' })),
});
const resolverSchema = z.object({
  name: z.string({ error: 'Missing "name"' }),
  version: z.literal('2025-10-01', { error: 'Unsupported version' }),
  description: z.optional(z.string({ error: 'Expected string' })),
  tokens: z.array(
    z.union([
      z.string(),
      z.discriminatedUnion('type', [tokenSetSchema, modifierSetSchema]),
    ]),
    { error: 'Missing "tokens"' },
  ),
});

function validateResolver(resolver: unknown): Resolver {
  try {
    return resolverSchema.parse(resolver);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(
        'Resolver validation:',
        JSON.stringify(err.format(), null, 2),
      );
    } else {
      console.error(err);
    }
    throw err;
  }
}

export function createResolver<T extends Record<string, any> = DTCGTokens>(
  tokenMapRaw: Record<string, T>,
  resolverRaw: Resolver,
): ResolverImpl<T> {
  const tokenMap = validateTokenMap<T>(tokenMapRaw);
  const resolver = validateResolver(resolverRaw);
  if (!Object.keys(tokenMap ?? {}).length) {
    throw new Error(`Empty token map! No tokens to resolve`);
  }

  const tokens: T = resolver?.tokens?.length
    ? mergeTokenSets(
        resolver.tokens.flatMap((set) => {
          if (typeof set === 'string') {
            return getTokens(set);
          }
          // Modifiers don’t contribute tokens directly
          if (set.type === 'modifier') {
            return [];
          }
          const { name, sources } = set;

          if (!sources?.length) {
            throw new Error(
              `Token set ${name} can’t contain empty array of sources`,
            );
          }
          return sources.map<T>((id) => getTokens(id));
        }),
      )
    : ({} as T);

  function getTokens(id: string): T {
    if (!(id in tokenMap)) {
      throw new Error(`Tokens "${id}" missing in tokenMap!`);
    }
    return tokenMap[id];
  }

  return {
    tokens,
    getTokens,
    apply(values: Record<string, string>): T {
      const modifiers = resolver.tokens.filter(
        (t): t is Modifier => typeof t !== 'string' && t.type === 'modifier',
      );

      console.log('modifiers.length', modifiers?.length);
      console.log('values', values);

      if (!modifiers?.length) {
        throw new Error(`No modifiers defined, nothing to apply()`);
      }
      if (!Object.keys(values ?? {}).length) {
        throw new Error(`Can’t apply an empty value set`);
      }

      let finalTokens = structuredClone(tokens);
      const modified = new Set<string>();

      for (const [name, value] of Object.entries(values)) {
        const modifier = modifiers.find((mod) => mod.name === name);
        // Note: this should be a validation error sooner
        if (!modifier) {
          throw new Error(`Modifier ${name} not defined!`);
        }
        const modVal = modifier.context[value];
        if (!modVal) {
          throw new Error(`Modifier ${name} has no ${value} defined`);
        }
        for (const id of modVal) {
          const modifiedTokens = getTokens(id);
          for (const id of getTokenIDs(modifiedTokens)) {
            modified.add(id);
          }
          finalTokens = mergeTokens(finalTokens, modifiedTokens);
        }
      }

      return {
        ...finalTokens,
        $extensions: { modified: [...modified] },
      };
    },
  };
}
