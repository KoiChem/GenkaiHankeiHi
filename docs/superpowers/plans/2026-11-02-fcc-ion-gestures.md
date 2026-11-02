# Ion gesture/grid/light plan

Spec: docs/superpowers/specs/2026-11-02-fcc-ion-gestures.md

- [x] Add failing Node ray/clipping cases and browser requirements for fixed grid scale, screen lighting/colors and all-ion hide/restore/single-delay/diagonal isolation.
- [x] Add shared analytic ray-sphere clipping helper; store stable ion metadata and hidden state independent of geometry/opacity; contextual restoration.
- [x] Route ion taps through the existing robust FCC gesture recognizer callback, remove old double-diagonal gesture path, retain singleaux after300ms.
- [x] Apply target-only grid recenter, camera-relative soft lighting and approved colors.
- [x] Verify actual browser ionflows/cancellation/opacity/diagonal clipping, grid/camera/light invariants, and appropriate existing regressions. Record report and hand off.
