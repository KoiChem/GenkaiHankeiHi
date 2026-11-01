# Fixed-scale clipping and free rotation plan

Spec: docs/superpowers/specs/2026-11-02-fcc-free-rotation.md

- [x] Add and run failing browser requirements for fixed-scale clipping and several full vertical rotations in FCC/allions, rolled projection roundtrip, reset rest and inverted snap continuity.
- [x] Remove unclipped framing term. Integrate r128 Trackball with no target pan/static direct motion, correct ortho pinch, shared screenoffset and resize handling.
- [x] Preserve projection up, clear pending control input around reset/projection/snap, interpolate snap quaternion smoothly, and cancel/re-enable controls safely across lifecycle changes.
- [x] Adapt obsolete auto-fit tests to fixed-scale behavior. Verify both pinch directions/projections, pan/rotate/picking/comparison and existing gestures; run Node/browser suites and inspect screenshots/console/network.
- [x] Record results and hand off to root review/publication.
