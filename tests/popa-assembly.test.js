const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const layout = JSON.parse(readFileSync(join(root, 'assembly_layout.json'), 'utf8'));
const filenames = layout.layersBackToFront.map(layer => layer.file.split('/').pop());

test('Popa has exactly two complete arms without legacy hand or leg overlays', () => {
  assert.deepEqual(filenames.filter(name => /arm|hand/.test(name)).sort(), ['left_arm.png', 'right_arm.png']);
  assert.deepEqual(filenames.filter(name => /foot|leg/.test(name)).sort(), ['foot_left.png', 'foot_right.png']);
  const shirt = layout.layersBackToFront.find(layer => layer.file === 'Outfit/shirt.png');
  assert.equal(shirt.clipPath, 'inset(0 28% 0 28%)');
});

test('every assembled layer has an existing asset and usable dimensions', () => {
  for (const layer of layout.layersBackToFront) {
    assert.ok(existsSync(join(root, 'images', layer.file.split('/').pop())), layer.file);
    const sprite = layout.sprites.find(sprite => sprite.file === layer.file);
    assert.ok(sprite, layer.file);
    const size = sprite.displaySize ?? sprite.artworkSize;
    assert.ok(size.every(value => Number.isFinite(value) && value > 0), layer.file);
  }
});
