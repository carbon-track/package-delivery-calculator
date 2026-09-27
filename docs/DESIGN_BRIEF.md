# Package Calculator Visual Design Brief

**Project:** CarbonTrack / Package Calculator  
**Version:** v1.1  
**Date:** 2026-09-26  
**Purpose:** visual and interaction guidance for AI agents and human implementers

---

## 1. Role of This Document

This brief is a **style and UI guidance document**. It is **not** the product source of truth.

- **Source of truth for product behavior, flows, structure, and wording:** `SPEC.md`
- **Role of this brief:** preserve the selected visual direction and provide implementation-friendly style guidance.

If any conflict exists between this brief and `SPEC.md`, follow **`SPEC.md`**.

Also note:
- mockup text is illustrative,
- labels/titles may be adapted during implementation,
- exact copy does **not** need to match the mockup,
- layout, tone, hierarchy, and interaction feel are more important than exact wording.

---

## 1.1 Authority Order for AI Agents

When implementing, use the following priority order:

1. **`SPEC.md`** — product behavior, routes, state, fields, validation, calculation rules, interaction requirements, and final product copy.
2. **`DESIGN_BRIEF.md`** — visual system, layout tendencies, interaction feel, responsive behavior, and art direction.
3. **Reference mockups** — visual examples only. Use them to infer composition, density, illustration language, spacing, and responsiveness; do **not** treat their words, numbers, navigation labels, or scientific claims as requirements.

If a mockup conflicts with the SPEC, the mockup must be adapted.

## 1.2 Approved Visual Reference Set

The following images are the approved reference family and should be used together rather than treating any single screen as pixel-perfect final design:

- `design_refs/00-style-anchor.png` — overall visual anchor / art direction
- `design_refs/01-unified-input.png` — unified manual + photo + text input
- `design_refs/02-package-layers.png` — confirmation and exploded package layers
- `design_refs/03-journey-result.png` — package journey and result breakdown
- `design_refs/04-scenario-compare.png` — baseline vs selected scenario comparison
- `design_refs/05-action-plan.png` — next-time action plan / suggestions

These images define the **visual family**, not final product wording. Exact titles, copy, numbers, navigation labels, stage names, and claims shown inside the images are placeholders unless they are also defined in `SPEC.md`.


## 2. Selected Style Direction

The chosen direction is the **third concept family**, now expanded into the approved reference set listed below. These references define the intended visual family for the prototype.

### Short description
A **playful, cartoony, warm, game-like package journey interface** with:
- a cute eco-adventure feeling,
- a map/journey metaphor,
- toy-like 3D-ish illustrations,
- rounded UI panels,
- colorful action cards,
- clear mobile-first structure,
- a friendly rather than corporate tone.

### Stylistic inspiration
- casual/cozy management games,
- package-lab / delivery-adventure feeling,
- approachable educational products,
- playful eco-tech branding.

The direction may be **inspired by cooking/management game energy**, but should **not depend on direct imitation of any single game's exact assets**.

---

## 3. Core Visual Principles

### 3.1 Overall tone
The UI should feel:
- cheerful,
- optimistic,
- accessible,
- kid-friendly but still usable by teens/adults,
- clear and interactive,
- playful without becoming messy.

### 3.2 What should stand out
- the package journey,
- the before-vs-after comparison,
- scenario buttons,
- large result summaries,
- editable packaging layers.

### 3.3 What should stay controlled
- data density,
- text amount per card,
- visual noise,
- number of competing accent colors in a single section.

---

## 4. Layout Language

### 4.1 Preferred structure
Use a **modular card-based layout**.

Common building blocks:
- hero card or hero map area,
- feature/action cards,
- result summary card,
- package layer card,
- journey step card,
- scenario comparison card,
- bottom navigation on mobile.

### 4.2 Card style
Cards should generally have:
- large rounded corners,
- soft shadows,
- light borders or no visible hard borders,
- comfortable padding,
- strong internal hierarchy.

### 4.3 Visual hierarchy
Prefer this order:
1. page title / current task,
2. primary action,
3. package/journey visual,
4. main result,
5. supporting details,
6. secondary actions.

---

## 5. Illustration Direction

### 5.1 Illustration style
Use a **clean 2.5D / pseudo-isometric cartoon style**:
- rounded forms,
- simple geometry,
- soft shading,
- toy-like delivery props,
- minimal facial detail,
- high readability at small sizes.

### 5.2 Common illustrated objects
- cardboard box,
- filler paper,
- tape roll,
- truck / van,
- warehouse / origin building,
- home / destination,
- map pin,
- CO2 cloud/result icon,
- leaf / eco badge,
- signboards,
- small helper characters.

### 5.3 Character style
Small helper characters may appear, but they should:
- remain secondary,
- not distract from the product,
- look rounded and simplified,
- avoid highly detailed facial features,
- function as scene flavor only.

---

## 6. Color System Direction

Use a playful but controlled palette.

### 6.1 Primary colors
- **Leaf Green** for primary actions and eco emphasis
- **Sky/Water Blue** for journey, transport, and informational areas
- **Warm Orange** for package, materials, and attention moments
- **Soft Cream / Off-white** for cards and content areas

### 6.2 Functional scenario colors
Keep the three scenario actions visually distinct:
- **Return:** orange / coral
- **Use less packaging:** green
- **Closer origin:** blue

### 6.3 Avoid
- excessive neon,
- too many gradients at once,
- dark enterprise dashboards,
- muddy low-contrast surfaces.

---

## 7. Typography Direction

Typography should feel:
- rounded,
- friendly,
- bold in headlines,
- highly legible on mobile.

