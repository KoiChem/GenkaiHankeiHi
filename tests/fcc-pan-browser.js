async(page)=>{
  const checks=[],assert=(ok,message)=>{if(!ok)throw new Error(message);checks.push(message);};
  const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);}};
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(70);};
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.locator('#crystal-type-group button[data-type=FCC]').click();await page.locator('#btn-reset-pos').click();await page.waitForFunction(()=>window.__fccCameras?.normal);
  const snapshot=()=>page.evaluate(()=>{const fcc=STATE.type==='FCC',mode=document.querySelector('#fcc-mode button.active').dataset.value,camera=fcc?__fccCameras[mode==='void'?'void':'normal']:__fccArgs.getCamera(),v=STATE.currentCenter.clone().project(camera);return{target:__fccArgs.controls.target.toArray(),center:STATE.currentCenter.toArray(),screen:[v.x,v.y],offset:[STATE.viewOffsetX,STATE.viewOffsetY]};});
  const drag=async(button,dx,dy)=>{await page.mouse.move(490,390);await page.mouse.down({button});await page.mouse.move(490+dx,390+dy,{steps:6});await page.mouse.up({button});await page.waitForTimeout(250);};
  for(const projection of [page.__fccPanProjection||'persp'])for(const grid of [0,1,2])for(const mode of ['normal','void','compare']){
    await panel(true);await click('#fcc-mode button[data-value="normal"]');await click('#grid-mode-group button[data-mode="'+grid+'"]');await click('#fcc-mode button[data-value="'+mode+'"]');if(mode!=='normal')await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);await click('#btn-'+projection);await click('#btn-reset-pos');await panel(false);
    const before=await snapshot();await drag('right',60,25);const panned=await snapshot();await drag('left',35,-20);const rotated=await snapshot();
    const sameTarget=rotated.target.every((v,i)=>Math.abs(v-before.center[i])<1e-8),sameScreen=rotated.screen.every((v,i)=>Math.abs(v-panned.screen[i])<1e-7);
    assert(sameTarget&&sameScreen&&Math.abs(panned.offset[0]+60)<1e-8,projection+' grid'+grid+' '+mode+': pan→rotate keeps geometric pivot and screen center');
    if(mode==='compare')assert(await page.evaluate(()=>__fccCameras.normal.projectionMatrix.equals(__fccCameras.void.projectionMatrix)),'comparison pan stays synchronized '+projection+' grid'+grid);
    const point=await page.evaluate(({mode,grid})=>{const side=mode==='void'?'void':'normal',camera=__fccCameras[side],effective=mode==='normal'?grid:0,dims=effective===2?[2,2,2]:effective===1?[2,1,2]:[1,1,1],p=mode==='void'?[1.5,1.5,1.5]:[dims[0]*3,1.5,1.5],v=new THREE.Vector3(...p).project(camera),width=mode==='compare'?innerWidth/2:innerWidth;return{x:(v.x+1)*width/2,y:(1-v.y)*innerHeight/2};},{mode,grid});
    if(mode!=='void'){
      const count=()=>page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.filter(o=>!o.visible).length);
      const old=await count();await page.mouse.click(point.x,point.y,{clickCount:2,delay:60});await page.waitForTimeout(350);assert(await count()===old+1,'picking follows panned '+projection+' grid'+grid+' '+mode);await panel(true);await click('#fcc-restore');await panel(false);
    }else{const previous=await page.evaluate(()=>__fccScenes.void.children.filter(o=>o.isGroup)[1].children[0]?.uuid);await page.mouse.click(point.x,point.y);await page.waitForTimeout(340);assert(await page.evaluate(()=>__fccScenes.void.children.filter(o=>o.isGroup)[1].children[0]?.uuid)!==previous,'void picking follows panned '+projection+' grid'+grid);}
  }
  await panel(true);await click('#fcc-mode button[data-value="normal"]');
  for(const type of ['CsCl','NaCl','ZnS'])for(const projection of [page.__fccPanProjection||'persp']){
    await click('#crystal-type-group button[data-type="'+type+'"]');await click('#btn-'+projection);await click('#btn-reset-pos');await panel(false);
    const before=await snapshot();await drag('right',55,20);const panned=await snapshot();await drag('left',35,-20);const rotated=await snapshot();
    assert(rotated.target.every((v,i)=>Math.abs(v-before.center[i])<1e-8)&&rotated.screen.every((v,i)=>Math.abs(v-panned.screen[i])<1e-7),type+' '+projection+' legacy pan→rotate retains model center');await panel(true);
  }
  await click('#crystal-type-group button[data-type="FCC"]');await click('#fcc-mode button[data-value="normal"]');await click('#grid-mode-group button[data-mode="0"]');await click('#btn-reset-pos');await panel(false);
  await drag('right',60,25);await panel(true);await click('#crystal-type-group button[data-type="NaCl"]');
  assert(await page.evaluate(()=>__fccArgs.controls.target.distanceTo(STATE.currentCenter)<1e-8),'FCC pan does not contaminate the ion-mode rotation target');
  await click('#crystal-type-group button[data-type="FCC"]');await click('#fcc-mode button[data-value="compare"]');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(450);await panel(false);
  const client=await page.context().newCDPSession(page);const touches=async(type,ps)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:ps});
  await touches('touchStart',[{x:220,y:180,id:1}]);await touches('touchStart',[{x:220,y:180,id:1},{x:280,y:180,id:2}]);
  const start=await snapshot();await touches('touchMove',[{x:250,y:195,id:1},{x:310,y:195,id:2}]);await touches('touchEnd',[]);await page.waitForTimeout(400);const end=await snapshot();
  assert(end.target.every((v,i)=>Math.abs(v-start.target[i])<1e-8)&&Math.abs(end.offset[0]-start.offset[0]+30)<1e-6,'two-finger screen pan changes offsets without moving rotation target');
  assert(await page.locator('#fcc-mode button[data-value="compare"]').getAttribute('aria-pressed')==='true','two-finger pan cannot trigger mode switching');await client.detach();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(450);
  const synced=await page.evaluate(()=>__fccCameras.normal.projectionMatrix.equals(__fccCameras.void.projectionMatrix));assert(synced,'resize retains synchronized panned comparison cameras');
  return{checks:checks.length,results:checks};
}
