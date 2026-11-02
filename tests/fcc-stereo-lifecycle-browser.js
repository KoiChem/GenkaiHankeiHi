/* Run after fcc-stereo-browser.js in the same Playwright page/session. */
async(page)=>{
 const results=[],check=(ok,name)=>{if(!ok)throw new Error(name);results.push(name);};
 await page.goto('http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__args);
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
 const panel=async show=>{const hidden=await page.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden'));if(hidden===show){await click('#toggle-panel-btn');await page.waitForTimeout(350);}};
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);await click('#btn-reset-pos');
  const layout=await page.evaluate(()=>{const r=document.querySelector('#ui-panel').getBoundingClientRect(),v=__args.controls.target.clone().project(__frames.at(-1).c);return{center:(v.x+1)*innerWidth/2,left:r.left,bottom:r.bottom,right:r.right};});
  check(Math.abs(layout.center-(size.width>=600?layout.left/2:size.width/2))<1,'reset uses correct available area at '+size.width);
  const overlap=await page.evaluate(()=>{const buttons=[...document.querySelectorAll('#ui-panel button')].map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height);return buttons.some((a,i)=>buttons.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5));});
  check(!overlap,'panel buttons do not overlap at '+size.width);
 }
 await page.setViewportSize({width:1280,height:800});await click('#btn-reset-pos');await click('#btn-stereo');await panel(false);
 const target=()=>page.evaluate(()=>{const c=__views.camera(__args.getCamera(),innerWidth/2,innerHeight,0),p=__args.controls.target.clone().project(c);return{x:(p.x+1)*innerWidth/4,y:(1-p.y)*innerHeight/2};});
 const before=await target();await page.mouse.move(300,400);await page.mouse.down({button:'right'});await page.mouse.move(340,425,{steps:5});await page.mouse.up({button:'right'});const after=await target();
 check(Math.abs(after.x-before.x-40)<1&&Math.abs(after.y-before.y-25)<1,'stereo screen pan shifts either eye by the requested pixels');
 await page.mouse.move(300,450);await page.mouse.down();await page.mouse.move(350,410,{steps:7});await page.mouse.up();await page.waitForTimeout(100);const rotated=await target();check(Math.abs(rotated.x-after.x)<1&&Math.abs(rotated.y-after.y)<1,'rotation after stereo pan keeps focus screen position fixed');
 const d=await page.evaluate(()=>__args.getCamera().position.distanceTo(__args.controls.target));await page.mouse.wheel(0,-200);await page.waitForTimeout(120);check(await page.evaluate(()=>__args.getCamera().position.distanceTo(__args.controls.target))<d,'wheel zoom remains available in stereo');
 await panel(true);await click('#fcc-mode button[data-value="void"]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);await click('#btn-reset-pos');await panel(false);
 const p=await page.evaluate(()=>{const c=__views.camera(__args.getCamera(),innerWidth/2,innerHeight,1),p=__args.controls.target.clone().project(c);return{x:innerWidth/2+(p.x+1)*innerWidth/4,y:(1-p.y)*innerHeight/2};});
 const guides=()=>page.evaluate(()=>__scenes.void.children.filter(o=>o.isGroup)[1].children.length);
 await page.mouse.click(p.x,p.y);await page.waitForTimeout(340);check(await guides()>0,'right stereo eye can select an interstitial site guide');await page.mouse.click(p.x,p.y);await page.waitForTimeout(340);check(await guides()===0,'right stereo guide retap clears the guide');
 await panel(true);await click('#btn-stereo');await click('#btn-stereo');await click('#btn-ortho');await click('#btn-reset-pos');await panel(false);
 const q=await page.evaluate(()=>__args.getCamera().quaternion.toArray());await page.mouse.move(300,450);await page.mouse.down();await page.mouse.move(350,400,{steps:6});await page.mouse.up();await panel(true);await click('#btn-persp');const stopped=await page.evaluate(()=>__args.getCamera().quaternion.toArray());await page.waitForTimeout(400);check(await page.evaluate(p=>Math.abs(p.reduce((sum,v,i)=>sum+v*__args.getCamera().quaternion.toArray()[i],0))>1-1e-8,stopped),'projection change cancels residual rotational glide');
 return{checks:results.length,results};
}
