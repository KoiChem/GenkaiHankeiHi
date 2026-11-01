const test = require('node:test');
const assert = require('node:assert/strict');
let G;
try { G = require('../fcc-geometry.js'); } catch {}

test('FCC geometry API exists', () => assert.ok(G, 'FCC geometry has not been implemented'));
test('FCC sites are deduplicated and every interior atom has twelve touching neighbors', () => {
  assert.ok(G);
  assert.deepEqual([0,1,2].map(m=>G.atoms(m).length),[14,38,63]);
  const p=G.atoms(2), center=p.find(p=>p.id==='2,2,2');
  assert.equal(p.filter(q=>Math.abs(G.distance(q.p,center.p)-2*G.R)<1e-10).length,12);
  assert.equal(new Set(p.map(p=>p.id)).size,p.length);
});
test('ABC uses global (111) planes and repeats after three layers', () => {
  assert.ok(G);
  const p=G.atoms(2);
  for (const a of p) assert.equal(a.layer,Math.round(a.p.reduce((s,v)=>s+v,0))%3);
  assert.equal(p.find(a=>a.id==='0,0,0').layer,p.find(a=>a.id==='2,2,2').layer);
});
test('all 13 boundary-inclusive octahedral sites and 8 tetrahedral sites have exact contacts', () => {
  assert.ok(G);
  const sites=G.sites();
  assert.equal(sites.filter(s=>s.kind==='oct').length,13);
  assert.equal(sites.filter(s=>s.kind==='tet').length,8);
  for(const s of sites){
    assert.equal(s.neighbors.length,s.kind==='oct'?6:4);
    const ratio=s.kind==='oct'?Math.sqrt(2)-1:Math.sqrt(1.5)-1;
    assert.ok(Math.abs(s.radius/G.R-ratio)<1e-12);
    for(const p of s.neighbors) assert.ok(Math.abs(G.distance(s.p,p)-G.R-s.radius)<1e-12);
  }
});
test('partitions cover every sampled void point exactly once and void volume matches close packing', () => {
  assert.ok(G);
  const sites=G.sites(), atoms=G.atoms(0), n=32;
  let voids=0;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){
    const p=[(i+.371)/n,(j+.419)/n,(k+.293)/n];
    if(atoms.every(a=>G.distance(a.p,p)>G.R)){
      voids++;
      assert.equal(sites.filter(s=>G.contains(s,p,1e-10)).length,1);
    }
  }
  assert.ok(Math.abs(voids/n**3-(1-Math.PI/(3*Math.sqrt(2))))<0.003);
});
test('sphere patches and cap meshes remain in the base cube and exclude atom interiors', () => {
  assert.ok(G);
  for(const s of G.sites()){
    const meshes=G.geometry(s,12);
    assert.ok(meshes.surface.positions.length>0);
    for(const mesh of [meshes.surface,meshes.cube,meshes.partition]){
      const p=mesh.positions;
      for(let i=0;i<p.length;i+=3){
        const v=p.slice(i,i+3);
        assert.ok(v.every(x=>x>=-1e-8&&x<=1+1e-8));
        // Curved surfaces use chords between exact samples; allow tessellation error.
        assert.ok(s.neighbors.every(a=>G.distance(a,v)>G.R-0.012));
      }
    }
  }
});
test('hide targets visible front atom; restore targets hidden back atom with recent-hide override', () => {
  assert.ok(G);
  const hits=[{id:'front',distance:1},{id:'back',distance:3},{id:'middle',distance:2}];
  assert.equal(G.pickAtom(hits,new Set(['front']),'hide'), 'middle');
  assert.equal(G.pickAtom(hits,new Set(['front','back']),'restore'), 'back');
  assert.equal(G.pickAtom(hits,new Set(['front','back']),'restore','front'), 'front');
  assert.equal(G.pickAtom(hits,new Set(),'restore'), null);
});
test('browser controller parses as a classic script',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(require('node:path').join(__dirname,'../fcc-view.js'),'utf8')));
});
test('every curved triangle winding agrees with the outward void normal',()=>{
  assert.ok(G);
  for(const quality of [16,32])for(const site of G.sites())for(const mesh of Object.values(G.geometry(site,quality))){
    const p=mesh.positions,n=mesh.normals;
    for(let i=0;i<p.length;i+=9){
      const u=[p[i+3]-p[i],p[i+4]-p[i+1],p[i+5]-p[i+2]],v=[p[i+6]-p[i],p[i+7]-p[i+1],p[i+8]-p[i+2]];
      const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      assert.ok(cross.reduce((s,x,k)=>s+x*n[i+k],0)>=-1e-12,'triangle winding points into its solid');
    }
  }
});

test('actual capped triangle meshes approximate the known void volume in both quality levels',()=>{
  const expected=1-Math.PI/(3*Math.sqrt(2));
  for(const [quality,tolerance]of [[16,.03],[32,.01]]){
    let volume=0;
    for(const site of G.sites())for(const mesh of Object.values(G.geometry(site,quality))){
      const p=mesh.positions;
      for(let i=0;i<p.length;i+=9){
        const a=p.slice(i,i+3),b=p.slice(i+3,i+6),c=p.slice(i+6,i+9);
        volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
      }
    }
    assert.ok(Math.abs(volume/expected-1)<tolerance,`quality ${quality}: ${volume}`);
  }
});