### 7.1 Use cases
- **Display/headline:** playful, chunky, rounded
- **Section title:** bold sans serif
- **Body text:** clean, readable sans serif
- **Numbers/results:** large and very clear

### 7.2 Important note
The exact written copy shown in mockups is **placeholder-quality guidance**. Implementation copy may change.

Agents should preserve:
- tone,
- hierarchy,
- clarity,
- compactness.

But they should not hard-code all mockup text as final product content.

---

## 8. Mobile Behavior

This product must feel **excellent on mobile first**.

### 8.1 Mobile patterns
Preferred mobile UI patterns:
- vertically stacked sections,
- large tap targets,
- bottom navigation or sticky primary action when helpful,
- collapsible details,
- compact journey steps,
- swipe-free critical flows whenever possible.

### 8.2 Mobile content order
On mobile, prioritize:
1. current screen goal,
2. primary action,
3. key visual,
4. result summary,
5. detail cards,
6. deeper explanation.

### 8.3 Desktop adaptation
Desktop may expand into:
- side-by-side cards,
- wider hero illustration,
- pinned comparison areas,
- multi-column layouts.

---

## 9. Motion and Interaction Feel

Motion should feel:
- bouncy but not chaotic,
- friendly,
- light,
- informative.

### 9.1 Good motion examples
- subtle card hover lift,
- package layer expansion,
- route reveal,
- number card fade/slide in,
- scenario change highlight,
- progress step emphasis.

### 9.2 Avoid
- long cinematic transitions,
- excessive particle effects,
- noisy floating animations,
- motion that slows task completion.

Reduced motion support is required.

---

## 10. Page-by-Page Visual Guidance

### 10.1 Home / Landing
Visual focus:
- adventure/journey feeling,
- package map or package world,
- immediate CTA.

Should communicate:
- this is interactive,
- you can build one package,
- you can compare scenarios,
- the experience is simple and playful.

### 10.2 Unified Input Page
Visual focus:
- editable package parts,
- clear entry options,
- strong affordance for cards/forms,
- AI assist as helper.

Possible layout:
- package parts list,
- image/text assist block,
- compact package preview,
- sticky CTA.

### 10.3 Confirm Package / Package Layers
Visual focus:
- exploded packaging view,
- identifiable layers,
- editable components,
- status chips such as known / estimated / unknown.

### 10.4 Journey / Result Page
Visual focus:
- path from origin to destination,
- step-by-step transport story,
- total footprint card,
- visible breakdown.

### 10.5 Compare Scenario Page
Visual focus:
- one selected scenario,
- baseline pinned,
- changed item highlighted,
- easy restoration of original.

### 10.6 Action Plan / Suggestions
Visual focus:
- 1–3 friendly action cards,
- low-pressure guidance,
- “save for next time” tone rather than guilt.

---

## 11. Component-Level Style Notes

### Buttons
- rounded,
- medium to large,
- strong color fill,
- icon-friendly,
- obvious primary/secondary distinction.

### Chips / Tags
Useful for:
- demo/user mode,
- known / estimated / unknown,
- scenario type,
- source/assumption status.

### Scenario cards
Should be instantly recognizable and color-coded.
Include:
- icon,
- short title,
- one-sentence explanation,
- small change/result badge if relevant.

### Result cards
Should use:
- large number,
- short interpretive phrase,
- optional supporting icon/illustration.

### Journey strip
May be illustrated as:
- path,
- step nodes,
- small buildings/vehicles,
- directional arrows.

---

## 12. Implementation Guidance for AI Agents

### 12.1 What agents should copy from the mockups
Agents should preserve:
- overall art direction,
- card shapes,
- playful eco-game feel,
- major layout structure,
- scenario color logic,
- mobile-first stacking patterns,
- package journey metaphor.

### 12.2 What agents should NOT copy too literally
Agents should not overfit to:
- exact headline words,
- exact button labels,
- exact numerical values,
- exact illustration arrangement,
- every decorative object.

### 12.3 What agents must defer to SPEC for
Always defer to `SPEC.md` for:
- routes/screens,
- state model,
- scenario behavior,
- AI constraints,
- calculation logic,
- interaction rules,
- field requirements,
- definitions of done.

---

## 13. “Do / Don’t” Summary

### Do
- keep the product cheerful,
- keep the layout very readable,
- use playful illustration without sacrificing usability,
- make mobile layouts feel intentional,
- keep comparison obvious,
- use consistent scenario colors,
- keep inputs approachable.

### Don’t
- make it look like a corporate analytics dashboard,
- overload one screen with too much copy,
- rely on tiny form controls,
- let decoration overwhelm functionality,
- treat mockup text as final product copy,
- break functional rules from `SPEC.md`.

---

## 14. Deliverables This Brief Supports

This brief should guide:
- additional concept mockups,
- final UI layouts,
- component library design,
- front-end implementation,
- motion design choices,
- agent-generated UI code.

---

## 15. Approved Direction Lock

For v1 implementation, the visual direction is now considered **selected**. AI agents should not independently redesign the product into a different aesthetic unless explicitly asked. They may make local UI decisions to improve usability or responsiveness while preserving:

- the cozy package-adventure visual language,
- the rounded card system,
- the 2.5D/pseudo-isometric illustrations,
- the green/blue/orange functional palette,
- the mobile-first hierarchy,
- the journey-map metaphor,
- the clear distinction between baseline and scenario states.

The implementation does **not** need to match the reference images pixel-for-pixel. Prefer reusable components, accessible controls, and correct product behavior over visual imitation.

