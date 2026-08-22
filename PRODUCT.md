# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary users: AI coding agents and human product/UI designers creating, iterating, and evaluating distinct interface concepts.
- Secondary users: Stakeholders and reviewers testing interactive prototypes and screens directly in the browser.

## Product Purpose

A sandbox and laboratory for rapid, isolated prototyping of high-craft frontend interfaces. Each mockup exists as an independent, fully interactive screen or component experiment accessible via its own dedicated clean URL (`/m/<id>`).

## Positioning

An autonomous UI design sandbox where individual mockups are strictly self-contained and visually uncoupled, rendered beneath an ultra-neutral graphite shell that stays out of the way.

## Operating Context

- Web application running React 19 + TypeScript + Vite + Wouter routing.
- Deployed as static bundle served by Nginx on `https://sandbox.shocker.cl`.
- Mockups are registered centrally in `src/mockups/registry.ts` and loaded dynamically.
- Development is driven by AI agents and developers adhering to `INSTRUCTIONS.md`.

## Capabilities and Constraints

- **Self-Contained Mockups:** Every mockup in `src/mockups/` must provide its own background, layout, and visual styling without leaking styles or imposing its aesthetics on other mockups.
- **Base UI Primitives:** Mockups use `@base-ui/react` (Dialog, Tabs, Accordion, Switch, Tooltip, Popover) adhering strictly to verified DOM state attributes (`data-active`, `data-checked`, `data-panel-open`, `data-popup-open`).
- **Skin System:** Optional re-theming support via `.skin` classes and `--sk-*` variables (`--sk-bg`, `--sk-ink`, `--sk-accent`, etc.) for mockups supporting dynamic skins.
- **Full-Width Canvas:** Mockups render at full viewport width below a 48px neutral shell rail; no narrow container or default page background is provided by the viewer.

## Brand Commitments

- **Shell Neutrality:** The viewer frame uses strictly neutral graphite tones (`--ink`, `--rail`, `--line`, `--fg-quiet`) with single-signal accenting (`--signal`), ensuring the chrome never contaminates or biases the visual perception of individual mockups.
- **Mockup Individuality:** No single global brand, color palette, or typography applies across all mockups. Each mockup owns its aesthetic world.

## Product Principles

1. **Strict Isolation:** Mockups must never share visual assumptions. Each prototype is its own sovereign aesthetic universe.
2. **Interactive Truth:** Components must have real, working interactive states (toggling switches, opening dialogs, switching tabs, real inputs).
3. **Distinctive Craft:** Reject generic AI-generated tropes (bland saturated blues, uniform rounded card nests, default typography). Each mockup must have a bold, deliberate point of view.
4. **Authentic Primitives:** Respect documented `@base-ui/react` attributes and web standards; never invent fake attributes or CSS variables.
