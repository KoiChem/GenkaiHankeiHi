# Approved fixed-scale clipping and free rotation

Product files FCC.html/fcc-view.js only; index.html unchanged. Root publishes.

- Toggling normal clipping preserves camera pose, distance, zoom and projected atom scale for perspective/orthographic and every grid. Remove the unclipped2R framing contribution, including reset; grid-count framing changes remain allowed. Whole spheres may extend outside the previous framing after unclipping; no automatic fit/zoom.
- All FCC modes and the three ion modes on FCC.html rotate freely through poles in both directions, with quaternion orientation and no global-up clamp. Screen-space panning retains fixed geometric targets. Wheel/pinch zoom, comparison pose/raycast synchronization and projection round trips retain behavior.
- Projection switches preserve camera up/roll. Reset cancels input/residual motion and returns upright/rest. Diagonal camera snaps remain smooth even from inverted up, without singular up-vector interpolation.

## Owning source and integration choices
Read Three.js r128 TrackballControls primary source: https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/js/controls/TrackballControls.js . It dynamically reads object, has noPan/staticMoving/handleResize, quaternion eye/up rotation, and public zoomCamera/reset methods. Use that same-version official script, no target pan, staticMoving=true for direct stable manipulation. Scope a correction for r128's inverse orthographic pinch ratio; retain screen-offset pan implementation. Use quaternion slerp plus interpolated distance for snap pose, not opposite up-vector lerp.
