(() => {
  'use strict';
  const arena = document.querySelector('.stack-arena');
  if (!arena || !window.Matter) return;
  const { Engine, Composite, Bodies, Body, Constraint, Sleeping } = window.Matter;
  const chips = [...arena.querySelectorAll('[data-stack-chip]')];
  const reset = document.querySelector('.stack-reset');
  const pause = document.querySelector('.stack-pause');
  const status = document.querySelector('.stack-status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let engine, states = [], frame = 0, previous = 0, accumulator = 0;
  let paused = false, visible = false, started = false, width = 0, height = 0;
  let drag = null, focused = null;
  const STEP = 1000 / 60;
  const say = text => { status.textContent = text; };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; accumulator = 0; };
  const point = event => {
    const rect = arena.getBoundingClientRect();
    return { x: Math.max(18, Math.min(width - 18, event.clientX - rect.left)), y: Math.max(18, Math.min(height - 18, event.clientY - rect.top)) };
  };
  const release = () => {
    if (!drag) return;
    const current = drag;
    drag = null;
    Composite.remove(engine.world, current.constraint);
    current.element.classList.remove('is-grabbed');
    if (current.element.hasPointerCapture?.(current.id)) current.element.releasePointerCapture(current.id);
  };
  const render = () => states.forEach(({element, body, w, h}) => {
    element.style.transform = 'translate3d(' + (body.position.x - w / 2) + 'px,' + (body.position.y - h / 2) + 'px,0) rotate(' + body.angle + 'rad)';
  });
  const tick = time => {
    frame = 0;
    if (!engine || paused || focused || !visible || document.hidden || motion.matches) return;
    if (previous) accumulator += Math.min(time - previous, 50);
    previous = time;
    while (accumulator >= STEP) { Engine.update(engine, STEP); accumulator -= STEP; }
    render();
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!frame && engine && !paused && !focused && visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  };
  const destroy = () => {
    stop(); release();
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = null; states = [];
    arena.classList.remove('is-physics');
    chips.forEach(el => { el.style.transform = ''; el.style.width = ''; el.style.height = ''; });
  };
  const initialize = () => {
    destroy();
    if (motion.matches) {
      reset.hidden = true; pause.hidden = true;
      say('Movimiento reducido: Stack mostrado como lista.');
      return;
    }
    width = arena.clientWidth; height = arena.clientHeight;
    if (width < 80 || height < 80) return;
    const dims = chips.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
    engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1;
    const thickness = 400, pad = 16;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, height - pad + thickness / 2, width + thickness * 2, thickness, {isStatic: true}),
      Bodies.rectangle(pad - thickness / 2, height / 2, thickness, height * 8, {isStatic: true}),
      Bodies.rectangle(width - pad + thickness / 2, height / 2, thickness, height * 8, {isStatic: true}),
      Bodies.rectangle(width / 2, -1400 - thickness / 2, width + thickness * 2, thickness, {isStatic: true})
    ]);
    states = chips.map((element, index) => {
      const {w, h} = dims[index];
      const x = pad + w / 2 + 4 + Math.random() * Math.max(1, width - pad * 2 - w - 8);
      const body = Bodies.rectangle(x, -65 - index * 62, w, h, {
        chamfer: {radius: 12}, restitution: .35, friction: .5, frictionAir: .025,
        density: .0018, angle: (Math.random() - .5) * .4
      });
      Composite.add(engine.world, body);
      element.style.width = w + 'px'; element.style.height = h + 'px';
      return {element, body, w, h};
    });
    arena.classList.add('is-physics');
    render();
    reset.hidden = false; pause.hidden = false;
    paused = false;
    pause.textContent = 'Pausar'; pause.setAttribute('aria-pressed', 'false');
    run();
  };
  chips.forEach(element => {
    element.addEventListener('pointerdown', event => {
      if (!engine || paused || motion.matches || event.button !== 0 || drag) return;
      // A pointer can manipulate a focused chip; keyboard-only focus pauses the scene.
      focused = null;
      const state = states.find(item => item.element === element);
      Sleeping.set(state.body, false);
      const position = point(event);
      const constraint = Constraint.create({pointA: position, bodyB: state.body, pointB: {x: 0, y: 0}, length: 0, stiffness: .18, damping: .2});
      Composite.add(engine.world, constraint);
      drag = {element, constraint, id: event.pointerId};
      element.setPointerCapture(event.pointerId);
      element.classList.add('is-grabbed');
      event.preventDefault(); run();
    });
    element.addEventListener('pointermove', event => {
      if (drag?.id === event.pointerId) drag.constraint.pointA = point(event);
    });
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
    element.addEventListener('focus', () => {
      if (!engine || drag) return;
      focused = element; stop();
      const state = states.find(item => item.element === element);
      Body.setPosition(state.body, {
        x: Math.max(state.w / 2 + 20, Math.min(width - state.w / 2 - 20, state.body.position.x)),
        y: Math.max(state.h / 2 + 20, Math.min(height - state.h / 2 - 20, state.body.position.y))
      });
      Body.setAngle(state.body, 0); render();
    });
    element.addEventListener('blur', () => { if (focused === element) focused = null; run(); });
    element.addEventListener('keydown', event => {
      if (!engine || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const s = states.find(item => item.element === element);
      const dx = event.key === 'ArrowLeft' ? -18 : event.key === 'ArrowRight' ? 18 : 0;
      const dy = event.key === 'ArrowUp' ? -18 : event.key === 'ArrowDown' ? 18 : 0;
      Body.setPosition(s.body, {x: Math.max(s.w/2+18, Math.min(width-s.w/2-18, s.body.position.x+dx)), y: Math.max(s.h/2+18, Math.min(height-s.h/2-18,s.body.position.y+dy))});
      Body.setVelocity(s.body, {x:0,y:0}); Body.setAngle(s.body,0); render();
    });
  });
  reset.addEventListener('click', () => { initialize(); say('Stack reiniciado. Las etiquetas vuelven a caer.'); });
  pause.addEventListener('click', () => {
    paused = !paused; release();
    pause.textContent = paused ? 'Continuar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(paused));
    if (paused) stop(); else run();
    say(paused ? 'Animación pausada.' : 'Animación reanudada.');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) {release(); stop();} else run(); });
  motion.addEventListener('change', () => { if (started) initialize(); });
  const resize = new ResizeObserver(() => {
    if (started && engine && (arena.clientWidth !== width || arena.clientHeight !== height)) initialize();
  });
  resize.observe(arena);
  const ready = document.fonts?.ready || Promise.resolve();
  ready.then(() => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible && !started) { started = true; initialize(); }
        if (visible) run(); else { release(); stop(); }
      }, {threshold: .12});
      observer.observe(arena);
    } else { visible = true; started = true; initialize(); }
  });
  window.addEventListener('pagehide', () => { release(); stop(); });
  window.addEventListener('pageshow', run);
})();
