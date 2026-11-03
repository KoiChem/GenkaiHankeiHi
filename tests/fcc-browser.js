async (page) => {
    const checks=[];
    const assert=(condition,message)=>{if(!condition)throw new Error(message);checks.push(message);};
    await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
        const original=window.createFCCView;
        window.createFCCView=options=>{
            window.__fccArgs=options;window.__fccController=original(options);window.__fccScenes={};window.__fccCameras={};
            const render=options.renderer.render.bind(options.renderer);
            options.renderer.render=(scene,camera)=>{const group=scene.children.find(o=>o.isGroup),site=group?.children[0]?.userData?.site;if(site){const key=site.kind?'void':'normal';window.__fccScenes[key]=scene;window.__fccCameras[key]=camera;}return render(scene,camera);};
            return window.__fccController;
        };
    }));
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width:1280,height:800});
    await page.goto('http://127.0.0.1:8765/FCC.html');
    await page.locator('#crystal-type-group button[data-type=FCC]').click();
    await page.locator('#btn-reset-pos').click();
    await page.waitForFunction(()=>window.__fccScenes?.normal);
    const click=async(selector)=>{await page.locator(selector).click();await page.waitForTimeout(80);};
    const panel=async(show)=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await page.locator('#toggle-panel-btn').click();await page.waitForTimeout(450);}};
    const countHidden=()=>page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.filter(o=>!o.visible).length);
    const point=(p,side)=>page.evaluate(({p,side})=>{const w=side?innerWidth/2:innerWidth;const camera=__fccArgs.views.camera(__fccArgs.getCamera(),w,innerHeight);const v=new THREE.Vector3(...p).project(camera);return{x:(v.x+1)*w/2+(side==='right'?w:0),y:(1-v.y)*innerHeight/2};},{p,side});
    assert(await page.locator('#fcc-controls').isVisible(),'FCC selection opens its dedicated controls');
    assert(await page.locator('#legacy-ratio').isHidden(),'FCC hides the ion radius-ratio controls');
    await panel(false);
    let p=await point([3,1.5,1.5]);
    await page.mouse.click(p.x,p.y,{clickCount:2,delay:65});await page.waitForTimeout(360);
    assert(await countHidden()===1,'double click hides one atom');
    await page.mouse.click(p.x,p.y,{clickCount:3,delay:65});await page.waitForTimeout(360);
    assert(await countHidden()===0,'triple click restores the atom without hiding another');
    await page.mouse.click(p.x,p.y,{clickCount:2,delay:65});await page.waitForTimeout(360);
    await panel(true);await click('#fcc-palette button[data-value="abc"]');
    await page.locator('#fcc-atom-opacity').fill('0.62');
    assert(await countHidden()===1,'palette and opacity changes retain hidden atoms');
    for(const [mode,count]of [[1,38],[2,63],[0,14]]){
        await click('#grid-mode-group button[data-mode="'+mode+'"]');
        const n=await page.evaluate(()=>__fccScenes.normal.children.find(o=>o.isGroup).children.length);
        assert(n===count,'grid '+mode+' renders '+count+' unique atom sites');
    }
    assert(await countHidden()===1,'grid round trip retains the common hidden site');
    await click('#btn-reset-pos');assert(await countHidden()===1,'view reset preserves hidden atoms');
    await click('#fcc-restore');assert(await countHidden()===0,'restore all clears individual hidden flags');
    await panel(false);p=await point([3,1.5,1.5]);
    await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+65,p.y+30,{steps:10});await page.waitForTimeout(500);await page.mouse.up();await page.waitForTimeout(350);
    assert(await page.locator('#fcc-mode button[data-value="normal"]').getAttribute('aria-pressed')==='true','drag past long-press threshold stays in normal mode');
    assert(await countHidden()===0,'drag cannot hide an atom');
    await panel(true);await click('#btn-reset-pos');await panel(false);p=await point([3,1.5,1.5]);
    await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();
    await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
    assert(await page.locator('#fcc-mode button[data-value="void"]').getAttribute('aria-pressed')==='true','long press on atom enters void mode');
    assert(await page.evaluate(()=>__fccScenes.void.children.filter(o=>o.isGroup).length)===2,'void scene contains voids and guides, without background atoms');
    const voidIds=await page.evaluate(()=>__fccScenes.void.children.find(o=>o.isGroup).children.map(o=>o.userData.site.id));
    assert(voidIds.length===21,'all 13 octahedral pieces and 8 tetrahedral sites are mounted');
    p=await point([1.5,1.5,1.5]);await page.mouse.click(p.x,p.y);await page.waitForTimeout(350);
    assert(await page.evaluate(()=>__fccScenes.void.children.filter(o=>o.isGroup)[1].children.length)>0,'tap selects one site guide');
    await page.mouse.click(p.x,p.y);await page.waitForTimeout(350);
    assert(await page.evaluate(()=>__fccScenes.void.children.filter(o=>o.isGroup)[1].children.length)===0,'retap removes the selected guide');
    await panel(true);
    for(const grid of [0,1,2]){
        await click('#fcc-mode button[data-value="normal"]');
        await click('#grid-mode-group button[data-mode="'+grid+'"]');
        await click('#fcc-mode button[data-value="void"]');
        for(const kind of ['oct','tet','both'])for(const display of ['void','sphere','both']){
            await click('#fcc-kind button[data-value="'+kind+'"]');await click('#fcc-display button[data-value="'+display+'"]');
            const result=await page.evaluate(()=>{const groups=__fccScenes.void.children.find(o=>o.isGroup).children.filter(o=>o.visible);return {count:groups.length,caps:groups.flatMap(o=>o.children.filter(m=>m.isMesh)).filter(m=>m.visible).length};});
            assert(result.count===(kind==='oct'?13:kind==='tet'?8:21),'grid '+grid+' '+kind+' '+display+' retains every selected base-cell site');
        }
    }
    await click('#fcc-mode button[data-value="normal"]');await click('#grid-mode-group button[data-mode="0"]');await click('#fcc-mode button[data-value="void"]');await click('#fcc-kind button[data-value="both"]');await click('#fcc-display button[data-value="both"]');
    await click('#fcc-mode button[data-value="compare"]');await click('#btn-reset-pos');await panel(false);
    assert(await page.locator('#fcc-divider').isVisible(),'comparison renders side by side');
    const sync=await page.evaluate(()=>{const a=__fccCameras.normal,b=__fccCameras.void;return a.position.distanceTo(b.position)<1e-10&&a.quaternion.angleTo(b.quaternion)<1e-10&&a.projectionMatrix.equals(b.projectionMatrix);});
    assert(sync,'comparison cameras share orientation, position and projection scale');
    p=await point([3,1.5,1.5],'left');await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(520);await page.mouse.up();
    assert(await page.locator('#fcc-mode button[data-value="void"]').getAttribute('aria-pressed')==='true','comparison long press returns to the prior void mode');
    await panel(true);await click('#fcc-mode button[data-value="normal"]');
    for(const name of ['CsCl','NaCl','ZnS']){
        await click('#crystal-type-group button[data-type="'+name+'"]');
        assert(await page.locator('#legacy-ratio').isVisible(),'legacy '+name+' restores radius controls');
        await page.locator('#ratio-slider').fill('0.43');await click('#grid-mode-group button[data-mode="1"]');await click('#grid-mode-group button[data-mode="0"]');
    }
    await click('#crystal-type-group button[data-type="FCC"]');
    assert(await page.locator('#fcc-palette button[data-value="abc"]').getAttribute('aria-pressed')==='true','FCC palette survives switching through all ion crystals');
    await click('#fcc-mode button[data-value="compare"]');await click('#btn-reset-pos');
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
    assert(await page.locator('#fcc-portrait').isVisible(),'portrait phone recommends landscape');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'portrait page does not overflow horizontally');
    await panel(false);await page.screenshot({path:'.playwright-mcp/fcc-phone-portrait.png'});
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);
    assert(await page.locator('#fcc-portrait').isHidden(),'landscape removes the orientation recommendation');
    await page.screenshot({path:'.playwright-mcp/fcc-phone-landscape.png'});
    await panel(true);await click('#toggle-quality');
    await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
    assert(errors.length===0,'browser has no uncaught JavaScript errors: '+errors.join(';'));
    return {checks:checks.length,results:checks};
}
