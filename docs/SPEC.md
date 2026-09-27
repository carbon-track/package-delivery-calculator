# Package Calculator Engineering Specification

**Project:** CarbonTrack Package Calculator  
**Version:** v1.0  
**Date:** 2026-09-26  
**Status:** Draft for implementation  
**Based on:** `包裹实验室_PRD_v0.2_包裹旅程与情景互动版`

---

## 1. Purpose

This specification translates the current product PRD into an implementation-ready engineering document for a lightweight web prototype.

The first version is a **mobile-first web application** that helps users:

1. build a representation of one package,
2. understand the packaging and delivery impacts of that package,
3. compare one alternative scenario at a time,
4. save one practical action for next time.

This document is the **technical source of truth** for engineering decisions. The PRD remains the **product source of truth**. If there is a conflict, product intent comes from the PRD, while data structures, APIs, and implementation contracts come from this SPEC.

---

## 2. Product Scope

### 2.1 In Scope for v1

- Mobile-first web prototype
- No login/account system
- No database
- No real logistics tracking
- No automatic order import
- No cold-chain support
- No cross-border full-chain calculation
- Unified package input experience with three entry methods:
  - manual card/form input,
  - photo-assisted draft generation,
  - short text-assisted draft generation
- Package confirmation view
- 2D package visualization
- 2D journey animation (shipment origin to destination)
- Three scenario comparisons:
  - return,
  - less packaging,
  - closer origin
- Baseline vs alternative comparison
- Action suggestion cards
- Session persistence in browser local storage
- Optional anonymous event logging only if explicitly enabled later

### 2.2 Out of Scope for v1

- User account system
- Multi-user collaboration
- Database-backed history
- Shopping platform integration
- Real-time package tracking
- Full LCA beyond packaging + delivery
- Product manufacturing footprint
- AI-generated emission numbers
- AI-generated factors or scientific claims
- Storing uploaded images permanently
- Combining multiple scenario changes at once

---

## 3. Recommended Tech Stack

### 3.1 Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Zod** for schema validation
- **Framer Motion** for lightweight UI/2D animation
- **SVG** for package layers, journey line, and icon-based visuals

### 3.2 Backend

- **Cloudflare Workers**
- **Cloudflare Static Assets** for SPA hosting
- Worker routes used only for:
  - AI-assisted draft generation
  - AI explanation generation
  - optional proxying and secret protection

### 3.3 Storage

- **Browser localStorage** only
- No database in v1
- No object storage required in v1

### 3.4 Testing

- **Vitest** for unit tests
- **React Testing Library** for component behavior
- Optional **Playwright** for end-to-end smoke tests

---

## 4. Architecture Overview

### 4.1 High-Level Principles

1. **Deterministic calculation:** carbon calculation must be pure and deterministic.
2. **AI is non-authoritative:** AI may assist input and explain results, but may never determine scientific calculation outputs.
3. **Single source of structured truth:** once a package is confirmed, all views derive from the same structured state.
4. **One change at a time:** v1 compares baseline against exactly one alternative scenario.
5. **Missing information is explicit:** unknown values must never be silently treated as zero.

### 4.2 System Separation

The system is divided into three layers:

#### A. Frontend experience layer
Responsible for:
- input flow,
- package visualization,
- journey animation,
- scenario controls,
- result rendering,
- action card rendering,
- local session persistence.

#### B. Calculation engine
Responsible for:
- packaging emissions,
- transport emissions,
- return scenario emissions,
- scenario comparison deltas,
- missing field diagnostics,
- factor versioning.

This engine must be pure TypeScript and independent of React.

#### C. AI service layer
Responsible for:
- drafting package components from photo/text,
- explaining already-computed results,
- generating short contextual suggestion text.

This layer must never:
- invent emission factors,
- invent total emissions,
- guess weight or route as confirmed fact,
- override calculation output.

---

## 5. Repository Structure

```text
package-calculator/
├── docs/
│   ├── PRD.md
│   ├── SPEC.md
│   └── TASKS.md
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── input/
│   │   ├── confirm/
│   │   ├── journey/
│   │   ├── compare/
│   │   ├── action/
│   │   └── ai/
│   ├── calculator/
│   │   ├── packaging/
│   │   ├── transport/
│   │   ├── scenarios/
│   │   ├── compare/
│   │   └── index.ts
│   ├── data/
│   │   ├── demo/
│   │   ├── factors/
│   │   └── templates/
│   ├── state/
│   ├── types/
│   ├── utils/
│   └── main.tsx
├── worker/
│   ├── index.ts
│   ├── routes/
│   ├── ai/
│   └── schemas/
├── tests/
├── package.json
├── vite.config.ts
└── wrangler.jsonc
```

