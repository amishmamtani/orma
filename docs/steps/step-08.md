# Step 8 — Frontend design + implementation

**Status:** ⏳ Pending
**Depends on:** Step 7 ✅

---

## Goal

Design and implement the final frontend. This step has two phases that must happen in order: **design first, then implement**. Do not start implementation without an approved design.

The bar is high: the app should feel professional and polished enough that a non-technical user trusts it immediately. Not a developer tool. Not a prototype. A product.

---

## Phase A — Design

Before writing any code, the design must be figured out. This means:

- Layout: where does the code panel sit relative to the diagram? How does the edit panel open?
- Node appearance: what do diagram nodes look like? Card? Pill? How is the label displayed?
- Interaction: what does hover look like? What does "selected" look like?
- Color and typography: what is the palette, the font, the visual weight?
- The edit panel: label hierarchy, input treatment, prompt output block, copy button
- Empty and loading states: what does the app look like before any code is pasted?

**How to run the design phase:**
Start a session with the explicit goal of designing the UI — not implementing it. Use that session to explore options, produce a clear description or mockup of the intended design, and get it approved before touching any code. Reference `docs/product.md` (UX principles) throughout.

The output of Phase A is a written design spec in the Notes section of this file: layout, palette, typography, component-by-component description. That spec is what Claude implements in Phase B.

---

## Phase B — Implementation

Once the design spec in Notes is filled in and approved, implement it. Styling only — no behavior changes. The functional loop from Steps 3–7 must remain intact.

**What to do:**
- Apply the approved design spec to all components
- Remove all leftover scaffold styles (`App.css` has unused template styles from Vite)
- Ensure the diagram is the visual primary surface; code panel is muted and secondary
- Test at multiple viewport sizes

**Load these docs before implementing:**
- `docs/product.md` — UX principles
- The Notes section of this file (the design spec from Phase A)

---

## How to test

- Open the app fresh (no prior context) and ask: does it look like a product, or a dev prototype?
- Show it to one person who didn't build it. Do they know what to do without explanation?
- Diagram is visually primary, code panel is secondary — confirmed?
- Labels are legible at all diagram zoom levels?
- Edit panel feels calm and focused, not cluttered?

---

## Done when

- [ ] Phase A: design spec written in Notes below and approved
- [ ] All components match the approved design
- [ ] No leftover scaffold styles
- [ ] Diagram is visually primary; code panel is visually secondary
- [ ] App looks intentional to someone who didn't build it

---

## Notes — Design spec

*(Phase A complete. Approved 2026-06-11.)*

---

### Mental model

The canvas is the base layer — full-screen, always visible. All UI elements float on top of it via z-index. There is no traditional page layout. Think Figma, not a webpage.

---

### Base layer — Canvas

- Full-screen React Flow canvas, `#111` background, dotted grid
- Flowchart columns render here, one per function
- No scrollbars — pan and zoom inside React Flow

---

### Floating panel 1 — Code panel (top-left)

- Position: fixed, top-left, inset ~16px from edges
- Size: ~35% viewport width, ~90% viewport height
- Background: `#252525`, rounded corners (~12px), subtle border
- **Header bar**: `main.py` pill (blue dot + filename) on the left · `▶ Run` button on the right
- **Empty state**: ghost mascot centered + *"Hi! I'm Orma, Press Enter to start typing or drag or drop your python file"* in muted text
- **With code**: syntax-highlighted Python (dark theme), scrollable, read-only
- Ghost disappears once code is present

---

### Floating panel 2 — Function tabs (top, canvas area)

- Position: fixed top, starting to the right of the code panel
- One pill tab per function: colored dot + `function_name`
- Colors cycle per function (green → pink → cyan → ...) — exact hex TBD
- Clicking a tab scrolls/pans the canvas to that function's column

---

### Floating panel 3 — Toolbar (bottom-center)

- Position: fixed bottom, centered in the canvas area (right of code panel)
- Contains: zoom in · zoom out · fit view · delete selected node · add node
- Replaces React Flow's default Controls widget
- Left of toolbar: tool controls · Right of toolbar: `Generate Prompt` button (indigo)

---

### Floating panel 4 — Prompt panel (bottom, full-width)

- Hidden by default. Appears when `Generate Prompt` is clicked.
- Slides up from the bottom, full canvas width (spanning right of code panel to edge)
- Dark background matching overall theme, rounded top corners
- Header: `□ Copy` pill (top-left) · `—` minimize · `✕` close (top-right)
- Body: generated prompt text, scrollable
- Minimize collapses it to a thin bar; close dismisses it entirely

---

### Diagram nodes

- Shape: rounded rectangle cards
- Background: dark blue-grey (approx `#1e2030`) — exact hex TBD
- Text: white, centered, 13–14px
- **Function header node**: colored dot (matching tab) + `function_name()` — slightly different style to read as a title
- **Regular nodes** (action, loop, condition, end): same card, plain white label
- **Edges/arrows**: thick, colored to match the function's accent color
- Node types (loop, condition) can keep a subtle tint difference — TBD

---

### Color palette

- Page/canvas bg: `#111111`
- Code panel bg: `#252525`
- Node cards: `#1e2030` (approx) — **TBD, user will supply**
- Function accent colors: **TBD, user will supply** (cycling palette)
- Generate Prompt button: indigo (~`#4f46e5`)
- Muted text: `#6b6b6b`
- White text: `#f5f5f5`

---

### Typography

- Font: system sans-serif (Inter if available) — TBD
- Node labels: 13–14px, regular weight
- Function headers: 13px, medium weight
- Tab pills: 12–13px

---

### Empty / loading states

- Empty: ghost + tagline in code panel (see above)
- Parsing (Run clicked): `▶ Run` button shows spinner / "Running…", code panel dims slightly
- Prompt generating: `Generate Prompt` button shows spinner, prompt panel opens with skeleton text
- Error: red-tinted message replaces content in the relevant panel
