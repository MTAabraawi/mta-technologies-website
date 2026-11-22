(function () {
  "use strict";
  var root = document.querySelector("[data-mta-carousel]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-to]"));
  var previous = root.querySelector("[data-carousel-prev]");
  var next = root.querySelector("[data-carousel-next]");
  var pause = root.querySelector("[data-carousel-pause]");
  var index = 0;
  var timer = null;
  var paused = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var delay = Math.max(5000, Number(root.getAttribute("data-autoplay")) || 8500);

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
  }
  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  function start() {
    stop();
    if (paused || document.hidden) return;
    timer = window.setInterval(function () { show(index + 1); }, delay);
  }
  function move(step) { show(index + step); start(); }
  if (previous) previous.addEventListener("click", function () { move(-1); });
  if (next) next.addEventListener("click", function () { move(1); });
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.getAttribute("data-carousel-to")) || 0);
      start();
    });
  });
  if (pause) pause.addEventListener("click", function () {
    paused = !paused;
    pause.textContent = paused ? "▶" : "Ⅱ";
    pause.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    if (paused) stop(); else start();
  });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) start();
  });
  document.addEventListener("visibilitychange", start);
  window.addEventListener("mta:languagechange", function () { show(index); });
  show(0);
  start();
})();
