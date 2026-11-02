# Approved grid, lighting, color and ion-gesture refinements

Keep original index.html unchanged. Root publishes.

- FCC1/4/8 grid switches only recenter model/camera target; camera distance and zoom do not automatically scale. Comparison geometry remains fixed to one cell.
- Soft lighting .8ambient/.4directional follows screen-up even with rolled free rotation; light direction is relative to camera orientation and target, not world/model translation. Match ion and FCC views.
- ABC colors pastelblue#8DBDDC,pastelred#F29AA8,pastellime#BFD99B. Octahedral balls/guide markers use yellow-orange#F2A522; guide edges use darker orange#D48D12 for readability, with a lighter/hue-distinct shell#F5D78E. Tetrahedral purple remains unchanged.
- All ion modes: double hides nearest visible ion; triple restores farthest hidden intersected ion, except recently hidden same-position ion takes priority. Single auxiliary action executes only after300ms disambiguation. Double no longer toggles diagonal; button remains.
- Stable type+fractional-coordinate site IDs cover sphere/caps. Visibility persists through ratio,opacity,grid and crystal switches. Hidden ions remain part of original geometry/spacing/auxiliary calculations and retain analytic ray-sphere targets clipped by cube/diagonal planes. Opacity0 cannot be double-hidden. Contextual restore-all-ion button.
- Use existing robust gesture cancellation for drag,multi-pointer,UI,blur,reset/projection. Preserve free rotation,pinch/wheel and screen-offset pan.

Octahedral guide edges use darker orange #D48D12 for contrast; markers/balls use #F2A522 and shell #F5D78E. All remain in the requested yellow-orange family.
