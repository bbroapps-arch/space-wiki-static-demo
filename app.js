import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { Pilot, ChaseCamera } from './pilot.js';
import { createAstronaut } from './astronaut.js';
import { createDocuments } from './documents.js';

const $ = selector => document.querySelector(selector);
const host = $('#scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 600px)').matches;
const NOTE_COUNT = 1800;
const initialCamera = new THREE.Vector3(0, 22, 255);
const origin = new THREE.Vector3();
const projects = [
  { name: '브랜드 아카이브', description: '브랜드의 방향과 감각을 모으는 공간. 작은 영감이 다음 아이디어의 시작이 됩니다.', tags: ['브랜딩', '영감', '아카이브'], position: [83, 49, 70], radius: 10.5, color: '#84919c' },
  { name: '새로운 서비스', description: '사용자의 일상에서 발견한 문제를 더 나은 경험으로 연결합니다.', tags: ['프로덕트', '리서치', '경험'], position: [-54, 12, 22], radius: 5.2, color: '#798998' },
  { name: '디자인 시스템', description: '형태, 색, 언어에 담긴 공통 원칙. 일관된 경험을 만드는 기록입니다.', tags: ['디자인', '시스템', 'UI'], position: [19, -12, 46], radius: 6.4, color: '#667888' },
  { name: '생각의 기록', description: '아직 이름 붙이지 못한 생각도 이곳에서 서로의 궤도를 만납니다.', tags: ['메모', '아이디어', '일상'], position: [-94, -39, 74], radius: 6.1, color: '#72808b' },
  { name: 'AI 실험실', description: '새로운 도구를 직접 실험하고 발견한 가능성과 질문을 모읍니다.', tags: ['AI', '실험', '기술'], position: [69, -40, -25], radius: 4.8, color: '#718b98' },
  { name: '읽고 남기기', description: '책과 글에서 발견한 문장을 나의 생각과 연결하는 작은 서재입니다.', tags: ['독서', '문장', '인사이트'], position: [-117, 65, -110], radius: 7.6, color: '#8c8798' },
  { name: '다음 여행', description: '낯선 곳에서의 관찰과 언젠가 가보고 싶은 장소를 함께 기록합니다.', tags: ['여행', '장소', '관찰'], position: [133, 2, -120], radius: 7.3, color: '#767f95' },
  { name: '팀의 작업실', description: '함께 만든 결과와 그 과정의 질문들을 다음 작업으로 이어갑니다.', tags: ['협업', '프로젝트', '회고'], position: [-13, 70, -80], radius: 4.4, color: '#8b9d9f' },
  { name: '작은 자동화', description: '반복되는 일에 여유를 만드는 실험. 도구와 흐름을 기록합니다.', tags: ['자동화', '도구', '흐름'], position: [40, -87, -100], radius: 6.8, color: '#677f85' },
  { name: '콘텐츠 노트', description: '전하고 싶은 이야기를 발견하고 다듬어 한 편의 콘텐츠로 만듭니다.', tags: ['콘텐츠', '이야기', '글쓰기'], position: [-149, -13, -53], radius: 4.6, color: '#908798' },
  { name: '데이터의 풍경', description: '숫자 뒤에 있는 패턴과 맥락을 읽고 이해하기 쉬운 모습으로 옮깁니다.', tags: ['데이터', '시각화', '분석'], position: [112, -72, -165], radius: 8.2, color: '#718a9b' },
  { name: '음악과 장면', description: '소리와 이미지가 남기는 감각을 하나의 분위기로 엮습니다.', tags: ['음악', '무드', '레퍼런스'], position: [-73, -92, -160], radius: 5.8, color: '#847d96' },
  { name: '일하는 방식', description: '더 잘 집중하고 함께 일하기 위한 방법을 탐색하는 기록입니다.', tags: ['생산성', '루틴', '방법'], position: [6, 4, -145], radius: 8.4, color: '#7c8895' },
  { name: '미래의 질문', description: '당장 답이 없어도 좋은 질문들. 다음 가능성을 향해 열어 둡니다.', tags: ['미래', '탐구', '질문'], position: [163, 79, -231], radius: 9.5, color: '#7f8598' },
];

// Repeatable sample positions keep the demo stable between reloads.
let seed = 9302026;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function normalRandom() {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) * Math.cos(2 * Math.PI * random());
}
const format = value => value.toLocaleString('ko-KR');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1830, 0.0018);
scene.add(new THREE.HemisphereLight(0xc3dfff, 0x292039, 2.1));
const keyLight = new THREE.DirectionalLight(0xffeed7, 3.4);
keyLight.position.set(-90, 160, 100); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x87baff, 2.2);
rimLight.position.set(90, 30, -120); scene.add(rimLight);
const camera = new THREE.PerspectiveCamera(58, 1, 0.5, 2500);
camera.position.copy(initialCamera);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  $('#loading').classList.add('hidden');
  $('#render-error').classList.remove('hidden');
  document.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setClearColor(0x080e20);
