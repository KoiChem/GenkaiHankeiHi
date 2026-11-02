/* FCC coordinates are in conventional-cell units (a = 1).
 * The voids are curved sphere complements inside Delaunay tetrahedra/octahedra,
 * not their convex coordination-polyhedron proxies. No rendering dependency.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FCCGeometry = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const R = Math.SQRT2 / 4;
    const add = (a,b) => a.map((v,i)=>v+b[i]);
    const sub = (a,b) => a.map((v,i)=>v-b[i]);
    const mul = (a,s) => a.map(v=>v*s);
    const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
    const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const length = a => Math.sqrt(dot(a,a));
    const unit = a => mul(a,1/length(a));
    const distance = (a,b) => length(sub(a,b));
    const cube = [[[-1,0,0],0],[[1,0,0],1],[[0,-1,0],0],[[0,1,0],1],[[0,0,-1],0],[[0,0,1],1]].map(([n,d])=>({n,d,cube:true}));
    function atoms(mode) {
        const dims = mode===2 ? [2,2,2] : mode===1 ? [2,1,2] : [1,1,1];
        const result=[];
        for(let i=0;i<=2*dims[0];i++)for(let j=0;j<=2*dims[1];j++)for(let k=0;k<=2*dims[2];k++) {
            if((i+j+k)%2)continue;
            const p=[i/2,j/2,k/2];
            result.push({id:[i,j,k].join(','),p,vertex:i%2===0&&j%2===0&&k%2===0,layer:((i+j+k)/2)%3});
        }
        return result;
    }
    function hullPlanes(vertices, center) {
        const planes=[];
        for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)for(let k=j+1;k<vertices.length;k++) {
            let n=cross(sub(vertices[j],vertices[i]),sub(vertices[k],vertices[i]));
            if(length(n)<1e-8)continue;
            n=unit(n);
            let d=dot(n,vertices[i]);
            if(dot(n,center)>d){n=mul(n,-1);d=-d;}
            if(vertices.some(p=>dot(n,p)>d+1e-8))continue;
            if(!planes.some(q=>distance(q.n,n)<1e-7&&Math.abs(q.d-d)<1e-7))planes.push({n,d,cube:false});
        }
        return planes;
    }
    let siteCache;
    function sites() {
        if(siteCache)return siteCache;
        const result=[];
        const make=(kind,p)=>{
            const neighbors=[], d=kind==='oct'?.5:Math.sqrt(3)/4;
            for(let i=-2;i<=4;i++)for(let j=-2;j<=4;j++)for(let k=-2;k<=4;k++){
                if((i+j+k)%2)continue;
                const q=[i/2,j/2,k/2];
                if(Math.abs(distance(p,q)-d)<1e-8)neighbors.push(q);
            }
            const planes=hullPlanes(neighbors,p);
            result.push({id:kind+':'+p.map(v=>v*4).join(','),kind,p,neighbors,planes,radius:d-R});
        };
        make('oct',[.5,.5,.5]);
        for(let axis=0;axis<3;axis++)for(let a=0;a<=1;a++)for(let b=0;b<=1;b++){
            const p=[0,0,0];p[axis]=.5;p[(axis+1)%3]=a;p[(axis+2)%3]=b;make('oct',p);
        }
        for(const x of [.25,.75])for(const y of [.25,.75])for(const z of [.25,.75])make('tet',[x,y,z]);
        siteCache=result;return result;
    }
    const contains=(s,p,epsilon=1e-8)=>s.planes.every(q=>dot(q.n,p)<=q.d+epsilon);
    function clip(poly, value) {
        const out=[];
        for(let i=0;i<poly.length;i++){
            const a=poly[i],b=poly[(i+1)%poly.length],va=value(a),vb=value(b);
            if(va>=-1e-10)out.push(a);
            if((va>0&&vb<0)||(va<0&&vb>0))out.push(add(a,mul(sub(b,a),va/(va-vb))));
        }
        return out;
    }
    function facePolygon(plane,planes) {
        const points=[];
        for(let i=0;i<planes.length;i++)for(let j=i+1;j<planes.length;j++){
            const a=plane,b=planes[i],c=planes[j],bc=cross(b.n,c.n),den=dot(a.n,bc);
            if(Math.abs(den)<1e-8)continue;
            const p=mul(add(add(mul(bc,a.d),mul(cross(c.n,a.n),b.d)),mul(cross(a.n,b.n),c.d)),1/den);
            if(planes.some(q=>dot(q.n,p)>q.d+1e-8))continue;
            if(!points.some(q=>distance(p,q)<1e-7))points.push(p);
        }
        if(points.length<3)return [];
        const center=mul(points.reduce(add,[0,0,0]),1/points.length);
        const u=unit(sub(points[0],center)),v=cross(plane.n,u);
        points.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),u))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),u)));
        return points;
    }
    function geometry(site, resolution=32) {
        const surface={positions:[],normals:[]},partition={positions:[],normals:[]},outer={positions:[],normals:[]};
        const planes=[...site.planes,...cube];
        function append(target,poly,normal) {
            for(let i=1;i+1<poly.length;i++) {
                const tri=[poly[0],poly[i],poly[i+1]];
                if(length(cross(sub(tri[1],tri[0]),sub(tri[2],tri[0])))<1e-12)continue;
                const winding=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));
                if(dot(winding,normal(tri[0]))<0)[tri[1],tri[2]]=[tri[2],tri[1]];
                for(const p of tri){target.positions.push(...p);target.normals.push(...normal(p));}
            }
        }
        function curved(tri,center) {
            let poly=tri;
            for(const q of planes){poly=clip(poly,p=>q.d-dot(q.n,p));if(poly.length<3)return;}
            // Inward-facing sphere normals point outward from the void volume.
            if(dot(cross(sub(poly[1],poly[0]),sub(poly[2],poly[0])),sub(center,poly[0]))<0)poly.reverse();
            append(surface,poly,p=>unit(sub(center,p)));
        }
        const latitude=resolution,longitude=resolution*2;
        for(const center of site.neighbors){
            const point=(i,j)=>{
                const t=Math.PI*i/latitude,f=2*Math.PI*j/longitude;
                return add(center,mul([Math.sin(t)*Math.cos(f),Math.cos(t),Math.sin(t)*Math.sin(f)],R));
            };
            for(let i=0;i<latitude;i++)for(let j=0;j<longitude;j++){
                const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);
                curved([a,b,c],center);curved([a,c,d],center);
            }
        }
        function capTriangle(tri, plane) {
            let poly=tri;
            for(const c of site.neighbors){poly=clip(poly,p=>distance(p,c)-R);if(poly.length<3)return;}
            append(plane.cube?outer:partition,poly,()=>plane.n);
        }
        for(const plane of planes){
            const polygon=facePolygon(plane,planes);
            if(polygon.length<3)continue;
            // Face vertices are already clipped to the base cube.
            for(let f=1;f+1<polygon.length;f++){
                const [a,b,c]=[polygon[0],polygon[f],polygon[f+1]];
                const n=resolution*2;
                const sample=(i,j)=>add(a,add(mul(sub(b,a),i/n),mul(sub(c,a),j/n)));
                for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
                    const p=sample(i,j),q=sample(i+1,j),r=sample(i,j+1);
                    capTriangle([p,q,r],plane);
                    if(i+j<n-1)capTriangle([q,sample(i+1,j+1),r],plane);
                }
            }
        }
        return {surface,cube:outer,partition};
    }
    // Half-spaces use n·point <= d, matching the convex geometry above.
    function raySphereDistance(origin,direction,center,radius,planes=[]) {
        const relative=sub(origin,center),b=dot(relative,direction),c=dot(relative,relative)-radius*radius;
        const discriminant=b*b-c;
        if(discriminant<0)return null;
        let lo=Math.max(0,-b-Math.sqrt(discriminant)),hi=-b+Math.sqrt(discriminant);
        for(const plane of planes){
            const distance=plane.d-dot(plane.n,origin),slope=-dot(plane.n,direction);
            if(Math.abs(slope)<1e-12){if(distance < -1e-9)return null;continue;}
            const t=-distance/slope;
            if(slope>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
        }
        return hi>=lo-1e-9?lo:null;
    }
    function pickAtom(hits,hidden,action,recent=null){
        const unique=new Map();for(const h of hits)if(!unique.has(h.id)||h.distance<unique.get(h.id).distance)unique.set(h.id,h);
        const candidates=[...unique.values()].filter(h=>action==='hide'?!hidden.has(h.id):hidden.has(h.id));
        if(action==='restore'&&recent&&candidates.some(h=>h.id===recent))return recent;
        candidates.sort((a,b)=>action==='hide'?a.distance-b.distance:b.distance-a.distance);
        return candidates.length?candidates[0].id:null;
    }
    return {R,atoms,sites,geometry,contains,distance,pickAtom,raySphereDistance};
}));
