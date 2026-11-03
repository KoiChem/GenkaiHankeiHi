async(page)=>{
 const base=page.__baseUrl||'http://127.0.0.1:8765/';
 await page.goto(base+'FCC.html?source=bookmark#example');
 await page.waitForURL('**/index.html?source=bookmark#example');
 for(const size of [{width:1280,height:800},{width:390,height:844},{width:844,height:390},{width:280,height:700}]){
  await page.setViewportSize(size);
  const layout=await page.evaluate(()=>{const a=document.querySelector('.stereo-control').getBoundingClientRect(),b=document.querySelector('#btn-stereo-strong').getBoundingClientRect();return{top:b.top-a.top,bottom:a.bottom-b.bottom,left:b.left-a.left,right:a.right-b.right,overflow:document.querySelector('#ui-panel').scrollWidth>document.querySelector('#ui-panel').clientWidth};});
  if(layout.overflow||Math.min(layout.top,layout.bottom,layout.left,layout.right)<2)throw Error(JSON.stringify({size,layout}));
 }
 await page.locator('#btn-stereo').click();await page.locator('#btn-stereo-strong').click();
 if(!await page.evaluate(()=>STATE.stereoMode==='cross'&&STATE.stereoStrong))throw Error('stereo controls failed');
 return{checks:6,url:page.url()};
}
