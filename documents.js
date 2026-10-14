import * as THREE from './vendor/three.module.js';

export function createDocuments(nodes, projects, layer, openDocument) {
  const group = new THREE.Group();
  const cards = [], targets = [];
  const titles = ['방향을 정하는 작은 기준', '관찰에서 발견한 연결', '다음 실험을 위한 질문'];
  const excerpts = [
    '작은 선택에도 같은 방향이 담기도록. 모아 둔 기록에서 반복되는 감각과 기준을 찾아봅니다.',
    '흩어진 메모 두 개가 만날 때 새로운 맥락이 생깁니다. 아직 이름 붙이지 못한 연결도 남겨둡니다.',
    '완성된 답보다 지금 검증할 수 있는 질문 하나. 다음 시도에서 확인할 내용을 짧게 기록합니다.',
  ];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  context.strokeStyle = '#b1e5e8'; context.lineWidth = 2;
  context.beginPath(); context.moveTo(20, 12); context.lineTo(36, 12); context.lineTo(45, 21); context.lineTo(45, 51); context.lineTo(20, 51); context.closePath(); context.stroke();
  context.beginPath(); context.moveTo(36, 12); context.lineTo(36, 22); context.lineTo(45, 22); context.stroke();
  for (let y = 30; y < 45; y += 6) { context.beginPath(); context.moveTo(26, y); context.lineTo(38, y); context.stroke(); }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const documents = nodes.slice(0, projects.length * 3).map((node, index) => {
    const chapter = Math.floor(index / projects.length);
    const project = projects[node.group];
    const data = { nodeIndex: index, group: node.group, position: node.position, title: `${project.name} · ${titles[chapter]}`, excerpt: excerpts[chapter], project: project.name,
      body: [project.description, excerpts[chapter], '관찰한 장면과 관련된 생각을 함께 기록하고, 가까운 문서의 연결을 따라 다음 아이디어를 찾아봅니다. 이 문서는 공간 탐색을 위한 샘플 콘텐츠입니다.'] };
    const material = new THREE.SpriteMaterial({ map, color: 0xc0eff3, transparent: true, opacity: 0.7, depthWrite: false });
    const marker = new THREE.Sprite(material); marker.position.copy(node.position); marker.scale.setScalar(3.2);
    marker.userData.documentIndex = index; group.add(marker); targets.push(marker);
    const card = document.createElement('button'); card.className = 'space-document'; card.hidden = true;
    const meta = document.createElement('span'); meta.className = 'document-meta'; meta.textContent = `문서 ${String(index + 1).padStart(2, '0')} / ${project.name}`;
    const title = document.createElement('strong'); title.textContent = titles[chapter];
    const excerpt = document.createElement('span'); excerpt.className = 'document-excerpt'; excerpt.textContent = data.excerpt;
    const foot = document.createElement('span'); foot.className = 'document-foot'; foot.textContent = '샘플 문서 · 클릭하여 읽기 ↗';
    card.append(meta, title, excerpt, foot); card.setAttribute('aria-label', `${data.title} 문서 읽기`);
    card.addEventListener('click', () => openDocument(index)); layer.appendChild(card); cards.push(card);
    return data;
  });
  const projected = new THREE.Vector3(), sight = new THREE.Vector3();
  const occlusion = new THREE.Raycaster();
  const avatarBounds = new THREE.Box3();
  const panels = ['#control-panel', '#detail-panel', '#document-panel', '#pilot-hud', '.explorer-badge', '#help-popover', '.scene-caption', '.pilot-guide'].map(selector => document.querySelector(selector)).filter(Boolean);
  const states = cards.map(() => ({ near: false, sizes: [null, null], transform: '', opacity: '' }));
  let width = 0, height = 0;
  const invalidateSizes = () => { for (const state of states) state.sizes = [null, null]; };
  window.addEventListener('resize', invalidateSizes);
  document.fonts?.ready.then(invalidateSizes);
  document.fonts?.addEventListener('loadingdone', invalidateSizes);
  function setNear(index, near) {
    if (states[index].near === near) return;
    cards[index].classList.toggle('near', near);
    states[index].near = near;
  }
  return {
    group, targets, documents,
    update(camera, observer, visible, planets, avatar) {
      if (!visible) {
        cards.forEach((card, index) => {
          if (!card.hidden) card.hidden = true;
          targets[index].visible = false;
        });
        return -1;
      }
      const bounds = layer.getBoundingClientRect();
      if (bounds.width !== width || bounds.height !== height) {
        width = bounds.width; height = bounds.height;
        invalidateSizes();
      }
      const occupied = [];
      // Document cards must never cover the third-person subject.
      avatarBounds.setFromObject(avatar);
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const x of [avatarBounds.min.x, avatarBounds.max.x]) {
        for (const y of [avatarBounds.min.y, avatarBounds.max.y]) {
          for (const z of [avatarBounds.min.z, avatarBounds.max.z]) {
            projected.set(x, y, z).project(camera);
            if (projected.z < -1 || projected.z > 1) continue;
            const px = (projected.x + 1) * bounds.width / 2, py = (1 - projected.y) * bounds.height / 2;
            left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
          }
        }
      }
      if (Number.isFinite(left)) occupied.push({ x: left - 8, y: top - 8, w: right - left + 16, h: bottom - top + 16 });
      for (const element of panels) {
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        occupied.push({ x: box.left - bounds.left - 10, y: box.top - bounds.top - 10, w: box.width + 20, h: box.height + 20 });
      }
      const candidates = [];
      documents.forEach((doc, index) => {
        const distance = observer.distanceTo(doc.position);
        targets[index].visible = distance < 155;
        if (distance > 125 || distance < 8) return;
        projected.copy(doc.position).project(camera);
        if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 0.96 || Math.abs(projected.y) > 0.85) return;
        candidates.push({ index, distance, near: distance < 82, x: (projected.x + 1) * bounds.width / 2 + 16, y: (1 - projected.y) * bounds.height / 2 - 16 });
      });
      candidates.sort((a, b) => a.distance - b.distance);
      // Measure each card size only once per detail level and layout/font change.
      // Batch temporary writes before reads; nothing is painted between these steps.
      const unmeasured = candidates.filter(({ index, near }) => !states[index].sizes[Number(near)]);
      for (const { index, near } of unmeasured) {
        const card = cards[index];
        card.style.visibility = 'hidden';
        setNear(index, near);
        if (card.hidden) card.hidden = false;
      }
      for (const { index, near } of unmeasured) {
        const card = cards[index];
        states[index].sizes[Number(near)] = { w: card.offsetWidth, h: card.offsetHeight };
      }
      const shown = new Map();
      let nearest = -1;
      for (const candidate of candidates) {
        if (shown.size >= (bounds.width < 600 ? 2 : 4)) break;
        const { index, near } = candidate;
        sight.subVectors(documents[index].position, camera.position);
        occlusion.far = sight.length() - 1;
        occlusion.set(camera.position, sight.normalize());
        if (occlusion.intersectObjects(planets, false).length) continue;
        const { w, h } = states[index].sizes[Number(near)];
        const x = THREE.MathUtils.clamp(candidate.x, 12, bounds.width - w - 12);
        const y = candidate.y;
        if (y < 34 || y + h > bounds.height - 143 || occupied.some(box => x < box.x + box.w && x + w > box.x && y < box.y + box.h && y + h > box.y)) continue;
        shown.set(index, { ...candidate, x, y });
        occupied.push({ x: x - 12, y: y - 10, w: w + 24, h: h + 20 });
        if (nearest < 0) nearest = index;
      }
      cards.forEach((card, index) => {
        const next = shown.get(index), state = states[index];
        if (card.hidden !== !next) card.hidden = !next;
        if (!next) return;
        setNear(index, next.near);
        const transform = `translate(${next.x}px,${next.y}px)`;
        const opacity = String(THREE.MathUtils.smoothstep(140 - next.distance, 15, 45));
        if (state.transform !== transform) { card.style.transform = transform; state.transform = transform; }
        if (state.opacity !== opacity) { card.style.opacity = opacity; state.opacity = opacity; }
      });
      for (const { index } of unmeasured) cards[index].style.visibility = '';
      return nearest;
    },
  };
}
