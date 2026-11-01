# FCC preview approved design

Implement the original [request](2026-11-01-fcc-request.md) in FCC.html, keeping index.html byte-for-byte unchanged until the user approves a later migration. Publication of this separate page is authorized.

The user approved all review recommendations, with these refinements:
- FCC uses equal touching spheres; position colors or global (111) ABC stacking. All 1 / 2×1×2 / 2×2×2 cells share coordinate site IDs.
- Void = coordination tetrahedron/octahedron minus original atomic spheres, clipped to the base [0,a]^3 cube. Both types: no artificial internal partition caps. One type: show the partition cut faces. Always show cube cut faces.
- All 13 octahedral site pieces and all 8 tetrahedral sites are shown in the base cube. Inscribed spheres use exact sqrt(2)-1 and sqrt(3/2)-1 ratios before clipping to that same cube. Hidden atoms never change geometry.
- Double tap/click hides nearest visible atom. Triple restores farthest hidden intersected atom, except an immediately preceding hide at the same position has priority. Defer doubles about 300 ms to disambiguate triples. Movement, multiple pointers, cancellation and long press cancel tap sequences.
- Void mode hides all background atoms. Explicit normal/void controls supplement 450 ms long press (cancel after movement).
- Comparison: left atoms, right voids, synchronized view/scale/target/projection; long press returns to the mode before comparison. Smartphone portrait retains side by side and recommends landscape.
- Tapping a site toggles its tetrahedral/octahedral guide; a different site replaces it. Guides use neighbors outside the base cube too.
- Preserve hidden IDs/settings across palette, opacity, grid, display and crystal switches within the page. View reset only resets view. Restore all only clears individually hidden flags.
- Keep existing three crystal modes and their existing gestures. Preserve common background, projection, fullscreen, quality, grid, panel and position controls. No unnecessary labels or touching buttons.

## Approach
Generate sphere surface patches clipped against the convex coordination polyhedron and base cube, and planar cut faces with atomic sphere footprints removed. Cache the resulting fixed geometries per quality; opacity and palette updates reuse meshes. This avoids runtime boolean-library dependencies. Shared camera/renderer scissor rendering handles comparison.