host.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', '업무 자료 지도. 화면 클릭으로 둘러보기 시작, WASD 이동, R/F 위아래 이동, Space 빠르게 이동, E 앞으로 짧게 이동, Esc 둘러보기 종료.');
renderer.domElement.setAttribute('tabindex', '0');

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 18;
controls.maxDistance = 720;
controls.rotateSpeed = -0.45;
controls.zoomSpeed = 0.65;
controls.panSpeed = -0.6;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.4;
$('#auto-rotate').checked = false;

const noiseGLSL = `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.17, 0.11, 0.23));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec3(12.1,7.2,3.4); a *= 0.51; }
    return v;
  }
`;

const nebulaMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec3 vDirection; void main() { vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    varying vec3 vDirection;
    uniform float uTime;
    ${noiseGLSL}
    void main() {
      vec3 d = normalize(vDirection);
      vec3 p = d * 3.8 + vec3(1.8, 1.25, uTime * 0.001);
      float n = fbm(p);
      float wisps = fbm(p * 3.0 + vec3(n * 2.2));
      float clouds = smoothstep(0.34, 0.76, n);
      float band = exp(-pow((d.y + d.x * 0.45 + (n-0.5)*0.6 + 0.06) * 3.0, 2.0));
      float dust = smoothstep(0.31, 0.67, wisps);
      float tint = smoothstep(-0.6, 0.65, d.x + n * 0.42);
      vec3 blue = vec3(0.009, 0.038, 0.19);
      vec3 violet = vec3(0.15, 0.011, 0.18);
      vec3 color = vec3(0.002, 0.005, 0.017);
      color += mix(violet, blue, tint) * clouds * (0.25 + band * 1.2);
      color += vec3(0.018,0.045,0.09) * dust * clouds * band * 0.7;
      color += vec3(0.15,0.012,0.11) * smoothstep(0.53,0.79,n) * band;
      float grain = hash(d * 1400.0) * 0.002;
      color += grain;
      gl_FragColor = vec4(color,1.0);
      #include <colorspace_fragment>
    }
  `,
});
const nebula = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 32), nebulaMaterial);
nebula.renderOrder = -10;
scene.add(nebula);

function glowTexture(ring = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (ring) {
    gradient.addColorStop(0, 'rgba(207,229,247,0)');
    gradient.addColorStop(0.22, 'rgba(207,229,247,0)');
    gradient.addColorStop(0.29, 'rgba(207,229,247,0.25)');
    gradient.addColorStop(0.32, 'rgba(235,246,255,0.85)');
    gradient.addColorStop(0.35, 'rgba(207,229,247,0.20)');
    gradient.addColorStop(0.48, 'rgba(137,180,222,0.10)');
    gradient.addColorStop(1, 'rgba(137,180,222,0)');
  } else {
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.09, 'rgba(241,248,255,1)');
    gradient.addColorStop(0.18, 'rgba(210,230,255,0.55)');
    gradient.addColorStop(0.38, 'rgba(135,183,255,0.12)');
    gradient.addColorStop(1, 'rgba(93,153,235,0)');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const softGlow = glowTexture();
const ringGlow = glowTexture(true);

function makePoints(positions, sizes, colors, brightness, background = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uBrightness: { value: brightness }, uHalo: { value: 1 }, uPixelRatio: { value: renderer.getPixelRatio() }, uTime: { value: 0 }, uBackground: { value: background ? 1 : 0 } },
    vertexShader: `
      attribute float aSize; attribute vec3 aColor;
      uniform float uPixelRatio, uTime, uBackground;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * uPixelRatio * (330.0 / max(12.0,-mv.z)),1.2,35.0);
        vColor = aColor;
        vAlpha = (0.78 + 0.22*sin(uTime*0.65 + position.x*0.1)) * mix(exp(-max(0.0,-mv.z-100.0)*0.0015),0.7,uBackground);
      }
    `,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      uniform float uBrightness, uHalo;
      void main() {
        float r = length(gl_PointCoord - vec2(0.5));
        if (r > 0.5) discard;
        float core = 1.0-smoothstep(0.04,0.21,r);
        float halo = exp(-r*r*23.0)*0.50*uHalo;
        float alpha = (core + halo) * vAlpha * uBrightness;
        gl_FragColor = vec4(vColor,alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

const backgroundPositions = [], backgroundSizes = [], backgroundColors = [];
for (let i = 0; i < 3400; i++) {
  const direction = new THREE.Vector3(normalRandom(), normalRandom(), normalRandom()).normalize();
  direction.multiplyScalar(750 + random() * 190);
  backgroundPositions.push(...direction.toArray());
  backgroundSizes.push(1.3 + random() * 5.2);
  backgroundColors.push(0.61 + random() * 0.32, 0.73 + random() * 0.25, 1);
}
const backgroundStars = makePoints(backgroundPositions, backgroundSizes, backgroundColors, 0.75, true);

const nodes = [], nodePositions = [], nodeSizes = [], nodeColors = [];
for (let i = 0; i < NOTE_COUNT; i++) {
  const group = i % projects.length;
  const center = new THREE.Vector3(...projects[group].position);
  const spread = 20 + random() * 48;
  const position = center.add(new THREE.Vector3(normalRandom() * spread, normalRandom() * spread * 0.73, normalRandom() * spread));
  // Three sample documents form a discoverable trail on the initial flight path.
  if (i === 0) position.set(8, 18, 155);
  if (i === 14) position.set(-23, 10, 128);
  if (i === 28) position.set(24, 22, 105);
  nodes.push({ position, group });
  nodePositions.push(...position.toArray());
  const large = random() > 0.97;
  nodeSizes.push(large ? 8 + random() * 9 : 2 + Math.pow(random(), 2) * 7.2);
  const tint = random();
  nodeColors.push(tint > 0.2 ? 0.92 : 0.65, tint > 0.2 ? 0.96 : 0.83, 1);
}
const notes = makePoints(nodePositions, nodeSizes, nodeColors, 1.35);

const linkPositions = [], linkProgress = [], linkNodeA = [], linkNodeB = [], linkGroups = [];
const projectLinkCounts = projects.map(() => 0);
let linkCount = 0;
for (let i = 0; i < nodes.length; i++) {
  const nearest = [];
  for (let j = i + 1; j < Math.min(nodes.length, i + 240); j++) {
    const distance = nodes[i].position.distanceToSquared(nodes[j].position);
    if (distance < 72 * 72) nearest.push({ j, distance });
  }
  nearest.sort((a, b) => a.distance - b.distance);
  for (const match of nearest.slice(0, 2)) {
    const from = nodes[i].position, to = nodes[match.j].position;
    const bend = new THREE.Vector3().subVectors(to, from).cross(new THREE.Vector3(0.3, 1, 0.2)).normalize().multiplyScalar(Math.sqrt(match.distance) * 0.045);
    const curve = t => from.clone().lerp(to, t).addScaledVector(bend, Math.sin(t * Math.PI));
    for (let segment = 0; segment < 4; segment++) {
      for (const t of [segment / 4, (segment + 1) / 4]) {
        linkPositions.push(...curve(t).toArray()); linkProgress.push(t);
        linkNodeA.push(i); linkNodeB.push(match.j); linkGroups.push(nodes[i].group);
      }
    }
    projectLinkCounts[nodes[i].group]++;
    if (nodes[match.j].group !== nodes[i].group) projectLinkCounts[nodes[match.j].group]++;
    linkCount++;
  }
}
const linkGeometry = new THREE.BufferGeometry();
linkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
linkGeometry.setAttribute('aProgress', new THREE.Float32BufferAttribute(linkProgress, 1));
linkGeometry.setAttribute('aNodeA', new THREE.Float32BufferAttribute(linkNodeA, 1));
linkGeometry.setAttribute('aNodeB', new THREE.Float32BufferAttribute(linkNodeB, 1));
linkGeometry.setAttribute('aGroup', new THREE.Float32BufferAttribute(linkGroups, 1));
const linkMaterial = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uObserver: { value: initialCamera.clone() }, uNode: { value: -1 }, uGroup: { value: -1 } },
  vertexShader: `
    attribute float aProgress, aNodeA, aNodeB, aGroup;
    uniform float uNode, uGroup; uniform vec3 uObserver;
    varying float vProgress, vNear, vFocus, vGroup;
    void main() {
      vProgress = aProgress; vGroup = aGroup;
      vNear = exp(-length(position-uObserver)*0.011);
      vFocus = max((1.0-step(0.1,abs(aNodeA-uNode))),(1.0-step(0.1,abs(aNodeB-uNode))));
      vFocus = max(vFocus, (1.0-step(0.1,abs(aGroup-uGroup)))*0.35);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`,
  fragmentShader: `
    uniform float uTime;
    varying float vProgress, vNear, vFocus, vGroup;
    void main() {
      float pulse = pow(max(0.0,sin(vProgress*6.283-uTime*1.6+vGroup)),18.0);
      vec3 color = mix(vec3(0.28,0.43,0.65),vec3(0.52,0.91,0.85),vFocus);
      float alpha = 0.023 + vNear*0.09 + vFocus*0.2 + pulse*vFocus*0.2;
      gl_FragColor = vec4(color,alpha);
      #include <colorspace_fragment>
    }`,
});
const links = new THREE.LineSegments(linkGeometry, linkMaterial);
scene.add(links);

const projectGroup = new THREE.Group();
scene.add(projectGroup);
const pickTargets = [];
const haloMaterials = [];
const planetMaterials = [];
const projectLabels = [];
const planetPalette = ['#75a9b6', '#b58a76', '#849bba', '#a293b8', '#70a89a', '#bfa985'];
projects.forEach((project, index) => {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(planetPalette[index % planetPalette.length]) }, uTime: { value: 0 }, uKind: { value: index % 3 } },
    vertexShader: `
      varying vec3 vLocal, vNormalWorld, vWorld;
      void main() {
        vLocal = normalize(position);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position,1.0); vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vLocal, vNormalWorld, vWorld;
      uniform vec3 uColor;
      uniform float uTime, uKind;
      ${noiseGLSL}
      void main() {
        vec3 p = vLocal * 5.0 + vec3(uTime*0.003,0.0,uKind*9.0);
        float n = fbm(p);
        float detail = fbm(p * 3.6 + vec3(n*2.0));
        float band = sin(vLocal.y * 42.0 + n * 11.0) * 0.5 + 0.5;
        float land = smoothstep(0.42,0.6,n);
        vec3 bump = vec3(noise(p*15.0),noise(p.yzx*15.0),noise(p.zxy*15.0))-0.5;
        vec3 normal = normalize(vNormalWorld+bump*0.15);
        float sun = dot(normal,normalize(vec3(-0.6,0.65,1.0)));
        float light = smoothstep(-0.12,0.75,sun);
        vec3 view = normalize(cameraPosition-vWorld);
        float rim = pow(1.0-max(0.0,dot(normalize(vNormalWorld),view)),3.5);
        vec3 ocean = uColor*vec3(0.32,0.53,0.66);
        vec3 ground = mix(uColor*0.72,uColor*1.25,detail);
        vec3 surface = mix(ocean,ground,land);
        if(uKind > 0.5 && uKind < 1.5) surface = uColor*(0.4+n*0.5+band*0.35+detail*0.2);
        float clouds = smoothstep(0.55,0.73,fbm(p*1.7+vec3(uTime*0.006)));
        surface = mix(surface,vec3(0.77,0.84,0.88),clouds*0.55);
        vec3 color = surface*(0.09+light*1.22);
        float cities = pow(noise(p*36.0),24.0)*land*(1.0-light);
        color += vec3(1.0,0.56,0.2)*cities*0.7;
        color += uColor*rim*(0.16+light*0.22);
        gl_FragColor = vec4(color,1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(project.radius, 56, 40), material);
  mesh.position.set(...project.position);
  mesh.rotation.z = (random() - 0.5) * 0.8;
  mesh.userData.projectIndex = index;
  projectGroup.add(mesh);
  pickTargets.push(mesh);
  planetMaterials.push(material);
  const haloMaterial = new THREE.SpriteMaterial({ map: softGlow, color: planetPalette[index % planetPalette.length], transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Sprite(haloMaterial);
  halo.position.copy(mesh.position);
  halo.scale.setScalar(project.radius * 4.6);
  projectGroup.add(halo);
  haloMaterials.push(haloMaterial);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(project.radius * 1.045, 40, 28), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTint: { value: new THREE.Color(planetPalette[index % planetPalette.length]) } },
    vertexShader: `varying vec3 vN,vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.0); }`,
    fragmentShader: `varying vec3 vN,vW; uniform vec3 uTint; void main(){ float rim=pow(1.0-max(0.0,dot(normalize(vN),normalize(cameraPosition-vW))),3.4); gl_FragColor=vec4(uTint,rim*0.3); #include <colorspace_fragment> }`.replace('#include <colorspace_fragment>', '\n#include <colorspace_fragment>\n'),
  }));
  atmosphere.position.copy(mesh.position); projectGroup.add(atmosphere);
  if (index % 3 === 0) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(project.radius * 1.38, project.radius * 2.05, 96), new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: { uRadius: { value: project.radius }, uTint: { value: new THREE.Color(planetPalette[index % planetPalette.length]) } },
      vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying vec3 vP; uniform float uRadius; uniform vec3 uTint; void main(){ float r=length(vP.xy)/uRadius; float bands=0.45+0.35*sin(r*130.0)+0.2*sin(r*370.0); float edge=smoothstep(1.38,1.46,r)*(1.0-smoothstep(1.91,2.05,r)); gl_FragColor=vec4(mix(uTint,vec3(0.82,0.76,0.65),0.4),edge*(0.12+bands*0.22)); }`,
    }));
    ring.position.copy(mesh.position); ring.rotation.set(1.1, 0.4, index * 0.7 + 0.3); projectGroup.add(ring);
  }
  const label = document.createElement('div');
  label.className = 'project-label';
  label.textContent = project.name;
  $('#labels').appendChild(label);
  projectLabels.push(label);
});

const brightNotes = new THREE.Group();
scene.add(brightNotes);
const brightMaterials = [];
for (let i = 0; i < 18; i++) {
  const node = nodes[Math.floor(random() * nodes.length)];
  const material = new THREE.SpriteMaterial({ map: softGlow, color: 0xdce9ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(node.position);
  sprite.scale.setScalar(4 + random() * 5);
  brightNotes.add(sprite);
  brightMaterials.push(material);
}

const selectionRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 5, 96), new THREE.MeshBasicMaterial({ color: 0xa0e1d7, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false }));
selectionRing.visible = false;
selectionRing.renderOrder = 10;
scene.add(selectionRing);

const astronaut = createAstronaut();
const explorer = astronaut.root;
scene.add(explorer);
const pilot = new Pilot(explorer);
const chaseCamera = new ChaseCamera(camera, explorer);
const direction = new THREE.Vector3();
function placeExplorerInView() {
  camera.getWorldDirection(direction);
  explorer.position.copy(camera.position).addScaledVector(direction, 30);
  explorer.position.y -= 3;
  explorer.quaternion.copy(camera.quaternion);
}
const spaceDocuments = createDocuments(nodes, projects, $('#document-layer'), openDocument);
scene.add(spaceDocuments.group);
let selectedDocument = -1;
let nearestDocument = -1;

function closeDocument() {
  selectedDocument = -1;
  $('#document-panel').classList.add('hidden');
  if (location.hash.startsWith('#document=')) history.replaceState(null, '', location.pathname + location.search);
}
function openDocument(index) {
  if (flight) setFlight(false, false);
  closeDetail(); setUiHidden(false);
  selectedDocument = index;
  const doc = spaceDocuments.documents[index];
  $('#document-project').textContent = doc.project;
  $('#document-title').textContent = doc.title;
  $('#document-body').replaceChildren(...doc.body.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  $('#document-panel').classList.remove('hidden');
  history.replaceState(null, '', '#document=' + index);
}
$('#close-document').addEventListener('click', closeDocument);
scene.add(camera);
const streakPositions = new Float32Array(240 * 6);
const streakColors = new Float32Array(240 * 6);
const streaks = Array.from({ length: 240 }, (_, i) => {
  const angle = random() * Math.PI * 2;
  const radius = 16 + random() * 135;
  streakColors.set([0.52, 0.72, 1, 0.025, 0.05, 0.12], i * 6);
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -20 - random() * 230);
});
const streakGeometry = new THREE.BufferGeometry();
streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3).setUsage(THREE.DynamicDrawUsage));
streakGeometry.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));
const streakMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
const warpLines = new THREE.LineSegments(streakGeometry, streakMaterial);
warpLines.frustumCulled = false;
warpLines.renderOrder = 20;
camera.add(warpLines);
let warpAmount = 0;
const localVelocity = new THREE.Vector3();
const inverseView = new THREE.Quaternion();

function updateWarp(delta) {
  const strength = reducedMotion || !flight ? 0 : THREE.MathUtils.clamp((pilot.velocity.length() - 65) / 150, 0, 1);
  warpAmount = THREE.MathUtils.damp(warpAmount, strength, 9, delta);
  warpLines.visible = warpAmount > 0.01;
  if (!warpLines.visible) return;
  localVelocity.copy(pilot.velocity).applyQuaternion(inverseView.copy(camera.quaternion).invert()).normalize();
  const length = 5 + warpAmount * 35;
  streaks.forEach((point, i) => {
    point.z += delta * (50 + warpAmount * 200);
    if (point.z > -14) point.z -= 236;
    streakPositions.set([point.x, point.y, point.z, point.x + localVelocity.x * length, point.y + localVelocity.y * length, Math.min(-2, point.z + localVelocity.z * length)], i * 6);
  });
  streakGeometry.attributes.position.needsUpdate = true;
  streakMaterial.opacity = warpAmount * 0.8;
}

$('#note-count').textContent = format(NOTE_COUNT);
$('#project-count').textContent = projects.length;
$('#link-count').textContent = format(linkCount);
let selectedIndex = -1;
let currentFilter = 'all';
let flight = false;
let hadPointerLock = false;
let transition = null;
let hovering = false;
let elapsed = 0;
let toastTimer;
const clock = new THREE.Clock();

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2200);
}

function setFlight(active, announce = true) {
  flight = active;
  transition = null;
  controls.enabled = !flight;
  controls.autoRotate = !flight && $('#auto-rotate').checked;
  const button = $('#flight-button');
  button.setAttribute('aria-pressed', String(active));
  button.querySelector('use').setAttribute('href', active ? '#i-pause' : '#i-play');
  button.querySelector('span').textContent = active ? '둘러보기 종료' : '둘러보기 시작';
  $('#guide-action').textContent = active ? '행성·문서 표식 클릭: 내용 보기' : '화면 클릭: 둘러보기 시작';
  $('#guide-detail').textContent = active ? '빈 공간 클릭: 이동 · WASD: 이동 · Esc: 종료' : '드래그: 화면 회전 · 휠: 확대·축소';
  document.body.classList.toggle('piloting', active);
  $('#pilot-hud').classList.toggle('hidden', !active);
  renderer.domElement.style.cursor = active ? 'crosshair' : 'grab';
  if (active) {
    // Clear OrbitControls' residual damping before handing the camera to the pilot.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    if (camera.position.distanceTo(explorer.position) > 75 || camera.position.distanceTo(explorer.position) < 12 || camera.getWorldDirection(direction).dot(explorer.position.clone().sub(camera.position).normalize()) < 0.2) placeExplorerInView();
    pilot.start();
    closeDetail();
    closeDocument();
    renderer.domElement.focus({ preventScroll: true });
    if (announce) toast('WASD 이동 · Space 빠르게 이동 · Esc 종료');
  } else {
    pilot.stop();
    if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
    controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(85));
    controls.update();
  }
}

function startPiloting(event) {
  setFlight(true);
  if (event?.pointerType === 'touch' || !renderer.domElement.requestPointerLock) return;
  try {
    const request = renderer.domElement.requestPointerLock();
    request?.catch(() => { if (flight) toast('드래그로 방향 전환 · WASD 이동 · Esc 종료'); });
  } catch { toast('드래그로 방향 전환 · WASD 이동 · Esc 종료'); }
}

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  document.body.classList.toggle('pointer-locked', locked);
  if (locked && !flight) document.exitPointerLock();
  else if (hadPointerLock && !locked && flight) {
    setFlight(false, false);
    setUiHidden(false);
  }
  hadPointerLock = locked;
});
document.addEventListener('pointerlockerror', () => {
  if (flight) toast('드래그로 방향 전환 · WASD 이동 · Esc 종료');
});

function setUiHidden(hidden) {
  document.body.classList.toggle('ui-hidden', hidden);
  $('#restore-ui').classList.toggle('hidden', !hidden);
}
$('#restore-ui').addEventListener('click', () => setUiHidden(false));

function closeDetail() {
  selectedIndex = -1;
  $('#detail-panel').classList.add('hidden');
  selectionRing.visible = false;
  projectLabels.forEach(label => label.classList.remove('selected'));
}

function selectProject(index, move = false) {
  closeDocument();
  if (currentFilter === 'notes') setFilter('all');
  selectedIndex = index;
  const project = projects[index];
  $('#detail-panel').classList.remove('hidden');
  $('#detail-index').textContent = `${String(index + 1).padStart(2, '0')} / ${projects.length}`;
  $('#detail-name').textContent = project.name;
  $('#detail-description').textContent = project.description;
  $('#detail-notes').textContent = nodes.filter(node => node.group === index).length;
  $('#detail-links').textContent = projectLinkCounts[index];
  $('#detail-tags').replaceChildren(...project.tags.map(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    return span;
  }));
  projectLabels.forEach((label, i) => label.classList.toggle('selected', i === index));
  selectionRing.position.set(...project.position);
  selectionRing.scale.setScalar(project.radius * 1.6);
  selectionRing.visible = true;
  if (move) focusSelected();
}

function moveCamera(target, position) {
  if (flight) setFlight(false, false);
  controls.autoRotate = false;
  transition = { time: 0, fromCamera: camera.position.clone(), fromTarget: controls.target.clone(), toCamera: position.clone(), toTarget: target.clone() };
}

function focusSelected() {
  if (selectedIndex < 0) return;
  const project = projects[selectedIndex];
  const target = new THREE.Vector3(...project.position);
  const direction = camera.position.clone().sub(target).normalize();
  const position = target.clone().add(direction.multiplyScalar(project.radius * 5.5 + 30));
  moveCamera(target, position);
  toast(`${project.name}로 이동합니다`);
}

function setFilter(filter) {
  currentFilter = filter;
  const showProjects = filter !== 'notes';
  const showNotes = filter !== 'projects';
  projectGroup.visible = showProjects;
  notes.visible = showNotes;
  brightNotes.visible = showNotes && $('#note-halo').checked;
  links.visible = showNotes && $('#connections').checked;
  if (!showProjects) closeDetail();
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === filter);
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  });
  $('#map-filter-label').textContent = { all: '전체 자료', projects: '프로젝트', notes: '문서' }[filter];
  $('#visible-count').textContent = format((showProjects ? projects.length : 0) + (showNotes ? NOTE_COUNT : 0));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
$('#project-halo').addEventListener('change', event => haloMaterials.forEach(material => { material.opacity = event.target.checked ? 0.16 * glowLevel : 0; }));
$('#note-halo').addEventListener('change', event => {
  notes.material.uniforms.uHalo.value = event.target.checked ? 1 : 0;
  brightNotes.visible = event.target.checked && currentFilter !== 'projects';
});
$('#connections').addEventListener('change', event => { links.visible = event.target.checked && currentFilter !== 'projects'; });
let glowLevel = 1;
function updateGlow() {
  const value = Number($('#glow').value);
  glowLevel = value / 65;
  $('#glow-value').textContent = `${value}%`;
  $('#glow').style.setProperty('--fill', `${(value - 10) / 90 * 100}%`);
  notes.material.uniforms.uBrightness.value = 0.65 + glowLevel * 0.7;
  backgroundStars.material.uniforms.uBrightness.value = 0.45 + glowLevel * 0.3;
  haloMaterials.forEach(material => { material.opacity = $('#project-halo').checked ? 0.16 * glowLevel : 0; });
  brightMaterials.forEach(material => { material.opacity = 0.7 * glowLevel; });
}
$('#glow').addEventListener('input', updateGlow);
updateGlow();
function updateSpeed() {
  const value = Number($('#speed').value) / 10;
  $('#speed-value').textContent = `${value.toFixed(1)}×`;
  $('#speed').style.setProperty('--fill', `${(Number($('#speed').value) - 2) / 18 * 100}%`);
  controls.autoRotateSpeed = value;
}
$('#speed').addEventListener('input', updateSpeed);
updateSpeed();
$('#auto-rotate').addEventListener('change', event => { controls.autoRotate = event.target.checked && !flight && !transition; });
$('#panel-toggle').addEventListener('click', () => {
  const expanded = $('#panel-toggle').getAttribute('aria-expanded') === 'true';
  $('#panel-toggle').setAttribute('aria-expanded', String(!expanded));
  $('#panel-body').classList.toggle('hidden', expanded);
  $('.collapse-mark').textContent = expanded ? '+' : '−';
});
$('#flight-button').addEventListener('click', event => { if (flight) setFlight(false); else startPiloting(event); });
$('#focus-button').addEventListener('click', () => selectProject((selectedIndex + 1) % projects.length, true));
$('#detail-focus').addEventListener('click', focusSelected);
$('#close-detail').addEventListener('click', closeDetail);
$('#reset-button').addEventListener('click', () => {
  setUiHidden(false);
  closeDocument();
  if (flight) setFlight(false, false);
  closeDetail();
  setFilter('all');
  moveCamera(origin, initialCamera);
  toast('처음 위치로 돌아갑니다');
});
$('#fullscreen-button').addEventListener('click', async () => {
  document.body.classList.add('immersive');
  try {
    if (document.fullscreenEnabled && !document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch { /* The app view stays expanded when native fullscreen is unavailable. */ }
});
$('#exit-immersive').addEventListener('click', async () => {
  document.body.classList.remove('immersive');
  if (document.fullscreenElement) await document.exitFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) document.body.classList.remove('immersive');
});
$('#help-button').addEventListener('click', () => $('#help-popover').classList.toggle('hidden'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    setUiHidden(false);
    document.body.classList.remove('immersive');
    closeDetail();
    closeDocument();
    $('#help-popover').classList.add('hidden');
    if (flight) setFlight(false, false);
    return;
  }
  if (event.target.closest('input, textarea, select, [contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'KeyH' && !event.repeat) setUiHidden(!document.body.classList.contains('ui-hidden'));
  if (!flight || event.target.closest('button')) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'Space'].includes(event.code)) {
    event.preventDefault();
    pilot.press(event.code);
  } else if (event.code === 'KeyE' && !event.repeat) {
    event.preventDefault();
    pilot.travel(direction.set(0, 0, -1).applyQuaternion(explorer.quaternion), true);
  }
});
document.addEventListener('keyup', event => pilot.release(event.code));
window.addEventListener('blur', () => { if (flight) setFlight(false, false); });
// Using any overlay stops movement, including when a key is released outside the canvas.
document.addEventListener('pointerdown', event => {
  if (flight && event.target !== renderer.domElement && !event.target.closest('#flight-button')) setFlight(false, false);
}, true);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
let latestPointer = null;
function aim(event) {
  const rect = host.getBoundingClientRect();
  const locked = document.pointerLockElement === renderer.domElement;
  pointer.x = locked ? 0 : (event.clientX - rect.left) / rect.width * 2 - 1;
  pointer.y = locked ? 0 : -(event.clientY - rect.top) / rect.height * 2 + 1;
  camera.updateMatrixWorld();
  raycaster.setFromCamera(pointer, camera);
  const targets = projectGroup.visible ? [...pickTargets] : [];
  if (currentFilter !== 'projects') targets.push(...spaceDocuments.targets.filter(target => target.visible));
  return raycaster.intersectObjects(targets, false);
}
renderer.domElement.addEventListener('pointerdown', event => {
  pointerDown = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, button: event.button, distance: 0 };
  renderer.domElement.setPointerCapture(event.pointerId);
  if (transition) { transition = null; controls.autoRotate = $('#auto-rotate').checked; }
});
renderer.domElement.addEventListener('pointerup', event => {
  if (pointerDown?.button === 0 && pointerDown.distance < 5) {
    const hits = aim(event);
    const direction = raycaster.ray.direction.clone();
    if (!flight) {
      startPiloting(event);
      if (!hits.length) pilot.travel(direction);
    } else if (hits.length) {
      setFlight(false, false);
      setUiHidden(false);
      const { projectIndex, documentIndex } = hits[0].object.userData;
      if (documentIndex !== undefined) openDocument(documentIndex);
      else selectProject(projectIndex);
    } else {
      closeDetail();
      pilot.travel(direction);
      toast('선택한 방향으로 이동합니다 · WASD로 방향 변경');
    }
  }
  if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
  pointerDown = null;
});
renderer.domElement.addEventListener('pointermove', event => {
  latestPointer = { clientX: event.clientX, clientY: event.clientY };
  const locked = document.pointerLockElement === renderer.domElement;
  const dx = locked ? event.movementX : pointerDown ? event.clientX - pointerDown.lastX : 0;
  const dy = locked ? event.movementY : pointerDown ? event.clientY - pointerDown.lastY : 0;
  if (pointerDown) {
    pointerDown.distance += Math.hypot(dx, dy);
    pointerDown.lastX = event.clientX;
    pointerDown.lastY = event.clientY;
  }
  if (flight && (locked || pointerDown)) pilot.look(-dx, -dy);
});
renderer.domElement.addEventListener('pointerleave', () => { latestPointer = null; hovering = false; renderer.domElement.style.cursor = flight ? 'crosshair' : 'grab'; });
renderer.domElement.addEventListener('pointercancel', () => { pointerDown = null; });

let width = 1, height = 1;
function resize() {
  width = host.clientWidth;
  height = host.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(host);
resize();

let frameCount = 0, fpsTime = 0;
const projected = new THREE.Vector3();
function animate() {
  const frameDuration = clock.getDelta();
  const delta = Math.min(frameDuration, 0.05);
  elapsed += delta;
  if (transition) {
    transition.time += delta;
    const fraction = reducedMotion ? 1 : Math.min(1, transition.time / 1.8);
    const eased = fraction * fraction * (3 - 2 * fraction);
    camera.position.lerpVectors(transition.fromCamera, transition.toCamera, eased);
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
    if (fraction === 1) { transition = null; controls.autoRotate = $('#auto-rotate').checked; }
    controls.update(delta);
    placeExplorerInView();
  } else if (flight) {
    pilot.update(delta, Number($('#speed').value) / 10);
    chaseCamera.update(delta, pilot.velocity.length());
  } else controls.update(delta);

  astronaut.update(elapsed, pilot.velocity.length(), reducedMotion, delta);
  updateWarp(delta);
  nebula.position.copy(camera.position);
  backgroundStars.position.copy(camera.position);
  camera.updateMatrixWorld();
  explorer.updateMatrixWorld();
  linkMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
  linkMaterial.uniforms.uObserver.value.copy(flight ? explorer.position : camera.position);
  linkMaterial.uniforms.uNode.value = selectedDocument >= 0 ? spaceDocuments.documents[selectedDocument].nodeIndex : nearestDocument;
  linkMaterial.uniforms.uGroup.value = selectedIndex;
  nebulaMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
  notes.material.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
  backgroundStars.material.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
  pickTargets.forEach((mesh, index) => {
    if (!reducedMotion) mesh.rotation.y += delta * 0.012 * (index % 3 + 1);
    planetMaterials[index].uniforms.uTime.value = reducedMotion ? 0 : elapsed;
    projected.copy(mesh.position).project(camera);
    const label = projectLabels[index];
    const inFrame = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 0.91 && Math.abs(projected.y) < 0.8;
    const show = projectGroup.visible && inFrame && (index === selectedIndex || (currentFilter === 'projects' || index === 0 || index === 2 || index === 4 || index === 12));
    label.style.display = show ? 'flex' : 'none';
    if (show) {
      label.style.opacity = index === selectedIndex ? '1' : '0.67';
      label.style.transform = `translate(${(projected.x + 1) * width / 2 + 16}px,${(-projected.y + 1) * height / 2 + 10}px)`;
    }
  });
  if (selectionRing.visible) selectionRing.quaternion.copy(camera.quaternion);
  if (frameCount % 6 === 0 && !pointerDown) {
    nearestDocument = spaceDocuments.update(camera, camera.position, currentFilter !== 'projects' && !document.body.classList.contains('ui-hidden'), projectGroup.visible ? pickTargets : [], explorer);
    if (latestPointer || document.pointerLockElement === renderer.domElement) {
      const hits = aim(latestPointer);
      hovering = hits.length > 0;
      renderer.domElement.style.cursor = hovering ? 'pointer' : flight ? 'crosshair' : 'grab';
      $('#reticle').classList.toggle('on-target', hovering);
      const hitData = hits[0]?.object.userData;
      $('#aim-name').textContent = flight && hovering ? hitData.documentIndex !== undefined ? spaceDocuments.documents[hitData.documentIndex].title : projects[hitData.projectIndex].name : '';
    }
    if (flight) {
      $('#pilot-status').textContent = pilot.diving ? '앞으로 짧게 이동' : pilot.keys.has('Space') ? '빠르게 이동' : pilot.destination ? '선택한 방향으로 이동' : '둘러보는 중';
      $('#pilot-speed').textContent = Math.round(pilot.velocity.length());
    }
  }
  renderer.render(scene, camera);
  frameCount++;
  fpsTime += frameDuration;
  if (fpsTime >= 0.8) {
    $('#fps').textContent = Math.round(frameCount / fpsTime);
    frameCount = 0;
    fpsTime = 0;
  }
}
const requestedDocument = /^#document=(\d+)$/.exec(location.hash);
const restoreDocument = requestedDocument ? Number(requestedDocument[1]) : -1;
if (restoreDocument >= 0 && restoreDocument < spaceDocuments.documents.length) openDocument(restoreDocument);
controls.update();
placeExplorerInView();
renderer.render(scene, camera);
$('#loading').classList.add('hidden');
renderer.setAnimationLoop(animate);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (flight) setFlight(false, false); renderer.setAnimationLoop(null); }
  else { clock.getDelta(); renderer.setAnimationLoop(animate); }
});
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  renderer.setAnimationLoop(null);
  $('#render-error').classList.remove('hidden');
  $('#error-message').textContent = '그래픽 연결이 중단되었습니다. 새로고침하면 우주를 다시 열 수 있습니다.';
});
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
