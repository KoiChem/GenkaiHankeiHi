# FCC preview refinement plan

Spec: docs/superpowers/specs/2026-11-01-fcc-refinements.md

- [x] Reproduce target-drift regression and capture a failing browser assertion before editing product code. Add failing UI, base-cell center and color requirements to targeted browser tests.
- [x] Disable OrbitControls target panning in FCC and legacy modes; share existing screen-offset right/touch panning. Apply offsets to FCC rendered/raycast viewport cameras; cancel gestures on multi-pointer/cancellation.
- [x] Implement context-based FCC UI groups, comparison forced clipping, single-void geometric center/framing and approved colors.
- [x] Verify target/projection-center invariants through pan then rotate for each mode, grid, projection and legacy transition; verify picking after pan and touch cancellation.
- [x] Verify browser UI at desktop, portrait/landscape phone; inspect screenshots, gaps, console/network. Run existing meaningful suites adapting expectations for intentionally hidden irrelevant controls.
- [x] Record evidence and hand off to root for review/publication.
