# Approved FCC preview refinements

Keep index.html byte-for-byte unchanged and refine only FCC.html/fcc-view.js product code. Root owns commit/deployment.

- Restore screen-space panning. Right drag and two-finger midpoint drag update shared pixel viewOffsetX/Y, never OrbitControls.target. Orbit center equals geometric model center. Apply offsets identically to rendered/picking FCC viewport cameras, perspective/orthographic, both comparison panes and resize. Cancel pending taps/long presses on multi-pointer input.
- Single void view always frames/rotates about the base cell, retaining the normal grid setting for return. Comparison preserves shared world coordinates/scale with the normal multi-cell model.
- FCC atom colors are mildly darker legacy pink/light-blue: #F29AA8 / #8DBDDC, reused for ABC A blue/B red; C orange unchanged. Legacy ion colors unchanged. Void surfaces are pale distinct green/purple, lighter/slightly different hues than saturated balls.
- Normal: mode row, grouped grid+clipping, palette, atom opacity, restore. Void: kind/display and relevant void/sphere opacities only; no grid/palette/atom actions/clipping. Compare: separate atom/void control groups; grid for left model, no clipping toggle; both models always clipped. Keep normal clipping preference for return. Common fullscreen/projection/reset/quality/background controls retain stable relative locations with gaps on every viewport.
