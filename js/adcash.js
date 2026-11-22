(function () {
  "use strict";

  var slots = document.querySelectorAll(".mta-ad-slot[data-ad-zone]");
  if (!slots.length) return;

  Array.prototype.forEach.call(slots, function (slot) {
    var zoneId = slot.getAttribute("data-ad-zone");
    if (!zoneId) return;

    if (!window.aclib || typeof window.aclib.runBanner !== "function") {
      slot.setAttribute("data-ad-status", "library-unavailable");
      return;
    }

    // Adcash renders each banner inside the parent of its runBanner script.
    var bannerScript = document.createElement("script");
    bannerScript.type = "text/javascript";
    bannerScript.text = "aclib.runBanner({ zoneId: '" + zoneId + "' });";
    slot.appendChild(bannerScript);
    slot.setAttribute("data-ad-status", "requested");
  });
})();
