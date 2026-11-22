(function () {
  "use strict";
  var root = document.querySelector("[data-mta-carousel]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-to]"));
  var previous = root.querySelector("[data-carousel-prev]");
  var next = root.querySelector("[data-carousel-next]");
  var index = 0;
  var timer = null;
  var delay = Math.max(2500, Number(root.getAttribute("data-autoplay")) || 4200);
  var pointerStart = null;

  function show(nextIndex) {
    if (!slides.length) return;
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.hidden = !active;
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
    window.dispatchEvent(new CustomEvent("mta:carouselchange", { detail: { index: index } }));
  }
  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  function start() {
    stop();
    if (document.hidden || slides.length < 2) return;
    timer = window.setInterval(function () { show(index + 1); }, delay);
  }
  function move(step) {
    show(index + step);
    start();
  }
  if (previous) previous.addEventListener("click", function () { move(-1); });
  if (next) next.addEventListener("click", function () { move(1); });
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.getAttribute("data-carousel-to")) || 0);
      start();
    });
  });

  // Native touch scrolling remains vertical; horizontal gestures switch slides.
  root.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" || event.target.closest("a,button")) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  root.addEventListener("pointerup", function (event) {
    if (!pointerStart) return;
    var dx = event.clientX - pointerStart.x;
    var dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      move(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  root.addEventListener("pointercancel", function () { pointerStart = null; });
  root.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });
  window.addEventListener("mta:languagechange", function () { show(index); });
  show(0);
  start();
})();