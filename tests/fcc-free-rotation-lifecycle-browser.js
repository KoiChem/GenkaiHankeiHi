async(page)=>{
  const results=[],failures=[],check=(ok,name)=>{results.push({name,pass:!!ok});if(!ok)failures.push(name);};
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccArgs);
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(80);};
  const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);}};
  await click('#crystal-type-group button[data-type="NaCl"]');
  if(!await page.locator('#toggle-clipping').evaluate(e=>e.classList.contains('active')))await click('#toggle-clipping');
  if(!await page.locator('#toggle-diagonal').evaluate(e=>e.classList.contains('active')))await click('#toggle-diagonal');
  await page.evaluate(()=>{const camera=__fccArgs.getCamera();camera.up.set(0,-1,0);camera.lookAt(__fccArgs.controls.target);__fccArgs.controls.update();});
  await click('#btn-snap-diagonal');
  const snap=await page.evaluate(async()=>{let previous=__fccArgs.getCamera().quaternion.clone(),max=0;for(let i=0;i<90;i++){await new Promise(requestAnimationFrame);const q=__fccArgs.getCamera().quaternion;max=Math.max(max,previous.angleTo(q));previous.copy(q);}return{max,up:__fccArgs.getCamera().up.toArray(),enabled:__fccArgs.controls.enabled};});
  check(snap.max<.25&&snap.up.every((v,i)=>Math.abs(v-[0,1,0][i])<1e-8)&&snap.enabled,'diagonal snap from inverted up is continuous and ends upright');
  await click('#crystal-type-group button[data-type="FCC"]');await click('#fcc-mode button[data-value="compare"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);await panel(false);
  await page.mouse.move(460,450);await page.mouse.down();await page.mouse.move(510,300,{steps:6});
  await page.evaluate(()=>document.querySelector('#btn-reset-pos').click());await page.mouse.up();
  const reset=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));await page.waitForTimeout(450);
  const settled=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray(),sync:__fccCameras.normal.projectionMatrix.equals(__fccCameras.void.projectionMatrix)&&__fccCameras.normal.quaternion.angleTo(__fccCameras.void.quaternion)<1e-8}));
  check(reset.up.every((v,i)=>Math.abs(v-[0,1,0][i])<1e-8)&&reset.q.every((v,i)=>Math.abs(v-settled.q[i])<1e-8),'reset during a drag clears queued motion and remains upright/rest');
  check(settled.sync,'comparison render cameras remain synchronized after reset');
  await panel(true);
  const client=await page.context().newCDPSession(page);
  for(const projection of ['persp','ortho']){
    await click('#btn-'+projection);await click('#btn-reset-pos');await panel(false);
    const apparent=()=>page.evaluate(()=>{const camera=__fccCameras.normal,p=__fccArgs.controls.target.clone(),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(.5);return p.clone().project(camera).distanceTo(p.add(right).project(camera));});
    const before=await apparent();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:220,y:350,id:1},{x:280,y:350,id:2}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:350,id:1},{x:300,y:350,id:2}]});await page.waitForTimeout(100);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);const spread=await apparent();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:350,id:1},{x:300,y:350,id:2}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:350,id:1},{x:280,y:350,id:2}]});await page.waitForTimeout(100);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);const pinch=await apparent();
    check(spread>before*1.2&&pinch<spread/1.2,'pinch spread enlarges and pinch close shrinks '+projection);
    await panel(true);
  }
  await client.detach();if(failures.length)throw new Error('Unmet requirements: '+failures.join('; '));return{checks:results.length,results};
}
