// 直劈：朝前方豎立的四分之一弧刀光，上細下粗；沿揮刀方向展開。
(function (R) {
  const old = R.addFx;
  R.addFx = function (kind, x, y, z, o) {
    if (kind !== 'bladeCleave') return old.apply(this, arguments);
    const TH = window.THREE, W = R.W;
    if (!TH || !W.scene) return;
    const r = Math.max(1, o.range || 3), objs = [], life = 0.28;
    for (let layer = 0; layer < 2; layer++) {
      const geo = new TH.BufferGeometry(), pos = new Float32Array(33 * 12), indices = [];
      geo.setAttribute('position', new TH.BufferAttribute(pos, 3));
      for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { const b=i*4+j,c=i*4+(j+1)%4; indices.push(b,c,b+4,c,c+4,b+4); }
      geo.setIndex(indices);
      const mat = new TH.MeshBasicMaterial({color:layer ? '#F4FCFF' : '#7CBFFF',transparent:true,opacity:layer ? 0.95 : 0.55,side:TH.DoubleSide,depthWrite:false});
      const mesh = new TH.Mesh(geo,mat); mesh.position.set(x,0.15,z); mesh.rotation.y=o.a||0;
      mesh.userData.ownGeo=true; mesh.frustumCulled=false; W.scene.add(mesh); objs.push(mesh);
    }
    const tick = k => {
      const end = Math.min(1,k / 0.58), start = Math.max(0,(k-0.58)/0.42);
      objs.forEach((mesh,layer) => {
        const p=mesh.geometry.attributes.position;
        for(let i=0;i<=32;i++) {
          const u=start+(end-start)*i/32, a=u*Math.PI/2;
          const width=(0.025+0.28*u*u)*(layer ? 0.32 : 1), outer=r, inner=r*(1-width);
          // 菱形截面形成真正的厚度，從背後或正面也看得到弧形刃面。
          const mid=(outer+inner)/2, thick=r*(0.008+0.055*u)*(layer ? 0.38 : 1);
          [[0,outer],[thick,mid],[0,inner],[-thick,mid]].forEach(([side,rr],j)=>p.setXYZ(i*4+j,side,Math.cos(a)*rr,Math.sin(a)*rr));
        }
        p.needsUpdate=true;
      });
    };
    tick(0.02); W.fxs.push({kind:'bladeCleave',t:0,life,objs,tick});
  };
})(window.R);
