async(page)=>{
 const results=[],check=(ok,name)=>{if(!ok)throw Error(name);results.push(name);};
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const f=createFCCView;window.createFCCView=o=>{window.__sizing=o;return f(o);};}));
 await page.setViewportSize({width:1280,height:800});await page.goto(page.__fccUrl||'http://127.0.0.1:8765/FCC.html');await page.waitForFunction(()=>window.__sizing);
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(100);};
 const order=await page.locator('#panel-utilities button').allTextContents();check(order.join(',')==='パネル固定,全画面','utility buttons are ordered');
 const measure=()=>page.evaluate(()=>{const c=__sizing.getCamera(),size=STATE.type==='FCC'?3:STATE.savedFixedA,d=c.position.distanceTo(__sizing.controls.target),span=c.isOrthographicCamera?(c.top-c.bottom)/c.zoom:2*d*Math.tan(THREE.MathUtils.degToRad(c.fov/2))/c.zoom;return{value:size/span,up:c.up.toArray(),target:__sizing.controls.target.toArray(),offset:[STATE.viewOffsetX,STATE.viewOffsetY]};});
 for(const projection of ['persp','ortho']){
  await click('#btn-'+projection);await click('[data-type=NaCl]');const first=await measure();
  for(const type of ['FCC','ZnS','NaCl']){await click('[data-type='+type+']');const next=await measure();check(Math.abs(next.value-first.value)<1e-8&&next.up.every((v,i)=>Math.abs(v-first.up[i])<1e-8)&&next.offset.every((v,i)=>v===first.offset[i]),projection+' scale and view persist through '+type);}
 }
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844},{width:844,height:390},{width:280,height:700},{width:320,height:480}]){
  await page.setViewportSize(size);await click('[data-type=FCC]');await page.waitForTimeout(450);
  const ui=await page.evaluate(()=>{const p=document.querySelector('#ui-panel'),r=p.getBoundingClientRect(),cube=document.querySelector('#view-cube').getBoundingClientRect(),bs=[...p.querySelectorAll('button')].map(b=>b.getBoundingClientRect()).filter(r=>r.width&&r.height);return{overflow:p.scrollWidth>p.clientWidth||document.documentElement.scrollWidth>innerWidth,overlap:bs.some((a,i)=>bs.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5)),cubeOverlap:Math.min(r.right,cube.right)-Math.max(r.left,cube.left)>0.5&&Math.min(r.bottom,cube.bottom)-Math.max(r.top,cube.top)>0.5,width:r.width,top:r.top,right:innerWidth-r.right,persp:document.querySelector('#btn-persp').getBoundingClientRect().width,ortho:document.querySelector('#btn-ortho').getBoundingClientRect().width};});
  check(!ui.overflow&&!ui.overlap&&ui.width<=310.1&&ui.persp===66&&ui.ortho===66,'responsive controls fit '+size.width);
  if(size.width===390||size.width===844||size.width===280||size.width===320)check(ui.top>=0&&ui.top<=120&&ui.right>=0&&ui.right<=20&&!ui.cubeOverlap,'phone panel sits at top right without covering the view cube '+size.width);
 }
 const browser=page.context().browser();
 for(const d of [{width:390,height:844,phone:true},{width:844,height:390,phone:true},{width:1024,height:768,phone:false}]){
  const context=await browser.newContext({viewport:{width:d.width,height:d.height},screen:{width:d.width,height:d.height},hasTouch:true,isMobile:true});const p=await context.newPage();
  try{await p.goto(page.__fccUrl||'http://127.0.0.1:8765/FCC.html');check(await p.evaluate(()=>STATE.isPanelPinned)===!d.phone,'initial pin state '+d.width);
   if(d.phone){const cube=await p.evaluate(()=>{const a=document.querySelector('#ui-panel').getBoundingClientRect(),el=document.querySelector('#view-cube'),b=el.getBoundingClientRect(),pixels=el.getContext('2d').getImageData(0,0,el.width,el.height).data;let top=el.height;for(let y=0;y<el.height;y++)for(let x=0;x<el.width;x++)if(pixels[(y*el.width+x)*4+3])top=Math.min(top,y);return{separated:Math.min(a.right,b.right)<=Math.max(a.left,b.left)||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top),visibleTop:b.top+top*b.height/el.height};});check(cube.separated&&cube.visibleTop>=0&&cube.visibleTop<10,'phone cube is near the top and not covered '+d.width);const t=await context.newCDPSession(p),x=Math.min(150,d.width*.25),y=d.height-30;await t.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await t.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+25,y:y-10,id:1}]});await t.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check(await p.locator('#ui-panel').evaluate(e=>e.classList.contains('hidden')),'unpinned phone panel hides when model is dragged '+d.width);await p.locator('#toggle-panel-btn').click();await t.detach();}
   await p.locator('#toggle-pin').click();const chosen=await p.evaluate(()=>STATE.isPanelPinned);await p.setViewportSize({width:d.height,height:d.width});check(await p.evaluate(()=>STATE.isPanelPinned)===chosen,'pin choice survives rotation '+d.width);}finally{await context.close();}
 }
 return{checks:results.length,results};
}
