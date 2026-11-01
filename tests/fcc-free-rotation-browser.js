async(page)=>{
  const results=[],failures=[],check=(ok,name)=>{results.push({name,pass:!!ok});if(!ok)failures.push(name);};
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const original=window.createFCCView;window.createFCCView=options=>{window.__fccArgs=options;window.__fccCameras={};window.__fccScenes={};const controller=original(options),render=options.renderer.render.bind(options.renderer);options.renderer.render=(scene,camera)=>{const site=scene.children.find(o=>o.isGroup)?.children[0]?.userData?.site;if(site){const key=site.kind?'void':'normal';__fccCameras[key]=camera;__fccScenes[key]=scene;}return render(scene,camera);};return controller;};}));
  const session=await page.context().newCDPSession(page);await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccCameras?.normal);
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(80);};
  const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);}};
  const scale=()=>page.evaluate(()=>{const camera=__fccArgs.getCamera(),view=__fccCameras.normal,p=STATE.currentCenter.clone(),right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(FCCGeometry.R*3),x=p.clone().project(view),y=p.clone().add(right).project(view);return{distance:camera.position.distanceTo(__fccArgs.controls.target),zoom:camera.zoom,radius:x.distanceTo(y),position:camera.position.toArray()};});
  for(const projection of ['persp','ortho'])for(const grid of [0,1,2]){
    await click('#grid-mode-group button[data-mode="'+grid+'"]');await click('#btn-'+projection);await click('#btn-reset-pos');const before=await scale();await click('#toggle-clipping');const after=await scale();
    check(Math.abs(before.distance-after.distance)<1e-8&&Math.abs(before.zoom-after.zoom)<1e-8&&Math.abs(before.radius-after.radius)<1e-8,'clipping preserves distance, zoom and projected atom radius '+projection+' grid'+grid);
  }
  await click('#grid-mode-group button[data-mode="0"]');await click('#btn-persp');
  for(const type of ['FCC','CsCl','NaCl','ZnS']){
    await click('#crystal-type-group button[data-type="'+type+'"]');await click('#btn-reset-pos');await panel(false);
    let angle=0,inverted=false;
    for(let sweep=0;sweep<10;sweep++){
      await page.mouse.move(500,560);await page.mouse.down();let previous=await page.evaluate(()=>__fccArgs.getCamera().quaternion.toArray());
      for(let step=1;step<=10;step++){
        await page.mouse.move(500,560-step*35);await page.waitForTimeout(20);
        const current=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.y}));
        const d=Math.min(1,Math.abs(previous.reduce((s,v,i)=>s+v*current.q[i],0)));angle+=2*Math.acos(d);previous=current.q;if(current.up<-.2)inverted=true;
      }
      await page.mouse.up();
    }
    check(angle>4*Math.PI&&inverted,type+' vertical swipes pass multiple full turns without a polar stop');
    await panel(true);
  }
  await page.evaluate(()=>{const camera=__fccArgs.getCamera();camera.rotateZ(.85);camera.up.set(0,1,0).applyQuaternion(camera.quaternion);__fccArgs.controls.update();});
  const before=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));
  await click('#btn-ortho');const middle=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));await click('#btn-persp');
  const after=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));
  check([middle,after].every(pose=>before.up.every((v,i)=>Math.abs(v-pose.up[i])<1e-8)&&Math.abs(before.q.reduce((s,v,i)=>s+v*pose.q[i],0))>1-1e-8),'rolled projection round trip preserves camera up and quaternion');
  await click('#btn-reset-pos');const rest=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));await page.waitForTimeout(450);const later=await page.evaluate(()=>({q:__fccArgs.getCamera().quaternion.toArray(),up:__fccArgs.getCamera().up.toArray()}));
  check(rest.up.every((v,i)=>Math.abs(v-[0,1,0][i])<1e-9)&&rest.q.every((v,i)=>Math.abs(v-later.q[i])<1e-9),'reset returns upright and remains at rest without residual rotation');
  await session.detach();if(failures.length)throw new Error('Unmet requirements: '+failures.join('; '));return{checks:results.length,results};
}
