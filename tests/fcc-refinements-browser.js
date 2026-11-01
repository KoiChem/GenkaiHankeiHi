async(page)=>{
  const checks=[],assert=(ok,message)=>{if(!ok)throw new Error(message);checks.push(message);};
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const original=window.createFCCView;window.createFCCView=options=>{window.__fccArgs=options;window.__fccScenes={};window.__fccCameras={};const result=original(options),render=options.renderer.render.bind(options.renderer);options.renderer.render=(scene,camera)=>{const site=scene.children.find(o=>o.isGroup)?.children[0]?.userData?.site;if(site){const kind=site.kind?'void':'normal';__fccScenes[kind]=scene;__fccCameras[kind]=camera;}return render(scene,camera);};return result;};}));
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccCameras?.normal);
  const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}};
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
  const drag=async(button,dx,dy)=>{await page.mouse.move(500,400);await page.mouse.down({button});await page.mouse.move(500+dx,400+dy,{steps:8});await page.mouse.up({button});await page.waitForTimeout(400);};
  const invariant=()=>page.evaluate(()=>({target:__fccArgs.controls.target.toArray(),center:STATE.currentCenter.toArray(),offset:[STATE.viewOffsetX,STATE.viewOffsetY],centerPixels:new THREE.Vector3(...STATE.currentCenter.toArray()).project(__fccCameras[document.querySelector('#fcc-mode button[data-value="void"]').getAttribute('aria-pressed')==='true'?'void':'normal']).toArray()}));
  await panel(false);const before=await invariant();await drag('right',80,35);const pan=await invariant();
  assert(pan.target.every((v,i)=>Math.abs(v-before.center[i])<1e-8),'right pan leaves OrbitControls target at model geometric center');
  assert(Math.abs(pan.offset[0]+80)<1e-8&&Math.abs(pan.offset[1]+35)<1e-8,'right pan is represented as pixel screen offsets');
  const screen=pan.centerPixels;await drag('left',55,-30);const rotated=await invariant();
  assert(rotated.centerPixels.every((v,i)=>i===2||Math.abs(v-screen[i])<1e-7),'pan then rotate keeps the model center at the same screen position');
  await panel(true);await click('#btn-reset-pos');
  assert(await page.locator('#fcc-palette').isVisible(),'normal shows atom palette');
  await click('#grid-mode-group button[data-mode="2"]');await click('#fcc-mode button[data-value="void"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
  assert(await page.locator('#grid-mode-group').isHidden(),'single void hides irrelevant normal-grid actions');
  assert(await page.locator('#fcc-palette').isHidden(),'single void hides atom palette');
  assert(await page.locator('#toggle-clipping').isHidden(),'single void hides clipping toggle');
  const voidCenter=await page.evaluate(()=>__fccArgs.controls.target.toArray());assert(voidCenter.every(v=>Math.abs(v-1.5)<1e-9),'single void rotates around the base cell even when normal grid is eight cells');
  await click('#fcc-mode button[data-value="compare"]');assert(await page.locator('#grid-mode-group').isHidden(),'comparison hides saved normal-grid actions');assert(await page.locator('#toggle-clipping').isHidden(),'comparison hides clipping toggle');
  await click('#fcc-mode button[data-value="normal"]');assert(await page.locator('#grid-mode-group button[data-mode="2"]').evaluate(e=>e.classList.contains('active')),'normal grid preference survives void mode');
  const colors=await page.evaluate(()=>[...new Set(__fccScenes.normal.children.find(o=>o.isGroup).children.map(o=>o.children[0].material.color.getHexString()))].sort());assert(JSON.stringify(colors)===JSON.stringify(['8dbddc','f29aa8']),'FCC palette uses darker legacy pink and pale blue');
  return {checks:checks.length,results:checks};
}
