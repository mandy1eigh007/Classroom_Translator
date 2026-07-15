# ClassLingo Visual Standard

## Design Position

ClassLingo is a sharp, visual, mobile-first tool for adults in the trades. It should feel cold, durable, and immediately scannable: dark steel, cut-glass surfaces, hard cyan edges, and controlled high-visibility color. It is not a soft school app, a corporate dashboard, or a children's product.

## Core Palette

- Canvas: near-black steel navy. Use dark blue-green depth, never cream or paper-white page backgrounds.
- Primary type: high-contrast white or near-white.
- Structural edge: electric cyan. Every actionable or selectable block gets a precise cyan rim.
- Structural accent lines: cyan to yellow, used as centered dividers, rails, progress, and orientation.
- Punch color: safety orange/red, reserved for a selected state, a critical action, or an alert.
- Neutral glass: smoked navy-blue with transparency. It should read as cool, dense material, never as a white haze.

## Build Contract

- Use `public/visual-guardrails.css` as the shared layer during rollout. It is added after page-specific CSS so its `cl-*` primitives win without rewriting application behavior.
- Do not use the existing `public/style.css` as a visual reference; it is the retired cream schoolbook system and remains untouched until its pages are migrated.
- Use `cl-shell` once per page, then compose `cl-card`, `cl-tile`, `cl-input`, `cl-button`, `cl-divider`, `cl-label`, `cl-meta`, and `cl-title` from the markup that already exists.
- Never change IDs, event hooks, request behavior, or form names during a visual pass unless the task requires it.

## Tokens

- Canvas: `#06131d`; deepest canvas: `#020a11`.
- Cyan edge: `#13d6d1`; divider endpoint: `#c6ee35`; teal secondary action: `#0fa9a8`; selection/critical: `#fb694a`.
- Card corner radius: `3px`. Touch targets: at least `44px` high.
- Shared card fill: smoked navy gradient from `rgba(20,48,69,.78)` to `rgba(3,12,23,.95)`.
- Shared chrome: cyan one-pixel rim, dark lower bevel, cool inner highlight, controlled cyan spill. No soft white outer glow.

## Type

- Headlines and navigation: uppercase, compact, high contrast, with clear line breaks.
- Supporting copy: readable mixed case in a lighter weight than headings.
- Labels: short and direct. Visual grouping must do as much work as the words.
- Never use oversized body copy, playful rounded type, or dense explanatory blocks.

## Surfaces And Edges

- Cards and tiles use a dark, smoked-blue glass fill with restrained transparency.
- Corners are tight: 3px to 4px. No pill cards.
- Every interactive block has a one-pixel cyan edge, a hard dark lower bevel, and a subtle cold inner highlight.
- Shadows are directional and crisp. Avoid pale bloom, fuzzy white shadows, or glossy plastic effects.
- The glass should look cool and cuttable: dimensional, layered, and dark enough to hold white type.

## Layout

- Mobile first. Preserve generous breathing room between major groups, then use compact, easy-to-scan control blocks inside them.
- Use clear vertical order: identity, task, action, supporting detail.
- Prefer two-column tile grids for short visual choices; use full-width blocks for decisions that need reading room.
- Keep visual anchors aligned. Fixed badge/flag areas stay vertically aligned across a grid.

## Buttons And Tiles

- Buttons are blocky, direct, and high contrast. White is acceptable for a primary entry action; teal is acceptable for a secondary action.
- Selection is unambiguous: safety orange/red surface or rail, never a subtle tint alone.
- Tiles should favor visual recognition. Use approved functional imagery such as language flags or interface glyphs when it reduces reading load.
- English/primary labels stay left; secondary language labels must not crowd or displace the primary label.

## Component Recipes

- Shell: dark technical grid at low opacity; one full-width cyan-to-yellow rail near the top.
- Card: smoked glass, 3px corners, cyan rim, teal left spine only when it is a major task panel.
- Tile: same glass, rim, lower bevel, and inner highlight as a card; use a short state rail only when it clarifies a choice.
- Divider: `4px` to `5px` high and full usable width, cyan-to-yellow. Center the section title above it; never use a short floating breaker line.
- Input: dark inset surface with cyan edge and yellow focus outline. Labels are small uppercase mono text.
- Primary button: white fill with cyan edge. Secondary button: teal fill with cyan edge. Selected, destructive, error, or alert action: orange/red.
- Status: cyan for neutral/success; orange/red for warning/critical. Do not introduce extra semantic colors.
- Iconography: use only functional imagery that reduces reading load. No decorative icons, emoji, or ornamental symbols.

## Responsive Rules

- Start at `390px` wide. A screen must not require horizontal scrolling or clipped text.
- Stack task controls vertically by default. Two columns are allowed only for short, immediately scannable choices.
- Keep the main task before supporting detail. Full-width actions follow the fields they submit.
- At `720px` and above, increase card padding and page gutters; do not inflate type or turn compact controls into oversized panels.
- Desktop layouts may add columns for parallel work, but preserve the mobile reading order and use the same primitives.

## States

- Default: smoked glass with cyan edge.
- Hover: lift one pixel and strengthen the cold cyan spill. Active: drop three pixels toward the bevel.
- Focus: yellow outline with a two-pixel offset. Never remove keyboard focus.
- Selected: orange/red surface or rail plus a readable dark label. Do not rely on color alone when the control supports an accessible selected state.
- Disabled: retain shape and edge, reduce opacity, and remove movement.
- Empty/loading: use a concise muted mono status inside the same card or tile; no illustrated placeholders.

## Accent System

- Use cyan-to-yellow rails as complete structural breaks, not decoration everywhere. Rails span the usable width of their section or card; section titles are centered above them while supporting text remains left aligned.
- The top orientation rail belongs to the page flow and scrolls away. Text must never run behind a fixed or floating rail.
- Thin technical-grid or contour detail may live quietly in the background at very low opacity.
- Cyan edges establish the shared system. Cyan-to-yellow rails differentiate structure; orange/red remain reserved for selected, critical, or alert states.

## Do Not Use

- Cream, beige, pastel classroom palettes, rainbow tile sets, or soft educational-app styling.
- Rounded, bubbly cards; excessive blur; white fog over glass; inflated drop shadows.
- Decorative gradients, floating blobs, generic stock imagery, or decorative symbols that do not improve scanning.
- Corporate SaaS layout habits: card stacks inside cards, vague copy, tiny low-contrast labels, or feature-tour language.

## Quality Check

Before a page is approved, check it at a 390px mobile width. The first screen must read as ClassLingo without explanation: dark steel canvas, white hierarchy, cut-glass cyan-edged controls, and disciplined cyan-to-yellow guidance.

## Visual QA Gate

- Check 390px mobile, 768px tablet, and a desktop width before approval.
- Confirm every interactive block has the cyan rim and a 44px minimum touch target where relevant.
- Confirm every structural divider is centered and cyan-to-yellow; orange/red appears only for selection, critical actions, errors, or alerts.
- Confirm no short or incomplete breaker lines remain, and no text can scroll behind the top rail.
- Confirm headings are uppercase/high contrast, support text is lighter weight, and no secondary text crowds the primary task.
- Confirm no cream, pastel, pill, white-fog glass, fuzzy white shadow, rainbow accent system, or nested-card layout remains.
- Put eyes on screenshots and check the browser console before each page is presented. Do not commit or deploy until Mandy approves the page.
