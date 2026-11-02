# FCC stereo implementation and verification

Spec: ../specs/2026-11-02-fcc-stereo.md

- [x] Implement shared model-views.js camera projection/render/raycast preparation and dynamic sidebar centering.
- [x] Add stereo cycling, projection preference restoration, per-eye legacy picking and rotation-only glide with cancellation guards.
- [x] Route FCC comparison to void-only stereo; preserve the inactive FCC state without recentering active ion models.
- [x] Verify viewport optics, actual per-eye model interaction, centering, inertia and state transitions with dedicated browser scenarios.
- [x] Run baseline interaction and input-cancellation regressions, inspect stereo UI image, and record evidence for release.
