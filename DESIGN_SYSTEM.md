# DESIGN_SYSTEM.md

## Purpose

This is the canonical visual system for SlopVault. It exists to keep the product visually calm, structurally precise, and consistent while preserving the dark, utilitarian, provenance-heavy character defined in the core docs.

This system is for the MVP that stores, retrieves, and shares AI creations. The parser and vault are the center. Seed and journey views are supporting provenance surfaces, not the first screen the user must learn.

## Executive Design Calls

- Dark mode only.
- Capture first. Retrieval second. Sharing third. Browsing fourth.
- The signed-in product is vault-first, not feed-first.
- There is one clear ingestion surface for every input type.
- The first public share unit is the artifact.
- For text artifacts, the shareable experience is "prompt + result" when the prompt is available.
- `artifact` is the primary product term. `fruit` can be tested later as optional flavor, not structure.
- Seed and journey views are secondary, advanced surfaces layered on top of artifact capture.
- Ingestion type complexity is handled by the system; the user should not have to understand internal distinctions before importing.

## Design Direction

SlopVault should feel like:

- a precise private workshop
- a quiet archive of messy intelligence
- a dark tool built for long sessions, not a glossy social app

It should not feel like:

- a consumer creator marketplace
- a soft rounded productivity dashboard
- a public feed optimized for performance theater

## Vocabulary

- `Artifact`: the saved unit the user can retrieve, view, and share
- `Prompt`: the input text that may be shown alongside a text artifact
- `Output`: the model result or saved result within an artifact
- `Seed`: a deeper idea object and provenance container
- `Journey`: the advanced lineage view for a seed

Use `artifact` in navigation, cards, and filters. Avoid mixing `artifact`, `output`, and `fruit` in the same screen.

## Color Tokens

### Core Neutrals

| Token | Value | Use |
|------|-------|-----|
| `color.bg.canvas` | `#0A0B0D` | app background |
| `color.bg.shell` | `#0F1217` | nav shell, persistent rails |
| `color.bg.panel` | `#141923` | cards, forms, inspectors |
| `color.bg.panelStrong` | `#1A2130` | selected or elevated panels |
| `color.bg.input` | `#11161F` | fields, textarea, code blocks |
| `color.bg.hover` | `#1D2533` | hover states |
| `color.fg.strong` | `#F3F5F7` | primary text |
| `color.fg.base` | `#D3D8E2` | body text |
| `color.fg.muted` | `#98A2B3` | metadata |
| `color.fg.subtle` | `#6B7280` | disabled or low-priority text |
| `color.border.base` | `#283041` | standard borders |
| `color.border.strong` | `#364154` | active borders |
| `color.border.subtle` | `#1A2030` | low-contrast separators |

### Accent and States

| Token | Value | Use |
|------|-------|-----|
| `color.accent.primary` | `#C5F277` | primary action, active highlight |
| `color.accent.primaryInk` | `#101407` | text on primary accent |
| `color.state.public` | `#C5F277` | public state |
| `color.state.shared` | `#79C8FF` | shared with others / linked |
| `color.state.unresolved` | `#F4B860` | unresolved placement |
| `color.state.inferred` | `#67E8D1` | inferred provenance |
| `color.state.success` | `#79E2A0` | success |
| `color.state.error` | `#F07D86` | error |

### Color Rules

- Use the accent sparingly. One primary action per screen gets accent fill.
- Do not tint entire layouts with accent color.
- Use state colors for labels, chips, and small indicators, not full panels.
- Public and private must be visually distinguishable at a glance.

## Typography Tokens

### Font Families

| Token | Value | Use |
|------|-------|-----|
| `font.ui` | `"Space Grotesk", "Segoe UI", sans-serif` | headings, UI, buttons |
| `font.mono` | `"IBM Plex Mono", "SFMono-Regular", monospace` | provenance, prompt snippets, code, badges when needed |

### Type Scale

| Token | Size / Line | Use |
|------|--------------|-----|
| `type.display` | `36 / 44` | landing section title, hero moments |
| `type.h1` | `28 / 36` | page title |
| `type.h2` | `22 / 30` | panel title |
| `type.h3` | `18 / 26` | card title, section heading |
| `type.body` | `15 / 24` | default body copy |
| `type.bodyCompact` | `14 / 20` | dense rows |
| `type.meta` | `12 / 18` | timestamps, labels, helper text |
| `type.label` | `11 / 16` | overlines, small chips, field labels |

### Typography Rules

- Use at most three visible text sizes per panel.
- Metadata belongs in `type.meta` or `type.label`, never in body size.
- Provenance strings, hashes, and model labels use `font.mono`.
- Avoid center-aligned body copy.

## Spacing Tokens

