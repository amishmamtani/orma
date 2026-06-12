# ADR-002: React Flow for diagram rendering

**Date:** 2026-05-01
**Status:** Accepted

## Problem

ORMA needs an interactive diagram library for React that can: render nodes with custom content, support click and hover handlers, and eventually support edge highlighting and custom layouts.

## Options considered

- **React Flow (`reactflow`):** Purpose-built for interactive node-edge graphs in React. Handles pan, zoom, node selection, and custom node types out of the box. Large community, well-maintained.
- **D3.js:** Maximum flexibility, but requires low-level SVG management. Steep integration cost with React's rendering model (imperative vs. declarative).
- **Mermaid / static diagram:** Simple to render but not interactive — no click or hover handlers on individual nodes.
- **Custom canvas (HTML5 Canvas / WebGL):** Full control, but significant engineering cost for hit-testing, zoom, and accessibility.

## Decision

Use React Flow. It is the pragmatic choice for an interactive diagram that needs node click handlers, custom node rendering, and incremental feature additions (hover, edge highlighting, custom layouts).

## Consequences

- **Constraint:** React Flow `reactflow@11` requires nodes to have a fixed `position: {x, y}`. Auto-layout must be computed before passing nodes to the component. Current implementation uses a simple top-to-bottom layout (`y = index × 120px`). For more complex layouts, a library like `dagre` or `elkjs` can be integrated — both have documented React Flow examples.
- **Known limitation:** React Flow does not natively support highlighting specific text within a node's label based on external state (needed for the hover-link feature, FR5). This will require a custom node renderer that accepts a `highlighted` prop.
- **Bundle size:** `reactflow` adds ~200KB gzipped to the frontend bundle. Acceptable for this use case.
- **Upgrade path:** React Flow v12 (`@xyflow/react`) has a different API. Pin to v11 until migration is deliberate.
