# Approved FCC comparison and appearance followup

Product scope: FCC.html/fcc-view.js only; index.html unchanged; root publishes.

- Normal-mode control order: palette, then grid+clipping, atom opacity, restore.
- Interstitial sphere materials use DoubleSide. Their curved inward-facing spherical patches retain the same material/color with natural lighting; existing planar caps remain distinct geometry.
- Moderately darken void surfaces to #AAD497 / #C7A5DE, keeping them lighter/hue-distinct from saturated balls.
- Comparison left is always the base unit cell (effective grid0), vertex/face palette, clipped. Normal palette/grid/clipping preferences are retained, never overwritten, and restored on return.
- Comparison hides palette/grid/clipping UI, retains atom opacity/restore and void controls. Rendering, frames, ray picking, center, reset and fit all use effective grid0; void-only remains base-cell.