| Token | Value |
|------|-------|
| `space.1` | `4px` |
| `space.2` | `8px` |
| `space.3` | `12px` |
| `space.4` | `16px` |
| `space.6` | `24px` |
| `space.8` | `32px` |
| `space.12` | `48px` |
| `space.16` | `64px` |
| `space.20` | `80px` |

### Rhythm Rules

- Default panel padding: `24px`
- Dense row padding: `12px 16px`
- Default page gutter: `24px` desktop, `16px` mobile
- Default vertical section gap: `32px`
- Do not mix `20px`, `28px`, `36px`, or other off-scale values without adding a token first

## Layout Tokens

| Token | Value | Use |
|------|-------|-----|
| `layout.rail.left` | `248px` | desktop left rail |
| `layout.rail.right` | `320px` | desktop inspector |
| `layout.content.readable` | `720px` | long-form text and prompt/result detail |
| `layout.content.wide` | `960px` | dashboard and stash views |
| `layout.actionBar.desktop` | `88px` | persistent bottom action zone |
| `layout.actionBar.mobile` | `72px` | mobile action zone |
| `layout.topbar.mobile` | `56px` | mobile top bar |

### Responsive Rules

- Mobile is the default layout.
- Under `960px`: right inspector becomes a slide-over sheet.
- Under `960px`: left rail becomes a drawer.
- Under `640px`: all pages become single-column; bottom action bar remains persistent.
- The journey view may remain center-dominant on large screens, but on mobile it becomes stacked: canvas first, inspector second, actions pinned.

## Border, Radius, and Shadow Tokens

| Token | Value | Use |
|------|-------|-----|
| `radius.control` | `8px` | buttons, inputs |
| `radius.panel` | `10px` | cards, panels |
| `radius.badge` | `999px` | state chips |
| `border.default` | `1px solid var(--color-border-base)` | default border |
| `shadow.panel` | `0 12px 40px rgba(0, 0, 0, 0.28)` | elevated overlay only |

### Surface Rules

- Panels are defined by border contrast first, shadow second.
- Avoid soft floating cards everywhere. Most surfaces should feel anchored.
- Use strong shadows only for dialogs, sheets, and active inspectors.

## Motion Tokens

| Token | Value |
|------|-------|
| `motion.fast` | `120ms` |
| `motion.base` | `180ms` |
| `motion.slow` | `240ms` |
| `motion.ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |

### Motion Rules

- Animate only to clarify hierarchy, focus, or placement.
- Allowed MVP transitions: sheet open/close, inspector swap, parse preview reveal, selected path focus, hover elevation.
- Avoid decorative looping animation.

## Iconography

- Use one icon set only. Recommended: Lucide.
- Default icon size: `16px`
- Dense metadata icon size: `14px`
- Action icon size: `18px`
- Do not mix outline and filled icon families.

## Component Recipes

### App Shell

- Background: `color.bg.canvas`
- Left rail: `color.bg.shell`, fixed on desktop
- Center: max width by page purpose
- Right inspector: `color.bg.panel`, separated by border
- Bottom action zone: anchored, high-contrast divider, one primary action

### Dump Surface

- Full-width dominant textarea or drop zone
- Paste area uses `font.mono` only for raw input preview, not for all UI
- Parse action is the single accent button
- Parsed preview lives beside or below the raw input, never above it
- Support four visible entry modes within the same surface:
  - pasted conversations
  - provider export JSON uploads
  - standalone artifact uploads or paste
  - standalone prompt uploads or paste
- Batch standalone artifact intake supports up to `10` items in one action
- The screen should communicate "bring whatever you have" rather than "choose the correct import type"

### Export Guide Sheet

- Lives inside the dump surface as a help drawer, sheet, or inline expandable guide
- Provides exact provider-specific export steps
- Must support at least ChatGPT, Claude, Gemini, and Grok guidance content
- Guidance is secondary but always discoverable from the ingestion hub
- The guide should be procedural and calm, not marketing copy

### Artifact Card

- Title first
- One preview layer only
- Metadata line: source, date, state, tags
- Share state visible without opening the card
- Do not add social counts to private cards

### Artifact Detail

- Main content occupies the readable column
- Prompt/result relationship is explicit when prompt exists
- Provenance lives in the right inspector
- Share action sits near the title, not buried in metadata

### State Badge

- Always use pills for state, never free-floating colored text
- Variants required: private, public, shared, unresolved, inferred

### Empty State

- One sentence maximum
- One primary next action
- No illustrations

## Accessibility Rules

- Minimum touch target: `44px`
- Focus ring must use a dedicated visible style, not browser default suppression
- All body copy must maintain accessible contrast against dark surfaces
- Color never carries state alone; combine color with text or icon
