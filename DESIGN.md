---
name: Scouting Report
description: Wallet PnL filed as a scout's report on the 20–80 scale, typed onto canary carbonless form paper.
colors:
  desk: "#1e2a8a"
  paper: "#f8f1b6"
  paper-2: "#efe5a0"
  print: "#1c1b16"
  print-2: "#5e5838"
  ink: "#1e2a8a"
  ink-2: "#4b559e"
  stamp: "#b81f2a"
  rule: "#1e2a8a6b"
  rule-soft: "#1e2a8a33"
  wash: "#1e2a8a12"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 62.5"
  grade:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "clamp(4.5rem, 10vw, 6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "15px"
    fontWeight: 750
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  body-print:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
    fontVariation: "'wdth' 87.5"
  label:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 75"
  stamp:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 62.5"
rounded:
  none: "0px"
spacing:
  hair: "4px"
  cell-x: "14px"
  cell-y: "10px"
  tool: "22px"
  block: "36px"
  sheet-x: "64px"
  sheet-y: "40px"
components:
  button-file:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  button-file-hover:
    backgroundColor: "{colors.print}"
    textColor: "{colors.paper}"
  field-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "4px 0 3px"
  field-input-focus:
    backgroundColor: "{colors.wash}"
  field-cell:
    backgroundColor: "{colors.paper}"
    padding: "9px 14px 11px"
  section-bar:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.print}"
    typography: "{typography.headline}"
    padding: "8px 14px"
  stamp-down:
    textColor: "{colors.stamp}"
    typography: "{typography.stamp}"
    padding: "6px 14px 5px"
  stamp-up:
    textColor: "{colors.ink}"
    typography: "{typography.stamp}"
    padding: "6px 14px 5px"
  ledger-row-hover:
    backgroundColor: "{colors.wash}"
---

# Design System: Scouting Report

## Overview

**Creative North Star: "The Carbon Copy Dossier"**

Every wallet is filed as a paper scouting report: a single canary sheet of continuous carbonless form paper lying on a carbon-blue desk, its pin-feed strips perforated down both sides. The form itself is printed in black condensed Archivo; everything the scout enters is typed in carbon-blue Courier Prime. Grades live on a printed 20–80 scale and get circled in pen as the report files. A rubber stamp delivers the verdict.

The page is dense and ruled, like an office form: 1px carbon-blue field boxes are the layout grid, not decoration around it. Nothing floats, nothing is rounded, and there are no cards. The only depth in the world is the sheet lifting off the desk. The verdict comes first (overall grade, stamp, three tool grades), then the typed evidence: totals, best calls, positions ledger, swap log, scout's notes, and method and limits at the foot.

The dark variant flips the material, not the grammar: a blue-black carbon sheet on a near-black desk, with pale cream print and pale periwinkle ink.

**Key Characteristics:**
- Two voices: printed form (Archivo, condensed via the wdth axis, black) and typed entries (Courier Prime, carbon blue, tabular figures).
- Field boxes ruled in 1px carbon blue are the grid; heavier 1px print-black rules open each major band.
- Hand marks on top of print: pen loops around grades, a triangular caret on the overall scale, an X typed in tick boxes, a rotated rubber stamp.
- Square everything. Zero radius anywhere.
- Motion is the act of filing: pen draws, caret drops, stamp thunks, typing cursor blinks.

## Colors

A two-pigment office palette: canary paper, carbon-blue ink, black print, and one red for losses and adverse stamps.

### Primary
- **Carbon Blue** (`ink`): every typed entry, every live state (focus outline, focused-field underline, hover text, checked X, pen loops, caret, selection), and the File report button fill. Also the desk (`desk`) the sheet lies on.

### Secondary
- **Rubber-Stamp Red** (`stamp`): negative PnL values, the "Not profitable" and "Returned" stamps, field validation errors and invalid underlines. Never decorative.

### Neutral
- **Canary Form Paper** (`paper`): the sheet, field cells, select options, the inverse text on the File button.
- **Second-Ply Canary** (`paper-2`): section header bars only, and the scrollbar track.
- **Press Black** (`print`): printed labels, headings, the heavy top rule of each band, tick-box outlines, scale ticks.
- **Faded Press** (`print-2`): secondary printed text: formula basis lines, minor scale numbers, section meta, footer, the "No record / Awaiting subject" stamp.
- **Faint Carbon** (`ink-2`): secondary typed text: placeholders, past log lines, ranks, grade descriptors, struck-through closed quantities.
- **Field Rule** (`rule`, carbon blue at 42%): field box borders, dashed perforation lines, dotted input underlines.
- **Soft Rule** (`rule-soft`, carbon blue at 20%): inner cell dividers, ledger row lines, tool dividers.
- **Carbon Wash** (`wash`, carbon blue at 7%): hover and focus fill on rows, tick boxes, focused inputs, "Show all" bars.

