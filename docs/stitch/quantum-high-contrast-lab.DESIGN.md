---
name: Quantum High-Contrast Lab
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6c9'
  on-secondary: '#2f3033'
  secondary-container: '#4a4b4e'
  on-secondary-container: '#bbbbbe'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e2e5'
  secondary-fixed-dim: '#c6c6c9'
  on-secondary-fixed: '#1a1c1e'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: 0.04em
  headline-xl-mobile:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: 0.03em
  headline-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: 0.03em
  headline-lg-mobile:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: 0.02em
  body-xl:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.02em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0.06em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.05em
spacing:
  gutter: 2rem
  margin: 2rem
  space-xs: 0.5rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2.5rem
  space-xl: 4rem
---

## Brand & Style

This design system delivers an ultra-accessible, tactile, and cyber-mechanical laboratory interface built specifically for educational exploration of Grover's quantum search algorithm. Designed fundamentally for low-vision and non-sighted users, the system prioritizes extreme perceptual clarity, uncompromising tactile feedback, and structural geometry over decorative aesthetics.

### Aesthetic & Movement
- **Cyber-Mechanical Instrument Clarity:** Heavy industrial test-equipment metaphors, bold physical delineations, stark high-contrast visual channeling, and unambiguous state transitions.
- **Radical Functional Minimalism:** No decorative photography, no gradient distractions, no subtle shadows, and zero chromatic dependence. Every visual cue serves as an immediate spatial, structural, or amplitude indicator.

### Core Tenets
- **Geometry as Data:** Amplitude, probability distribution, and target states are conveyed strictly through scaled geometric areas (e.g., area-scaled concentric rings, stroke weights, and contrasting shape primitives) rather than hue differences.
- **Structural Affordance:** Components appear physical, robust, and punchy. Hit states, toggles, and focus registers provide instant spatial feedback capable of withstanding extreme zoom, magnification lenses, and inverted display engines.

## Colors

The system uses an uncompromising monochromatic architecture. Hue cannot communicate state, value, selection, or quantum target status. All functional states depend on polarity inversion, geometric framing, and structural fill changes.

### Palette Architecture
- **Primary Canvas (`#080808`):** Deep, pure-neutral near-black providing the non-reflective void foundation.
- **Surface Elevated (`#141414`):** Secondary container background with hard 3px–4px structural boundaries.
- **Active Structural White (`#ffffff`):** Pure stark white applied to critical glyphs, prominent labels, filled active states, and primary interaction perimeters.
- **Secondary Zinc Structural (`#e4e4e7`):** High-reflectance structural silver used for secondary frame borders, inactive amplitude outlines, and sub-labels.
- **Muted Barrier (`#27272a`):** Dense low-luminance divider stroke used strictly for static non-interactive grid guides.

### Polarity & State Logic
- **Resting Interactive State:** Deep black backdrop (`#080808`), solid `#ffffff` 3px border, `#ffffff` content.
- **Focused State:** Mandatory 4px outer offset focus ring in pure `#ffffff` separated by a 2px `#080808` gap.
- **Active / Selected State (Inverted):** Complete polarity reversal. Solid `#ffffff` background fill with deep `#080808` text and iconography.
- **Quantum Target State:** Represented by concentric dual-line enclosures and continuous geometric animation/haptic frequency, never by hue shifts.

## Typography

Typography prioritizes legibility at high zoom and extreme astigmatic or low-vision degradation. Atkinson Hyperlegible Next provides distinctive letterforms (disambiguating 'I', '1', 'l', and 'O', '0'), while JetBrains Mono conveys mechanical values, qubit registers, matrix indices, and computational states.

### Scaling & Rules
- **Floor Size:** The absolute minimum text size anywhere in the interface is 20px (`body-lg` / `label-md`). Microcopy is strictly prohibited.
- **Font Weight Baseline:** Body text uses a minimum weight of 700 (Bold) to preserve stroke integrity against pure black backgrounds under display anti-aliasing.
- **Letter Spacing:** Extended letter spacing throughout prevents optical merging of characters under heavy magnification.
- **Leading Ratio:** Generous line-height (1.4x to 1.6x) guarantees distinct vertical tracking across physical screen magnifiers.

## Layout & Spacing

Layout operates on an unapologetic structural grid designed for rapid macro-scanning and physical pointer stability.

