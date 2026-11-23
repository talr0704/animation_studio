// Keep the original neck/upper chest when clothes replace Popa's full torso.
// Clip the existing illustration so its pivot and animation remain unchanged.
const originalClips = new WeakMap();
export function setOutfitBody(character, wearingOutfit) {
  const torso = character.querySelector('[data-sprite="torso"]');
  if (!torso) return;
  if (!originalClips.has(torso)) originalClips.set(torso, torso.style.clipPath);
  torso.style.clipPath = wearingOutfit ? 'inset(0 20% 60% 20%)' : originalClips.get(torso);
}
