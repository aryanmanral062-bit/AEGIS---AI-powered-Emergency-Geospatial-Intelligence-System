# AEGIS — AI-powered Emergency Geospatial Intelligence System

> **Statutory Disaster Decision Support & Evacuation Reassignment Architecture**  
> Operational scenario: Wayanad Landslide Rapid-Response Relocation Planning

---

## 🏛 Executive Overview

**AEGIS** (AI-powered Emergency Geospatial Intelligence System) is a high-assurance disaster-management command and control system designed for District Disaster Management Authorities (DDMA). 

It bridges raw field telemetry, deterministic multi-criteria spatial constraints, and human-in-the-loop statutory decision making across the four foundational operational stages:

$$\textbf{SEE} \longrightarrow \textbf{UNDERSTAND} \longrightarrow \textbf{PLAN} \longrightarrow \textbf{REVIEW}$$

---

## ⚡ Core Capabilities

1. **Deterministic S1–S10 State Machine:**
   * **S1 Baseline:** Mundakkai demographic baseline (427 households / 1,495 exposed individuals).
   * **S2 Hazard Escalation:** Catchment-level soil saturation exceeds critical threshold (>280mm/24h).
   * **S3 Capacity Constraint:** Local Meppadi shelter deficit identified (340 bed gap vs 2,100 projected need).
   * **S4 Plan V1 Generated:** Multi-hub allocation across Meppadi HSS (612), Kalpetta Hall (503), and St. Mary's Vythiri (380).
   * **S5 Statutory Approval:** District Collector formal concurrence under Section 34 of the DM Act 2005.
   * **S6 Infrastructure Failure:** Route R104 culvert bridge breach at KM 4.2 (impassable).
   * **S7 Plan V1 Invalidation:** Real-time constraint failure detection (150 evacuees transit-severed).
   * **S8 Alternative Routing:** Dynamic multi-criteria evaluation of intact bypass routes (R212 & R318).
   * **S9 Plan V2 Dynamic Reassignment:** Kalpetta Hall promoted to Primary Hub (612), St. Mary's Vythiri to Secondary (503), Meppadi HSS reduced to local bypass (380). Total preserved: 1,495 / 1,495.
   * **S10 Plan V2 Promulgation:** Final statutory sign-off and operational dispatch.

2. **Immutable SHA-256 Forensic Audit Ledger:**
   * Genesis-anchored cryptographic hash chain for every telemetry update, advisory computation, constraint validation, and administrative approval.
   * Live client-side cryptographic verification and tamper-detection engine.
   * Interactive Forensic Causal Sequence mapping from field trigger to dynamic reassignment.

3. **High-Precision GIS Workspace:**
   * Interactive MapLibre GL mapping engine featuring live hazard contours, evacuation corridors, shelter catchment polygons, and real-time route obstruction flags.
   * Dual-axis collapsible layout controls: Vertical upper-panel collapse (`Ctrl + Shift + B`) and horizontal Command Center collapse for full-screen GIS immersion.

4. **Integrated Operational Modules:**
   * Hazard Analysis, Population Vulnerability, Shelter Capacity & Deficit, Evacuation Routing, Relocation Planning, Active Incidents, and Resource Deployment.

---

## 🛠 Tech Stack

* **Framework:** React 19, TypeScript
* **Build System:** Vite, Tailwind CSS v4
* **Mapping:** MapLibre GL, Lucide Icons
* **Audit & Security:** Web Crypto API (SHA-256 hash-chain verification)
* **Code Quality:** Oxlint, TypeScript strict typechecking

---

## 🚀 Getting Started

### Prerequisites
* Node.js $\ge$ 18.0.0
* npm $\ge$ 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/Piyush575-byte/AEGIS---AI-powered-Emergency-Geospatial-Intelligence-System.git
cd AEGIS---AI-powered-Emergency-Geospatial-Intelligence-System

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build & Typecheck
```bash
# Typecheck
npx tsc --noEmit

# Production bundle
npm run build
```

---

## 📜 Statutory Alignment
Built strictly adhering to the **National Disaster Management Act, 2005 (DM Act)** and standard Incident Command System (ICS) operational guidelines.