### Rhythm & Philosophy
- **Tactile Density:** Layout zones are carved out by structural borders rather than empty whitespace alone. Every interactive group is boxed in a clear perimeter.
- **Expansive Touch Envelopes:** Interactive targets feature a hard minimum touch footprint of 64px × 64px, with default primary button targets reaching 72px–80px height.
- **Adaptive Grid Structure:**
  - **Desktop / Large Displays:** 4-column macro-grid with 2rem (`32px`) gutters and margins. Qubit register visualizers sit on distinct segmented planes.
  - **Tablet:** 2-column stacked operational flow, preserving 64px minimum target barriers.
  - **Mobile:** 1-column linear command stack. Margins tighten to 1.5rem (`24px`), maintaining all typographic and tap target minimums. Content reflows vertically without reducing stroke widths or scale factors.

## Elevation & Depth

This system rejects soft drop shadows, blurs, and pseudo-skeuomorphic light diffusion. Visual depth is strictly binary, mechanical, and architectural.

### Elevation Principles
- **Bold Border Framing:** Hierarchy is established exclusively through stroke weight variations (3px secondary, 4px primary/focus) and tonal background shifting (`#080808` canvas vs. `#141414` elevated modules).
- **Hard Mechanical Offset:** When an elevated component or active modal requires separation, it employs a hard mechanical cutout shadow: a solid `#ffffff` 4px border paired with a hard, zero-blur 6px offset block shadow (`box-shadow: 6px 6px 0px 0px #ffffff`).
- **Surface Nesting:** Embedded sub-circuits or nested quantum states live within recessed containers framed by continuous 3px solid `#e4e4e7` borders.

## Shapes

The design system enforces a sharp geometric paradigm (`roundedness: 0`). Sharp corners emphasize the raw, cyber-mechanical test-bench environment, ensure clean alignment across thick outlines, and preserve structural clarity when zoomed by screen magnifiers.

### Shape Primitives
- **Rectangles (0px Radius):** All buttons, badges, modals, panels, and register cards have crisp 90-degree right angles.
- **Data Circles:** Pure mathematical circles are reserved solely for quantum probability amplitudes and rotation phases. Circular bounds denote dynamic value visualization, creating an immediate semantic contrast with rectangular UI controls.

## Components

### Buttons & Action Controls
- **Physical Structure:** Minimum 64px height (default 72px). Border: 4px solid `#ffffff`. Background: `#080808`. Label: 22px JetBrains Mono in bold uppercase.
- **States:**
  - **Hover / Pointer-Over:** Inverts instantly to solid `#ffffff` background with `#080808` text.
  - **Keyboard / Assistive Focus:** Inverts background to `#ffffff`, text to `#080808`, and projects an external 4px outline offset by 3px (`outline: 4px solid #ffffff; outline-offset: 3px;`).
  - **Pressed / Active:** Retains filled state and translates 3px down and right to emulate a heavy mechanical micro-switch.

### Chips & Block Badges
- **Form:** Sharp rectangular blocks framed by 3px solid `#e4e4e7` borders.
- **Behavior:**
  - **Static Badges:** `#080808` background with `#e4e4e7` monospaced text.
  - **Interactive Toggles:** Active state triggers a solid `#ffffff` fill with black text and an internal 2px black inset ring.

### Checkboxes & Quantum Basis State Radios
- **Checkboxes:** 36px × 36px sharp square container with a 3px solid `#ffffff` border. Selected state renders a solid white square centered within (leaving a 4px black margin).
- **Quantum Basis Radios:** 40px diameter sharp circle with a 3px solid `#ffffff` border. Selected state fills an interior concentric solid white circle. When flagged as Grover's target state, the border expands to 6px with an oscillating outer boundary.

### Input Fields & Parameter Registers
- **Structure:** Minimum 64px height. Border: 3px solid `#e4e4e7`. Deep black `#080808` interior.
- **Typography:** 24px JetBrains Mono bold text.
- **Focus:** Border transitions to 4px solid `#ffffff` with a high-contrast 4px external focus outline.

### Quantum Amplitude Visualizer (Component Custom)
- **Concept:** Represents Grover's probability amplification using concentric circles rather than color gradients.
- **Structure:** A fixed 160px × 160px square cell with 3px solid `#27272a` crosshairs.
- **Visualization:** A solid white inner disc scales in radius proportionally to the state's probability $|α|^2$.
- **Target Indicator ("The Big One"):** The target qubit state is encased in dual 4px concentric rings with opposing diagonal hash markings across the perimeter, ensuring instantaneous visual and high-contrast recognition.

### Screen-Reader & Audio Coupling
- Every geometric amplitude transition must couple with real-time ARIA live region updates (e.g., `"Probability 78 percent, Target marked"`) and spatial audio pitch modulation corresponding directly to amplitude circle radius.
