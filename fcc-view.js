'use strict';
function placeScreenLight(light,camera,target) {
    light.position.set(0,1,1).normalize().applyQuaternion(camera.quaternion).multiplyScalar(10).add(target);
    light.target.position.copy(target);
}

function describeControl(control,reasonId,needed) {
    if (needed) control.setAttribute('aria-describedby',reasonId);
    else control.removeAttribute('aria-describedby');
}

/* Alternate-page FCC controller. Legacy ion rendering and input stay in FCC.html. */
function createFCCView({ THREE, renderer, controls, state: shared, getCamera, cameras, views, stopMotion, onIonTap, onViewChange }) {
    const G = FCCGeometry, a = 3, baseSites = G.sites();
    const state = { mode:'normal', palette:'sites', kind:'both', display:'both', atom:.85, void:.7, sphere:.6, hidden:new Set(), selected:null };
    const scenes = { normal:new THREE.Scene(), void:new THREE.Scene() };
    const viewLights = new Map();
    for(const scene of Object.values(scenes)) {
        scene.add(new THREE.AmbientLight(0xffffff,.8));
        const light=new THREE.DirectionalLight(0xffffff,.4);light.position.set(8,12,10);scene.add(light,light.target);viewLights.set(scene,light);
    }
    const atomRoot=new THREE.Group(),voidRoot=new THREE.Group(),guideRoot=new THREE.Group();
    scenes.normal.add(atomRoot);scenes.void.add(voidRoot,guideRoot);
    const atomMaterials=[],atomObjects=[],voidObjects=[];
    const cache=new Map(),sphereCache=new Map(),frameRoots=[];
    let atomBuild='',voidBuild='',active=false,recentHide=null;
    const clips = [new THREE.Plane(new THREE.Vector3(1,0,0),0),new THREE.Plane(new THREE.Vector3(-1,0,0),a),new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Plane(new THREE.Vector3(0,-1,0),a),new THREE.Plane(new THREE.Vector3(0,0,1),0),new THREE.Plane(new THREE.Vector3(0,0,-1),a)];
    const vec=p=>new THREE.Vector3(...p).multiplyScalar(a);
    const color=s=>s.kind==='oct'?0xf2a522:0x9a55d6;
    const voidColor=s=>s.kind==='oct'?0xf0cd80:0xbf99d6;
    const atomGrid=()=>state.mode==='normal'?shared.gridMode:0;
    const atomClipping=()=>state.mode==='compare'||shared.isClipping;
    const enabled=()=>shared.type==='FCC';
    const quality=()=>shared.isLowQuality?16:32;
    function clear(group,dispose=true) {
        while(group.children.length){const child=group.children.pop();child.parent=null;
            child.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}if(dispose&&o.geometry&&!o.geometry.userData.fccCached)o.geometry.dispose();});
        }
    }
    function frame(size,center,opacity,scene) {
        const geo=new THREE.EdgesGeometry(new THREE.BoxGeometry(...size));
        const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x577a95,transparent:true,opacity}));lines.position.copy(center);scene.add(lines);frameRoots.push({scene,lines});
    }
    function rebuildFrames() {
        for(const {scene,lines}of frameRoots){scene.remove(lines);lines.geometry.dispose();lines.material.dispose();}frameRoots.length=0;
        const grid=atomGrid(),dims=grid===2?[2,2,2]:grid===1?[2,1,2]:[1,1,1];
        const size=dims.map(v=>v*a),center=new THREE.Vector3(...size).multiplyScalar(.5);
        frame(size,center,.3,scenes.normal);frame([a,a,a],new THREE.Vector3(a/2,a/2,a/2),.55,scenes.void);
        if(atomGrid()>0)frame([a,a,a],new THREE.Vector3(a/2,a/2,a/2),.65,scenes.normal);
    }
    function caps(group,p,r,material,planes) {
        const center=vec(p),radius=r*a;
        planes.forEach(plane=>{
            const d=plane.distanceToPoint(center);
            if(Math.abs(d)>=radius-1e-7)return;
            const cap=new THREE.Mesh(new THREE.CircleGeometry(Math.sqrt(radius*radius-d*d),quality()*2),material.clone());
            cap.material.side=THREE.DoubleSide;cap.material.polygonOffset=true;cap.material.polygonOffsetFactor=-1;
            cap.position.copy(center).addScaledVector(plane.normal,-d + .0005);cap.lookAt(cap.position.clone().add(plane.normal.clone().negate()));group.add(cap);
        });
    }
    function rebuildAtoms() {
        clear(atomRoot);atomObjects.length=0;atomMaterials.length=0;
        const grid=atomGrid(),dims=grid===2?[2,2,2]:grid===1?[2,1,2]:[1,1,1];
        const planes=atomClipping()?clips.map((p,i)=>{const q=p.clone();if(i%2)q.constant=dims[(i-1)/2]*a;return q;}):[];
        // Independent geometries allow the simple legacy disposal routine to coexist safely.
        for(const site of G.atoms(atomGrid())){
            const group=new THREE.Group();group.userData.site=site;atomRoot.add(group);
            const mat=new THREE.MeshPhongMaterial({transparent:true,opacity:state.atom,shininess:45,clippingPlanes:planes,depthWrite:state.atom>=1});
            const mesh=new THREE.Mesh(new THREE.SphereGeometry(G.R*a,quality()*2,quality()),mat);mesh.position.copy(vec(site.p));group.add(mesh);
            caps(group,site.p,G.R,mat,planes);atomObjects.push(group);
            group.traverse(o=>{if(o.material)atomMaterials.push({material:o.material,site});});
        }
        rebuildFrames();
    }
    function buffer(data,center) {
        const geo=new THREE.BufferGeometry();geo.userData.fccCached=true;geo.setAttribute('position',new THREE.Float32BufferAttribute(data.positions.map((v,i)=>v-center[i%3]),3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(data.normals,3));geo.computeBoundingSphere();return geo;
    }
    function prepareVoids() {
        const q=quality();
        if(cache.has(q))return cache.get(q);
        const entry={ready:false,geometries:[],building:true};cache.set(q,entry);
        let i=0;
        const step=()=>{
            const site=baseSites[i],data=G.geometry(site,q);
            entry.geometries.push({site,surface:buffer(data.surface,site.p),cube:buffer(data.cube,site.p),partition:buffer(data.partition,site.p)});
            if(++i<baseSites.length)setTimeout(step,0);
            else {entry.ready=true;entry.building=false;if(enabled()&&quality()===q){voidBuild='';update();}}
        };
        setTimeout(step,0);return entry;
    }
    function sphereGeometry() {
        const q=quality();if(!sphereCache.has(q)){const geometry=new THREE.SphereGeometry(1,q*2,q);geometry.userData.fccCached=true;sphereCache.set(q,geometry);}return sphereCache.get(q);
    }
    function mountVoids(entry) {
        // Cached BufferGeometries outlive the meshes and are never disposed here.
        clear(voidRoot);voidObjects.length=0;
        for(const data of entry.geometries){
            const site=data.site,group=new THREE.Group();group.userData.site=site;voidRoot.add(group);
            const surfaceMat=new THREE.MeshPhongMaterial({color:voidColor(site),side:THREE.DoubleSide,transparent:true,opacity:state.void,depthWrite:false,shininess:35});
            const parts=[];
            for(const key of ['surface','cube','partition']){
                const mesh=new THREE.Mesh(data[key],surfaceMat.clone());mesh.scale.setScalar(a);mesh.position.copy(vec(site.p));mesh.userData.site=site;group.add(mesh);parts.push({key,mesh});
            }
            surfaceMat.dispose();
            const ballMat=new THREE.MeshPhongMaterial({color:color(site),side:THREE.DoubleSide,transparent:true,opacity:state.sphere,shininess:65,clippingPlanes:clips,depthWrite:state.sphere>=1});
            const balls=new THREE.Group();group.add(balls);
            const ball=new THREE.Mesh(sphereGeometry(),ballMat);ball.position.copy(vec(site.p));ball.scale.setScalar(site.radius*a);ball.userData.site=site;balls.add(ball);
            caps(balls,site.p,site.radius,ballMat,clips);
            balls.traverse(o=>{if(o.isMesh)o.userData.site=site;});
            voidObjects.push({site,group,parts,balls});
        }
    }
    function guide() {
        clear(guideRoot);
        if(!state.selected)return;
        const site=baseSites.find(s=>s.id===state.selected);
        if(!site||state.kind!=='both'&&state.kind!==site.kind){state.selected=null;return;}
        const vertices=site.neighbors,positions=[];
        let minimum=Infinity;
        for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)minimum=Math.min(minimum,G.distance(vertices[i],vertices[j]));
        for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)if(Math.abs(G.distance(vertices[i],vertices[j])-minimum)<1e-7)positions.push(...vertices[i].map(v=>v*a),...vertices[j].map(v=>v*a));
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:site.kind==='oct'?0xd48d12:0x7927b0,depthTest:false,transparent:true,opacity:.95}));lines.renderOrder=10;guideRoot.add(lines);
        // Small contact-center markers make neighbors outside the base cube legible.
        for(const p of vertices){const marker=new THREE.Mesh(new THREE.SphereGeometry(.035*a,10,8),new THREE.MeshBasicMaterial({color:color(site),depthTest:false}));marker.position.copy(vec(p));marker.renderOrder=11;guideRoot.add(marker);}
    }
    function syncUI() {
        for(const [id,value] of [['fcc-mode',state.mode],['fcc-palette',state.palette],['fcc-kind',state.kind],['fcc-display',state.display]])document.querySelectorAll('#'+id+' button').forEach(b=>{const selected=b.dataset.value===value;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
        const isFCC=enabled(),showVoid=state.mode!=='normal';
        const compareButton=document.querySelector('#fcc-mode button[data-value="compare"]');
        compareButton.disabled=views.stereo();
        document.getElementById('fcc-mode-reason').hidden=!views.stereo();
        describeControl(compareButton,'fcc-mode-reason',views.stereo());
        const restoreButton=document.getElementById('fcc-restore');
        restoreButton.disabled=state.hidden.size===0;
        const restoreReason=document.getElementById('fcc-restore-reason');
        restoreReason.textContent=state.hidden.size===0?'非表示の原子はありません':'不透明度0%では原子は見えません';
        restoreReason.hidden=state.hidden.size>0&&state.atom>0;
        describeControl(restoreButton,'fcc-restore-reason',!restoreReason.hidden);

        const grid=document.getElementById('grid-mode-group'),clip=document.getElementById('toggle-clipping');
        if(isFCC){
            const row=document.getElementById('fcc-grid-row');
            if(grid.parentElement!==row)row.prepend(grid);
            if(clip.parentElement!==row)row.append(clip);
        }else{
            const home=document.getElementById('legacy-grid-home'),slot=document.getElementById('legacy-clipping-slot');
            if(grid.parentElement!==home)home.append(grid);
            if(clip.parentElement!==slot.parentElement)slot.before(clip);
        }
        document.getElementById('fcc-controls').classList.toggle('comparing',state.mode==='compare');
        document.getElementById('fcc-atom-controls').hidden=state.mode==='void';
        document.getElementById('fcc-palette-controls').hidden=state.mode!=='normal';
        document.getElementById('fcc-grid-row').hidden=state.mode!=='normal';
        document.getElementById('fcc-grid-label').hidden=state.mode!=='normal';
        grid.hidden=isFCC&&state.mode!=='normal';
        clip.hidden=isFCC&&state.mode!=='normal';
        document.getElementById('fcc-void-controls').hidden=!showVoid;
        document.getElementById('fcc-void-opacity-row').hidden=!showVoid||state.display==='sphere';
        document.getElementById('fcc-sphere-opacity-row').hidden=!showVoid||state.display==='void';
        document.getElementById('fcc-atom-opacity').closest('.opacity-row').hidden=state.mode==='void';
        document.getElementById('fcc-restore').hidden=state.mode==='void';
        document.getElementById('fcc-divider').hidden=!enabled()||state.mode!=='compare';
        document.getElementById('fcc-portrait').hidden=!enabled()||state.mode!=='compare'||window.innerWidth>=window.innerHeight;
    }
    function update() {
        if(views.stereo() && state.mode==='compare'){stereoReturn='compare';state.mode='void';}
        active=true;syncUI();
        const key=[atomGrid(),quality(),atomClipping()].join(':');
        if(key!==atomBuild){atomBuild=key;rebuildAtoms();}
        for(const {material,site}of atomMaterials){
            material.color.setHex(state.mode!=='compare'&&state.palette==='abc'?[0x8dbddc,0xf29aa8,0xbfd99b][site.layer]:(site.vertex?0xf29aa8:0x8dbddc));
            material.opacity=state.atom;material.depthWrite=state.atom>=1;
        }
        atomObjects.forEach(o=>o.visible=!state.hidden.has(o.userData.site.id)&&state.atom>0);
        if(state.mode!=='normal'){
            const entry=prepareVoids();document.getElementById('fcc-loading').hidden=entry.ready;
            if(entry.ready&&voidBuild!==String(quality())){voidBuild=String(quality());mountVoids(entry);}
        }else document.getElementById('fcc-loading').hidden=true;
        for(const o of voidObjects){
            o.group.visible=state.kind==='both'||state.kind===o.site.kind;
            for(const {key,mesh}of o.parts){mesh.visible=state.display!=='sphere'&&(key!=='partition'||state.kind!=='both')&&state.void>0;mesh.material.opacity=state.void;mesh.material.depthWrite=state.void>=1;}
            o.balls.visible=state.display!=='void'&&state.sphere>0;o.balls.traverse(m=>{if(m.material){m.material.opacity=state.sphere;m.material.depthWrite=state.sphere>=1;}});
        }
        guide();
        const mode=atomGrid();
        const dims=mode===2?[2,2,2]:mode===1?[2,1,2]:[1,1,1];
        const center=new THREE.Vector3(...dims).multiplyScalar(a/2),shift=center.clone().sub(shared.currentCenter);
        if(shift.lengthSq()>1e-10){
            viewChanged();
            for(const camera of cameras)camera.position.add(shift);
            controls.target.copy(center);shared.currentCenter.copy(center);
        }

    }
    let stereoReturn = null;
    function setMode(mode) {
        if (views.stereo() && mode === 'compare') { stereoReturn = 'compare'; mode = 'void'; }
        else stereoReturn = null;
        viewChanged();
        state.mode=mode;update();
    }
    function reset() {
        stopMotion();
        shared.viewOffsetX=0;shared.viewOffsetY=0;views.resetLayout();
        const camera=getCamera(),span=(atomGrid()>0?2:1);
        const dist=a*span*2.8;
        const center=shared.currentCenter.clone();
        controls.target.copy(center);camera.up.set(0,1,0);camera.position.copy(center).add(new THREE.Vector3(1.3,1,1.6).normalize().multiplyScalar(dist));
        camera.zoom=1;if(camera.isOrthographicCamera){const h=2*dist*Math.tan(THREE.MathUtils.degToRad(20));camera.top=h/2;camera.bottom=-h/2;camera.left=-h*window.innerWidth/window.innerHeight/2;camera.right=-camera.left;}
        for(const viewCamera of cameras){viewCamera.clearViewOffset();viewCamera.updateProjectionMatrix();}
        controls.update();
    }
    function viewportCamera(camera,width,height,side=null) {
        return views.camera(camera,width,height,side);
    }
    function render(camera,background) {
        if(!active)update();
        const w=window.innerWidth,h=window.innerHeight;
        document.getElementById('fcc-portrait').hidden=state.mode!=='compare'||w>=h;
        const panes=views.stereo()?[{x:0,w:w/2,kind:state.mode,side:0},{x:w/2,w:w/2,kind:state.mode,side:1}]:state.mode==='compare'?[{x:0,w:w/2,kind:'normal'},{x:w/2,w:w/2,kind:'void'}]:[{x:0,w,kind:state.mode}];
        renderer.setScissorTest(true);
        for(const view of panes){
            const scene=scenes[view.kind];scene.background=background;
            renderer.setViewport(view.x,0,view.w,h);renderer.setScissor(view.x,0,view.w,h);
            placeScreenLight(viewLights.get(scene),camera,controls.target);
            renderer.render(scene,viewportCamera(camera,view.w,h,view.side ?? null));
        }
        renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
    }
    function pick(x,y,kind) {
        const w=window.innerWidth,h=window.innerHeight,compare=state.mode==='compare',right=compare&&x>=w/2;
        if(kind==='atom'&&(state.mode==='void'||right))return [];
        if(kind==='void'&&(state.mode==='normal'||compare&&!right))return [];
        const picked=views.pick(getCamera(),x,y,compare);
        const ray=new THREE.Raycaster();ray.setFromCamera(picked.ndc,picked.camera);
        if(kind==='atom'){
            const hits=[];
            // Analytic ray/sphere + clipping interval keeps hidden sites pickable,
            // including their cut faces. Display meshes are never hit targets.
            const grid=atomGrid(),dims=grid===2?[2,2,2]:grid===1?[2,1,2]:[1,1,1];
            const planes=atomClipping()?[
                {n:[-1,0,0],d:0},{n:[1,0,0],d:dims[0]*a},
                {n:[0,-1,0],d:0},{n:[0,1,0],d:dims[1]*a},
                {n:[0,0,-1],d:0},{n:[0,0,1],d:dims[2]*a}
            ]:[];
            for(const site of G.atoms(atomGrid())){
                const distance=G.raySphereDistance(ray.ray.origin.toArray(),ray.ray.direction.toArray(),site.p.map(v=>v*a),G.R*a,planes);
                if(distance!==null)hits.push({id:site.id,distance});
            }
            return hits;
        }
        voidRoot.updateMatrixWorld(true);
        const targets=[];voidRoot.traverse(o=>{if(o.isMesh){let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(visible)targets.push(o);}});
        const hits=ray.intersectObjects(targets,false).filter(hit=>clips.every(p=>p.distanceToPoint(hit.point)>=-1e-6));
        return hits.map(h=>({id:h.object.userData.site.id,distance:h.distance}));
    }
    let down=null,tapTimer=null,taps=0,tapPoint=null,pointers=new Set();
    function viewChanged(){recentHide=null;onViewChange();cancelGesture();}
    function cancelGesture() {clearTimeout(tapTimer);tapTimer=null;down=null;taps=0;tapPoint=null;}
    function tap(count,p) {
        if(!enabled()){onIonTap(count,p);return;}
        if(count===1){const hits=pick(p.x,p.y,'void');if(hits.length){state.selected=state.selected===hits[0].id?null:hits[0].id;guide();}return;}
        const hits=count===2&&state.atom<=0?[]:pick(p.x,p.y,'atom');
        const recent=recentHide&&Date.now()-recentHide.time<5000&&Math.hypot(p.x-recentHide.x,p.y-recentHide.y)<12?recentHide.id:null;
        const id=G.pickAtom(hits,state.hidden,count===2?'hide':'restore',recent);
        if(id){if(count===2){state.hidden.add(id);recentHide={id,x:p.x,y:p.y,time:Date.now()};}else{state.hidden.delete(id);recentHide=null;}update();}
    }
    document.getElementById('ui-panel').addEventListener('pointerdown',()=>{cancelGesture();pointers.clear();});
    const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',e=>{
        pointers.add(e.pointerId);
        if(pointers.size>1||!e.isPrimary||e.button!==0){cancelGesture();return;}
        if(tapPoint&&Math.hypot(e.clientX-tapPoint.x,e.clientY-tapPoint.y)>12)cancelGesture();
        clearTimeout(tapTimer);tapTimer=null;
        down={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,time:performance.now()};
    });
    window.addEventListener('pointermove',e=>{
        if(!down||e.pointerId!==down.id)return;
        if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8){down.moved=true;clearTimeout(tapTimer);taps=0;tapPoint=null;recentHide=null;onViewChange();}
    });
    window.addEventListener('pointerup',e=>{
        pointers.delete(e.pointerId);
        if(!down||e.pointerId!==down.id)return;
        const previous=down;down=null;
        // A held pointer is not a tap and never changes the display model.
        if(performance.now()-previous.time>=450){cancelGesture();return;}
        if(previous.moved||e.button!==0||pointers.size)return;
        taps++;tapPoint={x:e.clientX,y:e.clientY};
        if(taps===3){const p=tapPoint;cancelGesture();tap(3,p);}
        else tapTimer=setTimeout(()=>{const count=taps,p=tapPoint;cancelGesture();if(p)tap(count,p);},300);
    });
    window.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);cancelGesture();});
    window.addEventListener('blur',()=>{pointers.clear();cancelGesture();});
    canvas.addEventListener('wheel',viewChanged,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){pointers.clear();cancelGesture();}});
    for(const [id,key]of [['fcc-mode','mode'],['fcc-palette','palette'],['fcc-kind','kind'],['fcc-display','display']])document.getElementById(id).addEventListener('click',e=>{
        const button=e.target.closest('button');if(!button||button.disabled)return;cancelGesture();
        if(key==='mode')setMode(button.dataset.value);else{state[key]=button.dataset.value;update();}
    });
    for(const key of ['atom','void','sphere'])document.getElementById('fcc-'+key+'-opacity').addEventListener('input',e=>{state[key]=Number(e.target.value);document.getElementById('fcc-'+key+'-value').value=Math.round(state[key]*100)+'%';update();});
    document.getElementById('fcc-restore').addEventListener('click',()=>{state.hidden.clear();recentHide=null;update();});
    return {setStereo(on){
        if(on && state.mode==='compare'){stereoReturn='compare';state.mode='void';if(enabled())update();}
        else if(!on && stereoReturn){const mode=stereoReturn;stereoReturn=null;state.mode=mode;if(enabled())update();}
        if(enabled())syncUI();
        viewChanged();
    },update,render,reset,cancelGesture,viewChanged,deactivate(){active=false;cancelGesture();syncUI();document.getElementById('fcc-divider').hidden=true;document.getElementById('fcc-portrait').hidden=true;document.getElementById('fcc-loading').hidden=true;}};
}
