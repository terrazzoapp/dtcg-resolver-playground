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
  - I imagine most design systems can retroactively label their token files as fitting into a “Set” or “Modifier” in a way that makes sense to them, with few to no changes.
  - Modifiers not only describe the final values, they also describe the mechanisms for change itself, which is immensely useful. For example, in web, a modifier could map to, say, a [@media query](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries), in iOS that could map to [a color scheme API](https://developer.apple.com/documentation/uikit/uiuserinterfacestyle), etc.. For multi-platform design systems, this could result in less drift between all the platforms.
- Inputs (modifier values) being a shallow `Record<string, string>` map is also perfect. It allows all the freedom any design system needs, without introducing undue complexity that would lead to collapse
- Being able to collect overrides all in a single file (e.g. `colors/dark.json`) is an improvement over Terrazzo’s `modes` which force you to implement themes with a microscope, zoomed in on individual tokens but at the expense of being able to see a theme at a glance.

### Neutral

Papercuts that are annoying, but no obvious alternatives exist I can think of (“it is what it is“).

- Requiring dozens of token files to all share one universal schema is a PITA.
  - It would be nice to have some tool that enforces each file’s schema is compatible with the rest (e.g. a JSON Schema).
  - Bouncing around, trying to alias tokens that are in other files is just difficult no matter how you slice it. You’ll always have to futz with something on some level to get things to line up.
- 2 modifiers can’t act on the same tokens.
  - This is just a sad truth of any design system. You can’t have 2 modifiers that both override color tokens, otherwise they conflict with one another and the final values aren’t clear (for example, when should `theme: dark.json` take priority over `high-contrast: high-contrast.json`, or vice-versa? would we end up with a broken UI with some tokens in light mode, some in dark?). To solve this, you’d need a “resolver resolver” which becomes infinite, and circular.
  - Best practice is to always have 1 modifier operate on one type of tokens (e.g. only have one color theme modifier, where you declare things like `dark` and `dark-high-contrast` as individual themes). Any abstraction you make on top of this only exacerbates the problem, and makes it more complex. However, teaching people about this isn’t easily doable from any modification to this proposal I can think of.

> [!NOTE]
> Would it be overkill to throw an error if 2 separate modifiers declared overrides on the same tokens?

### Needs improvement

Omissions or flaws that need some change.

#### Undefined / unclear

- Merging behavior needs more clear definitions, e.g.:
  - What happens if 2 conflicting tokens have different `$type`s?
    - Note: conflicting `$value`s are OK. But `$type`s aren’t because they cascade to all downstream aliases, resulting in a broken system.
  - What happens if 2 conflicting groups have different `$type`s? (because it potentially affects all aliases)
  - What happens if 2 conflicting groups have different `$description`s?
    - Note: although there is an order here and “last wins,” it’s likely there’s an unintentional conflict here the user should be made aware of
- `modifiers` need a `default` key to declare the initial value
- `modifiers.values` shouldn’t be able to produce different token trees in the end
  - Having “Schrödinger tokens” that both “exist and don’t exist” based on modifier values will be in a broken state more likely than working, and should be prevented upstream.
  - Modifiers exist to alter **values,** not the presence/absense of tokens

> [!NOTE]
> It’s not necessary to require that all Sets declare all token values that the modifiers will overwrite. Rather, when 2 different modifier values produce completely different token trees with different IDs, that should be a problem.

- The concept of “sources” for Sets and Modifiers need more formal definition beyond “string”
  - example: [JSON Schema outlining document identifiers](https://json-schema.org/understanding-json-schema/structuring#schema-identification)

#### Needs change

- `modifiers` should NOT automatically namespace tokens.
  - This is the single decision that would break backwards compatiblity with all existing design systems.
    - While it’s possible for a design system to retroactively select certain JSON files as “modifiers,” requiring all modifier tokens to be renamed with a `name` prefix would be a nonstarter.
    - Mature design systems would simply ignore this proposal, and continue doing what they were doing before.
  - Beyond the burden of token renaming, it inverts the nature of `resolver.json`, changing it from a pure backwards compatible addition that _describes_ the source JSON, into a _schema enforcer_ and _mutator_ of source JSON.
  - It changes the fundamental nature of aliasing, neither result of which is ideal. Either source JSON:
    - **Alias to the final tokens,** in which case what’s the point? If the tokens already are aware of the namespacing, why not live in the source?
    - **Alias to pre-namespaced tokens,** in which case toolmakers have to deep-crawl and transform all aliases (assuming it’s even possible to transform an alias before resolving it), and hope that we didn’t make a mistake somewhere (e.g. what if namespaced and non-namespaced tokens exist? What was the original intent of the alias?). This is likely untenable, because aliases are no longer predictable.

> [!IMPORTANT]
> GitHub Primer’s tokens would not work with the Resolver proposal if modifiers namespaced everything. Their color system relies on setting the values of `color.*`, `display.*`, `bgColor.*`, `fgColor.*`, and more that get overridden by different modifiers (i.e. one modifier, 6+ different roots). They have such a complex, mature color system, having to rename all tokens in one change would be impossible.

- `modifiers` should be an object rather than an array.
  - The `name` is not only critical for functioning, it is also not allowed to conflict with other modifiers. So it should be a key instead.
  - Based on the existing concept, too, there shouldn’t be a “modifier order” in which they are applied, so the array order should be moot anyway (if you have multiple modifiers trying to act on the same tokens, you probably have a deeper structural issue that array order won’t be able to untangle)
- `modifiers.values` should also be an object, probably, for the same reasons

- `meta` should be renamed to `$extensions` as it describes tool-specific additions

#### Needs removal

- `modifier.type` (e.g. `"type": "enumerated"`). The types haven’t all been defined yet, and the usecases are unclear.

  - Different types of modifiers require different syntax, which is unknown at this point
  - Modifier types could be a 2.0 breaking change in the future, if clearer needs & patterns arise

- `meta` should not contain any core behavior (e.g. `meta.alias`, `meta.default`, etc.)