---

## 6. Application State Model

### 6.1 App State

```ts
interface AppState {
  mode: "demo" | "user";
  flowStep: FlowStep;
  packageDraft: PackageInput;
  baselineSnapshot: PackageInput | null;
  baselineResult: CalculationResult | null;
  activeScenario: ScenarioSession | null;
  savedActionPlan: ActionPlan | null;
  ui: UIState;
}
```

### 6.2 FlowStep

```ts
type FlowStep =
  | "home"
  | "input"
  | "confirm"
  | "journey"
  | "compare"
  | "action";
```

### 6.3 UIState

```ts
interface UIState {
  reducedMotion: boolean;
  showAssumptionsPanel: boolean;
  showSourcesPanel: boolean;
  pendingAIRequest: boolean;
  errorMessage: string | null;
}
```

### 6.4 ScenarioSession

```ts
interface ScenarioSession {
  type: ScenarioType;
  alternativeInput: PackageInput;
  alternativeResult: CalculationResult | null;
  changedFields: ChangedField[];
}
```

---

## 7. Domain Models

### 7.1 Value State

Many user fields can be known, estimated, or unknown. Use a tagged union instead of optional primitives.

```ts
type ValueState<T> =
  | { kind: "known"; value: T; source: "user" }
  | { kind: "estimated"; value: T; source: "template"; templateId: string }
  | { kind: "unknown" };
```

### 7.2 Core PackageInput

```ts
interface PackageInput {
  id: string;
  mode: "demo" | "user";
  packageContext: "received" | "planning_purchase";
  item: ItemInfo;
  components: PackageComponent[];
  route: RouteInput;
  regionContext: RegionContext;
  notes?: string;
}
```

### 7.3 ItemInfo

```ts
interface ItemInfo {
  category:
    | "shoes"
    | "clothing"
    | "electronics"
    | "books"
    | "beauty"
    | "household"
    | "other";
}
```

### 7.4 PackageComponent

```ts
interface PackageComponent {
  id: string;
  layerOrder: number;
  type: PackageComponentType;
  material: ValueState<MaterialType>;
  quantity: number;
  massGrams: ValueState<number>;
  dimensionsCm?: ValueState<DimensionsCm>;
  isUserEditable: boolean;
}

type PackageComponentType =
  | "shipping_box"
  | "product_box"
  | "mailer_bag"
  | "paper_filler"
  | "plastic_filler"
  | "tape"
  | "label"
  | "other";

type MaterialType =
  | "corrugated_cardboard"
  | "paper"
  | "ldpe_plastic"
  | "mixed_plastic"
  | "kraft_paper"
  | "adhesive_tape"
  | "other"
  | "unknown";

interface DimensionsCm {
  length: number;
  width: number;
  height: number;
}
```

### 7.5 RouteInput

```ts
interface RouteInput {
  origin: LocationInput;
  destination: LocationInput;
  distanceKm: ValueState<number>;
  transportMode: ValueState<TransportMode>;
}

type TransportMode =
  | "parcel_van"
  | "truck"
  | "mixed_ground"
  | "unknown";
```

### 7.6 LocationInput

```ts
interface LocationInput {
  label: string;
  city?: string;
  countryCode?: string;
}
```

### 7.7 RegionContext

```ts
interface RegionContext {
  dataRegion: "none" | "demo" | "validated_region";
  factorDatasetVersion?: string;
  dataYear?: number;
}
```

---

## 8. Scenario Models

### 8.1 Scenario Types

```ts
type ScenarioType =
  | "return"
  | "less_packaging"
  | "closer_origin";
```

### 8.2 Scenario-Specific Inputs

```ts
interface ReturnScenarioInput {
  returnDestination: LocationInput;
  returnDistanceKm: ValueState<number>;
  extraPackaging: PackageComponent[];
}

interface LessPackagingScenarioInput {
  replacementComponents: PackageComponent[];
  protectionConditionNote: string;
}

interface CloserOriginScenarioInput {
  alternativeOrigin: LocationInput;
  alternativeDistanceKm: ValueState<number>;
  assumptionNote: string;
}
```

