# AEGIS — AI-Powered Emergency Geospatial Intelligence System

> **Evidence-based disaster decision support for emergency planning, evacuation, and resilient response.**

AEGIS is a decision-support prototype designed to help disaster-management authorities understand rapidly changing hazards, evaluate exposed populations, formulate relocation plans, review alternatives, and maintain a tamper-evident operational audit trail.

The system is demonstrated around a simulated emergency scenario in **Wayanad, Kerala**, involving rainfall-driven slope instability, shelter-capacity constraints, route failure, evacuation reassignment, and statutory human approval.

> **Important:** AEGIS is an advisory decision-support prototype. It does not autonomously issue evacuation orders, dispatch personnel, or exercise statutory authority. The operational scenario and data shown in the application are demonstration/simulated data.

---

## Why AEGIS?

Disaster response decisions often require several pieces of information to be considered simultaneously:

- What is happening?
- Who is exposed?
- Which routes remain viable?
- Where is shelter capacity available?
- What happens if an operational dependency fails?
- Why was a particular plan recommended?
- What alternatives were considered?
- Who authorized the final decision?
- Can the decision history be independently reviewed?

AEGIS brings these questions into a single operational workspace.

The core decision-support flow is:

```text
SEE
  ↓
UNDERSTAND
  ↓
PLAN
  ↓
REVIEW
Core Capabilities
🗺️ Geospatial Operational View
The dashboard provides a GIS-based operational workspace showing:
- Hazard areas
- Exposed habitations
- Shelter locations
- Route networks
- Route status
- Evacuation movement vectors
- Critical route failures
- Alternative corridors
The map dynamically responds to the simulation state.
📊 Exposure & Capacity Analysis
AEGIS maintains a reconciled operational picture of:
- Exposed households
- Exposed population
- Shelter capacity
- Projected requirements
- Capacity surplus/deficit
- Shelter allocations
Demonstration scenario:
427 households
1,495 exposed residents

1,760 usable shelter capacity
2,100 projected requirement

Local deficit:
-340 persons

Net sector capacity after allocation:
+265 beds
🧠 Multi-Criteria Relocation Planning
AEGIS formulates evacuation relocation plans using operational criteria including:
- Shelter capacity
- Route viability
- Distance
- Medical coverage
The system explicitly labels these as AEGIS Advisory recommendations.
Human authority remains responsible for approval.
⚠️ Dynamic Failure & Replanning
The demonstration includes a critical operational dependency failure.
Primary route:
R104
fails at:
KM 4.2
The failure causes:
150 evacuees
to become severed from the original evacuation corridor.
Instead of silently modifying the existing plan, AEGIS:
1. Detects the route failure
2. Preserves Plan V1
3. Marks Plan V1 as invalidated
4. Evaluates alternative corridors
5. Generates Plan V2
6. Presents the reassignment for human approval
Four Decision-Support Foundations
1. SEE
What is happening? Where? Who is exposed?
The GIS workspace provides the operational picture.
The demonstration scenario identifies:
Mundakkai
427 households
1,495 residents
94.2% slope saturation
Hazard zones, shelters, routes, and affected populations are displayed spatially.
2. UNDERSTAND
Why does it matter?
AEGIS combines operational evidence including:
- Rainfall observations
- Slope saturation
- Shelter capacity
- Route telemetry
- Exposure information
- Data freshness
- Confidence indicators
The Decision Context interface provides evidence, findings, constraints, and rationale behind recommendations.
3. PLAN
What should be considered?
AEGIS evaluates shelter and routing alternatives and produces a proposed relocation plan.
Plan V1
Meppadi Govt. HSS       612
Kalpetta Community Hall 503
St. Mary's Vythiri      380
───────────────────────────
Total                  1,495
The allocation covers:
1,495 / 1,495 residents
100%
4. REVIEW
What requires human authority?
AEGIS does not replace statutory decision-makers.
The interface explicitly separates:
AEGIS ADVISORY
        ↓
Human Review
        ↓
District Collector / District Magistrate
        ↓
Statutory Concurrence
The demonstration records approval decisions in the audit ledger.
Demonstration Scenario
The primary demonstration follows a deterministic S1 → S10 operational sequence.
S1  BASELINE
 ↓
S2  HAZARD SURGE
 ↓
S3  CAPACITY AUDIT
 ↓
S4  PLAN V1 GENERATED
 ↓
S5  PLAN V1 APPROVED
 ↓
S6  R104 BRIDGE FAILURE
 ↓
S7  PLAN V1 INVALIDATED
 ↓
S8  ALTERNATIVE SEARCH
 ↓
S9  PLAN V2 GENERATED
 ↓
S10 PLAN V2 APPROVED
State progression
State	Event	Operational Change
S1	Baseline	R104 clear; baseline monitoring
S2	Hazard Escalation	204mm rainfall scenario; 94.2% saturation
S3	Capacity Audit	340-person local capacity deficit identified
S4	Plan V1	Initial multi-shelter plan formulated
S5	V1 Approved	Human statutory approval recorded
S6	Route Failure	R104 blocked at KM 4.2
S7	Invalidation	Plan V1 invalidated; 150 evacuees affected
S8	Alternative Search	R212/R318 evaluated as bypass corridors
S9	Plan V2	Shelter allocations rebalanced
S10	V2 Approved	Human re-approval recorded


Plan Evolution
Plan V1
Meppadi        612
Kalpetta       503
St. Mary's    380
               ───
Total         1495
After R104 becomes unavailable, AEGIS formulates Plan V2:
Plan V2
Kalpetta       612
St. Mary's    503
Meppadi        380
               ───
Total         1495
Reallocation deltas:
Kalpetta       +109
St. Mary's     +123
Meppadi        -232
────────────────────
Total             0
The population total remains mathematically reconciled throughout the replanning process.
Tamper-Evident Audit Ledger
AEGIS includes a demonstration SHA-256 linked audit ledger.
Each operational event is linked to the previous event through cryptographic hashing.
Genesis
   ↓
Event #1
   ↓
Event #2
   ↓
Event #3
   ↓
...
   ↓
Event #10
   ↓
Tip
The demonstration includes:
- SHA-256 linked events
- Sequence numbers
- Event payloads
- Previous-hash references
- Hash verification
- Tamper detection
- Canonical ledger restoration
- Approval receipts
- Causal event relationships
Tamper Demonstration
The audit interface can intentionally mutate an event payload.
AEGIS then detects the broken chain and identifies the affected event.
Example:
CRYPTOGRAPHIC TAMPERING DETECTED
Sequence #6
evt-06-r104-fail
Security Boundary
The audit ledger is intentionally presented as:
TAMPER-EVIDENT — DEMONSTRATION

This prototype does not claim production-grade institutional immutability.
A production implementation would require appropriate:
- Server-side append-only storage
- Authentication and authorization
- Key management
- Institutional retention policies
- Access controls
- Operational security controls
Command Center
The dashboard contains a dedicated Command Center with three operational views:
┌────────────┬─────────────┬─────────────┐
│  DECISION  │  SITUATION  │   EVIDENCE  │
└────────────┴─────────────┴─────────────┘
DECISION
Displays:
- Current relocation plan
- Shelter allocations
- Decision rationale
- Approval status
- Human approval controls
SITUATION
Displays:
- Active incidents
- Hazard warnings
- Route failures
- Operational alerts
- Impact information
EVIDENCE
Displays:
- Data freshness
- Telemetry sources
- Confidence information
- Supporting evidence
Dashboard Layout
The dashboard is designed as a command/control workspace:
┌──────────────┬──────────────────────────────┬──────────────┐
│              │                              │              │
│ Navigation   │          GIS MAP             │  COMMAND     │
│              │                              │  CENTER      │
│              │                              │              │
└──────────────┴──────────────────────────────┴──────────────┘
The interface supports:
- Collapsible navigation
- Collapsible Command Center
- Resizable map/panel workspace
- Resizable timeline
- Persistent panel preferences
- Responsive workspace behavior
The central GIS workspace automatically reclaims available space when side panels are collapsed.
Technology Stack
Technology	Purpose
React	Application UI
TypeScript	Type-safe application logic
Vite	Development/build tooling
Tailwind CSS	Interface styling
MapLibre GL	Geospatial visualization
SHA-256	Demonstration audit-chain integrity
React Router	Application routing


Architecture
App
│
├── AppShell
│   ├── Header
│   ├── Sidebar
│   └── Dashboard
│
├── Dashboard
│   ├── KPI Strip
│   ├── Simulation Controller
│   ├── GIS Map
│   ├── Relocation Panel
│   │   └── Decision Context
│   ├── Insights Panel
│   └── Data Freshness
│
├── Audit Log
│   ├── Audit Verification
│   ├── Causal Chain
│   ├── Approval Receipts
│   ├── Audit Timeline
│   └── Event Detail
│
└── Supporting Modules
    ├── Scenario Simulation
    ├── Compare Plans
    └── Data Status
Project Structure
src/
├── components/
│   ├── audit/
│   ├── common/
│   ├── data-status/
│   ├── decision-context/
│   ├── insights/
│   ├── kpi/
│   ├── layout/
│   ├── map/
│   ├── planning/
│   └── simulation/
│
├── data/
│   ├── mockData.ts
│   └── simulationData.ts
│
├── pages/
│   ├── AuditLog.tsx
│   ├── ComparePlans.tsx
│   ├── Dashboard.tsx
│   ├── DataStatus.tsx
│   ├── DesignFoundationPreview.tsx
│   ├── PlaceholderPage.tsx
│   └── Simulation.tsx
│
├── types/
│   └── index.ts
│
├── utils/
│   ├── cryptoAudit.ts
│   └── formatters.ts
│
├── App.tsx
├── index.css
└── main.tsx
Application Routes
Route	Purpose
/	AEGIS Dashboard
/dashboard	Main command center
/system/audit-log	Forensic audit ledger
/audit	Audit view
/operations/audit	Operations audit
/analysis/compare	Plan comparison
/analysis/simulation	Scenario simulation
/system/data-status	Data freshness
/planning/hazards	Hazard module
/planning/vulnerability	Vulnerability module
/planning/shelters	Shelter module
/planning/routes	Route module
/planning/relocation	Relocation module
/operations/incidents	Incident module
/operations/resources	Resource module
/design-foundation	Design system


Some planning and operations modules are currently staged for expansion while the core decision-support workflow is concentrated in the main dashboard.
Getting Started
Requirements
- Node.js
- npm
- Git
Install
npm install
Start Development Server
npm run dev
The application will be available at:
http://localhost:5173/
Type Check
npx tsc --noEmit
Production Build
npm run build
Verification
The prototype has been tested through programmatic state-machine and adversarial validation.
Current verification results include:
TypeScript compilation       PASS
Production build             PASS
State-machine invariants     23 / 23 PASS
Adversarial verification     68 / 68 PASS
Application routes            16 / 16 HTTP 200
Orphaned components           0
Duplicate data sources        0
The demonstration state machine is deterministic and preserves the same causal sequence across reset/replay operations.
Browser automation testing encountered an external Playwright driver CDN download limitation during validation. Programmatic runtime, TypeScript, build, route, and adversarial checks were completed successfully. Browser-interaction claims should therefore be interpreted separately from automated browser-driver verification.

Human Authority Boundary
AEGIS is deliberately designed around human-in-the-loop disaster decision support.
AEGIS can:
- Analyze evidence
- Identify exposure
- Detect constraints
- Evaluate alternatives
- Formulate relocation plans
- Explain recommendations
- Record decision context
- Maintain a tamper-evident demonstration ledger
AEGIS does not:
- Autonomously issue evacuation orders
- Exercise statutory authority
- Dispatch emergency personnel
- Override human decision-makers
- Claim institutional production immutability
The final statutory decision remains with the appropriate human authority.
Demo Walkthrough
For a short hackathon presentation:
1. Start at S1
Show the baseline GIS situation.
2. Advance to S2–S3
Demonstrate hazard escalation and shelter-capacity analysis.
3. Advance to S4
Show AEGIS generating Plan V1.
4. Approve Plan V1
Demonstrate the explicit human approval boundary.
5. Advance to S6
Trigger the R104 bridge failure.
6. Advance to S7
Show Plan V1 becoming invalidated rather than silently modified.
7. Advance to S8–S9
Show alternative route evaluation and Plan V2 generation.
8. Approve Plan V2
Demonstrate human re-approval and resilient routing.
9. Open the Audit Trail
Show the causal chain and SHA-256 verification.
10. Demonstrate Tamper Detection
Trigger the audit tamper test and show the affected event being identified.
Roadmap
Potential next-stage development includes:
- Live disaster-data integrations
- Real-time telemetry ingestion
- Production GIS data sources
- Server-side audit storage
- Role-based access control
- Institutional authentication
- Real evacuation-route optimization
- Shelter availability synchronization
- Multi-district coordination
- Production deployment architecture
- Historical incident analytics
- Automated data-quality monitoring
Project Status
Current status: Hackathon Prototype / Demonstration Ready
AEGIS currently demonstrates an end-to-end decision-support workflow connecting:
Geospatial Evidence
       ↓
Hazard Understanding
       ↓
Capacity Analysis
       ↓
Relocation Planning
       ↓
Human Approval
       ↓
Operational Failure
       ↓
Plan Invalidation
       ↓
Alternative Evaluation
       ↓
Resilient Replanning
       ↓
Forensic Audit
The objective is not to replace emergency authorities.
The objective is to give them a clearer, more traceable, evidence-driven basis for making difficult decisions under rapidly changing conditions.
License
License to be determined.
AEGIS
AI-Powered Emergency Geospatial Intelligence System
Decision Support • Geospatial Intelligence • Resilient Planning • Human-in-the-Loop Governance

### One thing I'd change from your current README

Your current GitHub screenshot shows the README is basically just the project title. That's wasting one of the **first things a hackathon judge will see**.

This version makes the repository immediately answer:

**What is it → why does it matter → how does it work → what makes it different → how do I run it → how was it verified?**

I would **not** add fake claims like "AI predicts disasters" or "production-ready emergency management platform." Your current prototype is stronger when presented honestly as a **decision-support demonstration with a very clear human-authority boundary**.
