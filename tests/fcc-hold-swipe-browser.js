async page=>{
 const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const cdp=await page.context().newCDPSession(page);
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await page.setViewportSize({width:844,height:390});
 const panel=async show=>{if(await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'))===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}};
 for(const type of ['NaCl','CsCl','ZnS','FCC']){
  await panel(true);await page.locator('#crystal-type-group button[data-type="'+type+'"]').click();
  if(type==='FCC')await page.locator('#fcc-mode button[data-value=normal]').click();
  await page.locator('#grid-mode-group button[data-mode="0"]').click();await page.locator('#btn-reset-pos').click();
  const restore=page.locator(type==='FCC'?'#fcc-restore':'#ion-restore');if(await restore.isEnabled())await restore.click();await panel(false);
  const p=await page.evaluate(()=>{const a=STATE.type==='FCC'?3:STATE.savedFixedA,cam=__fccArgs.views.camera(__fccArgs.getCamera(),innerWidth,innerHeight);let pts=STATE.type==='FCC'?[[a,a/2,a/2]]:__lastScene.children.find(g=>g.isGroup).children.filter(m=>m.geometry?.type==='SphereGeometry'&&m.visible).map(m=>m.position.toArray());return pts.map(p=>{const v=new THREE.Vector3(...p).project(cam);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};}).find(p=>p.x>70&&p.x<innerWidth-90&&p.y>100&&p.y<innerHeight-50);});
  assert(!!p,type+' has a touch target');
  const count=()=>page.evaluate(()=>STATE.type==='FCC'?__fccScenes.normal.children.find(g=>g.isGroup).children.filter(g=>!g.visible).length:__lastScene.children.find(g=>g.isGroup).children.filter(m=>m.geometry?.type==='SphereGeometry'&&!m.visible).length);
  const start=async()=>{await touch('touchStart',[{...p,id:1}]);await page.waitForTimeout(600);};
  await start();assert(await page.evaluate(()=>!__fccArgs.controls.enabled),type+' hold selects and locks rotation');
  assert(await page.evaluate(()=>{const scene=STATE.type==='FCC'?__fccScenes.normal:__lastScene;return scene.children.filter(m=>m.material?.isShaderMaterial&&m.geometry.parameters.radius>m.material.uniforms.glowRadius.value).length===1;}),type+' soft light extends beyond selected sphere');
  await touch('touchEnd',[]);await page.waitForTimeout(350);assert(await count()===0,type+' hold alone cancels');
  assert(await page.evaluate(()=>(STATE.type==='FCC'?__fccScenes.normal:__lastScene).children.every(m=>!m.material?.isShaderMaterial)),type+' cancel removes external light');
  await start();await touch('touchMove',[{x:p.x+65,y:p.y,id:1}]);await touch('touchMove',[{...p,id:1}]);await touch('touchEnd',[]);await page.waitForTimeout(350);assert(await count()===0,type+' return cancels');
  await start();await touch('touchStart',[{...p,id:1},{x:p.x+30,y:p.y,id:2}]);await touch('touchEnd',[]);await page.waitForTimeout(350);assert(await count()===0,type+' second finger cancels');
  await start();await touch('touchCancel',[]);await page.waitForTimeout(350);assert(await count()===0,type+' interrupted touch cancels');
  await start();await touch('touchMove',[{x:p.x+65,y:p.y,id:1}]);assert(await count()===0,type+' hides only on release');await touch('touchEnd',[]);await page.waitForTimeout(350);assert(await count()===1,type+' swipe hides one');
  assert(await page.evaluate(()=>__fccArgs.controls.enabled),type+' restores camera controls');
 }
 await cdp.detach();return{checks:checks.length,results:checks};
}