### 8.3 Scenario Rules

- The baseline package input must remain immutable after confirmation.
- Scenario application must create a new `alternativeInput` object.
- Only one scenario may be active at a time.
- Each scenario may modify only the fields relevant to that scenario.
- v1 must provide a “restore original” action.

---

## 9. Calculation Engine Contract

### 9.1 Design Requirements

The calculation engine must:
- be framework-independent,
- accept structured input,
- return full diagnostic output,
- expose missing inputs,
- never hide partial coverage,
- never depend on AI.

### 9.2 Main API

```ts
function calculatePackage(
  input: PackageInput,
  dataset: FactorDataset
): CalculationResult;

function compareScenario(
  baselineInput: PackageInput,
  alternativeInput: PackageInput,
  dataset: FactorDataset
): ScenarioComparisonResult;
```

### 9.3 CalculationResult

```ts
interface CalculationResult {
  packaging: ModuleResult;
  transport: ModuleResult;
  returnTrip?: ModuleResult;
  coveredTotalKgCO2e: number;
  completeness: "complete" | "partial" | "not_calculable";
  missingFields: MissingField[];
  assumptions: AssumptionNote[];
  factorDatasetVersion: string;
  resultVersion: string;
}
```

### 9.4 ModuleResult

```ts
interface ModuleResult {
  status: "calculated" | "partial" | "not_calculable";
  kgCO2eCovered: number;
  lineItems: ResultLineItem[];
  missingFields: MissingField[];
}

interface ResultLineItem {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  factorValue: number;
  factorUnit: string;
  kgCO2e: number;
  sourceRefIds: string[];
}
```

### 9.5 MissingField

```ts
interface MissingField {
  fieldPath: string;
  message: string;
  blocking: boolean;
}
```

### 9.6 ScenarioComparisonResult

```ts
interface ScenarioComparisonResult {
  baselineResult: CalculationResult;
  alternativeResult: CalculationResult;
  deltaKgCO2e: number | null;
  comparisonStatus: "comparable" | "partially_comparable" | "not_comparable";
  changedFields: ChangedField[];
  comparisonNotes: string[];
}

interface ChangedField {
  fieldPath: string;
  baselineLabel: string;
  alternativeLabel: string;
}
```

### 9.7 Calculation Logic Rules

#### Packaging
- Packaging emissions are calculated as:
  - `material mass × emission factor`
- If a component mass is unknown and no template estimate exists, that component is not silently counted as zero.
- Packaging module may still be partial if some components are known and others unknown.

#### Transport
- Transport emissions are calculated from:
  - distance,
  - transport mode,
  - shipment allocation rule,
  - factor dataset.
- If a route is only illustrative, it must be explicitly labeled as such.

#### Return scenario
- Return is an added module; it must not be modeled as “double the original shipment.”
- Extra packaging and return transport are separate line items.

#### Less packaging scenario
- Only component-level changes are allowed.
- The reduction must correspond to explicit changes in material or mass.
- Purely visual shrinkage without mass change is invalid.

#### Closer origin scenario
- Other conditions must remain fixed unless explicitly stated.
- Only origin/distance changes should affect this scenario in v1.

---

## 10. Factor Dataset Format

### 10.1 Requirements

All factor data must be versioned and static for a given release.

### 10.2 Example Schema

```ts
interface FactorDataset {
  version: string;
  region: string;
  year: number;
  materials: MaterialFactor[];
  transport: TransportFactor[];
}

interface MaterialFactor {
  material: MaterialType;
  kgCO2ePerKg: number;
  unit: "kgCO2e/kg";
  sourceRefId: string;
  sourceUrl: string;
  note?: string;
}

interface TransportFactor {
  mode: TransportMode;
  kgCO2ePerParcelKm?: number;
  kgCO2ePerTonneKm?: number;
  allocationMethod: string;
  sourceRefId: string;
  sourceUrl: string;
}
```

### 10.3 File Convention

```text
src/data/factors/
- factors-demo-v1.json
- factors-us-v1.json
- sources-demo-v1.json
```

---

## 11. AI Service Specification

### 11.1 Principle

AI is used only for:
- generating a draft from photo or short text,
- explaining calculation results,
- formatting suggestion cards.

AI is not allowed to:
- calculate emissions,
- invent sources,
- guess route, weight, or material certainty as fact,
- change confirmed structured package input without user confirmation.

