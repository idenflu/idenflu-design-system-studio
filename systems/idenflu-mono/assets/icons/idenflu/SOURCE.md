# Icon sources

The original 43 icons were copied from the user-provided local project:
`idenflu-wes-intro/design-system/icons`.

The source uses a 24 × 24 viewBox, 1.5px outline strokes, butt line caps and
miter joins. Original paths and filled variants are preserved. Components
apply their own foreground color and size through CSS masks or images.

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
Together with these 52 additions, the canonical catalog contains 99 SVG files.
Research sources and selection rationale: [icon-research.md](../../../../../docs/icon-research.md).
