import * as THREE from './vendor/three.module.js';

export function createAstronaut() {
  const root = new THREE.Group();
  const figure = new THREE.Group();
  root.add(figure);
  const white = new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.32, metalness: 0.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x192936, roughness: 0.5, metalness: 0.3 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xed7850, roughness: 0.35, metalness: 0.15 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xefb458, roughness: 0.23, metalness: 0.65, emissive: 0x654019, emissiveIntensity: 0.22 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x98e8eb, emissive: 0x50bed3, emissiveIntensity: 1.5, roughness: 0.3 });

  function part(geometry, material, position, parent = figure) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  function block(w, h, d) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d - 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.055, bevelThickness: 0.05 });
    geometry.translate(0, 0, -d / 2 + 0.05);
    return geometry;
  }
  const torsoShape = new THREE.Shape();
  torsoShape.moveTo(-0.92, 0); torsoShape.lineTo(0.92, 0); torsoShape.lineTo(0.7, 1.45); torsoShape.lineTo(-0.7, 1.45); torsoShape.closePath();
  const torso = new THREE.ExtrudeGeometry(torsoShape, { depth: 0.95, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.07, bevelThickness: 0.06 });
  torso.translate(0, 0, -0.48);
  part(torso, white, [0, 0.45, 0]);
  part(block(1.64, 0.25, 1.03), dark, [0, 0.43, 0]);
  part(block(0.84, 0.7, 0.13), dark, [0, 1.24, -0.57]);
  part(block(0.52, 0.21, 0.07), cyan, [-0.03, 1.36, -0.68]);
  for (let i = 0; i < 3; i++) part(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 12), i === 0 ? orange : white, [-0.22 + i * 0.22, 1.08, -0.68]).rotation.x = Math.PI / 2;

  part(new THREE.CylinderGeometry(0.48, 0.55, 0.22, 28), dark, [0, 2, 0]);
  part(new THREE.SphereGeometry(0.97, 36, 24), white, [0, 2.73, 0]).scale.set(1.02, 0.96, 0.92);
  const visor = part(new THREE.SphereGeometry(0.94, 32, 20), gold, [0, 2.76, -0.27]);
  visor.scale.set(0.85, 0.68, 0.79);
  const visorRim = part(new THREE.TorusGeometry(0.79, 0.07, 8, 40), dark, [0, 2.73, -0.65]);
  visorRim.scale.y = 0.76;
  const glint = part(new THREE.TorusGeometry(0.69, 0.014, 4, 24, Math.PI * 0.58), cyan, [0, 2.8, -0.89]);
  glint.scale.y = 0.72;
  // A short top stud and C-shaped hands give the small figure its brick-toy silhouette.
  part(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 24), white, [0, 3.64, 0]);
  const arms = [], legs = [], jets = [];
  for (const side of [-1, 1]) {
    part(new THREE.CylinderGeometry(0.27, 0.27, 0.14, 20), orange, [side * 0.96, 2.72, 0]).rotation.z = Math.PI / 2;
    const arm = new THREE.Group(); arm.position.set(side * 1.02, 1.67, 0); arm.rotation.z = side * 0.19;
    figure.add(arm); arms.push(arm);
    part(new THREE.CylinderGeometry(0.3, 0.27, 0.83, 16), white, [0, -0.35, 0], arm);
    part(new THREE.CylinderGeometry(0.29, 0.29, 0.2, 16), orange, [0, -0.76, 0], arm);
    part(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 14), dark, [0, -0.93, 0], arm);
    const hand = part(new THREE.TorusGeometry(0.23, 0.085, 8, 20, Math.PI * 1.52), gold, [0, -1.15, -0.02], arm);
    hand.rotation.z = -Math.PI * 0.26;
    const leg = new THREE.Group(); leg.position.set(side * 0.47, 0.23, 0); figure.add(leg); legs.push(leg);
    part(block(0.7, 1.05, 0.76), white, [0, -0.55, 0], leg);
    part(block(0.73, 0.25, 0.78), orange, [0, -0.8, 0], leg);
    part(block(0.77, 0.38, 1.02), dark, [0, -1.13, -0.1], leg);
    part(new THREE.CylinderGeometry(0.32, 0.32, 1.56, 20), white, [side * 0.53, 1.18, 0.84]);
    part(new THREE.CylinderGeometry(0.33, 0.33, 0.14, 20), orange, [side * 0.53, 1.53, 0.84]);
    part(new THREE.CylinderGeometry(0.19, 0.26, 0.3, 20), dark, [side * 0.53, 0.34, 0.84]);
    const jet = part(new THREE.ConeGeometry(0.2, 1.5, 16), new THREE.MeshBasicMaterial({ color: 0x83e8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), [side * 0.53, -0.25, 0.84]);
    jet.rotation.z = Math.PI; jets.push(jet);
  }
  part(block(0.55, 1.2, 0.4), dark, [0, 1.23, 0.85]);
  for (let i = 0; i < 3; i++) part(block(0.3, 0.04, 0.025), cyan, [0, 1.42 - i * 0.16, 1.08]);
  part(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8), dark, [0.69, 2.35, 0.87]);
  part(new THREE.SphereGeometry(0.07, 12, 8), cyan, [0.69, 2.85, 0.87]);
  figure.scale.setScalar(0.72);
  return {
    root,
    update(time, speed, reducedMotion, delta) {
      const thrust = Math.min(1, speed / 180);
      figure.position.y = reducedMotion ? 0 : Math.sin(time * 1.8) * 0.09;
      figure.rotation.x = THREE.MathUtils.damp(figure.rotation.x, -thrust * 0.23, 5, delta);
      arms.forEach((arm, i) => { arm.rotation.x = -0.18 - thrust * 0.4 + (reducedMotion ? 0 : Math.sin(time * 1.4 + i) * 0.05); });
      legs.forEach((leg, i) => { leg.rotation.x = thrust * (i ? 0.25 : 0.4) + (reducedMotion ? 0 : Math.sin(time * 1.3 + i) * 0.045); });
      jets.forEach(jet => { jet.scale.y = 0.2 + thrust * 1.8; jet.material.opacity = 0.16 + thrust * 0.5; });
    },
  };
}
