async(page)=>{
  const results=[],failures=[],check=(ok,name)=>{results.push({name,pass:!!ok});if(!ok)failures.push(name);};
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccArgs);await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(410);
  const pose=()=>page.evaluate(()=>__fccArgs.getCamera().quaternion.toArray());
  const same=(a,b)=>Math.abs(a.reduce((s,v,i)=>s+v*b[i],0))>1-1e-9;
  const pointer=(type,buttons,x,y)=>page.evaluate(({type,buttons,x,y})=>document.querySelector('canvas').dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'mouse',pointerId:31,isPrimary:true,button:buttons&2?2:buttons?0:-1,buttons,clientX:x,clientY:y})),{type,buttons,x,y});
  await pointer('pointerdown',1,500,400);await pointer('pointermove',1,550,350);await page.waitForTimeout(80);const drag=await pose();await pointer('pointermove',0,650,450);await page.waitForTimeout(80);const hover=await pose();
  check(same(drag,hover),'hover with buttons0 cannot continue a drag after a missed mouseup');await pointer('pointerup',0,650,450);
  const client=await page.context().newCDPSession(page),touch=async(type,x,y)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{id:1,x,y}]});
  for(const action of ['reset','projection']){
    await touch('touchStart',500,400);await touch('touchMove',520,370);await page.waitForTimeout(80);
    await page.evaluate(action=>document.querySelector(action==='reset'?'#btn-reset-pos':'#btn-ortho').click(),action);const stopped=await pose();await touch('touchMove',620,280);await page.waitForTimeout(100);
    check(same(stopped,await pose()),action+' suppresses the old touch until release');await touch('touchEnd');
    const before=await pose();await touch('touchStart',500,400);await touch('touchMove',550,330);await page.waitForTimeout(80);check(!same(before,await pose()),'fresh touch rotates after '+action+' cancellation');await touch('touchEnd');
  }
  await pointer('pointerdown',2,500,400);await pointer('pointermove',2,550,425);await page.evaluate(()=>document.querySelector('#btn-reset-pos').click());await pointer('pointermove',2,650,475);await page.waitForTimeout(80);
  check(await page.evaluate(()=>STATE.viewOffsetX===0&&STATE.viewOffsetY===0),'reset suppresses an old held right-drag pan');await pointer('pointerup',0,650,475);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:450,y:350},{id:2,x:550,y:350}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:470,y:360},{id:2,x:570,y:360}]});await page.waitForTimeout(60);
  await page.evaluate(()=>document.querySelector('#btn-reset-pos').click());await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:500,y:380},{id:2,x:600,y:380}]});await page.waitForTimeout(80);
  check(await page.evaluate(()=>STATE.viewOffsetX===0&&STATE.viewOffsetY===0),'reset suppresses old held two-finger screen panning');await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.evaluate(()=>{document.querySelector('#crystal-type-group button[data-type="NaCl"]').click();if(!STATE.isClipping)document.querySelector('#toggle-clipping').click();if(!STATE.isDiagonalMode)document.querySelector('#toggle-diagonal').click();});
  await touch('touchStart',500,400);await touch('touchMove',520,370);await page.waitForTimeout(60);await page.locator('#view-cube').click();
  await page.evaluate(async()=>{for(let i=0;i<90;i++)await new Promise(requestAnimationFrame);});const snapped=await pose();await touch('touchMove',650,250);await page.waitForTimeout(80);
  check(same(snapped,await pose()),'completed snap suppresses its old held touch until release');await touch('touchEnd');const beforeFresh=await pose();await touch('touchStart',500,400);await touch('touchMove',550,330);await page.waitForTimeout(80);check(!same(beforeFresh,await pose()),'fresh touch rotates after snap cancellation');await touch('touchEnd');
  await client.detach();if(failures.length)throw new Error('Unmet requirements: '+failures.join('; '));return{checks:results.length,results};
}
