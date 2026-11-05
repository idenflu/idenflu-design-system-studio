# Icon sources

The original 43 icons were copied from the user-provided local project:
`idenflu-wes-intro/design-system/icons`.

The source uses a 24 × 24 viewBox, 1.5px outline strokes, butt line caps and
miter joins. Original filenames and source records are preserved; geometry
refinements are documented below. Components apply their own foreground
color and size through CSS masks or images.

Four missing utility icons (`copy`, `settings`, `trash-2`, `eye-off`) come from
the official `lucide-static@0.468.0` package. Their stroke width, caps and joins
were normalized to the same 1.5px / butt / miter rules; paths were preserved.

Original source license: `LICENSE.txt`.
Supplementary Lucide license: `LICENSE-LUCIDE.txt`.

## Studio additions

The following 32 outline icons were drawn for this studio, following the same
24 × 24 / 1.5px / butt / miter rules. They are original additions. Official
MUI, Material Symbols, Ant Design, Heroicons and Lucide references informed
the concept selection, not the SVG paths:

`home`, `folder`, `edit`, `save`, `external-link`, `refresh`, `bell`, `chat`,
`heart`, `star`, `bookmark`, `image`, `attachment`, `globe`, `users`,
`shield-check`, `dashboard`, `chart-bar`, `chart-line`, `cart`, `credit-card`,
`receipt`, `tag`, `briefcase`, `camera`, `location`, `send`, `help-circle`,
`logout`, `undo`, `redo`, `sort`.

Twenty original filled counterparts were drawn separately, using the existing
`-fill` filename suffix:

`home-fill`, `folder-fill`, `bell-fill`, `chat-fill`, `heart-fill`, `star-fill`,
`bookmark-fill`, `image-fill`, `users-fill`, `shield-check-fill`,
`dashboard-fill`, `cart-fill`, `credit-card-fill`, `receipt-fill`, `tag-fill`,
`briefcase-fill`, `camera-fill`, `location-fill`, `send-fill`, `help-circle-fill`.

Each filename is also its React `Icon` name and CSS `icon-<name>` suffix.
The original 47 assets and their source/license records above are preserved.
These 52 additions and the application icon below brought the catalog to
100 SVG files before the workflow expansion below. The current catalog has
140 SVG files: 106 outline icons and 34 filled icons.
Research sources and selection rationale: [icon-research.md](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/research/icon-research.md).

## Component sprite

The separate `../icons.svg` sprite is the source for the planned 0.4.2 React
icon components. It contains outline variants only and may differ from these
preserved 0.4.1 assets. Its `copy`, `visibility-off`, `trash`, `download`,
`upload`, `folder`, `menu`, `moon`, and `rotate` drawings derive from matching
drawings in the local `idenflu-design-system/packages/icons/src/icons.svg`
sprite; `trash` was subsequently adjusted. `user` follows that sprite's
`person` drawing, and the composite user drawings use it as a reference.
`folder-open` was redrawn using a user-provided Lucide example as a reference.
The additional `arrow-right-left`, `asterisk-square`, `calendar-clock`,
`crop`, `file-pen`, `folder-input`, `folder-output`, `line-height`, `list`,
`pen-line`, `play-disabled`, `restart`, `rotate-asterisk`, `table`, `table2`,
`text`, and `tree` drawings come from the same local design system sprite.
Other drawings originate from the
assets documented here and have been adjusted for the icon design principles.

## Application icons

`microsoft-excel` is an original monochrome drawing of an X tile and worksheet
grid, identifying Microsoft Excel while following the studio's existing
24 × 24 / 1.5px / butt / miter rules. It uses currentColor like the other icons.

## Workflow expansion · 2026-11-04

Twenty-two original outline icons were drawn for this studio using the same
24 × 24 / 1.5px / butt / miter rules:

`sort-ascending`, `sort-descending`, `filter-clear`, `columns`, `pin`, `pin-off`,
`drag-handle`, `more-vertical`, `file-text`, `folder-open`, `archive`, `share`,
`printer`, `user-plus`, `user-minus`, `login`, `unlock`, `error-circle`, `ban`,
`sliders`, `maximize`, `minimize`.

Lucide, Heroicons and Carbon informed the concept selection, not the SVG
paths. The existing studio theme button's original `sun` and `moon` drawings
were also moved into canonical SVG files. These 24 additions are all outline
icons; no existing outline or filled assets were replaced.

## Status and access-control expansion · 2026-11-04

Four status icons use the official `lucide-static@0.468.0` geometry, normalized
to 24 × 24 / 1.5px / butt / miter:

- `circle-dashed` ← `circle-dashed`
- `circle-dot` ← `circle-dot`; the central dot is filled at radius 2 for small sizes
- `pause-circle` ← `circle-pause`
- `minus-circle` ← `circle-minus`

Six access icons adapt geometry from the same Lucide release:

- `key` ← `key-round`
- `id-card` ← `id-card`; the frame corner radius is reduced to 1
- `hierarchy` ← `network`
- `crown` ← `crown`
- `user-check` ← `user-check`; the existing mono head and shoulder geometry is used
- `user-settings` combines the mono person geometry with the `settings` outline;
  the larger, continuous gear silhouette stays distinct at small sizes

Lucide license: `LICENSE-LUCIDE.txt`. The pinned SVG source is
`https://github.com/lucide-icons/lucide/tree/0.468.0/icons`.

`error-circle-fill` and `ban-fill` are original inverse drawings of the mono
outline assets. `shield`, `shield-alert`, `shield-off` and `user-lock` reuse
and combine the existing mono shield, person and lock geometry.

The following existing drawings were refined with their filenames retained:

- `error-circle`, `ban`: radius 10, matching the other circular status frames
- `unlock`: the same 18 × 11 body as `lock`
- `person`, `person-fill`, `user-plus`, `user-minus`: radius-4 heads and consistent shoulder curves
- `file-text`, `filter-clear`: reuse the corresponding base silhouette
- `pin-off`: preserve the pin silhouette and add clearance around the slash
- `share`, `microsoft-excel`: improve small-size spacing and simplify detail
- `calendar-fill`, `receipt-fill`, `image-fill`: widen internal cutouts to 2 units
