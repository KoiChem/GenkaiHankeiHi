async(page)=>{
    const checks=[],assert=(p,m)=>{if(!p)throw new Error(m);checks.push(m);};
    await page.setViewportSize({width:844,height:390});
    if(await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'))){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}
    await page.locator('#fcc-mode button[data-value="normal"]').click();
    await page.locator('#grid-mode-group button[data-mode="0"]').click();
    await page.locator('#fcc-restore').click();
    await page.locator('#btn-persp').click();await page.locator('#btn-reset-pos').click();
    await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);
    const p=await page.evaluate(()=>{const v=new THREE.Vector3(3,1.5,1.5).project(__fccCameras.normal);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
    const session=await page.context().newCDPSession(page);
    const touch=async(type,points)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    const finger={x:p.x,y:p.y,id:1};
    const taps=async n=>{for(let i=0;i<n;i++){await touch('touchStart',[finger]);await touch('touchEnd',[]);await page.waitForTimeout(65);}await page.waitForTimeout(350);};
    const hidden=()=>page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.filter(o=>!o.visible).length);
    await taps(2);assert(await hidden()===1,'two real touch taps hide one atom');
    await taps(3);assert(await hidden()===0,'three real touch taps restore it');
    await touch('touchStart',[finger]);await page.waitForTimeout(70);await touch('touchStart',[finger,{x:p.x+35,y:p.y,id:2}]);await page.waitForTimeout(500);await touch('touchEnd',[]);await page.waitForTimeout(350);
    assert(await page.locator('#fcc-mode button[data-value="normal"]').getAttribute('aria-pressed')==='true','two-finger touch cancels the pending long press');
    assert(await hidden()===0,'two-finger touch cannot produce a delayed hide');
    await session.detach();return {checks:checks.length,results:checks};
}
