async(page)=>{
 const failures=[],passed=[],errors=[];
 const check=(ok,name,detail='')=>(ok?passed:failures).push(name+(ok?'':` ${detail}`));
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(...args){if(this.canvas.id==='view-cube')(window.__cubeText??=[]).push(args[0]);return fill.apply(this,args);};
  document.addEventListener('DOMContentLoaded',()=>{
   const make=window.createFCCView;window.createFCCView=o=>{
    window.__viewArgs=o;const render=o.renderer.render.bind(o.renderer);
    o.renderer.render=(scene,camera)=>{window.__viewFrame={scene,camera};return render(scene,camera);};
    return make(o);
   };
  });
 });
 await page.setViewportSize({width:1280,height:800});
 await page.goto(page.__fccUrl||'http://127.0.0.1:8765/FCC.html');
 await page.waitForFunction(()=>window.__viewFrame);
 const click=async s=>{await page.locator(s).click();await page.waitForTimeout(90);};
 const initial=await page.evaluate(()=>({type:STATE.type,ratio:STATE.ratio,na:document.querySelector('[data-type=NaCl]').getAttribute('aria-pressed'),fcc:document.querySelector('#fcc-controls').hidden,ion:document.querySelector('#legacy-opacity').hidden,distance:__viewArgs.getCamera().position.distanceTo(__viewArgs.controls.target),target:__viewArgs.controls.target.toArray(),center:STATE.currentCenter.toArray(),screen:__viewArgs.controls.target.clone().project(__viewFrame.camera).toArray(),panelLeft:document.querySelector('#ui-panel').getBoundingClientRect().left}));
 check(initial.type==='NaCl'&&initial.na==='true'&&initial.fcc&&!initial.ion&&initial.ratio===.414,'page starts with the NaCl model and its controls',JSON.stringify(initial));
 check(initial.target.every((v,i)=>Math.abs(v-initial.center[i])<1e-8)&&Math.abs((initial.screen[0]+1)*640-initial.panelLeft/2)<1,'initial NaCl rotation center is in the unobstructed area',JSON.stringify(initial));
 check(Math.abs(initial.distance-8.4)<1e-7,'initial NaCl keeps the previous first-view scale',JSON.stringify(initial));
 for(const size of [{width:1024,height:768},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);await page.reload();await page.waitForFunction(()=>window.__viewFrame);
  const layout=await page.evaluate(()=>({type:STATE.type,center:(__viewArgs.controls.target.clone().project(__viewFrame.camera).x+1)*innerWidth/2,left:document.querySelector('#ui-panel').getBoundingClientRect().left}));
  const expected=size.width>=600||size.height<=540?layout.left/2:size.width/2;
  check(layout.type==='NaCl'&&Math.abs(layout.center-expected)<1,'initial NaCl is centered at '+size.width+'×'+size.height,JSON.stringify(layout));
 }
 await page.setViewportSize({width:1280,height:800});await page.reload();await page.waitForFunction(()=>window.__viewFrame);
 await click('[data-type=NaCl]');
 await page.locator('#opacity-m-slider').scrollIntoViewIfNeeded();
 const slider=await page.evaluate(()=>['p','m'].map(k=>{const e=document.querySelector('#opacity-'+k+'-slider'),r=e.getBoundingClientRect();return{text:e.parentElement.querySelector('.opacity-label').textContent.trim().replace(/\s+/g,' '),width:r.width,x:r.left+13+(r.width-26)*Number(e.value),y:r.top+r.height/2,label:e.getAttribute('aria-label')};}));
 const screenshot=await page.screenshot({scale:'css'}),imageUrl='data:image/png;base64,'+Buffer.from(screenshot).toString('base64');
 const colors=await page.evaluate(({imageUrl,points})=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);resolve(points.map(p=>Array.from(ctx.getImageData(Math.round(p.x),Math.round(p.y),1,1).data).slice(0,3)));};im.onerror=reject;im.src=imageUrl;}),{imageUrl,points:slider});
 check(slider[0].text==='陽 70%'&&slider[1].text==='陰 60%'&&slider.every(s=>s.label.includes('イオン')),'ion labels are concise with full accessible names',JSON.stringify(slider));
 check(slider[0].width>220&&slider[1].width>220&&colors[0].join(',')==='255,182,193'&&colors[1].join(',')==='173,216,230','ion sliders are wider with matching thumb colors',JSON.stringify({slider,colors}));
 check(await page.locator('#btn-snap-diagonal').count()===0,'section front button is removed');
 const stereoLayout=await page.evaluate(()=>{const p=document.querySelector('.stereo-control'),a=document.querySelector('#btn-stereo'),b=document.querySelector('#btn-stereo-strong'),c=document.querySelector('#btn-persp');const r=e=>{const x=e.getBoundingClientRect();return{left:x.left,right:x.right,width:x.width,height:x.height}};return{outer:r(p),main:r(a),strong:r(b),projection:r(c),border:getComputedStyle(p).borderTopWidth,nested:a.contains(b)||b.contains(a)};});
 check(!stereoLayout.nested&&stereoLayout.strong.left-stereoLayout.main.right>=4&&parseFloat(stereoLayout.border)>=1&&stereoLayout.main.width>stereoLayout.projection.width,'stereo strength appears in a shared frame with separate hit targets',JSON.stringify(stereoLayout));
 await click('#btn-ortho');await click('#btn-stereo');
 const beforePerspective=await page.evaluate(()=>({q:__viewArgs.getCamera().quaternion.toArray(),target:__viewArgs.controls.target.toArray(),offset:[STATE.viewOffsetX,STATE.viewOffsetY]}));
 await page.locator('#btn-persp').evaluate(e=>e.click());await page.waitForTimeout(150);
 const perspective=await page.evaluate(()=>({mode:STATE.stereoMode,ortho:STATE.isOrthographic,q:__viewArgs.getCamera().quaternion.toArray(),target:__viewArgs.controls.target.toArray(),offset:[STATE.viewOffsetX,STATE.viewOffsetY]}));
 check(perspective.mode==='off'&&!perspective.ortho&&perspective.q.every((v,i)=>Math.abs(v-beforePerspective.q[i])<1e-7)&&JSON.stringify(perspective.target)===JSON.stringify(beforePerspective.target)&&JSON.stringify(perspective.offset)===JSON.stringify(beforePerspective.offset),'perspective exits cross stereo and overrides prior parallel projection without moving the model',JSON.stringify(perspective));
 while(await page.evaluate(()=>STATE.stereoMode!=='off'))await click('#btn-stereo');
 await click('#btn-persp');await click('#btn-stereo');await click('#btn-stereo');
 await page.locator('#btn-ortho').evaluate(e=>e.click());await page.waitForTimeout(150);
 check(await page.evaluate(()=>STATE.stereoMode==='off'&&STATE.isOrthographic),'parallel projection exits parallel stereo and selects parallel projection');
 while(await page.evaluate(()=>STATE.stereoMode!=='off'))await click('#btn-stereo');
 await click('#btn-persp');
 await click('[data-type=FCC]');await click('#fcc-mode [data-value=compare]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
 await click('#btn-stereo');await page.locator('#btn-ortho').evaluate(e=>e.click());await page.waitForTimeout(100);
 check(await page.evaluate(()=>STATE.stereoMode==='off'&&STATE.isOrthographic)&&await page.locator('#fcc-mode [data-value=compare]').getAttribute('aria-pressed')==='true','projection selection exits stereo and restores FCC comparison');
 while(await page.evaluate(()=>STATE.stereoMode!=='off'))await click('#btn-stereo');
 const pose=()=>page.evaluate(()=>{const c=__viewArgs.getCamera(),d=c.position.distanceTo(__viewArgs.controls.target);return{q:c.quaternion.toArray(),target:__viewArgs.controls.target.toArray(),offset:[STATE.viewOffsetX,STATE.viewOffsetY],span:c.isOrthographicCamera?(c.top-c.bottom)/c.zoom:2*d*Math.tan(THREE.MathUtils.degToRad(c.fov/2))/c.zoom};});
 for(const previous of ['persp','ortho'])for(const method of ['cross','parallel'])for(const selected of ['persp','ortho']){
  await click('#btn-'+previous);await click('#btn-stereo');if(method==='parallel')await click('#btn-stereo');
  const before=await pose();await click('#btn-'+selected);const after=await pose();
  const stable=Math.abs(before.q.reduce((s,v,i)=>s+v*after.q[i],0))>1-1e-8&&before.target.every((v,i)=>Math.abs(v-after.target[i])<1e-8)&&before.offset.every((v,i)=>Math.abs(v-after.offset[i])<1e-8)&&Math.abs(before.span-after.span)<1e-7;
  check(stable&&await page.evaluate(wanted=>STATE.stereoMode==='off'&&STATE.isOrthographic===(wanted==='ortho'),selected)&&await page.locator('#fcc-mode [data-value=compare]').getAttribute('aria-pressed')==='true',`stereo ${previous}→${method}→${selected} restores comparison and pose`,JSON.stringify({before,after}));
 }
 await click('#fcc-mode [data-value=normal]');
 const icons=await page.evaluate(()=>[...document.querySelectorAll('#grid-mode-group button')].map(b=>({box:b.getBoundingClientRect().toJSON(),svg:b.querySelector('svg').getBoundingClientRect().toJSON()})));
 check(icons[0].svg.width===20&&icons[2].svg.width>=30&&Math.abs(icons[1].svg.width-icons[2].svg.width)<1&&icons.every(i=>i.svg.left>=i.box.left&&i.svg.right<=i.box.right&&i.svg.top>=i.box.top&&i.svg.bottom<=i.box.bottom),'4 and 8 cell icons fit and are enlarged while 1 stays unchanged',JSON.stringify(icons));
 await click('[data-type=NaCl]');await click('#btn-persp');
 const cube=await page.locator('#view-cube').boundingBox();
 check(Math.abs(cube.width-86.4)<1&&(await page.evaluate(()=>window.__cubeText||[])).length===0,'larger view cube has no drawn labels',JSON.stringify(cube));
 await click('#toggle-diagonal');
 await page.evaluate(()=>{const c=__viewArgs.getCamera(),t=__viewArgs.controls.target,d=c.position.distanceTo(t);c.position.copy(t).add(new THREE.Vector3(1,.3,-1).normalize().multiplyScalar(d));c.up.set(0,1,0);__viewArgs.controls.update();});
 await page.waitForTimeout(120);const pos=await page.locator('#view-cube').boundingBox();await page.mouse.click(pos.x+pos.width/2,pos.y+pos.height/2);await page.waitForTimeout(350);
 const dot=await page.evaluate(()=>__viewArgs.getCamera().position.clone().sub(__viewArgs.controls.target).normalize().dot(new THREE.Vector3(1,0,-1).normalize()));
 check(dot>.9999,'unlabelled section face still selects the section view',String(dot));
 await page.evaluate(()=>{const c=__viewArgs.getCamera(),t=__viewArgs.controls.target,d=c.position.distanceTo(t);c.position.copy(t).add(new THREE.Vector3(1,.6,-1).normalize().multiplyScalar(d));c.up.set(0,1,0);__viewArgs.controls.update();});
 await page.locator('#view-cube').focus();await page.keyboard.press('d');await page.waitForTimeout(350);
 const keyboardSection=await page.evaluate(()=>({dot:__viewArgs.getCamera().position.clone().sub(__viewArgs.controls.target).normalize().dot(new THREE.Vector3(1,0,-1).normalize()),label:document.querySelector('#view-cube').getAttribute('aria-label')}));
 check(keyboardSection.dot>.9999&&keyboardSection.label.includes('D'),'keyboard users can select the section view with an announced shortcut',JSON.stringify(keyboardSection));
 const modifiers=await page.evaluate(()=>['ctrlKey','metaKey','altKey'].map(key=>{const e=new KeyboardEvent('keydown',{key:'d',[key]:true,bubbles:true,cancelable:true});document.querySelector('#view-cube').dispatchEvent(e);return e.defaultPrevented;}));
 check(modifiers.every(v=>!v),'section shortcut does not intercept browser modifier shortcuts',JSON.stringify(modifiers));
 await page.evaluate(()=>{const c=__viewArgs.getCamera(),t=__viewArgs.controls.target,d=c.position.distanceTo(t),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.5,-.8,Math.PI/2,'YXZ'));c.position.copy(new THREE.Vector3(0,0,d).applyQuaternion(q).add(t));c.up.set(0,1,0).applyQuaternion(q);c.quaternion.copy(q);__viewArgs.controls.update();});
 const r=await page.locator('#view-cube').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;await page.mouse.move(x,y);await page.mouse.down();const q0=await page.evaluate(()=>__viewArgs.getCamera().quaternion.toArray());await page.mouse.move(x+25,y,{steps:5});await page.mouse.up();await page.waitForTimeout(100);
 const drag=await page.evaluate(before=>{const q=new THREE.Quaternion().fromArray(before).invert().multiply(__viewArgs.getCamera().quaternion).normalize(),angle=2*Math.acos(Math.min(1,Math.abs(q.w)));return{angle,axisY:q.y/Math.sin(angle/2)};},q0);
 check(Math.abs(drag.angle-.18)<.01&&drag.axisY<-.995,'cube screen-relative drag uses 60% of original speed',JSON.stringify(drag));
 const emu=await page.context().newCDPSession(page);await emu.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await page.waitForTimeout(100);const touchCube=await page.locator('#view-cube').boundingBox();
 check(Math.abs(touchCube.width-105.6)<1,'touch view cube is 1.2 times its previous size',JSON.stringify(touchCube));await emu.send('Emulation.setTouchEmulationEnabled',{enabled:false});await emu.detach();
 check(errors.length===0,'no uncaught JavaScript errors',JSON.stringify(errors));
 if(failures.length)throw Error(JSON.stringify({passed,failures}));return{checks:passed.length,passed};
}
