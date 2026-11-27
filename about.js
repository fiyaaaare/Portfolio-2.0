/*!
 * About section  -  about.js
 *
 * - The ID card drops in once when the section scrolls into view, then settles into a gentle swing.
 *
 * Expected markup: see about.html  ( [data-about] > .id-stage > .id-anchor > .id-rig )
 */
(function () {
  'use strict';

  var section = document.querySelector('[data-about]');
  if (!section) return;
  var stage  = section.querySelector('.id-stage');
  var rig    = section.querySelector('.id-rig');
  if (!stage || !rig) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- tuning ---------------- */
  var STIFF    = 7.5;        // pendulum stiffness  (bigger = quicker swing)
  var DAMP     = reduce ? 4 : 0.75;   // air drag    (bigger = settles sooner)
  var GRAVITY  = 4200;       // px/s^2 for the drop
  var REST     = -0.045;     // resting tilt in radians (tiny lean, like the mock-up)
  var MAX_ANG  = 1.25;       // can't be swung further than this (~72deg)
  /* ---------------- state ---------------- */
  var th = REST, w = 0;      // angle (rad) and angular velocity (rad/s)
  var y = 0, vy = 0;         // vertical offset (px) and speed, used for the drop
  var falling = false, shown = false;
  var raf = 0, lastT = 0, rigH = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function measure() { rigH = rig.offsetHeight; }
  function render() { rig.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) rotate(' + th.toFixed(4) + 'rad)'; }

  function hide() {            // park the card above the section
    y = -(rigH + 80); vy = 0; th = REST; w = 0; falling = false; render();
  }

  /* ---------------- simulation ---------------- */
  function step(dt) {
    w += (-STIFF * Math.sin(th - REST) - DAMP * w) * dt;
    th += w * dt;
    if (th > MAX_ANG || th < -MAX_ANG) { th = clamp(th, -MAX_ANG, MAX_ANG); w *= -0.3; }
    if (falling) {
      vy += GRAVITY * dt; y += vy * dt;
      if (y >= 0) {                              // the lanyard goes taut
        y = 0;
        if (vy > 380) {
          if (!reduce) w += (Math.random() < 0.5 ? -1 : 1) * Math.min(1.1, vy / 2200);
          vy = -vy * 0.32;                       // little rebound
        } else { vy = 0; falling = false; }
      }
    }
  }

  function active() {
    return falling || Math.abs(w) > 0.004 || Math.abs(th - REST) > 0.0008;
  }

  function frame(t) {
    raf = 0;
    var dt = Math.min(0.033, (t - lastT) / 1000 || 0.016); lastT = t;
    step(dt / 2); step(dt / 2);
    render();
    if (active()) raf = requestAnimationFrame(frame);
    else { th = REST; w = 0; render(); }
  }
  function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------------- drop on scroll ---------------- */
  function drop() {
    hide();
    if (reduce) { y = 0; render(); return; }
    falling = true; kick();
  }

  var io = new IntersectionObserver(function (entries) {
    var e = entries[entries.length - 1];
    if (!shown && e.isIntersecting && e.intersectionRatio >= 0.35) {
      shown = true;
      section.classList.add('is-in');
      io.unobserve(stage);
      setTimeout(drop, 120);
    }
  }, { threshold: [0, 0.35] });

  /* ---------------- init ---------------- */
  section.classList.add('is-armed');
  measure(); hide();
  rig.classList.add('is-ready');
  window.addEventListener('resize', function () { measure(); if (!shown) hide(); });
  if (window.ResizeObserver) new ResizeObserver(measure).observe(rig);
  io.observe(stage);
})();
