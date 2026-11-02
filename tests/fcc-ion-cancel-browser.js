async(page)=>{
 const checks=[],assert=(v,n)=>{if(!v)throw new Error(n);checks.push(n);};
 await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__lastScene);
 await page.locator('#crystal-type-group button[data-type="NaCl"]').click();await page.locator('#btn-reset-pos').click();await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);
 const snapshot=()=>page.evaluate(()=>({aux:STATE.auxLinesState,hidden:__lastScene.children.find(g=>g.isGroup).children.filter(m=>m.geometry?.type==='SphereGeometry'&&!m.visible).length}));
 const p=await page.evaluate(()=>{const a=STATE.savedFixedA,v=new THREE.Vector3(a,a/2,a/2).project(__fccArgs.getCamera());return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
 const original=await snapshot();await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+40,p.y-30,{steps:6});await page.mouse.up();await page.waitForTimeout(350);assert(JSON.stringify(await snapshot())===JSON.stringify(original),'ion drag cannot trigger single or hide actions');
 for(const action of ['wheel','blur','reset','projection']){
  await page.mouse.click(p.x,p.y,{clickCount:action==='wheel'?1:2,delay:40});
  if(action==='wheel')await page.mouse.wheel(0,100);else if(action==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));else await page.evaluate(action=>document.querySelector(action==='reset'?'#btn-reset-pos':'#btn-ortho').click(),action);
  await page.waitForTimeout(350);assert(JSON.stringify(await snapshot())===JSON.stringify(original),'ion '+action+' cancels pending tap actions');
 }
 await page.evaluate(()=>{document.querySelector('#btn-persp').click();document.querySelector('#btn-reset-pos').click();const c=__fccArgs.getCamera();c.position.copy(__fccArgs.controls.target).add(new THREE.Vector3(0,0,10));c.up.set(0,1,0);__fccArgs.controls.update();});
 const center={x:640,y:400};await page.mouse.click(center.x,center.y,{clickCount:2,delay:60});await page.waitForTimeout(350);const first=await page.evaluate(()=>__lastScene.children.find(g=>g.isGroup).children.find(m=>m.geometry?.type==='SphereGeometry'&&!m.visible).userData.ionSiteId);
 await page.mouse.click(center.x,center.y,{clickCount:2,delay:60});await page.waitForTimeout(350);assert((await snapshot()).hidden===2,'aligned ray can hide two different visible ions');
 await page.mouse.move(200,400);await page.mouse.down();for(let i=1;i<=20;i++){await page.mouse.move(200+i*33.5,400);await page.waitForTimeout(20);}await page.mouse.up();
 await page.mouse.click(center.x,center.y,{clickCount:3,delay:60});await page.waitForTimeout(350);assert(await page.evaluate(id=>__lastScene.children.find(g=>g.isGroup).children.some(m=>m.userData.ionSiteId===id&&m.visible),first),'rotation invalidates recent-hide priority and restores the farthest hidden ion');
 return{checks:checks.length,results:checks};
}
