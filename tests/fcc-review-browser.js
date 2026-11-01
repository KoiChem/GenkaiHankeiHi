async (page) => {
    const checks=[],assert=(p,m)=>{if(!p)throw new Error(m);checks.push(m);};
    await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const original=window.createFCCView;window.createFCCView=options=>{window.__fccArgs=options;window.__fccScenes={};window.__fccCameras={};const result=original(options),render=options.renderer.render.bind(options.renderer);options.renderer.render=(scene,camera)=>{const group=scene.children.find(o=>o.isGroup),site=group?.children[0]?.userData?.site;if(site){const key=site.kind?'void':'normal';__fccScenes[key]=scene;__fccCameras[key]=camera;}return render(scene,camera);};return result;};}));
    await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__fccCameras?.normal);
    const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
    const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}};
    const fits=()=>page.evaluate(()=>{
        const mode=document.querySelector('#fcc-mode button.active').dataset.value,grid=mode==='normal'?STATE.gridMode:0;
        const dims=grid===2?[2,2,2]:grid===1?[2,1,2]:[1,1,1];
        const camera=__fccCameras.normal||__fccCameras.void;
        const result=[];for(const x of [0,dims[0]*3])for(const y of [0,dims[1]*3])for(const z of [0,dims[2]*3]){const p=new THREE.Vector3(x,y,z).project(camera);result.push(Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001);}return result.every(Boolean);
    });
    assert(await fits(),'portrait normal entry fits the cell without reset');
    await click('#fcc-mode button[data-value="compare"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
    assert(await fits(),'portrait comparison entry fits the cell without reset');
    await panel(false);await page.screenshot({path:'.playwright-mcp/fcc-phone-portrait-fixed.png'});
    await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(500);await panel(true);await click('#fcc-mode button[data-value="normal"]');
    await click('#grid-mode-group button[data-mode="2"]');assert(await fits(),'desktop 8-cell switch fits all corners without reset');
    const before=await page.evaluate(()=>__fccArgs.getCamera().position.distanceTo(__fccArgs.controls.target));
    await click('#grid-mode-group button[data-mode="0"]');await click('#grid-mode-group button[data-mode="2"]');
    const after=await page.evaluate(()=>__fccArgs.getCamera().position.distanceTo(__fccArgs.controls.target));assert(Math.abs(before-after)<1e-8,'grid round trip preserves the user zoom ratio');
    await click('#fcc-mode button[data-value="compare"]');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);assert(await fits(),'resizing comparison with a saved eight-cell preference fits its base-cell corners');
    await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(500);await click('#fcc-mode button[data-value="normal"]');await click('#grid-mode-group button[data-mode="0"]');await click('#fcc-mode button[data-value="compare"]');
    for(let i=0;i<2;i++){await click('#toggle-quality');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);}
    const memory=[];
    for(let i=0;i<3;i++){await click('#toggle-quality');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);await page.waitForTimeout(100);memory.push(await page.evaluate(()=>__fccArgs.renderer.info.memory.geometries));}
    assert(memory[0]===memory[2],'geometry counts remain stable after quality cache warm-up: '+memory.join(' -> '));
    await click('#fcc-display button[data-value="void"]');await page.locator('#fcc-void-opacity').fill('1');await page.waitForTimeout(80);
    const opaque=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.every(o=>o.children.filter(m=>m.isMesh&&m.visible).every(m=>m.material.depthWrite)));
    assert(opaque,'every visible 100% opaque void part writes depth');
    const centers=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.every(o=>o.children.filter(m=>m.isMesh).every(m=>m.position.distanceTo(new THREE.Vector3(...o.userData.site.p).multiplyScalar(3))<1e-8)));
    assert(centers,'void mesh sort origins match their individual site centers');
    await click('#fcc-mode button[data-value="normal"]');await click('#btn-reset-pos');await page.locator('#fcc-atom-opacity').fill('0');await panel(false);
    const point=await page.evaluate(()=>{const p=new THREE.Vector3(3,1.5,1.5).project(__fccCameras.normal);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
    await page.mouse.click(point.x,point.y,{clickCount:2,delay:60});await page.waitForTimeout(350);
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();
    assert(await page.locator('#fcc-mode button[data-value="normal"]').getAttribute('aria-pressed')==='true','opacity-zero atoms cannot trigger long press');
    await panel(true);await page.locator('#fcc-atom-opacity').fill('1');await panel(false);
    const remaining=()=>page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.filter(o=>o.visible).length);
    assert(await remaining()===14,'opacity-zero double click does not create phantom hidden atoms');
    let attempts=0;
    while(await remaining()>0&&attempts++<28){
        const p=await page.evaluate(()=>{const o=__fccScenes.normal.children.find(o=>o.isGroup).children.find(o=>o.visible),v=new THREE.Vector3(...o.userData.site.p).multiplyScalar(3).lerp(new THREE.Vector3(1.5,1.5,1.5),.04).project(__fccCameras.normal);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
        await page.mouse.click(p.x,p.y,{clickCount:2,delay:50});await page.waitForTimeout(340);
    }
    assert(await remaining()===0,'all atoms can be individually hidden through real pointer gestures');
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();
    assert(await page.locator('#fcc-mode button[data-value="normal"]').getAttribute('aria-pressed')==='true','individually hidden atoms cannot trigger long press');
    await panel(true);await click('#fcc-restore');await click('#btn-ortho');await click('#fcc-mode button[data-value="compare"]');
    const orthographic=await page.evaluate(()=>{const a=__fccCameras.normal,b=__fccCameras.void;return a.isOrthographicCamera&&b.isOrthographicCamera&&a.projectionMatrix.equals(b.projectionMatrix)&&a.position.distanceTo(b.position)<1e-8;});
    assert(orthographic,'comparison remains synchronized with orthographic projection');
    await click('#fcc-kind button[data-value="both"]');await click('#fcc-display button[data-value="both"]');
    const combined=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.every(o=>!o.children[2].visible));
    assert(combined,'combined kinds suppress artificial internal caps');
    await click('#fcc-kind button[data-value="oct"]');
    const single=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.filter(o=>o.visible).every(o=>o.children[2].visible));
    assert(single,'single-kind display retains partition cut faces');
    await panel(false);await page.screenshot({path:'.playwright-mcp/fcc-comparison-orthographic.png'});
    return {checks:checks.length,results:checks};
}
