async(page)=>{
  const checks=[],failures=[],check=(ok,name)=>{checks.push({name,pass:!!ok});if(!ok)failures.push(name);};
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const original=window.createFCCView;window.createFCCView=options=>{window.__fccArgs=options;window.__fccScenes={};window.__fccCameras={};const controller=original(options),render=options.renderer.render.bind(options.renderer);options.renderer.render=(scene,camera)=>{const site=scene.children.find(o=>o.isGroup)?.children[0]?.userData?.site;if(site){const key=site.kind?'void':'normal';__fccScenes[key]=scene;__fccCameras[key]=camera;}return render(scene,camera);};return controller;};}));
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccCameras?.normal);
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
  check(await page.evaluate(()=>document.querySelector('#fcc-palette-controls').getBoundingClientRect().top<document.querySelector('#fcc-grid-row').getBoundingClientRect().top),'normal palette appears above grid and clipping');
  await click('#fcc-palette button[data-value="abc"]');await click('#grid-mode-group button[data-mode="2"]');await click('#toggle-clipping');await click('#fcc-mode button[data-value="compare"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);await page.waitForTimeout(250);
  check(await page.locator('#fcc-palette').isHidden()&&await page.locator('#grid-mode-group').isHidden()&&await page.locator('#toggle-clipping').isHidden(),'comparison hides palette, grid and clipping');
  const comparison=await page.evaluate(()=>{const atoms=__fccScenes.normal.children.find(o=>o.isGroup).children,voids=__fccScenes.void.children.find(o=>o.isGroup).children;return{count:atoms.length,colors:[...new Set(atoms.map(o=>o.children[0].material.color.getHexString()))].sort(),target:__fccArgs.controls.target.toArray(),savedGrid:STATE.gridMode,savedClip:STATE.isClipping,clipped:atoms.every(o=>o.children[0].material.clippingPlanes.length===6),sides:voids.every(o=>o.children[3].children[0].material.side===THREE.DoubleSide),voidColors:[...new Set(voids.map(o=>o.children[0].material.color.getHexString()))].sort()};});
  check(comparison.count===14,'comparison always renders the 14 base-cell atom sites');
  check(JSON.stringify(comparison.colors)===JSON.stringify(['8dbddc','f29aa8']),'comparison always uses vertex and face colors');
  check(comparison.target.every(v=>Math.abs(v-1.5)<1e-9),'comparison rotates around the base-cell center');
  check(await page.evaluate(()=>{const lines=__fccScenes.normal.children.filter(o=>o.isLineSegments);return lines.length===1&&new THREE.Box3().setFromObject(lines[0]).min.toArray().every(v=>Math.abs(v)<1e-9)&&new THREE.Box3().setFromObject(lines[0]).max.toArray().every(v=>Math.abs(v-3)<1e-9);}),'comparison frame covers exactly the base unit cell');
  check(comparison.savedGrid===2&&!comparison.savedClip&&comparison.clipped,'comparison clips without overwriting saved normal grid/clipping');
  check(comparison.sides,'interstitial sphere curved surfaces use DoubleSide');
  check(JSON.stringify(comparison.voidColors)===JSON.stringify(['c7a5de','f5d78e']),'void surfaces use orange and purple families');
  await click('#btn-reset-pos');check(await page.evaluate(()=>Math.abs(__fccArgs.getCamera().position.distanceTo(__fccArgs.controls.target)-8.4)<1e-8),'comparison reset uses unit-cell fit rather than saved eight-cell span');check(await page.evaluate(()=>__fccArgs.controls.target.toArray().every(v=>Math.abs(v-1.5)<1e-9)),'comparison reset targets the base cell');
  await click('#fcc-mode button[data-value="normal"]');
  check(await page.locator('#fcc-palette button[data-value="abc"]').getAttribute('aria-pressed')==='true'&&await page.locator('#grid-mode-group button[data-mode="2"]').evaluate(e=>e.classList.contains('active')),'normal palette and eight-cell preference restore on return');
  check(await page.evaluate(()=>!STATE.isClipping&&__fccScenes.normal.children.find(o=>o.isGroup).children.length===63),'normal returns to 63 unclipped atom sites');
  await click('#fcc-mode button[data-value="compare"]');await page.waitForTimeout(250);await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);await page.screenshot({path:'.playwright-mcp/fcc-fixed-comparison.png'});
  if(failures.length)throw new Error('Unmet requirements: '+failures.join('; '));
  return{checks:checks.length,results:checks};
}
