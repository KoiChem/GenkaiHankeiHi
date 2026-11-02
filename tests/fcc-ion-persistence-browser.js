async(page)=>{
 const checks=[],assert=(v,n)=>{if(!v)throw new Error(n);checks.push(n);};
 await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__lastScene);
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(80);};
 const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);}};
 const count=()=>page.evaluate(()=>__lastScene.children.find(g=>g.isGroup).children.filter(m=>m.geometry?.type==='SphereGeometry'&&m.visible).length);
 const point=()=>page.evaluate(()=>{const c=__fccArgs.getCamera();c.updateMatrixWorld();const objects=__lastScene.children.find(g=>g.isGroup).children.filter(o=>o.visible&&o.userData.ionSiteId);for(const object of objects.slice().sort((a,b)=>a.position.distanceTo(c.position)-b.position.distanceTo(c.position))){const p=object.position.clone().lerp(STATE.currentCenter,.025).project(c),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(p.x,p.y),c);const hits=ray.intersectObjects(objects,false).filter(h=>(h.object.material.clippingPlanes||[]).every(pl=>pl.distanceToPoint(h.point)>-1e-6));if(hits.length)return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}throw new Error('No visible ion point');});
 for(const type of ['CsCl','NaCl','ZnS']){
  await panel(true);await click('#crystal-type-group button[data-type="'+type+'"]');await click('#grid-mode-group button[data-mode="0"]');await click('#btn-reset-pos');await click('#ion-restore');await panel(false);
  const before=await count(),p=await point();await page.mouse.click(p.x,p.y,{clickCount:2,delay:65});await page.waitForTimeout(350);assert(await count()===before-1,type+' double hides one ion');
  const hidden=await page.evaluate(()=>__lastScene.children.find(g=>g.isGroup).children.find(m=>m.geometry?.type==='SphereGeometry'&&!m.visible).userData.ionSiteId);
  assert(await page.evaluate(id=>__lastScene.children.find(g=>g.isGroup).children.filter(m=>m.userData.ionSiteId===id).every(m=>!m.visible),hidden),type+' sphere and every cap share hidden visibility');
  await panel(true);await page.locator('#ratio-slider').fill('0.54');await click('#grid-mode-group button[data-mode="1"]');await click('#grid-mode-group button[data-mode="0"]');
  await click('#crystal-type-group button[data-type="FCC"]');await click('#crystal-type-group button[data-type="'+type+'"]');
  assert(await page.evaluate(id=>__lastScene.children.find(g=>g.isGroup).children.some(m=>m.userData.ionSiteId===id&&!m.visible),hidden),type+' hidden ID persists across ratio/grid/crystal changes');
  await page.locator('#opacity-p-slider').fill('0');await page.locator('#opacity-m-slider').fill('0');await panel(false);await page.mouse.click(p.x,p.y,{clickCount:2,delay:65});await page.waitForTimeout(350);await panel(true);await page.locator('#opacity-p-slider').fill('0.7');await page.locator('#opacity-m-slider').fill('0.6');assert(await count()===before-1,type+' opacity-zero double creates no phantom hidden state');
  await click('#ion-restore');assert(await count()===before,type+' restore-all restores the current ions');
  if(!await page.locator('#toggle-diagonal').evaluate(e=>e.classList.contains('active')))await click('#toggle-diagonal');await panel(false);
  const diagonalPoint=await point();await page.mouse.click(diagonalPoint.x,diagonalPoint.y,{clickCount:2,delay:65});await page.waitForTimeout(350);assert(await count()===before-1,type+' hides correctly with diagonal clipping');await page.mouse.click(diagonalPoint.x,diagonalPoint.y,{clickCount:3,delay:65});await page.waitForTimeout(350);assert(await count()===before,type+' restores through the clipped analytic hit target');
  await panel(true);await click('#toggle-diagonal');
  const light=await page.evaluate(()=>{const l=__lastScene.children.find(o=>o.isDirectionalLight),v=l.position.clone().sub(l.target.position).normalize().applyQuaternion(__fccArgs.getCamera().quaternion.clone().invert());return{x:v.x,y:v.y,z:v.z,a:__lastScene.children.find(o=>o.isAmbientLight).intensity,d:l.intensity};});assert(Math.abs(light.x)<1e-8&&light.y>.7&&light.z>.7&&light.a===.8&&light.d===.4,type+' uses matching screen-up soft lighting');
 }
 await click('#toggle-pin');await panel(false);await page.mouse.click(40,100,{clickCount:2,delay:60});await page.waitForTimeout(350);assert(await page.locator('#ui-panel').evaluate(e=>!e.classList.contains('hidden')),'empty-background double reopens an unpinned panel');await click('#toggle-pin');
 return{checks:checks.length,results:checks};
}
