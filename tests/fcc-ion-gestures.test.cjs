const test=require('node:test'),assert=require('node:assert/strict'),G=require('../fcc-geometry.js');
test('analytic ion hit API is available',()=>assert.equal(typeof G.raySphereDistance,'function'));
test('analytic rays select spherical fronts and clipped cube/diagonal caps',()=>{
 assert.equal(G.raySphereDistance([0,0,5],[0,0,-1],[0,0,0],1,[]),4);
 assert.equal(G.raySphereDistance([0,0,5],[0,0,-1],[0,0,0],1,[{n:[0,0,1],d:0}]),5);
 assert.equal(G.raySphereDistance([2,0,5],[0,0,-1],[0,0,0],1,[]),null);
 const d=1/Math.sqrt(2);
 assert.equal(G.raySphereDistance([0,0,5],[0,0,-1],[0,0,0],1,[{n:[d,0,d],d:0}]),5);
 assert.equal(G.raySphereDistance([0,0,5],[0,0,-1],[0,0,0],1,[{n:[0,0,-1],d:-2}]),null);
});
