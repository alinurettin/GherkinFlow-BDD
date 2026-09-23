# 📐 System Architecture: GherkinFlow-BDD
- **Project:** GherkinFlow-BDD
- **Discipline:** Behavior-Driven Development (BDD) & Specification by Example
- **Author:** Expert Software Architect
- **Status:** APPROVED

## 1. High-Level Architecture Topology
```mermaid
flowchart TD
    CLI["💻 CLI Interface (src/cli.js)"] --> Engine["🧠 GherkinFlow-BDD Algorithmic Engine (src/gherkin_engine.js)"]
    API["🌐 HTTP REST API (src/index.js)"] --> Engine
    UI["🖥️ Dark-Mode Dashboard (public/index.html)"] --> API
    Tests["🧪 Assertion Test Suite (tests/run_tests.js)"] --> Engine
    Engine --> Output["📊 Structured Test Results & CI Telemetry"]
```

## 2. Component Breakdown
1. **Algorithmic Engine (`src/gherkin_engine.js`):** Core logic implementing Behavior-Driven Development (BDD) & Specification by Example. Zero third-party runtime bloat.
2. **REST API & Web Server (`src/index.js`):** Lightweight HTTP microservice running on port 7075 providing health probes and interactive endpoints.
3. **Interactive Console (`public/index.html`):** Dark-mode responsive diagnostic dashboard with live metric cards and JSON inspection.
4. **CLI Entrypoint (`src/cli.js`):** Developer terminal interface for local CI script execution.
5. **Deterministic Test Suite (`tests/run_tests.js`):** Rigorous, non-mocked assertions verifying boundary conditions, error handling, and performance.
