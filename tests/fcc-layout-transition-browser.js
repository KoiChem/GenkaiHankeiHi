async(page)=>{
 const fresh=await page.context().newPage();
 try {
  await fresh.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const make=createFCCView;window.createFCCView=o=>{window.layoutArgs=o;const render=o.renderer.render.bind(o.renderer);o.renderer.render=(scene,camera)=>{window.layoutCamera=camera;return render(scene,camera);};return make(o);};}));
  await fresh.setViewportSize({width:390,height:844});
  await fresh.goto('http://127.0.0.1:8765/FCC.html');
  await fresh.waitForFunction(()=>window.layoutCamera);
  const center=()=>fresh.evaluate(()=>{const p=layoutArgs.controls.target.clone().project(layoutCamera);return(p.x+1)*innerWidth/2;});
  // Reproduce a bottom panel's transient horizontal position during a breakpoint transition.
  await fresh.locator('#ui-panel').evaluate(e=>e.style.transform='translateX(195px)');
  await fresh.locator('#btn-reset-pos').evaluate(e=>e.click());
  await fresh.waitForTimeout(40);
  if(Math.abs(await center()-195)>1)throw new Error('bottom-panel transition incorrectly shifts model');
  await fresh.locator('#ui-panel').evaluate(e=>e.style.transform='');
  await fresh.setViewportSize({width:1280,height:800});await fresh.waitForTimeout(450);
  const left=await fresh.locator('#ui-panel').evaluate(e=>e.getBoundingClientRect().left);
  await fresh.locator('#ui-panel').evaluate(e=>e.style.transform='translateX(120px)');
  await fresh.locator('#btn-reset-pos').evaluate(e=>e.click());
  await fresh.waitForTimeout(40);
  if(Math.abs(await center()-left/2)>1)throw new Error('sidebar transition incorrectly shifts model');
  return{checks:2,passed:true};
 }finally{await fresh.close();}
}
