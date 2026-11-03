async(page)=>{
 const results=[],check=(ok,name)=>{if(!ok)throw Error(name);results.push(name);};const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const make=createFCCView;window.createFCCView=o=>{window.__args=o;window.__frames=[];window.__scenes={};const draw=o.renderer.render.bind(o.renderer);o.renderer.render=(s,c)=>{__frames.push({s,c});if(__frames.length>4)__frames.shift();const site=s.children.find(g=>g.isGroup)?.children[0]?.userData?.site;if(site)__scenes[site.kind?'void':'normal']=s;else __scenes.ion=s;return draw(s,c);};return make(o);};}));
 await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__args);
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
 await click('#crystal-type-group button[data-type=FCC]');await click('#btn-reset-pos');
 const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await click('#toggle-panel-btn');await page.waitForTimeout(350);}};
 check(await page.locator('#btn-stereo-strong').isDisabled(),'strong stereo is disabled outside stereoscopic view');
 check(await page.locator('#stereo-strength-reason').isHidden(),'disabled strong stereo has no visible explanation');
 check(await page.locator('#fcc-restore').isDisabled()&&await page.locator('#fcc-restore-reason').isHidden(),'restore is disabled without a visible explanation when no atom is hidden');
 check(await page.locator('#btn-reset-pos').evaluate(e=>e.parentElement.id==='common-actions'&&e.nextElementSibling.id==='toggle-quality'),'reset is next to lightweight mode');
 const props=await page.evaluate(()=>{const b=document.querySelector('#btn-stereo'),s=document.querySelector('#btn-stereo-strong');return{same:b.parentElement===s.parentElement,nested:b.contains(s)||s.contains(b)};});check(props.same&&!props.nested,'stereo cycle and strength are sibling buttons inside one frame');
 await page.locator('#btn-stereo').focus();await page.keyboard.press('Space');await page.waitForTimeout(150);
 check(await page.evaluate(()=>STATE.stereoMode==='cross'),'stereo cycle works from the keyboard');
 check(await page.locator('#btn-stereo-strong').isEnabled()&&await page.locator('#stereo-strength-reason').isHidden(),'strong stereo becomes available without an obsolete hint');
 check(await page.locator('#fcc-mode button[data-value=compare]').isDisabled()&&await page.locator('#fcc-mode-reason').isHidden(),'comparison is disabled without a visible stereo reason');
 await page.locator('#fcc-mode button[data-value=compare]').evaluate(e=>e.click());check(await page.locator('#fcc-mode button[data-value=normal]').getAttribute('aria-pressed')==='true','disabled comparison cannot change the active mode');
 const weak=await page.evaluate(()=>({eye:Math.abs(__frames.at(-1).c.userData.eyeOffset),q:__args.getCamera().quaternion.toArray(),d:__args.getCamera().position.distanceTo(__args.controls.target)}));
 await page.locator('#btn-stereo-strong').focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);
 const strong=await page.evaluate(()=>({eye:Math.abs(__frames.at(-1).c.userData.eyeOffset),q:__args.getCamera().quaternion.toArray(),d:__args.getCamera().position.distanceTo(__args.controls.target),mode:STATE.stereoMode}));
 check(Math.abs(strong.eye/weak.eye-1.5)<1e-8,'strong stereo increases eye separation by 1.5');
 check(strong.mode==='cross'&&strong.q.every((v,i)=>Math.abs(v-weak.q[i])<1e-8)&&Math.abs(strong.d-weak.d)<1e-8,'strength toggling preserves the stereo mode and camera pose');
 check(await page.locator('#btn-stereo-strong').getAttribute('aria-pressed')==='true','strong state is exposed to assistive technology');
 await panel(false);const point=await page.evaluate(()=>{const camera=__args.views.camera(__args.getCamera(),innerWidth/2,innerHeight,0),p=new THREE.Vector3(3,1.5,1.5).project(camera);return{x:(p.x+1)*innerWidth/4,y:(1-p.y)*innerHeight/2};});
 const visible=()=>page.evaluate(()=>__scenes.normal.children.find(g=>g.isGroup).children.filter(o=>o.visible).length);const n=await visible();await page.mouse.click(point.x,point.y,{clickCount:2,delay:60});await page.waitForTimeout(340);check(await visible()===n-1,'strong stereo uses matching per-eye picking to hide an atom');await panel(true);
 check(await page.locator('#fcc-restore').isEnabled(),'hiding an atom enables restore');
 await click('#fcc-restore');check(await visible()===n&&await page.locator('#fcc-restore').isDisabled(),'restoring all atoms clears the state and disables the completed action');
 await click('#btn-stereo');check(await page.evaluate(()=>STATE.stereoMode==='parallel'&&STATE.stereoStrong),'cycle preserves strength preference in parallel mode');await click('#btn-stereo');
 check(await page.locator('#fcc-mode button[data-value=compare]').isEnabled()&&await page.locator('#fcc-mode-reason').isHidden(),'exiting stereo enables comparison and removes the reason');
 check(await page.locator('#btn-stereo-strong').isDisabled()&&await page.locator('#btn-stereo-strong').getAttribute('aria-pressed')==='true','disabled strong button retains its preference');
 await click('#btn-ortho');check(await page.locator('#btn-ortho').getAttribute('aria-pressed')==='true'&&await page.locator('#btn-persp').getAttribute('aria-pressed')==='false','projection choices expose their current state');
 await click('#btn-persp');await page.locator('#grid-mode-group button[data-mode="1"]').focus();await page.keyboard.press('Space');check(await page.evaluate(()=>document.activeElement===document.querySelector('#grid-mode-group button[data-mode="1"]')),'keyboard grid selection retains focus');
 await click('#fcc-mode button[data-value=compare]');check(await page.locator('#fcc-grid-label').isHidden(),'comparison has no orphaned grid heading');
 await click('#fcc-mode button[data-value=normal]');await click('#grid-mode-group button[data-mode="0"]');await click('#crystal-type-group button[data-type=NaCl]');
 check(await page.locator('#ion-restore').isDisabled()&&await page.locator('#ion-restore-reason').isHidden(),'ion restore is disabled without a visible explanation');
 await click('#toggle-clipping');check(await page.locator('#toggle-diagonal').isDisabled()&&await page.locator('#ion-section-reason').isHidden(),'clipping-off disables the diagonal action');
 await click('#toggle-clipping');await click('#toggle-diagonal');check(await page.locator('#toggle-diagonal').getAttribute('aria-pressed')==='true'&&await page.locator('#btn-snap-diagonal').count()===0,'diagonal remains available without a separate front-view button');
 const contrast=await page.evaluate(()=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05),bg=e=>{for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;if(!c.endsWith(', 0)')&&c!=='transparent')return rgb(c);}return[255,255,255];};
  const visible=[...document.querySelectorAll('#ui-panel button:not(:disabled)')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height);return visible.map(e=>{const s=getComputedStyle(e);return{id:e.id||e.textContent.trim(),text:ratio(rgb(s.color),bg(e)),border:ratio(rgb(s.borderTopColor),bg(e))};});
 });check(contrast.every(c=>c.text>=4.5),'enabled button text contrast is at least 4.5:1');check(contrast.every(c=>c.border>=3),'enabled control boundaries contrast at least 3:1');
 await page.locator('#btn-stereo').focus();await page.keyboard.press('Tab');const focus=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return{s:s.outlineStyle,w:parseFloat(s.outlineWidth),color:s.outlineColor};});check(focus.s!=='none'&&focus.w>=2,'keyboard focus has a visible two-pixel outline');
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);await click('#crystal-type-group button[data-type=FCC]');
  for(const mode of ['normal','void','compare']){
   await click('#fcc-mode button[data-value="'+mode+'"]');if(mode!=='normal')await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
   const ui=await page.evaluate(()=>{const panel=document.querySelector('#ui-panel'),rect=panel.getBoundingClientRect(),bs=[...panel.querySelectorAll('button')].map(e=>({id:e.id||e.textContent.trim(),r:e.getBoundingClientRect()})).filter(o=>o.r.width&&o.r.height);return{overflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:panel.scrollWidth>panel.clientWidth,min:bs.every(o=>o.r.width>=24&&o.r.height>=40),touch:bs.some((o,i)=>bs.slice(i+1).some(p=>Math.min(o.r.right,p.r.right)-Math.max(o.r.left,p.r.left)>.5&&Math.min(o.r.bottom,p.r.bottom)-Math.max(o.r.top,p.r.top)>.5))};});
   check(!ui.overflow&&!ui.panelOverflow&&ui.min&&!ui.touch,'responsive controls fit with separated targets '+size.width+' '+mode);
   await page.screenshot({path:'.playwright-mcp/fcc-panel-'+size.width+'-'+mode+'.png'});
  }
 }
 check(errors.length===0,'no uncaught JavaScript errors');return{checks:results.length,results,contrast};
}