### Dark variant
Applied under `prefers-color-scheme: dark` (unless `data-theme="light"`): desk `#070917`, paper `#12163a`, paper-2 `#191e4a`, print `#ece6c2`, print-2 `#b3ac86`, ink `#b4beff`, ink-2 `#8c96d6`, stamp `#ff7a7a`. Rule, soft rule and wash re-derive from the new ink. The stamp's `multiply` blend switches to `normal`.

### Named Rules
**The Carbon Owns Live Rule.** Anything interactive or in motion is carbon blue: focus, hover, the checked mark, the cursor, the pen. Print black is static form; red is only for loss and refusal.

**The Two Pigments Rule.** Gains are not green. A positive number is carbon blue set bold; a negative number is stamp red set bold. No other hue enters the sheet.

## Typography

**Display / Label Font:** Archivo (variable, with the `wdth` axis), fallback Arial Narrow, sans-serif.
**Typed Font:** Courier Prime 400/700, fallback Courier New, monospace.

**Character:** A printed government-form face pushed to its condensed widths for the form, against a typewriter face for everything the scout fills in. Which voice a string uses tells you whether it is the form or the data.

### Hierarchy
- **Display** (Archivo 800, wdth 62.5%, clamp(2.4rem, 4.6vw, 3.6rem), line-height 0.88, uppercase): the form title "Scouting Report" in the header, once per page.
- **Grade** (Courier Prime 700, clamp(4.5rem, 10vw, 6rem), line-height 1): the overall grade at poster scale, circled in pen.
- **Headline** (Archivo 750, wdth 75%, 15px, 0.07em, uppercase): section bar titles (Best calls, Positions, Swap log, Scout's notes, Method & limits).
- **Title** (Courier Prime 700, 22–24px): tool grades and the overall grade descriptor.
- **Body** (Courier Prime 400, 15–17px, line-height 1.45–1.5, tabular figures): all typed entries: inputs, verdict line (max 52ch), ledgers, log, notes.
- **Body Print** (Archivo 400, wdth 87.5%, 12.5–13.5px, print-2): formula basis lines, method list (max 70ch), section meta, footer.
- **Label** (Archivo 650, wdth 75%, 11px, 0.08em, uppercase): every field label and ledger column head. The printed caption of a form box.
- **Stamp** (Archivo 800, wdth 62.5%, 26px, 0.1em, uppercase): the verdict stamp only.

### Named Rules
**The Form-or-Entry Rule.** Printed text (labels, headings, method) is Archivo in print black. Data (numbers, addresses, tokens, sentences about this wallet) is Courier Prime in carbon blue. Never set data in Archivo or form labels in Courier.

**The Width-Axis Rule.** Archivo hierarchy comes from the wdth axis (62.5% / 75% / 87.5%) as much as from size. Condense, don't enlarge.

## Layout

One sheet, max 1280px wide, centred on the desk with 40px margins and 64px side padding (room for the 32px pin-feed strips). Inside, every band is a CSS grid of ruled cells whose borders are the grid lines: cells carry right and bottom 1px rules, the band carries the left rule, and a 1px print-black rule caps the top of each band.

- **Header:** 3fr title cell / 9fr fields on a 12-column sub-grid (subject 6, chain/period/meta 3 each, links 6).
- **Verdict:** 7fr overall grade / 5fr tool grades, 18px below the header.
- **Totals:** seven equal cells under the verdict.
- **Sections:** 36px apart, each opened by a section bar, then a ledger table or best-call grid (auto-fit, min 200px).
- **Notes row:** two equal columns with a 40px gutter.

Cell padding sits around 9–12px vertical, 14px horizontal; tool rows 14–16px by 22px.

Responsive: at 1100px the header stacks and totals go to 4 columns. At 860px the sheet goes full-bleed (no margin, 16px padding, no shadow or pin-feed strips), the verdict stacks, and optional ledger columns hide. At 560px the subject input and button stack, the record and totals go to 2 columns, best calls go to one column, and the stamp shrinks to 19px.

## Elevation & Depth

Flat paper on a flat desk. The one shadow belongs to the sheet itself; everything on the sheet is ink, print and rules, with no layering between cells.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 24px 48px -16px rgb(4 6 30 / 0.55), 0 2px 6px rgb(4 6 30 / 0.3)`; dark: `rgb(0 0 0 / 0.7)` and `/ 0.5`): the form lifting off the desk. Removed at 860px when the sheet goes full-bleed.

### Named Rules
**The One Sheet Rule.** Only the paper casts a shadow. Panels, buttons and stamps never get their own elevation.

## Shapes

Strictly rectilinear: 0 radius on every element, including the button and inputs (`border-radius: 0` is set explicitly). Forms come from rules, not fills: solid 1px field boxes, dotted 1px input underlines, dashed 1px perforation lines beside the pin-feed holes (radial-gradient punch holes on a 24px pitch). The only non-rectangular marks are hand-made: the open, wobbly pen loop (an SVG path that overshoots its start) and the downward triangular caret. The stamp is a double-ruled rectangle (3px border plus 1px outline at 3px offset), rotated -8deg.

## Components

### Buttons
- **Shape:** square (0 radius).
- **File report (primary):** carbon-blue fill, paper text, Archivo label voice at 13px, wdth 75%, 700, 0.08em, uppercase; padding 6px 14px (10px 14px at phone width).
- **Hover / Active:** fill turns print black over 160ms; pressed nudges down 1px. Focus uses the global 2px carbon outline at 2px offset.
- **Show-all bar (tertiary):** full-width, borderless, left-aligned label-voice text in carbon blue; carbon wash on hover.
- **Icon links:** typed-voice carbon text plus a 16px stroked SVG icon (copy, check, out-arrow); underline on hover.

### Inputs / Fields
- **Style:** each field is a ruled cell with a printed label on top; the entry is typed carbon-blue text (17px) on a transparent background over a 1px dotted rule underline.
- **Focus:** the underline goes solid carbon blue and the field takes the carbon wash. No outline ring.
- **Error:** underline turns stamp red; a 13px stamp-red message appears below.
- **Select:** same as input, with an inline SVG chevron in faint carbon.
- **Tick boxes (radio groups):** 15px square print-black box on paper; checked state is a typed carbon-blue "X". Wash on hover, 2px outline on focus.

### Section bars
Second-ply canary strip, print-black rule above and field rule below, headline-voice title left and print-2 meta (or tick boxes) right.

### Ledgers
Full-width tables, 1px soft rules between rows, label-voice column heads, typed-voice cells with right-aligned tabular numbers. Rows take the carbon wash on hover. Closed quantities are struck through in faint carbon. Losses are stamp red; SELL is set in print black, BUY in bold carbon.

### Grade scale (signature)
A printed 13-step scale (20 to 80 in fives) under a 1px print-black rule, with tick marks (8px at tens, 5px at fives) and tens set bold. A tool grade is circled with a pen loop; the overall grade gets a carbon caret dropping onto the scale.

### Pen loop (signature)
An SVG loop in carbon ink with round caps, drawn on with a 700ms stroke-dashoffset animation, staggered per grade so the report visibly files: overall first, then the tool grades top to bottom. 1.4px stroke around the poster grade, 5.5px (in its scaled viewBox) around scale numbers.

### Stamp (signature)
One per report, top right of the overall cell. "Not profitable" and "Returned" are stamp red; "Profitable" uses carbon blue; "No record" / "Awaiting subject" is a dashed, unanimated print-2 stamp. It thunks in (scale 1.6 to 1) last and uses `multiply` blend on light paper.

### Typing log
The filing state: streamed progress lines in typed voice prefixed by "›", past lines faint carbon, the current line ending in a blinking carbon block cursor.

## Do's and Don'ts

### Do:
- **Do** draw every new layout region as ruled field cells (1px `rule` borders, print-black rule on top of each band).
- **Do** put every data value in Courier Prime carbon blue with tabular figures, and every caption in the 11px condensed uppercase label voice.
- **Do** mark positive values bold carbon and negative values bold stamp red.
- **Do** express a grade on the printed 20–80 scale and mark it by hand (pen loop or caret).
- **Do** keep the filing sequence: pen loops, then caret, then the stamp last.
- **Do** honour `prefers-reduced-motion`: loops render fully drawn, stamp and caret appear without animation, the cursor stops blinking.

### Don't:
- **Don't** round corners, add cards, or give anything but the sheet a shadow.
- **Don't** introduce green, gradients, or any hue beyond paper, print, carbon and stamp red.
- **Don't** put more than one stamp on a report.
- **Don't** build the dark crypto dashboard (big portfolio number, chart, glowing panels); the dark variant is a carbon sheet, not a dashboard.
