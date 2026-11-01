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
