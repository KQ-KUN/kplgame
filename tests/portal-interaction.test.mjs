import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const script = await fs.readFile(new URL('../portal/portal.js', import.meta.url), 'utf8');

function fixture() {
  let focused;
  function control(properties = {}) {
    const listeners = new Map();
    return {
      ...properties,
      addEventListener: (type, handler) => listeners.set(type, handler),
      emit: (type, event) => listeners.get(type)?.(event),
      focus() { focused = this; },
      setAttribute(name, value) { this[name] = value; },
    };
  }
  const trigger = control({ dataset: { panel: 'ad-panel' }, 'aria-expanded': 'false' });
  const close = control();
  const panel = control({ hidden: true, querySelector: () => close });
  // Deliberately omit native dialog APIs, as in older embedded browsers.
  vm.runInNewContext(script, {
    document: { querySelectorAll: () => [trigger], getElementById: () => panel },
  });
  return { trigger, close, panel, focused: () => focused };
}

test('contact information opens and closes without native modal APIs', () => {
  const { trigger, close, panel, focused } = fixture();
  for (let i = 0; i < 3; i++) {
    trigger.emit('click');
    assert.equal(panel.hidden, false);
    assert.equal(trigger['aria-expanded'], 'true');
    assert.equal(focused(), close);
    close.emit('click');
    assert.equal(panel.hidden, true);
    assert.equal(trigger['aria-expanded'], 'false');
    assert.equal(focused(), trigger);
  }
});

test('Escape and the trigger close the panel; Tab can leave it', () => {
  const { trigger, panel } = fixture();
  trigger.emit('click');
  panel.emit('keydown', { key: 'Tab', preventDefault() { assert.fail('Tab must remain free'); } });
  assert.equal(panel.hidden, false);
  let prevented = false;
  panel.emit('keydown', { key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(panel.hidden, true);
  trigger.emit('click');
  trigger.emit('click');
  assert.equal(panel.hidden, true);
});
