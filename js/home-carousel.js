(function () {
  "use strict";
  var root = document.querySelector("[data-mta-carousel]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-to]"));
  var previous = root.querySelector("[data-carousel-prev]");
  var next = root.querySelector("[data-carousel-next]");
  if (!slides.length) return;

  var index = 0;
  var timer = null;
  var delay = Math.max(2500, Number(root.getAttribute("data-autoplay")) || 5200);
  var touchStart = null;
  var suppressClickUntil = 0;

  function show(nextIndex) {
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

  root.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" || event.target.closest("button")) return;
    touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });
  root.addEventListener("pointerup", function (event) {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    var dx = event.clientX - touchStart.x;
    var dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    suppressClickUntil = Date.now() + 450;
    move(dx < 0 ? 1 : -1);
  }, { passive: true });
  root.addEventListener("click", function (event) {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil = 0;
    }
  }, true);

  document.addEventListener("visibilitychange", start);
  window.addEventListener("mta:languagechange", function () { show(index); });
  show(0);
  start();
})();