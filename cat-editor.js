// Existing timeline editor, adapted to the assembled cat's part groups.
export function mountCatEditor({ character: robot, groups, stop: pauseAnimations, headFollowers = [] }) {
const ANIMATION_EDITOR_ENABLED = true;
const gsap = window.gsap;
const partElements = Object.fromEntries(groups);
partElements.robot = robot;
const PART_NAMES = Object.keys(partElements);
const ROBOT_CONFIG = Object.fromEntries(PART_NAMES.map(name => {
 const el = partElements[name];
 const [x, y] = getComputedStyle(el).transformOrigin.split(' ').map(parseFloat);
 return [name, { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1,
  left: 0, top: 0, width: 440, transformOrigin: `${x / 440 * 100}% ${y / 475 * 100}%` }];
}));
function splitTransformOrigin(value) { const [x,y] = value.split(' ').map(parseFloat); return {x,y}; }
function joinTransformOrigin(x,y) { return `${x}% ${y}%`; }
const ANIMATION_STORAGE_KEY = 'popaAnimationEditorDataV2';
const EDITOR_FIELDS = ['x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'transformOriginX', 'transformOriginY'];
const EASE_OPTIONS = [
  'none',
  'linear',
  'sine.in',
  'sine.out',
  'sine.inOut',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'back.out',
  'elastic.out',
];
const DEFAULT_ANIMATION_DATA = { idle: { name: 'Popa', duration: 2, loop: true, keyframes: [] } };
const ANIMATION_DATA = loadAnimationData();

let animationEditor;
let animationPanelBody;
let selectedAnimationKey = Object.keys(ANIMATION_DATA)[0] || 'idle';
let editorSelectedPart = 'head';
let selectedKeyframeId = null;
let copiedKeyframe = null;
let editorCurrentTime = 0;
let editorZoom = 1;
let editorIsPlaying = false;
let editorRecordMode = false;
let editorOnionSkin = false;
let editorRafId = null;
let editorPlayStart = 0;
let editorPlayStartTime = 0;
const editorInputs = new Map();
const onionLayer = document.createElement('div');
const currentEditorValues = {};

function getCurrentAnimation() {
  return ANIMATION_DATA[selectedAnimationKey];
}

function makeAnimationKey(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'animation';
  let key = base;
  let index = 2;
  while (ANIMATION_DATA[key]) {
    key = `${base}-${index}`;
    index += 1;
  }
  return key;
}

function makeKeyframeId() {
  return `kf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getBaseTransform(partName) {
  const config = ROBOT_CONFIG[partName];
  const origin = splitTransformOrigin(config.transformOrigin);
  return {
    x: config.x || 0,
    y: config.y || 0,
    rotate: config.rotate || 0,
    scale: config.scale ?? 1,
    scaleX: config.scaleX ?? 1,
    scaleY: config.scaleY ?? 1,
    opacity: 1,
    transformOriginX: origin.x,
    transformOriginY: origin.y,
  };
}

function getPartValues(partName) {
  return { ...getBaseTransform(partName), ...(currentEditorValues[partName] || {}) };
}

function setPartValues(partName, values) {
  currentEditorValues[partName] = { ...getPartValues(partName), ...values };
  applyEditorValues(partName, currentEditorValues[partName]);
}

function applyEditorValues(partName, values) {
  const element = partElements[partName];
  gsap.set(partName === 'head' ? [element, ...headFollowers] : element, {
    x: values.x,
    y: values.y,
    rotate: values.rotate,
    scale: values.scale,
    scaleX: values.scaleX,
    scaleY: values.scaleY,
    opacity: values.opacity,
    transformOrigin: joinTransformOrigin(values.transformOriginX, values.transformOriginY),
    overwrite: 'auto',
  });
}

function syncEditorValuesFromBase() {
  PART_NAMES.forEach((partName) => {
    currentEditorValues[partName] = getBaseTransform(partName);
  });
}

// ==================================================
// localStorage
// ==================================================
function loadAnimationData() {
  try {
    const saved = localStorage.getItem(ANIMATION_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn('Could not load animation data from localStorage.', error);
  }
  return structuredClone(DEFAULT_ANIMATION_DATA);
}

function saveAnimationData() {
  localStorage.setItem(ANIMATION_STORAGE_KEY, JSON.stringify(ANIMATION_DATA));
}

function clearSavedAnimationData() {
  if (!confirm('Clear saved animation data from this browser?')) return;
  localStorage.removeItem(ANIMATION_STORAGE_KEY);
  Object.keys(ANIMATION_DATA).forEach((key) => delete ANIMATION_DATA[key]);
  Object.assign(ANIMATION_DATA, structuredClone(DEFAULT_ANIMATION_DATA));
  selectedAnimationKey = 'idle';
  selectedKeyframeId = null;
  editorCurrentTime = 0;
  renderAnimationEditor();
  previewAtTime(editorCurrentTime);
}

// ==================================================
// timeline rendering
// ==================================================
function createAnimationEditor() {
  document.body.classList.add('animation-editor-enabled');
  animationEditor = document.createElement('aside');
  animationEditor.className = 'animation-editor';
  animationEditor.innerHTML = `
    <div class="animation-editor__header">
      <h2>Animation Editor</h2>
      <button type="button" data-editor-action="togglePanel">Hide</button>
    </div>
    <div class="animation-editor__body"></div>
  `;
  document.body.appendChild(animationEditor);
  animationPanelBody = animationEditor.querySelector('.animation-editor__body');
  animationEditor.addEventListener('click', handleAnimationEditorClick);
  animationEditor.addEventListener('input', handleAnimationEditorInput);
  animationEditor.addEventListener('change', handleAnimationEditorChange);
  window.addEventListener('keydown', handleAnimationEditorKeyboard);
  window.addEventListener('resize', renderTimelineMarkers);
  onionLayer.className = 'onion-layer';
  robot.appendChild(onionLayer);
  renderAnimationEditor();
}

function renderAnimationEditor() {
  const animation = getCurrentAnimation();
  animationPanelBody.innerHTML = `
    <section class="editor-section">
      <h3>Animation <span class="recording-indicator ${editorRecordMode ? 'is-recording' : ''}">RECORDING</span></h3>
      <label>Animation
        <select data-editor="animationSelect">
          ${Object.entries(ANIMATION_DATA).map(([key, data]) => `<option value="${key}" ${key === selectedAnimationKey ? 'selected' : ''}>${data.name || key}</option>`).join('')}
        </select>
      </label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="newAnimation">New Animation</button>
        <button type="button" data-editor-action="renameAnimation">Rename Animation</button>
        <button type="button" data-editor-action="deleteAnimation">Delete Animation</button>
        <button type="button" data-editor-action="duplicateAnimation">Duplicate Animation</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Timeline</h3>
      <div class="timeline-readout"><span data-editor="timeDisplay">${editorCurrentTime.toFixed(2)}s</span> / ${animation.duration.toFixed(2)}s</div>
      <div class="timeline" data-editor="timeline">
        <div class="timeline-ruler" data-editor="ruler"></div>
        <div class="timeline-markers" data-editor="markers"></div>
        <div class="timeline-playhead" data-editor="playhead"></div>
      </div>
      <div class="editor-grid">
        <label>Duration <input type="number" step="0.1" min="0.1" value="${animation.duration}" data-editor="duration" /></label>
        <label>Zoom <input type="range" min="1" max="5" step="0.25" value="${editorZoom}" data-editor="zoom" /></label>
        <label class="editor-check"><input type="checkbox" ${animation.loop ? 'checked' : ''} data-editor="loop" /> Loop</label>
      </div>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="play">Play</button>
        <button type="button" data-editor-action="pause">Pause</button>
        <button type="button" data-editor-action="stop">Stop</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Part</h3>
      <label>Selected part
        <select data-editor="partSelect">
          ${PART_NAMES.map((partName) => `<option value="${partName}" ${partName === editorSelectedPart ? 'selected' : ''}>${partName}</option>`).join('')}
        </select>
      </label>
    </section>
    <section class="editor-section">
      <h3>Transform</h3>
      <label>Ease
        <select data-editor="ease">
          ${EASE_OPTIONS.map((ease) => `<option value="${ease}">${ease}</option>`).join('')}
        </select>
      </label>
      <div class="transform-fields" data-editor="transformFields"></div>
    </section>
    <section class="editor-section">
      <h3>Keyframes</h3>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="addKeyframe">Add Keyframe</button>
        <button type="button" data-editor-action="updateKeyframe">Update Keyframe</button>
        <button type="button" data-editor-action="deleteKeyframe">Delete Keyframe</button>
        <button type="button" data-editor-action="copyKeyframe">Copy Keyframe</button>
        <button type="button" data-editor-action="pasteKeyframe">Paste Keyframe</button>
      </div>
      <div class="keyframe-list" data-editor="keyframeList"></div>
    </section>
    <section class="editor-section">
      <h3>Preview</h3>
      <label class="editor-check"><input type="checkbox" ${editorRecordMode ? 'checked' : ''} data-editor="record" /> Record Mode</label>
      <label class="editor-check"><input type="checkbox" ${editorOnionSkin ? 'checked' : ''} data-editor="onion" /> Onion Skin</label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="resetPart">Reset Current Part to Base Pose</button>
        <button type="button" data-editor-action="resetFrame">Reset Entire Frame to Base Pose</button>
        <button type="button" data-editor-action="clearAnimation">Clear Current Animation</button>
      </div>
    </section>
    <section class="editor-section">
      <h3>Import / Export</h3>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="copyJson">Copy Animation JSON</button>
        <button type="button" data-editor-action="copyGsap">Copy GSAP Code</button>
        <button type="button" data-editor-action="downloadJson">Download Animation JSON</button>
        <button type="button" data-editor-action="importJson">Import Animation JSON</button>
        <button type="button" data-editor-action="clearSaved">Clear Saved Animation Data</button>
      </div>
      <textarea data-editor="importText" placeholder="Paste animation JSON here to import"></textarea>
    </section>
  `;
  renderTransformControls();
  renderTimelineRuler();
  renderTimelineMarkers();
  renderKeyframeList();
  updatePlayhead();
  updateSelectedHighlightForEditor();
}

function renderTransformControls() {
  const fields = animationPanelBody.querySelector('[data-editor="transformFields"]');
  fields.innerHTML = '';
  editorInputs.clear();
  const values = getPartValues(editorSelectedPart);
  EDITOR_FIELDS.forEach((field) => {
    const label = document.createElement('label');
    label.textContent = field;
    const number = document.createElement('input');
    number.type = 'number';
    number.step = field.includes('scale') || field.includes('Origin') || field === 'opacity' ? '0.01' : '1';
    number.value = values[field];
    number.dataset.editorTransform = field;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = number.step;
    slider.min = field === 'opacity' ? 0 : field.includes('scale') ? 0 : field.includes('Origin') ? 0 : -300;
    slider.max = field === 'opacity' ? 1 : field.includes('scale') ? 3 : field.includes('Origin') ? 100 : 300;
    slider.value = values[field];
    slider.dataset.editorTransform = field;
    label.append(number, slider);
    fields.appendChild(label);
    editorInputs.set(field, [number, slider]);
  });
}

function renderTimelineRuler() {
  const ruler = animationPanelBody.querySelector('[data-editor="ruler"]');
  const animation = getCurrentAnimation();
  const ticks = Math.max(2, Math.ceil(animation.duration * editorZoom));
  ruler.innerHTML = Array.from({ length: ticks + 1 }, (_, index) => {
    const time = (animation.duration / ticks) * index;
    return `<span style="left:${(index / ticks) * 100}%">${time.toFixed(1)}</span>`;
  }).join('');
}

function renderTimelineMarkers() {
  if (!animationPanelBody) return;
  const markers = animationPanelBody.querySelector('[data-editor="markers"]');
  if (!markers) return;
  const animation = getCurrentAnimation();
  markers.innerHTML = animation.keyframes.map((keyframe) => {
    const left = (keyframe.time / animation.duration) * 100;
    return `<button type="button" class="timeline-marker ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}" data-keyframe-id="${keyframe.id}" style="left:${left}%" title="${keyframe.part} ${keyframe.time.toFixed(2)}s"></button>`;
  }).join('');
}

function updatePlayhead() {
  if (!animationPanelBody) return;
  const animation = getCurrentAnimation();
  const playhead = animationPanelBody.querySelector('[data-editor="playhead"]');
  const timeDisplay = animationPanelBody.querySelector('[data-editor="timeDisplay"]');
  if (playhead) playhead.style.left = `${(editorCurrentTime / animation.duration) * 100}%`;
  if (timeDisplay) timeDisplay.textContent = `${editorCurrentTime.toFixed(2)}s`;
}

// ==================================================
// keyframe editing
// ==================================================
function getEditableValuesForSelectedPart() {
  const values = getPartValues(editorSelectedPart);
  return EDITOR_FIELDS.reduce((acc, field) => {
    acc[field] = Number(values[field]);
    return acc;
  }, {});
}

function findKeyframeAt(partName, time) {
  return getCurrentAnimation().keyframes.find((keyframe) => keyframe.part === partName && Math.abs(keyframe.time - time) < 0.001);
}

function upsertKeyframe() {
  const animation = getCurrentAnimation();
  const existing = findKeyframeAt(editorSelectedPart, editorCurrentTime);
  const ease = animationPanelBody.querySelector('[data-editor="ease"]')?.value || 'sine.inOut';
  const data = {
    id: existing?.id || makeKeyframeId(),
    time: Number(editorCurrentTime.toFixed(3)),
    part: editorSelectedPart,
    values: getEditableValuesForSelectedPart(),
    ease,
  };
  if (existing) Object.assign(existing, data);
  else animation.keyframes.push(data);
  selectedKeyframeId = data.id;
  sortKeyframes(animation);
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function updateSelectedKeyframe() {
  const keyframe = getSelectedKeyframe();
  if (!keyframe) return upsertKeyframe();
  keyframe.time = Number(editorCurrentTime.toFixed(3));
  keyframe.part = editorSelectedPart;
  keyframe.values = getEditableValuesForSelectedPart();
  keyframe.ease = animationPanelBody.querySelector('[data-editor="ease"]')?.value || keyframe.ease;
  sortKeyframes(getCurrentAnimation());
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function deleteSelectedKeyframe() {
  const animation = getCurrentAnimation();
  animation.keyframes = animation.keyframes.filter((keyframe) => keyframe.id !== selectedKeyframeId);
  selectedKeyframeId = null;
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function copySelectedKeyframe() {
  const keyframe = getSelectedKeyframe();
  if (keyframe) copiedKeyframe = structuredClone(keyframe);
}

function pasteKeyframe() {
  if (!copiedKeyframe) return;
  const clone = structuredClone(copiedKeyframe);
  clone.id = makeKeyframeId();
  clone.time = Number(editorCurrentTime.toFixed(3));
  clone.part = editorSelectedPart;
  getCurrentAnimation().keyframes.push(clone);
  selectedKeyframeId = clone.id;
  sortKeyframes(getCurrentAnimation());
  saveAnimationData();
  renderTimelineMarkers();
  renderKeyframeList();
}

function getSelectedKeyframe() {
  return getCurrentAnimation().keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);
}

function sortKeyframes(animation) {
  animation.keyframes.sort((a, b) => a.time - b.time || a.part.localeCompare(b.part));
}

function selectKeyframe(id) {
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === id);
  if (!keyframe) return;
  selectedKeyframeId = id;
  editorCurrentTime = keyframe.time;
  editorSelectedPart = keyframe.part;
  setPartValues(editorSelectedPart, keyframe.values);
  renderAnimationEditor();
  previewAtTime(editorCurrentTime);
}

function renderKeyframeList() {
  const list = animationPanelBody.querySelector('[data-editor="keyframeList"]');
  const grouped = PART_NAMES.map((partName) => {
    const keyframes = getCurrentAnimation().keyframes.filter((keyframe) => keyframe.part === partName);
    if (!keyframes.length) return '';
    return `<div class="keyframe-group"><strong>${partName}</strong>${keyframes.map((keyframe) => `<button type="button" class="keyframe-item ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}" data-keyframe-id="${keyframe.id}">${keyframe.time.toFixed(2)}s · ${keyframe.ease}</button>`).join('')}</div>`;
  }).join('');
  list.innerHTML = grouped || '<p class="empty-state">No keyframes yet.</p>';
}

// ==================================================
// preview interpolation
// ==================================================
function easeRatio(easeName, ratio) {
  if (easeName === 'none') return ratio >= 1 ? 1 : 0;
  const ease = gsap.parseEase(easeName === 'linear' ? 'none' : easeName) || gsap.parseEase('none');
  return ease(ratio);
}

function interpolateValues(fromValues, toValues, ratio, easeName) {
  const eased = easeRatio(easeName, ratio);
  const output = {};
  EDITOR_FIELDS.forEach((field) => {
    const from = Number(fromValues[field] ?? 0);
    const to = Number(toValues[field] ?? from);
    output[field] = from + (to - from) * eased;
  });
  return output;
}

function getPoseForPartAtTime(partName, time) {
  const animation = getCurrentAnimation();
  const partKeyframes = animation.keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
  if (!partKeyframes.length) return getBaseTransform(partName);
  if (partKeyframes.length === 1) return partKeyframes[0].values;
  if (time <= partKeyframes[0].time) {
    if (!animation.loop) return partKeyframes[0].values;
    const previous = partKeyframes.at(-1);
    const span = animation.duration - previous.time + partKeyframes[0].time;
    const ratio = span ? (time + animation.duration - previous.time) / span : 1;
    return interpolateValues(previous.values, partKeyframes[0].values, ratio, partKeyframes[0].ease);
  }
  for (let index = 1; index < partKeyframes.length; index += 1) {
    const previous = partKeyframes[index - 1];
    const next = partKeyframes[index];
    if (time <= next.time) {
      const ratio = (time - previous.time) / (next.time - previous.time || 1);
      return interpolateValues(previous.values, next.values, ratio, next.ease);
    }
  }
  if (!animation.loop) return partKeyframes.at(-1).values;
  const previous = partKeyframes.at(-1);
  const next = partKeyframes[0];
  const span = animation.duration - previous.time + next.time;
  const ratio = span ? (time - previous.time) / span : 1;
  return interpolateValues(previous.values, next.values, ratio, next.ease);
}

function previewAtTime(time) {
  const animation = getCurrentAnimation();
  editorCurrentTime = Math.max(0, Math.min(animation.duration, time));
  PART_NAMES.forEach((partName) => {
    const values = getPoseForPartAtTime(partName, editorCurrentTime);
    currentEditorValues[partName] = { ...values };
    applyEditorValues(partName, values);
  });
  refreshEditorTransformInputs();
  updatePlayhead();
  renderOnionSkin();
}

function refreshEditorTransformInputs() {
  if (!editorInputs.size) return;
  const values = getPartValues(editorSelectedPart);
  editorInputs.forEach((inputs, field) => inputs.forEach((input) => { input.value = values[field]; }));
}

// ==================================================
// playback
// ==================================================
function playEditorAnimation() {
  pauseAnimations();
  editorIsPlaying = true;
  editorPlayStart = performance.now();
  editorPlayStartTime = editorCurrentTime;
  cancelAnimationFrame(editorRafId);
  editorRafId = requestAnimationFrame(tickEditorPlayback);
}

function tickEditorPlayback(now) {
  if (!editorIsPlaying) return;
  const animation = getCurrentAnimation();
  const elapsed = (now - editorPlayStart) / 1000;
  let nextTime = editorPlayStartTime + elapsed;
  if (animation.loop) nextTime %= animation.duration;
  if (!animation.loop && nextTime >= animation.duration) {
    nextTime = animation.duration;
    pauseEditorAnimation();
  }
  previewAtTime(nextTime);
  if (editorIsPlaying) editorRafId = requestAnimationFrame(tickEditorPlayback);
}

function pauseEditorAnimation() {
  editorIsPlaying = false;
  cancelAnimationFrame(editorRafId);
}

function stopEditorAnimation() {
  pauseEditorAnimation();
  previewAtTime(0);
}

// ==================================================
// onion skin
// ==================================================
function renderOnionSkin() {
  onionLayer.innerHTML = '';
  if (!editorOnionSkin) return;
  const animation = getCurrentAnimation();
  const keyframes = animation.keyframes.filter((keyframe) => keyframe.part === editorSelectedPart).sort((a, b) => a.time - b.time);
  const previous = [...keyframes].reverse().find((keyframe) => keyframe.time < editorCurrentTime) || (animation.loop ? keyframes.at(-1) : null);
  const next = keyframes.find((keyframe) => keyframe.time > editorCurrentTime) || (animation.loop ? keyframes[0] : null);
  [previous, next].filter(Boolean).forEach((keyframe, index) => {
    const source = partElements[keyframe.part];
    const clone = source.cloneNode(true);
    clone.className = 'onion-clone';
    clone.style.opacity = index === 0 ? '0.25' : '0.18';
    onionLayer.appendChild(clone);
    gsap.set(clone, {
      position: 'absolute',
      left: ROBOT_CONFIG[keyframe.part].left,
      top: ROBOT_CONFIG[keyframe.part].top,
      width: ROBOT_CONFIG[keyframe.part].width,
      zIndex: 50 + index,
      x: keyframe.values.x,
      y: keyframe.values.y,
      rotate: keyframe.values.rotate,
      scale: keyframe.values.scale,
      scaleX: keyframe.values.scaleX,
      scaleY: keyframe.values.scaleY,
      transformOrigin: joinTransformOrigin(keyframe.values.transformOriginX, keyframe.values.transformOriginY),
    });
  });
}

// ==================================================
// import/export
// ==================================================
function formatAnimationJson() {
  return `const ANIMATION_DATA = ${JSON.stringify(ANIMATION_DATA, null, 2).replace(/"([^"\\]+)":/g, '$1:')};`;
}

function buildGsapCode() {
  const animation = getCurrentAnimation();
  const functionName = `build${(animation.name || selectedAnimationKey).replace(/[^a-z0-9]/gi, '')}Timeline`;
  const lines = [`function ${functionName}() {`, `  const timeline = gsap.timeline({ repeat: ${animation.loop ? -1 : 0} });`, ''];
  animation.keyframes.forEach((keyframe) => {
    const values = { ...keyframe.values };
    delete values.transformOriginX;
    delete values.transformOriginY;
    values.transformOrigin = joinTransformOrigin(keyframe.values.transformOriginX, keyframe.values.transformOriginY);
    values.duration = keyframe.time;
    if (keyframe.ease !== 'none') values.ease = keyframe.ease;
    lines.push(`  timeline.to(partElements.${keyframe.part}, ${JSON.stringify(values, null, 4)}, ${keyframe.time});`);
  });
  lines.push('', '  return timeline;', '}');
  return lines.join('\n');
}

async function copyText(text) {
  console.log(text);
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.warn('Clipboard copy failed; output was logged to console.', error);
  }
}

function downloadAnimationJson() {
  const blob = new Blob([JSON.stringify(ANIMATION_DATA, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'robot-animation-data.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importAnimationJson() {
  const text = animationPanelBody.querySelector('[data-editor="importText"]').value.trim();
  if (!text) return;
  const cleaned = text.replace(/^const\s+ANIMATION_DATA\s*=\s*/, '').replace(/;$/, '');
  const parsed = JSON.parse(cleaned);
  Object.keys(ANIMATION_DATA).forEach((key) => delete ANIMATION_DATA[key]);
  Object.assign(ANIMATION_DATA, parsed);
  selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
  saveAnimationData();
  renderAnimationEditor();
  previewAtTime(0);
}

function clearCurrentAnimation() {
  if (!confirm('Clear all keyframes in the current animation?')) return;
  getCurrentAnimation().keyframes = [];
  selectedKeyframeId = null;
  saveAnimationData();
  renderAnimationEditor();
  previewAtTime(0);
}

function resetCurrentPartToBase() {
  setPartValues(editorSelectedPart, getBaseTransform(editorSelectedPart));
  refreshEditorTransformInputs();
  if (editorRecordMode) upsertKeyframe();
}

function resetEntireFrameToBase() {
  PART_NAMES.forEach((partName) => setPartValues(partName, getBaseTransform(partName)));
  refreshEditorTransformInputs();
  renderOnionSkin();
}

function updateSelectedHighlightForEditor() {
  PART_NAMES.forEach((partName) => partElements[partName].classList.toggle('animation-selected', partName === editorSelectedPart));
}

function setTimelineTimeFromPointer(event) {
  const timeline = animationPanelBody.querySelector('[data-editor="timeline"]');
  const rect = timeline.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  previewAtTime(ratio * getCurrentAnimation().duration);
}

function handleMarkerDrag(marker, pointerDownEvent) {
  pointerDownEvent.preventDefault();
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === marker.dataset.keyframeId);
  const move = (event) => {
    const timeline = animationPanelBody.querySelector('[data-editor="timeline"]');
    const rect = timeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    keyframe.time = Number((ratio * getCurrentAnimation().duration).toFixed(3));
    selectedKeyframeId = keyframe.id;
    editorCurrentTime = keyframe.time;
    sortKeyframes(getCurrentAnimation());
    renderTimelineMarkers();
    renderKeyframeList();
    updatePlayhead();
  };
  const up = () => {
    saveAnimationData();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function handleAnimationEditorClick(event) {
  const actionButton = event.target.closest('[data-editor-action]');
  const marker = event.target.closest('.timeline-marker');
  const keyframeButton = event.target.closest('.keyframe-item');
  if (marker) return selectKeyframe(marker.dataset.keyframeId);
  if (keyframeButton) return selectKeyframe(keyframeButton.dataset.keyframeId);
  if (!actionButton) return;
  const actions = {
    togglePanel: () => animationEditor.classList.toggle('is-collapsed'),
    newAnimation: () => {
      const name = prompt('Animation name?', 'New Animation');
      if (!name) return;
      const key = makeAnimationKey(name);
      ANIMATION_DATA[key] = { name, duration: 2, loop: false, keyframes: [] };
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    renameAnimation: () => {
      const name = prompt('New animation name?', getCurrentAnimation().name);
      if (!name) return;
      getCurrentAnimation().name = name;
      saveAnimationData();
      renderAnimationEditor();
    },
    deleteAnimation: () => {
      if (Object.keys(ANIMATION_DATA).length <= 1 || !confirm('Delete this animation?')) return;
      delete ANIMATION_DATA[selectedAnimationKey];
      selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
      saveAnimationData();
      renderAnimationEditor();
    },
    duplicateAnimation: () => {
      const source = structuredClone(getCurrentAnimation());
      source.name = `${source.name} Copy`;
      const key = makeAnimationKey(source.name);
      ANIMATION_DATA[key] = source;
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    play: playEditorAnimation,
    pause: pauseEditorAnimation,
    stop: stopEditorAnimation,
    addKeyframe: upsertKeyframe,
    updateKeyframe: updateSelectedKeyframe,
    deleteKeyframe: deleteSelectedKeyframe,
    copyKeyframe: copySelectedKeyframe,
    pasteKeyframe,
    resetPart: resetCurrentPartToBase,
    resetFrame: resetEntireFrameToBase,
    clearAnimation: clearCurrentAnimation,
    copyJson: () => copyText(formatAnimationJson()),
    copyGsap: () => copyText(buildGsapCode()),
    downloadJson: downloadAnimationJson,
    importJson: importAnimationJson,
    clearSaved: clearSavedAnimationData,
  };
  actions[actionButton.dataset.editorAction]?.();
}

function handleAnimationEditorInput(event) {
  const transformInput = event.target.closest('[data-editor-transform]');
  if (!transformInput) return;
  pauseEditorAnimation();
  const field = transformInput.dataset.editorTransform;
  setPartValues(editorSelectedPart, { [field]: Number(transformInput.value) });
  refreshEditorTransformInputs();
  renderOnionSkin();
  if (editorRecordMode) upsertKeyframe();
}

function handleAnimationEditorChange(event) {
  const target = event.target;
  if (target.matches('[data-editor="animationSelect"]')) {
    selectedAnimationKey = target.value;
    editorCurrentTime = 0;
    selectedKeyframeId = null;
    renderAnimationEditor();
    previewAtTime(0);
  }
  if (target.matches('[data-editor="partSelect"]')) {
    editorSelectedPart = target.value;
    renderTransformControls();
    updateSelectedHighlightForEditor();
    renderOnionSkin();
  }
  if (target.matches('[data-editor="duration"]')) {
    getCurrentAnimation().duration = Math.max(0.1, Number(target.value));
    saveAnimationData();
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
  }
  if (target.matches('[data-editor="zoom"]')) {
    editorZoom = Number(target.value);
    renderTimelineRuler();
  }
  if (target.matches('[data-editor="loop"]')) {
    getCurrentAnimation().loop = target.checked;
    saveAnimationData();
  }
  if (target.matches('[data-editor="record"]')) {
    editorRecordMode = target.checked;
    renderAnimationEditor();
  }
  if (target.matches('[data-editor="onion"]')) {
    editorOnionSkin = target.checked;
    renderOnionSkin();
  }
}

function handleAnimationEditorKeyboard(event) {
  if (!ANIMATION_EDITOR_ENABLED) return;
  const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (isTyping) return;
  const moveAmount = event.shiftKey ? 10 : 1;
  const timeAmount = event.shiftKey ? 0.5 : 0.05;
  const rotateAmount = event.shiftKey ? 5 : 1;
  if (event.key === 'Enter') {
    const keyframeElement = document.activeElement?.closest?.('[data-keyframe-id]');
    if (keyframeElement) {
      event.preventDefault();
      return selectKeyframe(keyframeElement.dataset.keyframeId);
    }
  }
  const actions = {
    ' ': () => (editorIsPlaying ? pauseEditorAnimation() : playEditorAnimation()),
    ArrowLeft: () => previewAtTime(editorCurrentTime - timeAmount),
    ArrowRight: () => previewAtTime(editorCurrentTime + timeAmount),
    ArrowUp: () => setPartValues(editorSelectedPart, { y: getPartValues(editorSelectedPart).y - moveAmount }),
    ArrowDown: () => setPartValues(editorSelectedPart, { y: getPartValues(editorSelectedPart).y + moveAmount }),
    a: () => setPartValues(editorSelectedPart, { x: getPartValues(editorSelectedPart).x - moveAmount }),
    d: () => setPartValues(editorSelectedPart, { x: getPartValues(editorSelectedPart).x + moveAmount }),
    '[': () => setPartValues(editorSelectedPart, { rotate: getPartValues(editorSelectedPart).rotate - rotateAmount }),
    ']': () => setPartValues(editorSelectedPart, { rotate: getPartValues(editorSelectedPart).rotate + rotateAmount }),
    k: upsertKeyframe,
    Delete: deleteSelectedKeyframe,
    Tab: () => {
      const next = PART_NAMES[(PART_NAMES.indexOf(editorSelectedPart) + 1) % PART_NAMES.length];
      editorSelectedPart = next;
      renderTransformControls();
      updateSelectedHighlightForEditor();
    },
  };
  const action = actions[event.key] || actions[event.key.toLowerCase?.()];
  if (!action) return;
  event.preventDefault();
  pauseEditorAnimation();
  action();
  refreshEditorTransformInputs();
  renderOnionSkin();
  if (editorRecordMode && ['ArrowUp', 'ArrowDown', 'a', 'd', '[', ']'].includes(event.key.toLowerCase?.() || event.key)) upsertKeyframe();
}

function bindTimelinePointer() {
  animationEditor.addEventListener('pointerdown', (event) => {
    const marker = event.target.closest('.timeline-marker');
    if (marker) return handleMarkerDrag(marker, event);
    if (!event.target.closest('[data-editor="timeline"]')) return;
    pauseEditorAnimation();
    setTimelineTimeFromPointer(event);
    const move = (moveEvent) => setTimelineTimeFromPointer(moveEvent);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}


// ==================================================
// UX upgrade: scroll-safe editor, resizable panel, track timeline
// ==================================================
const ANIMATION_EDITOR_WIDTH_KEY = 'robotAnimationEditorWidth';
const MIN_EDITOR_WIDTH = 420;
const MAX_EDITOR_WIDTH = 720;
let editorTrackFilter = 'all';
let editorSnap = 0;
let lastEditorScrollState = null;
let cachedTimelineDrag = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPixelsPerSecond() {
  return 160 * editorZoom;
}

function getVisibleParts() {
  if (editorTrackFilter === 'selected') return [editorSelectedPart];
  if (editorTrackFilter === 'nonempty') {
    const partsWithKeys = new Set(getCurrentAnimation().keyframes.map((keyframe) => keyframe.part));
    return PART_NAMES.filter((partName) => partsWithKeys.has(partName));
  }
  return PART_NAMES;
}

function snapTime(time) {
  if (!editorSnap) return Number(time.toFixed(3));
  return Number((Math.round(time / editorSnap) * editorSnap).toFixed(3));
}

function saveEditorScrollState() {
  return {
    panelScrollTop: animationEditor?.scrollTop || 0,
    keyframeListScrollTop: animationPanelBody?.querySelector('[data-editor="keyframeList"]')?.scrollTop || 0,
    timelineScrollLeft: animationPanelBody?.querySelector('[data-editor="timelineScroll"]')?.scrollLeft || 0,
  };
}

function restoreEditorScrollState(state = lastEditorScrollState) {
  if (!state) return;
  requestAnimationFrame(() => {
    if (animationEditor) animationEditor.scrollTop = state.panelScrollTop;
    const keyframeList = animationPanelBody?.querySelector('[data-editor="keyframeList"]');
    const timelineScroll = animationPanelBody?.querySelector('[data-editor="timelineScroll"]');
    if (keyframeList) keyframeList.scrollTop = state.keyframeListScrollTop;
    if (timelineScroll) timelineScroll.scrollLeft = state.timelineScrollLeft;
  });
}

function withEditorScrollPreserved(callback) {
  lastEditorScrollState = saveEditorScrollState();
  callback();
  restoreEditorScrollState(lastEditorScrollState);
}

function setEditorWidth(width) {
  const nextWidth = clamp(width, MIN_EDITOR_WIDTH, MAX_EDITOR_WIDTH);
  document.documentElement.style.setProperty('--animation-editor-width', `${nextWidth}px`);
  localStorage.setItem(ANIMATION_EDITOR_WIDTH_KEY, String(nextWidth));
}

function installEditorResizeHandle() {
  const handle = animationEditor.querySelector('[data-editor-resize]');
  if (!handle) return;
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent) => setEditorWidth(window.innerWidth - moveEvent.clientX - 16);
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function createAnimationEditor() {
  document.body.classList.add('animation-editor-enabled');
  const savedWidth = Number(localStorage.getItem(ANIMATION_EDITOR_WIDTH_KEY));
  if (savedWidth) setEditorWidth(savedWidth);
  animationEditor = document.createElement('aside');
  animationEditor.className = 'animation-editor';
  animationEditor.setAttribute('aria-label', 'Animation editor');
  animationEditor.innerHTML = `
    <div class="animation-editor__resize" data-editor-resize aria-hidden="true"></div>
    <div class="animation-editor__header">
      <h2>Animation Editor</h2>
      <button type="button" data-editor-action="togglePanel" aria-label="Hide or show animation editor body">Hide</button>
    </div>
    <div class="animation-editor__body"></div>
  `;
  document.body.appendChild(animationEditor);
  animationPanelBody = animationEditor.querySelector('.animation-editor__body');
  animationEditor.addEventListener('click', handleAnimationEditorClick);
  animationEditor.addEventListener('input', handleAnimationEditorInput);
  animationEditor.addEventListener('change', handleAnimationEditorChange);
  window.addEventListener('keydown', handleAnimationEditorKeyboard);
  window.addEventListener('resize', () => withEditorScrollPreserved(() => {
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
  }));
  onionLayer.className = 'onion-layer';
  robot.appendChild(onionLayer);
  installEditorResizeHandle();
  renderAnimationEditor();
}

function sectionMarkup(title, id, content, open = false, extraClass = '') {
  return `<details class="editor-section ${extraClass}" data-editor-section="${id}" ${open ? 'open' : ''}>
    <summary>${title}</summary>
    <div class="editor-section__content">${content}</div>
  </details>`;
}

function renderAnimationEditor() {
  const state = saveEditorScrollState();
  const animation = getCurrentAnimation();
  animationPanelBody.innerHTML = `
    ${sectionMarkup('Animation', 'animation', `
      <span class="recording-indicator ${editorRecordMode ? 'is-recording' : ''}">RECORDING</span>
      <label>Animation
        <select data-editor="animationSelect">
          ${Object.entries(ANIMATION_DATA).map(([key, data]) => `<option value="${key}" ${key === selectedAnimationKey ? 'selected' : ''}>${data.name || key}</option>`).join('')}
        </select>
      </label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="newAnimation">New Animation</button>
        <button type="button" data-editor-action="renameAnimation">Rename Animation</button>
        <button type="button" data-editor-action="deleteAnimation">Delete Animation</button>
        <button type="button" data-editor-action="duplicateAnimation">Duplicate Animation</button>
      </div>
    `, true)}
    ${sectionMarkup('Timeline', 'timeline', `
      <div class="timeline-readout"><span data-editor="timeDisplay">${editorCurrentTime.toFixed(2)}s</span> / ${animation.duration.toFixed(2)}s</div>
      <div class="editor-grid editor-grid--timeline-controls">
        <label>Duration <input type="number" step="0.1" min="0.1" value="${animation.duration}" data-editor="duration" /></label>
        <label>Zoom <input type="range" min="0.5" max="8" step="0.25" value="${editorZoom}" data-editor="zoom" /></label>
        <label>Tracks
          <select data-editor="trackFilter">
            <option value="all" ${editorTrackFilter === 'all' ? 'selected' : ''}>Show all tracks</option>
            <option value="selected" ${editorTrackFilter === 'selected' ? 'selected' : ''}>Show selected part only</option>
            <option value="nonempty" ${editorTrackFilter === 'nonempty' ? 'selected' : ''}>Hide empty tracks</option>
          </select>
        </label>
        <label>Snap
          <select data-editor="snap">
            ${[0, 0.01, 0.05, 0.1, 0.25, 0.5].map((value) => `<option value="${value}" ${Number(editorSnap) === value ? 'selected' : ''}>${value ? `${value}s` : 'Off'}</option>`).join('')}
          </select>
        </label>
        <label class="editor-check"><input type="checkbox" ${animation.loop ? 'checked' : ''} data-editor="loop" /> Loop</label>
      </div>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="zoomOut">Zoom out</button>
        <button type="button" data-editor-action="zoomIn">Zoom in</button>
        <button type="button" data-editor-action="fitTimeline">Fit animation</button>
        <button type="button" data-editor-action="play">Play</button>
        <button type="button" data-editor-action="pause">Pause</button>
        <button type="button" data-editor-action="stop">Stop</button>
      </div>
      <div class="timeline-board" data-editor="timeline">
        <div class="timeline-labels" data-editor="timelineLabels"></div>
        <div class="timeline-scroll" data-editor="timelineScroll">
          <div class="timeline-canvas" data-editor="timelineCanvas">
            <div class="timeline-ruler" data-editor="ruler"></div>
            <div class="timeline-tracks" data-editor="tracks"></div>
            <div class="timeline-playhead" data-editor="playhead"><span data-editor="playheadTime">0.00s</span></div>
          </div>
        </div>
      </div>
    `, true, 'editor-section--timeline')}
    ${sectionMarkup('Part', 'part', `
      <label>Selected part
        <select data-editor="partSelect">
          ${PART_NAMES.map((partName) => `<option value="${partName}" ${partName === editorSelectedPart ? 'selected' : ''}>${partName}</option>`).join('')}
        </select>
      </label>
    `, false)}
    ${sectionMarkup('Transform', 'transform', `
      <label>Ease
        <select data-editor="ease">
          ${EASE_OPTIONS.map((ease) => `<option value="${ease}">${ease}</option>`).join('')}
        </select>
      </label>
      <div class="transform-fields" data-editor="transformFields"></div>
    `, false)}
    ${sectionMarkup('Keyframes', 'keyframes', `
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="addKeyframe">Add Keyframe</button>
        <button type="button" data-editor-action="updateKeyframe">Update Keyframe</button>
        <button type="button" data-editor-action="deleteKeyframe">Delete Keyframe</button>
        <button type="button" data-editor-action="copyKeyframe">Copy Keyframe</button>
        <button type="button" data-editor-action="pasteKeyframe">Paste Keyframe</button>
      </div>
      <div class="keyframe-list" data-editor="keyframeList"></div>
    `, false)}
    ${sectionMarkup('Preview', 'preview', `
      <label class="editor-check"><input type="checkbox" ${editorRecordMode ? 'checked' : ''} data-editor="record" /> Record Mode</label>
      <label class="editor-check"><input type="checkbox" ${editorOnionSkin ? 'checked' : ''} data-editor="onion" /> Onion Skin</label>
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="resetPart">Reset Current Part to Base Pose</button>
        <button type="button" data-editor-action="resetFrame">Reset Entire Frame to Base Pose</button>
        <button type="button" data-editor-action="clearAnimation">Clear Current Animation</button>
      </div>
    `, false)}
    ${sectionMarkup('Import / Export', 'export', `
      <div class="editor-grid editor-grid--buttons">
        <button type="button" data-editor-action="copyJson">Copy Animation JSON</button>
        <button type="button" data-editor-action="copyGsap">Copy GSAP Code</button>
        <button type="button" data-editor-action="downloadJson">Download Animation JSON</button>
        <button type="button" data-editor-action="importJson">Import Animation JSON</button>
        <button type="button" data-editor-action="clearSaved">Clear Saved Animation Data</button>
      </div>
      <textarea data-editor="importText" placeholder="Paste animation JSON here to import"></textarea>
    `, false)}
  `;
  renderTransformControls();
  renderTimelineRuler();
  renderTimelineMarkers();
  renderKeyframeList();
  updatePlayhead();
  updateSelectedHighlightForEditor();
  restoreEditorScrollState(state);
}

function getTimelineMetrics() {
  const animation = getCurrentAnimation();
  const scroll = animationPanelBody?.querySelector('[data-editor="timelineScroll"]');
  const visibleWidth = scroll?.clientWidth || 1;
  const pixelsPerSecond = getPixelsPerSecond();
  const timelineWidth = Math.max(visibleWidth, animation.duration * pixelsPerSecond);
  return { animation, scroll, visibleWidth, pixelsPerSecond, timelineWidth };
}

function timeToPixel(time) {
  return time * getPixelsPerSecond();
}

function pixelToTime(pixel) {
  return snapTime(pixel / getPixelsPerSecond());
}

function renderTimelineRuler() {
  const labels = animationPanelBody.querySelector('[data-editor="timelineLabels"]');
  const ruler = animationPanelBody.querySelector('[data-editor="ruler"]');
  const canvas = animationPanelBody.querySelector('[data-editor="timelineCanvas"]');
  const tracks = animationPanelBody.querySelector('[data-editor="tracks"]');
  if (!ruler || !canvas || !tracks || !labels) return;
  const { animation, timelineWidth, pixelsPerSecond } = getTimelineMetrics();
  const visibleParts = getVisibleParts();
  canvas.style.width = `${timelineWidth}px`;
  labels.innerHTML = `<div class="timeline-label-spacer">Part</div>${visibleParts.map((partName) => `<div class="timeline-label-row">${partName}</div>`).join('')}`;
  const majorStep = 0.5;
  const minorStep = 0.1;
  const fragment = document.createDocumentFragment();
  for (let time = 0; time <= animation.duration + 0.0001; time += minorStep) {
    const tick = document.createElement('span');
    const isMajor = Math.abs((time / majorStep) - Math.round(time / majorStep)) < 0.001;
    tick.className = `timeline-tick ${isMajor ? 'is-major' : 'is-minor'}`;
    tick.style.left = `${time * pixelsPerSecond}px`;
    if (isMajor) tick.textContent = time.toFixed(1);
    fragment.appendChild(tick);
  }
  ruler.replaceChildren(fragment);
}

function renderTimelineMarkers() {
  if (!animationPanelBody) return;
  const tracks = animationPanelBody.querySelector('[data-editor="tracks"]');
  if (!tracks) return;
  const { animation, timelineWidth, pixelsPerSecond } = getTimelineMetrics();
  const visibleParts = getVisibleParts();
  const fragment = document.createDocumentFragment();
  tracks.style.width = `${timelineWidth}px`;
  visibleParts.forEach((partName, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'timeline-track';
    row.dataset.part = partName;
    const keys = animation.keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
    let previousLeft = -Infinity;
    let stagger = 0;
    keys.forEach((keyframe) => {
      const left = keyframe.time * pixelsPerSecond;
      stagger = left - previousLeft < 10 ? stagger + 1 : 0;
      previousLeft = left;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `timeline-keyframe ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}`;
      marker.dataset.keyframeId = keyframe.id;
      marker.style.left = `${left}px`;
      marker.style.top = `${50 + ((stagger % 3) - 1) * 11}%`;
      marker.title = `${keyframe.time.toFixed(2)}s · ${keyframe.part} · ${keyframe.ease}`;
      marker.setAttribute('aria-label', `Select ${keyframe.part} keyframe at ${keyframe.time.toFixed(2)} seconds using ${keyframe.ease}`);
      fragment.appendChild(row).appendChild(marker);
    });
    if (!keys.length) fragment.appendChild(row);
  });
  tracks.replaceChildren(fragment);
}

function updatePlayhead() {
  if (!animationPanelBody) return;
  const playhead = animationPanelBody.querySelector('[data-editor="playhead"]');
  const handleTime = animationPanelBody.querySelector('[data-editor="playheadTime"]');
  const timeDisplay = animationPanelBody.querySelector('[data-editor="timeDisplay"]');
  const x = timeToPixel(editorCurrentTime);
  if (playhead) playhead.style.transform = `translateX(${x}px)`;
  if (handleTime) handleTime.textContent = `${editorCurrentTime.toFixed(2)}s`;
  if (timeDisplay) timeDisplay.textContent = `${editorCurrentTime.toFixed(2)}s`;
}

function updateKeyframeSelectionClasses() {
  animationPanelBody?.querySelectorAll('[data-keyframe-id]').forEach((element) => {
    element.classList.toggle('is-selected', element.dataset.keyframeId === selectedKeyframeId);
    element.setAttribute('aria-pressed', String(element.dataset.keyframeId === selectedKeyframeId));
  });
}

function summarizeKeyframeValues(keyframe) {
  return Object.entries(keyframe.values)
    .filter(([field, value]) => Number(value) !== Number(getBaseTransform(keyframe.part)[field]))
    .map(([field]) => field)
    .slice(0, 5)
    .join(', ') || 'base pose';
}

function renderKeyframeList() {
  const list = animationPanelBody.querySelector('[data-editor="keyframeList"]');
  if (!list) return;
  const state = saveEditorScrollState();
  const fragment = document.createDocumentFragment();
  PART_NAMES.forEach((partName) => {
    const keyframes = getCurrentAnimation().keyframes.filter((keyframe) => keyframe.part === partName).sort((a, b) => a.time - b.time);
    if (!keyframes.length) return;
    const group = document.createElement('div');
    group.className = 'keyframe-group';
    group.innerHTML = `<div class="keyframe-group-header">${partName}</div>`;
    keyframes.forEach((keyframe) => {
      const row = document.createElement('div');
      row.className = `keyframe-row ${keyframe.id === selectedKeyframeId ? 'is-selected' : ''}`;
      row.dataset.keyframeId = keyframe.id;
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.innerHTML = `
        <span class="keyframe-selected-dot" aria-hidden="true"></span>
        <span>${keyframe.time.toFixed(2)}s</span>
        <span>${keyframe.part}</span>
        <span>${keyframe.ease}</span>
        <span class="keyframe-summary">${summarizeKeyframeValues(keyframe)}</span>
        <button type="button" data-keyframe-edit="${keyframe.id}" aria-label="Edit keyframe at ${keyframe.time.toFixed(2)} seconds">✎</button>
        <button type="button" data-keyframe-delete="${keyframe.id}" aria-label="Delete keyframe at ${keyframe.time.toFixed(2)} seconds">×</button>
      `;
      group.appendChild(row);
    });
    fragment.appendChild(group);
  });
  if (!fragment.childNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No keyframes yet.';
    fragment.appendChild(empty);
  }
  list.replaceChildren(fragment);
  restoreEditorScrollState(state);
}

function selectKeyframe(keyframeId, options = {}) {
  const state = saveEditorScrollState();
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === keyframeId);
  if (!keyframe) return;
  selectedKeyframeId = keyframeId;
  editorCurrentTime = keyframe.time;
  editorSelectedPart = keyframe.part;
  setPartValues(editorSelectedPart, keyframe.values);
  const partSelect = animationPanelBody.querySelector('[data-editor="partSelect"]');
  if (partSelect) partSelect.value = editorSelectedPart;
  const easeSelect = animationPanelBody.querySelector('[data-editor="ease"]');
  if (easeSelect) easeSelect.value = keyframe.ease;
  refreshEditorTransformInputs();
  updatePlayhead();
  updateSelectedHighlightForEditor();
  updateKeyframeSelectionClasses();
  if (options.preview !== false) previewAtTime(editorCurrentTime);
  restoreEditorScrollState(state);
}

function fitTimelineToAnimation() {
  const state = saveEditorScrollState();
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  if (!scroll) return;
  editorZoom = clamp(scroll.clientWidth / (getCurrentAnimation().duration * 160), 0.5, 8);
  const zoomInput = animationPanelBody.querySelector('[data-editor="zoom"]');
  if (zoomInput) zoomInput.value = editorZoom;
  renderTimelineRuler();
  renderTimelineMarkers();
  updatePlayhead();
  restoreEditorScrollState(state);
}

function zoomTimeline(direction) {
  const state = saveEditorScrollState();
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  const oldPixels = timeToPixel(editorCurrentTime);
  editorZoom = clamp(editorZoom + direction * 0.25, 0.5, 8);
  const zoomInput = animationPanelBody.querySelector('[data-editor="zoom"]');
  if (zoomInput) zoomInput.value = editorZoom;
  renderTimelineRuler();
  renderTimelineMarkers();
  updatePlayhead();
  if (scroll) scroll.scrollLeft = Math.max(0, timeToPixel(editorCurrentTime) - (oldPixels - state.timelineScrollLeft));
}

function setTimelineTimeFromPointer(event) {
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  if (!scroll) return;
  const rect = cachedTimelineDrag?.rect || scroll.getBoundingClientRect();
  const left = event.clientX - rect.left + scroll.scrollLeft;
  previewAtTime(clamp(pixelToTime(left), 0, getCurrentAnimation().duration));
}

function handleMarkerDrag(marker, pointerDownEvent) {
  pointerDownEvent.preventDefault();
  pointerDownEvent.stopPropagation();
  marker.setPointerCapture?.(pointerDownEvent.pointerId);
  const keyframe = getCurrentAnimation().keyframes.find((item) => item.id === marker.dataset.keyframeId);
  const scroll = animationPanelBody.querySelector('[data-editor="timelineScroll"]');
  cachedTimelineDrag = { rect: scroll.getBoundingClientRect() };
  const move = (event) => {
    const left = event.clientX - cachedTimelineDrag.rect.left + scroll.scrollLeft;
    keyframe.time = clamp(pixelToTime(left), 0, getCurrentAnimation().duration);
    selectedKeyframeId = keyframe.id;
    editorCurrentTime = keyframe.time;
    sortKeyframes(getCurrentAnimation());
    renderTimelineMarkers();
    renderKeyframeList();
    updatePlayhead();
  };
  const up = () => {
    cachedTimelineDrag = null;
    saveAnimationData();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function handleAnimationEditorClick(event) {
  const keyframeDelete = event.target.closest('[data-keyframe-delete]');
  const keyframeEdit = event.target.closest('[data-keyframe-edit]');
  const marker = event.target.closest('.timeline-keyframe');
  const row = event.target.closest('.keyframe-row');
  if (keyframeDelete) {
    selectedKeyframeId = keyframeDelete.dataset.keyframeDelete;
    deleteSelectedKeyframe();
    return;
  }
  if (keyframeEdit) return selectKeyframe(keyframeEdit.dataset.keyframeEdit);
  if (marker) return selectKeyframe(marker.dataset.keyframeId);
  if (row) return selectKeyframe(row.dataset.keyframeId);

  const actionButton = event.target.closest('[data-editor-action]');
  if (!actionButton) return;
  const actions = {
    togglePanel: () => animationEditor.classList.toggle('is-collapsed'),
    newAnimation: () => {
      const name = prompt('Animation name?', 'New Animation');
      if (!name) return;
      const key = makeAnimationKey(name);
      ANIMATION_DATA[key] = { name, duration: 2, loop: false, keyframes: [] };
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    renameAnimation: () => {
      const name = prompt('New animation name?', getCurrentAnimation().name);
      if (!name) return;
      getCurrentAnimation().name = name;
      saveAnimationData();
      renderAnimationEditor();
    },
    deleteAnimation: () => {
      if (Object.keys(ANIMATION_DATA).length <= 1 || !confirm('Delete this animation?')) return;
      delete ANIMATION_DATA[selectedAnimationKey];
      selectedAnimationKey = Object.keys(ANIMATION_DATA)[0];
      saveAnimationData();
      renderAnimationEditor();
    },
    duplicateAnimation: () => {
      const source = structuredClone(getCurrentAnimation());
      source.name = `${source.name} Copy`;
      const key = makeAnimationKey(source.name);
      ANIMATION_DATA[key] = source;
      selectedAnimationKey = key;
      saveAnimationData();
      renderAnimationEditor();
    },
    play: playEditorAnimation,
    pause: pauseEditorAnimation,
    stop: stopEditorAnimation,
    zoomOut: () => zoomTimeline(-1),
    zoomIn: () => zoomTimeline(1),
    fitTimeline: fitTimelineToAnimation,
    addKeyframe: upsertKeyframe,
    updateKeyframe: updateSelectedKeyframe,
    deleteKeyframe: deleteSelectedKeyframe,
    copyKeyframe: copySelectedKeyframe,
    pasteKeyframe,
    resetPart: resetCurrentPartToBase,
    resetFrame: resetEntireFrameToBase,
    clearAnimation: clearCurrentAnimation,
    copyJson: () => copyText(formatAnimationJson()),
    copyGsap: () => copyText(buildGsapCode()),
    downloadJson: downloadAnimationJson,
    importJson: importAnimationJson,
    clearSaved: clearSavedAnimationData,
  };
  actions[actionButton.dataset.editorAction]?.();
}

function handleAnimationEditorChange(event) {
  const target = event.target;
  if (target.matches('[data-editor="animationSelect"]')) {
    selectedAnimationKey = target.value;
    editorCurrentTime = 0;
    selectedKeyframeId = null;
    renderAnimationEditor();
    previewAtTime(0);
  }
  if (target.matches('[data-editor="partSelect"]')) {
    editorSelectedPart = target.value;
    withEditorScrollPreserved(() => {
      renderTransformControls();
      updateSelectedHighlightForEditor();
      renderTimelineRuler();
      renderTimelineMarkers();
      renderOnionSkin();
    });
  }
  if (target.matches('[data-editor="duration"]')) {
    const state = saveEditorScrollState();
    getCurrentAnimation().duration = Math.max(0.1, Number(target.value));
    editorCurrentTime = clamp(editorCurrentTime, 0, getCurrentAnimation().duration);
    saveAnimationData();
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
    restoreEditorScrollState(state);
  }
  if (target.matches('[data-editor="zoom"]')) {
    const state = saveEditorScrollState();
    editorZoom = Number(target.value);
    renderTimelineRuler();
    renderTimelineMarkers();
    updatePlayhead();
    restoreEditorScrollState(state);
  }
  if (target.matches('[data-editor="trackFilter"]')) {
    editorTrackFilter = target.value;
    withEditorScrollPreserved(() => {
      renderTimelineRuler();
      renderTimelineMarkers();
      updatePlayhead();
    });
  }
  if (target.matches('[data-editor="snap"]')) editorSnap = Number(target.value);
  if (target.matches('[data-editor="loop"]')) {
    getCurrentAnimation().loop = target.checked;
    saveAnimationData();
  }
  if (target.matches('[data-editor="record"]')) {
    editorRecordMode = target.checked;
    const indicator = animationPanelBody.querySelector('.recording-indicator');
    indicator?.classList.toggle('is-recording', editorRecordMode);
  }
  if (target.matches('[data-editor="onion"]')) {
    editorOnionSkin = target.checked;
    renderOnionSkin();
  }
}

function bindTimelinePointer() {
  animationEditor.addEventListener('pointerdown', (event) => {
    const marker = event.target.closest('.timeline-keyframe');
    if (marker) return handleMarkerDrag(marker, event);
    const scroll = event.target.closest('[data-editor="timelineScroll"]');
    if (!scroll) return;
    pauseEditorAnimation();
    cachedTimelineDrag = { rect: scroll.getBoundingClientRect() };
    setTimelineTimeFromPointer(event);
    const move = (moveEvent) => setTimelineTimeFromPointer(moveEvent);
    const up = () => {
      cachedTimelineDrag = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

animationEditor?.remove();
if (ANIMATION_EDITOR_ENABLED) {
  pauseAnimations();
  syncEditorValuesFromBase();
  createAnimationEditor();
  bindTimelinePointer();
  previewAtTime(0);
}

return {
  pause: pauseEditorAnimation,
  reset: resetEntireFrameToBase,
  setPivot(name, x, y) {
    const origin = { transformOriginX: x / 440 * 100, transformOriginY: y / 475 * 100 };
    ROBOT_CONFIG[name].transformOrigin = joinTransformOrigin(origin.transformOriginX, origin.transformOriginY);
    Object.assign(currentEditorValues[name], origin);
    gsap.set(name === 'head' ? [partElements[name], ...headFollowers] : partElements[name], { transformOrigin: `${x}px ${y}px` });
    if (editorSelectedPart === name) refreshEditorTransformInputs();
  },
};
}
