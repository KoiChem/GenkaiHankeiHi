# FCC Compact Panel Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan. The user approved the conversation's FCC panel, opacity, and view-cube decisions.

**Goal:** Compact the observation panel and make the view cube follow screen-relative dragging.

**Architecture:** Keep the existing standalone FCC page, Three.js camera, renderer and stereo lifecycle. Adjust panel markup/style and the shared camera orientation without adding dependencies.

**Tech Stack:** HTML/CSS, JavaScript, Three.js r128, Playwright, Node tests.

**Spec:** Approved conversation: 40px panel buttons, contextual settings and accessible labels, persistent stereo projection icons disabled with perspective selected, 70%/60% void defaults, slightly darker void surfaces, and cube drag at 70% of prior speed in screen coordinates.

## Global Constraints

- Keep `index.html` unchanged; preserve button spacing, current model geometry, state and stereo behavior.
- View-cube drag must work after roll, pitch, repeated drags, and in diagonal-section mode; taps and zoom/pan remain separate.
- Remove supplemental text visually while retaining accessible names and descriptions.

## Tasks

1. Add browser regression coverage for screen-axis cube dragging, speed, stereo projection controls and void defaults. Run against the current page and confirm expected failures.
2. Update `FCC.html` and `fcc-view.js` for compact layout, persistent stereo icons and void defaults. Update existing panel/stereo checks to the approved appearance and behavior.
3. Update `view-cube.js` to apply drag rotation about camera-relative axes with the existing gesture lifecycle. Validate directional signs, continuous rotation, mouse and touch behavior.
4. Run focused browser checks across desktop, tablet and narrow layouts, existing geometry and stereo tests, inspect the diff, push, and verify the deployed page.
