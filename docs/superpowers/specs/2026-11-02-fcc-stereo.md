# FCC inertia, available-area centering and stereoscopic display

Approved by the user in this chat. Implement in FCC.html and its helpers; index.html remains unchanged.

- Retain unrestricted quaternion rotation and add a short decaying rotational glide, close to the original index behavior. Pan/zoom remain direct. Reset/projection/snap must cancel all residual rotation and previously held inputs.
- On initialization and position reset, a right sidebar is excluded from the horizontal display center using its actual rectangle. Bottom phone panels do not shift the model sideways. Opening/closing the panel alone does not move the model. Orbit target remains the model geometric center.
- Rightmost top view button cycles normal display, cross-eye, parallel-eye, normal display. Perspective-only stereo hides projection switches and remembers/restores the prior projection preference.
- Stereo uses two full-height half-width viewports across the entire window, ignoring the sidebar. Right geometry may remain behind the overlay. Parallel eye assignment is natural; cross-eye reverses it. Parallel off-axis eye cameras have no vertical disparity and converge at the model's orbit target plane. Separation is a mild 3.5% of camera-to-target distance.
- Shared viewport projection is used for both rendering and selection, including cut/hidden atoms and ion targets. Model rotation, screen pan, zoom, opacity, palette and guides remain operational. Stereo operations persist on exit; only projection/context state is restored.
- FCC comparison enters stereo as the void-only scene in both eyes, with appropriate controls; exiting restores comparison. Explicit FCC mode changes supersede the saved comparison state.
- Mono sidebar offset is separate from user pan. Stereo ignores that layout component while preserving user pan, so pan adjustments survive exit.
- No new dependency beyond the current Three.js runtime. No textual model labels or extra stereo adjustment controls.
