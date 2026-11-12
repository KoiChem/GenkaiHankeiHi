'use strict';
// Selected silhouette, independent of surface lighting and volume thickness.
function createSelectionGlow(renderer) {
    let selected=[],busy=false;
    const maskScene=new THREE.Scene();maskScene.background=new THREE.Color(0);
    const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
    const overlay=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
        uniforms:{mask:{value:target.texture},pixel:{value:new THREE.Vector2()}},
        vertexShader:'varying vec2 uvGlow;void main(){uvGlow=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader:`varying vec2 uvGlow;uniform sampler2D mask;uniform vec2 pixel;
        void main(){float inside=texture2D(mask,uvGlow).r;float light=0.;float weight=0.;
        for(int x=-4;x<=4;x++)for(int y=-4;y<=4;y++){
            vec2 offset=vec2(float(x),float(y));float w=exp(-dot(offset,offset)/7.);
            vec2 p=uvGlow+offset*pixel*2.;
            float sampleValue=0.;if(p.x>=0.&&p.x<=1.&&p.y>=0.&&p.y<=1.)sampleValue=texture2D(mask,p).r;
            light+=sampleValue*w;weight+=w;
        }
        float alpha=inside*0.24+(1.-inside)*light/weight*0.28;
        gl_FragColor=vec4(1.,0.92,0.25,alpha);}`});
    overlay.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
    const render=renderer.render.bind(renderer);
    renderer.render=function(scene,viewCamera){
        render(scene,viewCamera);
        if(busy||!selected.length||!selected.some(m=>{for(let p=m;p;p=p.parent)if(p===scene)return true;return false;}))return;
        busy=true;
        const viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),test=renderer.getScissorTest(),oldTarget=renderer.getRenderTarget(),auto=renderer.autoClear;
        try{
            const width=Math.max(1,Math.ceil(viewport.z/2)),height=Math.max(1,Math.ceil(viewport.w/2));
            if(target.width!==width||target.height!==height)target.setSize(width,height);
            selected.forEach((source,i)=>{source.updateWorldMatrix(true,false);maskScene.children[i].matrix.copy(source.matrixWorld);});
            // Render targets use texture pixels; setViewport would apply the screen DPR again.
            renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;
            render(maskScene,viewCamera);
            renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);renderer.autoClear=false;
            material.uniforms.pixel.value.set(1/width,1/height);render(overlay,camera);
        }finally{
            renderer.setRenderTarget(oldTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);renderer.autoClear=auto;busy=false;
        }
    };
    function clear(){selected=[];while(maskScene.children.length){const m=maskScene.children.pop();m.parent=null;m.material.dispose();}}
    return {select(meshes){clear();selected=meshes.filter(m=>m.isMesh&&m.visible&&m.material.opacity>0);
        for(const source of selected){const mat=new THREE.MeshBasicMaterial({color:0xffffff,side:source.material.side,clippingPlanes:source.material.clippingPlanes});
            const mesh=new THREE.Mesh(source.geometry,mat);mesh.matrixAutoUpdate=false;maskScene.add(mesh);}
    },clear};
}
