(function () {
  "use strict";

  var slot = document.querySelector(".mta-ad-slot");
  if (!slot) return;

  var isMobile = window.matchMedia
    ? window.matchMedia("(max-width: 767px)").matches
    : window.innerWidth < 768;
  var zoneId = isMobile ? "12478782" : "12478774";

  if (!window.aclib || typeof window.aclib.runBanner !== "function") {
    slot.setAttribute("data-ad-status", "library-unavailable");
    return;
  }

  // Adcash detects the placement from the script element's parent container.
  // Keep the provider call in a script element so its source is never rendered as page text.
  var bannerScript = document.createElement("script");
  bannerScript.type = "text/javascript";
  bannerScript.text = "aclib.runBanner({ zoneId: '" + zoneId + "' });";
  slot.appendChild(bannerScript);
  slot.setAttribute("data-ad-status", "requested");
})();
