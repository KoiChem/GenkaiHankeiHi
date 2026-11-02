# FCC preview checks

The app has no package installation/build step. Serve the repository as a static site and use the connected Playwright MCP.

## Geometry and mesh checks

```sh
/Users/ikemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.cjs
```

On another machine, use an available `node --test tests/*.test.cjs` (Node20+). The tests use only Node built-ins.

## Browser flows

Start a local static server from the repository:

```sh
python3 -m http.server 8765
```

Run these Playwright MCP calls in order, using the repository's absolute path:

```js
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-browser.js"
});
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-review-browser.js"
});
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-touch-browser.js"
});
```

The first two scripts initialize the page themselves and install browser-only instrumentation around the renderer; the touch script reuses that page. Results list each passed assertion. The scripts use the local port8765. Browser screenshots are written under `.playwright-mcp/` and are verification artifacts, not source assets.

The browser scenarios cover responsive Chromium and emulated touch input. Physical iOS/Safari feel and sustained-device performance require separate checks.

## FCC refinement regressions

The normal grid is now intentionally hidden in single-void mode. The comprehensive scenario switches back to normal before changing that setting, then checks the same base-cell void cases.

After one of the initializing scenarios above, run:

```js
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-refinements-browser.js"
});
// Run each projection separately to stay below the browser tool's 60-second call limit.
await tools.mcp__playwright__browser_run_code_unsafe({code: "async(page)=>{page.__fccPanProjection='persp';}"});
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-pan-browser.js"
});
await tools.mcp__playwright__browser_run_code_unsafe({code: "async(page)=>{page.__fccPanProjection='ortho';}"});
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-pan-browser.js"
});
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-refinement-ui-browser.js"
});
```

These check actual rendered screen-center invariance and ray picking after pixel-space pan, all modes/grids/projections, ion-mode transitions, CDP touch panning/cancellation, keyboard focus, comparison clipping, fixed-scale clipping, contextual UI and button gaps. The UI scenario records nine screenshots across desktop and phone orientations.

## Fixed-unit comparison followup

Comparison now intentionally hides both palette and grid settings, and its left model always uses one clipped unit cell with vertex/face colors. Saved normal-mode grid, palette and clipping preferences remain unchanged. Pan tests still iterate all saved grid preferences, but comparison picking/framing use effective grid0; review-fit assertions likewise test the rendered base cell.

```js
await tools.mcp__playwright__browser_run_code_unsafe({
  filename: "/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-comparison-browser.js"
});
```

This initializing scenario checks normal control order, fixed comparison geometry/colors/frame/center/reset, hidden irrelevant controls, restoration of normal preferences, sphere DoubleSide materials and the darker void palette. It writes `.playwright-mcp/fcc-fixed-comparison.png` with the settings panel closed. Continue with the existing scenarios/pan projection invocations above for regression coverage.


## Fixed-scale clipping and free rotation

Run the initializing Playwright scenarios `tests/fcc-free-rotation-browser.js`, `tests/fcc-free-rotation-lifecycle-browser.js`, and `tests/fcc-free-rotation-cancel-browser.js` in that order with the same filename-based MCP call as above. They verify scale across clipping toggles, repeated vertical turns in all four modes, rolled projection changes, pinch directions, smooth inverted-view snapping, and held-input cancellation. The UI test now asserts fixed scale rather than automatic fitting of unclipped atoms.

Verification: Node 10/10; rotation/scale 12/12; lifecycle 5/5; cancellation 9/9; baseline 56/56; UI 34/34; orthographic pan/picking 28/28. Physical Safari/device testing remains unperformed.

## Free rotation and fixed-scale clipping

The user opted out of automatic fitting when clipping changes. The old complete-unclipped-sphere auto-fit check is replaced with equal camera distance/zoom checks.

Run `tests/fcc-free-rotation-browser.js` first to initialize instrumentation and verify all six clipping/projection/grid combinations, multiple full turns in FCC/CsCl/NaCl/ZnS, rolled projection switches and reset rest. Then run `tests/fcc-free-rotation-lifecycle-browser.js` for inverted-up snap continuity, mid-drag reset, comparison synchronization and pinch direction in both projections. `tests/fcc-free-rotation-cancel-browser.js` covers missed mouseup, held touches across reset/projection/snap, old held screen pans and fresh-gesture recovery.

```js
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-free-rotation-browser.js"});
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-free-rotation-lifecycle-browser.js"});
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-free-rotation-cancel-browser.js"});
```

## Ion gestures, fixed grid scale and screen-relative lighting

Current ion gesture policy on FCC.html is single auxiliary action after300ms, double hide and triple restore. Diagonal view is button-only. The original index.html is untouched. FCC normal1/4/8 grid changes retain camera distance/zoom and recenter only; old automatic-grid-fit expectations are intentionally obsolete. Explicit view reset remains available.

```js
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-ion-gestures-browser.js"});
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-ion-persistence-browser.js"});
await tools.mcp__playwright__browser_run_code_unsafe({filename:"/Users/ikemon/Documents/codings/GitHub/chem/GenkaiHankeiHi/tests/fcc-ion-cancel-browser.js"});
```

The first initializes scene instrumentation. These check screen-relative lighting and colors, stable sphere/cap IDs, all3ion types, ratio/grid/crystal persistence, opacity0, arbitrary diagonal clipping, restore actions, single-delay and canceled inputs. The cancellation scenario rotates an aligned two-hidden-ion ray180° to check that recent-hide priority is invalidated and the farthest hidden ion restores. Node's new analytic hit tests run with the existing `node --test tests/*.test.cjs` command.
