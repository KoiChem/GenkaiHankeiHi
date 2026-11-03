async(page)=>{
  const checks=[],assert=(ok,m)=>{if(!ok)throw new Error(m);checks.push(m);};
  const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
  const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}};
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.locator('#crystal-type-group button[data-type=FCC]').click();await page.locator('#btn-reset-pos').click();await page.waitForFunction(()=>window.__fccCameras?.normal);
  for(const selector of ['#grid-mode-group button[data-mode="1"]','#toggle-clipping']){
    const button=page.locator(selector);await button.focus();await page.keyboard.press('Space');await page.keyboard.press('Enter');assert(await button.evaluate(e=>document.activeElement===e),'repeated keyboard activation keeps focus on '+selector);
  }
  assert(await page.getByRole('slider',{name:'原子の不透明度',exact:true}).isVisible(),'atom slider retains explicit opacity semantics');
  await click('#fcc-mode button[data-value="void"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
  assert(await page.getByRole('slider',{name:'間隙の不透明度',exact:true}).isVisible()&&await page.getByRole('slider',{name:'間隙球の不透明度',exact:true}).isVisible(),'void and sphere sliders retain explicit opacity semantics');
  const colors=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.filter(o=>o.visible).map(o=>{const surface=o.children[0].material.color,ball=o.children[3].children[0].material.color;const h={},b={};surface.getHSL(h);ball.getHSL(b);return{lighter:h.l>b.l,hue:Math.abs(h.h-b.h)};}));
  assert(colors.every(c=>c.lighter&&c.hue>.005),'void surfaces are lighter with distinct hues from their balls');
  await click('#fcc-mode button[data-value="normal"]');
  if(await page.locator('#toggle-clipping').evaluate(e=>e.classList.contains('active')))await click('#toggle-clipping');
  for(const projection of ['persp','ortho'])for(const grid of [0,1,2]){
    await click('#grid-mode-group button[data-mode="'+grid+'"]');await click('#btn-'+projection);await click('#btn-reset-pos');
    const before=await page.evaluate(()=>({distance:__fccArgs.getCamera().position.distanceTo(__fccArgs.controls.target),zoom:__fccArgs.getCamera().zoom}));
    await click('#toggle-clipping');
    const after=await page.evaluate(()=>({distance:__fccArgs.getCamera().position.distanceTo(__fccArgs.controls.target),zoom:__fccArgs.getCamera().zoom}));
    assert(Math.abs(before.distance-after.distance)<1e-8&&Math.abs(before.zoom-after.zoom)<1e-8,'clipping retains view scale '+projection+' grid'+grid);
    await click('#toggle-clipping');
  }
  await click('#fcc-mode button[data-value="compare"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
  assert(await page.evaluate(()=>!STATE.isClipping&&__fccScenes.normal.children.find(o=>o.isGroup).children.every(o=>o.children[0].material.clippingPlanes.length===6)),'comparison forces clipped atoms without changing normal preference');
  await click('#fcc-mode button[data-value="normal"]');assert(await page.evaluate(()=>!STATE.isClipping&&__fccScenes.normal.children.find(o=>o.isGroup).children.every(o=>o.children[0].material.clippingPlanes.length===0)),'normal restores the unclipped preference');
  await click('#toggle-clipping');await click('#grid-mode-group button[data-mode="0"]');await click('#btn-reset-pos');
  // A panel pointer must cancel the canvas double before its 300ms timeout.
  const p=await page.evaluate(()=>{const v=new THREE.Vector3(3,1.5,1.5).project(__fccCameras.normal);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
  await page.mouse.click(p.x,p.y,{clickCount:2,delay:40});
  await page.locator('#fcc-atom-opacity').click();await page.waitForTimeout(350);
  assert(await page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.every(o=>o.visible)),'UI pointer cancels the pending canvas double tap');
  const slider=await page.locator('#fcc-atom-opacity').boundingBox(),session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1},{x:slider.x+slider.width*.7,y:slider.y+slider.height/2,id:2}]});
  await page.waitForTimeout(520);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);await session.detach();
  assert(await page.locator('#fcc-mode button[data-value="normal"]').getAttribute('aria-pressed')==='true','a second pointer on UI cancels the model long press');
  await click('#toggle-pin');await page.mouse.move(500,400);await page.mouse.down({button:'right'});await page.mouse.move(550,425,{steps:6});await page.mouse.up({button:'right'});await page.waitForTimeout(450);
  assert(await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden')),'right pan hides an unpinned settings panel');
  await panel(true);await click('#toggle-pin');
  const screenshots=[];
  for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(450);
    for(const mode of ['normal','void','compare']){
      await click('#fcc-mode button[data-value="'+mode+'"]');await page.waitForTimeout(250);
      const noOverlap=await page.locator('#ui-panel').evaluate(panel=>{const buttons=[...panel.querySelectorAll('button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=buttons[i].getBoundingClientRect(),b=buttons[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>-.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>-.5)return false;}return true;});
      assert(noOverlap,'buttons keep gaps '+viewport.width+'×'+viewport.height+' '+mode);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+viewport.width+' '+mode);
      const filename='.playwright-mcp/fcc-refined-'+viewport.width+'-'+mode+'.png';await page.screenshot({path:filename});screenshots.push(filename);
    }
  }
  return{checks:checks.length,results:checks,screenshots};
}
