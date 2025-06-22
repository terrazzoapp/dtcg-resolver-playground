# Design Token Playground

![screenshot showing side-by-side code editors in browser](./.github/screenshot.png)

This playground features a working example of [Design Token Specification](https://tr.designtokens.org/) tokens along with the [upcoming Resolver candidate](https://resolver-spec.netlify.app/) that allows for theming and composition.

> [!NOTE]
> This is only an example implementation of the Resolver specification. It is not considered canonical, and the proposal isn’t finalized. Expect changes to occur before being fully accepted in the specification.

## How to use

1. Select a design system from the presets
2. Edit code!
3. Select modifiers on the top right.
4. See the result on the bottom right. The highlighted lines show how your chosen modifiers affected the end result.

## Resolver spec feedback

Updated thoughts on [The Resolver Spec](https://docs.google.com/document/d/1LOtdiS8R903R7RwDd22JiDxljh51l7Xfy9M1D-p-9mU/edit?tab=t.0) since working on [dts-playground.pages.dev](https://dts-playground.pages.dev).

### Wins / perfect as-is

Design decisions that should be defended and kept.

- Having `resolver.json` be an additive “meta file” adds missing information to existing design systems in a friendly opt-in way.
- The concept of “sets” and “modifiers” is brilliant.
  - It’s backwards-compatible with most existing design tokens setups, because JSON files may retroactively be labeled as a “set” or “modifier” because of how Style Dictionary worked.
  - Modifiers not only describe the final values, they also describe the mechanisms for change itself, e.g. in web, a modifier could map to, say, a [@media query](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries), in iOS that could map to [a color scheme API](https://developer.apple.com/documentation/uikit/uiuserinterfacestyle), etc.. For multi-platform design systems, this could result in less drift between all the platforms.
- Inputs being a flat `Record<string, string>` is also perfect. It allows all the freedom any design system needs, without introducing undue complexity that would lead to collapse
- Being able to collect overrides all in a single file is an improvement over Terrazzo’s `modes` which force you to implement themes with a microscope, zoomed in on individual tokens but at the expense of being able to see overrides at a glance.

### Neutral

Papercuts that are annoying, but no obvious alternatives exist I can think of (“it is what it is“).

- Requiring dozens of token files to all share one universal schema is a PITA.
  - It would be nice to have some tool that enforces each file’s schema is compatible with the rest (i.e. a JSON Schema).
  - Bouncing around, trying to alias tokens that are in other files is just difficult no matter how you slice it. You’ll always have to futz with something on some level to get things to line up.
- 2 modifiers can’t act on the same tokens.
  - This is just a sad truth of any design system. You can’t have 2 modifiers that both override color tokens, otherwise they conflict with one another and the final values aren’t clear (for example, when should `theme: dark.json` take priority over `high-contrast: high-contrast.json`, or vice-versa? would we end up with a broken UI with some tokens in light mode, some in dark?). To solve this, you’d need a “resolver resolver” which becomes infinite, and circular.

> [!NOTE]
> Would it be overkill to throw an error if 2 separate modifiers declared overrides on the same tokens?

### Needs improvement

Omissions or flaws that need some change.

- Merging behavior needs more clear definitions, e.g.:
  - What happens if 2 conflicting tokens have different `$type`s?
    - Note: conflicting `$value`s is OK, since sets have defined resolution order, the “last wins”
  - What happens if 2 conflicting groups have different `$type`s?
  - What happens if 2 conflicting groups have different `$description`s?
    - Note: although there is an order here and “last wins,” it’s likely there’s an unintentional conflict here the user should be made aware of
- `modifier.type` should just be removed. It still hasn’t been defined yet, and its usecase is unclear.
  - Different types of modifiers require different syntax, which is unknown at this point
  - Modifier types could be a 2.0 breaking change in the future, if clearer needs & patterns arise
- `modifiers` should NOT automatically namespace tokens.
  - This breaks backwards-compatibility with all design systems. While it’s possible for a design system to retroactively select certain JSON files as “modifiers,” requiring all modifier tokens to be renamed with a `name` prefix would be a nonstarter.

> [!IMPORTANT]
> GitHub Primer has many color tokens that are usually prefixed with `base.color.*` or `functional.*`. If a modifier required one common prefix, then Primer would need a full top-to-bottom rename of everything, which would be untenable.

- `modifiers` need a `default` key to declare the initial value
- `modifiers` should be an object rather than an array.
  - The `name` is not only critical for functioning, it is also not allowed to conflict with other modifiers. So it should be a key instead.
  - Based on the existing concept, too, there shouldn’t be a “modifier order” in which they are applied, so the array order should be moot anyway (if you have multiple modifiers trying to act on the same tokens, you probably have a deeper structural issue that array order won’t be able to untangle)
- `modifiers.values` should also be an object, probably, for the same reasons
- `modifiers.values` shouldn’t be able to produce different token trees in the end
  - Having “Schrödinger tokens” that both “exist and don’t exist” based on modifier values will be in a broken state more likely than working, and should be prevented upstream.
  - Modifiers exist to alter **values,** not the presence/non-presence of tokens

> [!NOTE]
> It’s not necessary to require that all Sets declare all token values that the modifiers will overwrite. Rather, when 2 different modifier values produce completely different token trees with different IDs, that should be a problem.

- The concept of “sources” for Sets and Modifiers need more formal definition beyond “string”
  - example: [JSON Schema outlining document identifiers](https://json-schema.org/understanding-json-schema/structuring#schema-identification)
- `meta` should be renamed to `$extensions` as it describes tool-specific additions
- `meta` should not contain any core behavior (e.g. `meta.alias`, `meta.default`, etc.)
- No part of the resolver should be able to arbitrarily namespace tokens.
  - This creates a circular dependency between `resolver.json` and the source JSON files, with them declaring impossible aliases that rely on values in `resolver.json` that haven’t been built yet.
  - Further, if the alises themselves are already namespaced, then the tokens are aware of the namespacing and they might as well declare it there.
  - What if an arbitrarily-namespaced JSON file aliases within itself? Are all aliases recursively transformed? How can we transform aliases before resolving them? How do we know for sure it wasn’t trying to alias another token outside the file in a different namespace?
  - This would result in a resolution headache, trying to perform operations in a very precise and brittle chain, in order to get the only possible working end-values (keeping in mind that every modifier is allowed to arbitrarily namespace, AND load the same files resulting in different end tokens)
