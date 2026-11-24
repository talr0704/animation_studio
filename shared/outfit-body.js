// Keep the original neck/upper chest when clothes replace Popa's full torso.
// Clip the existing illustration so its pivot and animation remain unchanged.
const originalClips = new WeakMap();
const armVariants = new WeakMap();
export function setOutfitBody(character, wearingOutfit) {
  const torso = character.querySelector('[data-sprite="torso"]');
  if (!torso) return;
  if (!originalClips.has(torso)) originalClips.set(torso, torso.style.clipPath);
  torso.style.clipPath = wearingOutfit ? 'inset(0 20% 60% 20%)' : originalClips.get(torso);

  // The yellow sleeves are baked into the original arm art. Only the base
  // shirt uses them. Outfits can draw their own sleeves over the bare arms.
  const shirt = character.querySelector('[data-sprite="shirt"]');
  const hasYellowSleeves = shirt && shirt.parentElement.style.visibility !== 'hidden';
  if (!armVariants.has(character)) {
    armVariants.set(character, ['left_arm', 'right_arm'].map(name => {
      const image = character.querySelector(`[data-sprite="${name}"]`);
      return {
        image,
        sleeved: image.src,
        bare: new URL(`../assets/characters/popa/parts/${name}_bare.png`, import.meta.url).href,
      };
    }));
  }
  for (const { image, sleeved, bare } of armVariants.get(character)) {
    const source = hasYellowSleeves ? sleeved : bare;
    if (image.src !== source) image.src = source;
  }
}