### 11.2 Worker Endpoints

#### POST `/api/ai/package-draft`
Create a structured draft from text and/or an image.

Request:

```ts
interface PackageDraftRequest {
  text?: string;
  imageBase64?: string;
}
```

Response:

```ts
interface PackageDraftResponse {
  components: DraftPackageComponent[];
  draftWarnings: string[];
  unknownFields: string[];
}

interface DraftPackageComponent {
  type: PackageComponentType | "unknown";
  material: MaterialType | "unknown";
  quantity: number | null;
  confidence: number | null;
  inferredFrom: "text" | "image" | "both";
}
```

Rules:
- response must never include emission numbers,
- response must never include mass if not explicitly provided,
- response must never include route distance unless explicitly provided.

#### POST `/api/ai/explain-result`
Convert structured results into concise natural-language explanation.

Request:

```ts
interface ExplainResultRequest {
  baselineResult: CalculationResult;
  comparisonResult?: ScenarioComparisonResult;
  currentScenarioType?: ScenarioType;
  userConstraints?: {
    timeSensitivity?: string;
    transportAccess?: string;
  };
}
```

Response:

```ts
interface ExplainResultResponse {
  summary: string;
  suggestionCards: SuggestionCard[];
  caveats: string[];
}
```

### 11.3 Prompting Rules

The worker prompt must explicitly state:
- the model may explain only numbers already provided,
- the model may not produce new numeric estimates,
- uncertain items must remain uncertain,
- the output must be JSON validated by Zod.

### 11.4 Failure Handling

If AI fails:
- user must still be able to complete manual flow,
- fixed fallback text templates must be shown,
- no result screen is blocked purely by AI unavailability.

---

## 12. Persistence Specification

### 12.1 Local Storage Keys

```text
pcalc.session.v1
pcalc.actionPlan.v1
pcalc.ui.v1
```

### 12.2 Persisted Data

Persist:
- current package draft,
- baseline snapshot,
- active scenario selection,
- saved action plan,
- reduced motion preference,
- example/user mode.

Do not persist:
- raw image uploads,
- AI prompt text beyond current session necessity,
- any hidden secret,
- full AI conversation history.

### 12.3 Reset Behavior

“Clear session” must:
- remove session data from localStorage,
- remove saved action plan,
- restore app to initial state.

---

## 13. UI and Interaction Specification

### 13.1 Design Direction

Visual style should be **cartoonish, playful, friendly, and game-like**, inspired by cozy package-handling games and kitchen-management games.

Desired qualities:
- rounded shapes,
- layered cards,
- lively iconography,
- warm, high-contrast color system,
- soft shadows,
- toy-like package illustrations,
- expressive but not cluttered motion.

Avoid:
- photorealism,
- overly corporate dashboards,
- heavy data-table-first layouts,
- visually noisy particle effects.

### 13.2 Mobile-First Layout

Primary screens:
1. Home
2. Unified Input
3. Confirm Package
4. Journey View
5. Scenario Compare
6. Action Plan

### 13.3 Shared Layout Regions

Each non-home screen should include:
- top status/header,
- current mode chip (demo/user),
- main content panel,
- bottom navigation or next-step action.

### 13.4 Screen Behavior

#### Home
- Choose demo package or build own package.
- No login wall.

#### Input
- Manual cards are primary fallback.
- Photo/text AI assistance opens as helper, not replacement.
- All draft items must be explicitly confirmed.

#### Confirm
- Show package layers.
- Show editable components.
- Mark each field as user-known / estimated / unknown.

#### Journey
- Show simplified animated movement from origin to destination.
- Reveal package and transport contributions in sequence.
- Must support skip, replay, and reduced-motion fallback.

#### Compare
- Show baseline pinned.
- User may activate exactly one scenario.
- Show what changed.
- Show alternative result and delta if comparable.

#### Action
- Show 1–3 suggested next-time actions.
- User can save one plan or ignore all.

---

## 14. Animation Rules

### 14.1 Journey Animation

- Use 2D only.
- Use SVG or DOM animation; do not use 3D/WebGL.
- Animation is explanatory, not a simulation.
- Display sequence:
  1. package appears,
  2. route starts,
  3. transport contribution appears,
  4. arrival state shown,
  5. summary shown.

### 14.2 Reduced Motion

