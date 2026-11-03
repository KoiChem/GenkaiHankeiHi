async(page)=>{
 const failures=[],passed=[];
 const check=(condition,name,detail='')=>(condition?passed:failures).push(name+(condition?'':` ${detail}`));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
  const make=window.createFCCView;window.createFCCView=o=>{
   window.__compactArgs=o;const draw=o.renderer.render.bind(o.renderer);
   o.renderer.render=(scene,camera)=>{window.__compactScene=scene;return draw(scene,camera);};
   return make(o);
  };
 }));
 await page.setViewportSize({width:1280,height:800});
 await page.goto(page.__fccUrl||'http://127.0.0.1:8765/FCC.html');
 await page.waitForFunction(()=>window.__compactArgs);
 const ax=await page.context().newCDPSession(page);
 const description=async selector=>{
  const root=await ax.send('DOM.getDocument');
  const {nodeId}=await ax.send('DOM.querySelector',{nodeId:root.root.nodeId,selector});
  const {nodes}=await ax.send('Accessibility.getPartialAXTree',{nodeId,fetchRelatives:false});
  return nodes[0]?.description?.value||'';
 };
 const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(100);};
 const values=await page.evaluate(()=>({void:document.querySelector('#fcc-void-opacity').value,sphere:document.querySelector('#fcc-sphere-opacity').value}));
 check(values.void==='0.7'&&values.sphere==='0.6','new void defaults are reflected in the sliders',JSON.stringify(values));
 const panel=await page.evaluate(()=>({
  top:[...document.querySelector('#panel-utilities').querySelectorAll('button')].map(b=>b.textContent.trim()),
  common:[...document.querySelector('#common-actions').querySelectorAll('button')].map(b=>b.textContent.trim()),
  visibleReasons:[...document.querySelectorAll('.context-reason')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1;}).map(e=>e.textContent),
  gridLabels:[...document.querySelectorAll('#grid-mode-group button')].map(b=>b.textContent.trim()),
  projections:[...document.querySelectorAll('#btn-persp,#btn-ortho')].map(b=>({text:b.textContent.trim(),label:b.getAttribute('aria-label')}))
 }));
 check(panel.top.join(',')==='全画面,パネル固定'&&panel.common.join(',')==='位置を戻す,軽量モード','reset is next to lightweight mode',JSON.stringify(panel));
 check(panel.visibleReasons.length===0,'explanatory notes are not visible',JSON.stringify(panel.visibleReasons));
 check(panel.gridLabels.every(x=>!x)&&panel.projections.every(p=>!p.text&&p.label),'icons retain names without visual text',JSON.stringify(panel));
 await click('#fcc-mode [data-value=void]');await page.waitForFunction(()=>document.querySelector('#fcc-loading').hidden);
 const visibleOpacities=async()=>page.evaluate(()=>{
  const found={};__compactScene.traverse(o=>{if(o.isMesh&&o.visible&&o.userData.site&&o.material){const k=o.userData.site.kind;(found[k]??=new Set()).add(o.material.opacity);}});
  return Object.fromEntries(Object.entries(found).map(([k,v])=>[k,[...v]]));
 });
 await page.waitForFunction(()=>window.__compactScene?.children.some(g=>g.children.some(o=>o.userData?.site)));
 const initialMaterials=await visibleOpacities();
 check(['oct','tet'].every(k=>initialMaterials[k]?.includes(.7)&&initialMaterials[k]?.includes(.6)),'both void types render with the requested initial opacities',JSON.stringify(initialMaterials));
 for(const [id,value] of [['fcc-void-opacity','0.5'],['fcc-sphere-opacity','0.4']])await page.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const changedMaterials=await visibleOpacities();
 check(['oct','tet'].every(k=>changedMaterials[k]?.includes(.5)&&changedMaterials[k]?.includes(.4)),'opacity sliders update the rendered void and spheres',JSON.stringify(changedMaterials));
 await click('#fcc-mode [data-value=normal]');
 const descriptionsBefore={compare:await description('#fcc-mode [data-value=compare]'),projection:await description('#btn-persp'),strong:await description('#btn-stereo-strong')};
 check(!descriptionsBefore.compare.includes('立体視を解除')&&!descriptionsBefore.projection.includes('立体視中')&&descriptionsBefore.strong.includes('立体視を選ぶ'),'accessible descriptions match normal mode',JSON.stringify(descriptionsBefore));
 await click('#btn-ortho');
 const before=await page.locator('#btn-stereo').boundingBox();
 await click('#btn-stereo');
 const stereo=await page.evaluate(()=>({mode:STATE.stereoMode,ortho:STATE.isOrthographic,persp:document.querySelector('#btn-persp').disabled,parallel:document.querySelector('#btn-ortho').disabled,pressed:document.querySelector('#btn-persp').getAttribute('aria-pressed')}));
 const after=await page.locator('#btn-stereo').boundingBox();
 check(await page.locator('#btn-persp').isVisible()&&await page.locator('#btn-ortho').isVisible()&&stereo.persp&&stereo.parallel&&stereo.pressed==='true','stereo shows disabled projection icons with perspective selected',JSON.stringify(stereo));
 check(Math.abs(before.width-after.width)<1,'stereo mode does not expand its button',JSON.stringify({before,after}));
 const descriptionsStereo={compare:await description('#fcc-mode [data-value=compare]'),projection:await description('#btn-persp'),strong:await description('#btn-stereo-strong')};
 check(descriptionsStereo.compare.includes('立体視を解除')&&descriptionsStereo.projection.includes('立体視中')&&!descriptionsStereo.strong.includes('立体視を選ぶ'),'accessible descriptions match stereo mode',JSON.stringify(descriptionsStereo));
 await click('#btn-stereo');await click('#btn-stereo');
 check(await page.evaluate(()=>STATE.isOrthographic)&&await page.locator('#btn-ortho').isEnabled(),'stereo restores the previous projection');
 await click('#btn-persp');
 const setPose=async roll=>page.evaluate(r=>{
  const c=__compactArgs.getCamera(),controls=__compactArgs.controls;
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.55,-.8,r,'YXZ'));
  const distance=c.position.distanceTo(controls.target);
  c.position.copy(new THREE.Vector3(0,0,distance).applyQuaternion(q).add(controls.target));
  c.up.set(0,1,0).applyQuaternion(q);c.quaternion.copy(q);controls.update();
 },roll);
 const deltaFrom=before=>page.evaluate(before=>{
  const q0=new THREE.Quaternion().fromArray(before),q1=__compactArgs.getCamera().quaternion.clone();
  const delta=q0.invert().multiply(q1).normalize();if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);
  const angle=2*Math.acos(Math.min(1,delta.w)),sin=Math.sqrt(Math.max(1e-16,1-delta.w*delta.w));
  return {axis:[delta.x/sin,delta.y/sin,delta.z/sin],angle};
 },before);
 const drag=async(dx,dy)=>{
  const box=await page.locator('#view-cube').boundingBox();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  const q0=await page.evaluate(()=>__compactArgs.getCamera().quaternion.toArray());
  await page.mouse.move(x+dx,y+dy,{steps:5});await page.mouse.up();await page.waitForTimeout(100);
  return deltaFrom(q0);
 };
 for(const roll of [0,Math.PI/2,Math.PI]){
  for(const [dx,dy,axis] of [[25,0,[0,-1,0]],[0,25,[-1,0,0]],[-25,0,[0,1,0]],[0,-25,[1,0,0]]]){
   await setPose(roll);const result=await drag(dx,dy);
   const dot=result.axis.reduce((s,v,i)=>s+v*axis[i],0);
   check(dot>.995&&Math.abs(result.angle-.21)<.012,`cube follows screen axis and slower speed roll=${roll.toFixed(2)} drag=${dx},${dy}`,JSON.stringify({result,dot}));
  }
 }
 await click('#crystal-type-group [data-type=NaCl]');await click('#toggle-diagonal');
 const ionDescriptions={diagonal:await description('#toggle-diagonal'),snap:await description('#btn-snap-diagonal'),opacity:await description('#opacity-p-slider')};
 check(!ionDescriptions.diagonal.includes('切り出し')&&!ionDescriptions.snap.includes('オンにする')&&!ionDescriptions.opacity.includes('補助線'),'enabled ion controls have no inapplicable explanation',JSON.stringify(ionDescriptions));
 await setPose(Math.PI/2);const sectionDrag=await drag(25,0);
 check(sectionDrag.axis[1]<-.995&&Math.abs(sectionDrag.angle-.21)<.012,'section cube drag also follows screen axes',JSON.stringify(sectionDrag));
 const sectionBefore=await page.evaluate(()=>{
  const c=__compactArgs.getCamera(),controls=__compactArgs.controls,d=c.position.distanceTo(controls.target);
  c.position.copy(controls.target).add(new THREE.Vector3(1,.3,-1).normalize().multiplyScalar(d));
  c.up.set(0,1,0);controls.update();
  return{target:controls.target.toArray(),distance:d,offset:[STATE.viewOffsetX,STATE.viewOffsetY]};
 });
 await page.waitForTimeout(100);
 const sectionBox=await page.locator('#view-cube').boundingBox();
 await page.mouse.click(sectionBox.x+sectionBox.width/2,sectionBox.y+sectionBox.height/2);await page.waitForTimeout(350);
 const sectionAfter=await page.evaluate(()=>{
  const c=__compactArgs.getCamera(),controls=__compactArgs.controls;
  return{dot:c.position.clone().sub(controls.target).normalize().dot(new THREE.Vector3(1,0,-1).normalize()),target:controls.target.toArray(),distance:c.position.distanceTo(controls.target),offset:[STATE.viewOffsetX,STATE.viewOffsetY]};
 });
 check(sectionAfter.dot>.9999&&Math.abs(sectionAfter.distance-sectionBefore.distance)<1e-8&&JSON.stringify(sectionBefore.target)===JSON.stringify(sectionAfter.target)&&JSON.stringify(sectionBefore.offset)===JSON.stringify(sectionAfter.offset),'section face still snaps to the section without changing zoom or position',JSON.stringify(sectionAfter));
 const touch=await page.context().newCDPSession(page);
 await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await page.waitForTimeout(100);
 await setPose(Math.PI/2);const box=await page.locator('#view-cube').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 const touchStart=await page.evaluate(()=>__compactArgs.getCamera().quaternion.toArray());
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+25,y,id:1}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
 const touchDrag=await deltaFrom(touchStart);
 check(touchDrag.axis[1]<-.995&&Math.abs(touchDrag.angle-.21)<.012,'touch dragging the section cube follows the screen axis',JSON.stringify(touchDrag));
 await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach();
 check(errors.length===0,'page has no uncaught errors',JSON.stringify(errors));
 if(failures.length)throw Error(JSON.stringify({passed,failures}));
 return{count:passed.length,passed};
}
