# BizTrack Design Guide

BizTrack uses a calm, ledger-inspired visual style for Nepali small businesses:
deep green for the business identity, warm paper surfaces for the workspace, and
gold as a restrained accent. Keep data dense but scannable, with clear status
labels and familiar form controls.

## Brand colors

| Name | Hex | Use |
| --- | --- | --- |
| Pine green | `#0C3B37` | Sidebar, brand mark, and primary brand accents |
| Warm paper | `#F8F6F2` | App canvas and lightly tinted controls |
| Harvest gold | `#F4C44E` | Small highlights and the logo's chart accent |
| White | `#FFFFFF` | Cards, dialogs, and navigation text |
| Stone 900 | `#1C1917` | Main text (`text-stone-900`) |
| Stone 200 | `#E7E5E4` | Dividers, borders, and control outlines |

Use the existing semantic theme tokens for component surfaces and state colors:
`background`, `foreground`, `card`, `muted`, `border`, `input`, `ring`, and
`destructive`. Success and warning feedback use emerald and amber tones. The
global shadcn tokens are currently neutral; pine green is applied directly in
the app shell and branded dashboard areas.

## Typography

- **Plus Jakarta Sans** is the Latin UI and heading face, loaded through
  `next/font`.
- **Noto Sans Devanagari** provides Nepali-script fallback and text.
- **Geist Mono** is reserved for technical or tabular values where fixed-width
  alignment helps.

Use the existing Tailwind scale and hierarchy:

- Page title: `text-2xl font-semibold tracking-tight`
- Card or section title: `text-sm` to `text-lg`, semibold
- Body and form labels: `text-sm`
- Supporting text and metadata: `text-xs` or `text-[11px]`, muted
- Currency and totals: medium or semibold, with labels visually quieter

## Layout and components

- The desktop shell pairs a fixed-width pine-green sidebar with a white sticky
  top bar and a warm, neutral content canvas.
- Keep content centered and responsive; page content commonly uses
  `max-w-6xl`, with mobile-first horizontal padding.
- Cards and dialogs use white surfaces, subtle stone borders, and rounded
  corners. Keep related fields grouped and leave enough space for touch use.
- Use existing shadcn/ui buttons, inputs, selects, dialogs, cards, and badges.
  Keep status badges concise and pair color with readable text.
- Use Sonner toasts for operation success and failure. Keep field-specific
  validation close to its input, and keep toast placement at the bottom-right.
- Format monetary amounts in Nepali rupees (`Rs.`) and display dates in the
  existing localized format.
- Keep catalog names unambiguous: product names are unique per business, so
  include size or variant in the name. A person who is both a customer and
  supplier should use one `Both` party record.

## Brand mark

The BizTrack mark combines a ledger page and rising chart bars in warm paper and
gold over pine green. Use the same SVG app icon in the sidebar and browser icon;
keep clear space around it and do not recolor the mark ad hoc.