If reduced motion is enabled:
- replace animation with stepwise static state changes,
- preserve all information and labels.

### 14.3 Scenario Animation

Only replay the relevant changed portion.
Examples:
- return: append reverse route section,
- less packaging: swap relevant packaging layer,
- closer origin: shorten route.

---

## 15. Accessibility Requirements

The prototype must:
- support keyboard navigation,
- not rely on color alone to distinguish results,
- provide text labels for icons,
- provide alt text or accessible labels for illustrations,
- support reduced motion,
- maintain readable contrast.

---

## 16. Error Handling Rules

### 16.1 Input Validation

Use Zod validation for:
- package input,
- scenario input,
- factor dataset,
- AI JSON responses.

### 16.2 User-Facing Errors

Examples:
- “This field is still unknown.”
- “We can show only the covered parts of the estimate.”
- “AI draft unavailable. You can still enter the package manually.”

### 16.3 Blocking vs Non-Blocking

Blocking errors:
- malformed persisted state,
- invalid factor dataset,
- impossible scenario structure.

Non-blocking errors:
- AI timeout,
- partial data coverage,
- missing optional notes.

---

## 17. Analytics and Telemetry (Optional)

Telemetry is optional in v1 and must be off by default unless explicitly enabled.

If enabled later, only collect minimal event data such as:
- entered demo mode,
- completed first result,
- used a scenario,
- saved action plan.

Do not collect:
- full AI chat transcript,
- uploaded images,
- personal shipping identifiers.

---

## 18. Testing Requirements

### 18.1 Unit Tests

Required areas:
- packaging calculation
- transport calculation
- scenario comparison
- missing-field behavior
- no-zero-substitution for unknowns
- baseline immutability
- factor dataset parsing
- AI response schema validation

### 18.2 Example Test Cases

#### CALC-001 Packaging known mass
Given a cardboard component of 500 g and a valid cardboard factor, the packaging module must calculate a non-zero emissions value.

#### CALC-002 Unknown mass
Given a component with unknown mass and no template estimate, the component must not contribute zero silently; the module must report missing coverage.

#### SCEN-001 Return does not double shipment
Applying the return scenario must add return emissions as separate line items, not multiply the original shipment total by two.

#### SCEN-002 Less packaging preserves baseline
Applying less packaging must create a new alternative input while leaving baseline unchanged.

#### AI-001 Invalid AI schema
If the AI endpoint returns invalid JSON, the worker must reject it and the frontend must show fallback behavior.

#### UI-001 Reduced motion
When reduced motion is active, the journey screen must still present the same information without animated movement.

### 18.3 End-to-End Smoke Tests

Recommended smoke flows:
1. Demo mode complete flow
2. Manual input flow
3. AI draft flow with fallback
4. Compare each of the three scenarios
5. Reset session flow

---

## 19. Definition of Done for v1

v1 is complete only when all of the following are true:

1. User can complete the flow on mobile from home to action.
2. Manual input works without AI.
3. AI draft is optional and confirm-before-write.
4. Baseline result is visible and traceable.
5. All three scenarios work independently.
6. Baseline can be restored.
7. Unknown inputs are not treated as zero.
8. Journey animation can be skipped and replayed.
9. Reduced motion fallback exists.
10. Session persistence and reset both work.
11. AI failure does not block comparison flow.
12. Source/assumption panel exists.
13. Core calculator tests pass.
14. Build deploys on Cloudflare Workers + Static Assets.

---

## 20. Implementation Sequence (Recommended)

1. Scaffold repo and Cloudflare deployment
2. Define all TypeScript types and Zod schemas
3. Implement factor dataset format
4. Implement pure calculation engine
5. Add unit tests for calculator
6. Implement app state and local persistence
7. Build manual input + confirm screens
8. Build baseline results and journey screen
9. Build three scenario flows
10. Build action card flow
11. Add Worker AI endpoints with schema validation
12. Add AI-assisted draft and explanation UI
13. Polish visual style and animation
14. Run end-to-end smoke tests

---

## 21. Notes on PRD Revisions

The current PRD is strong enough to proceed into engineering without a full rewrite.

Recommended future PRD additions (optional, not blocking):
- define first validated region/data release plan,
- define exact demo package examples,
- define first factor dataset governance workflow,
- define whether anonymous telemetry will be enabled in user testing,
- define visual art direction references as a separate design brief.

These are not required before implementation of the prototype.

