(function () {
  "use strict";

  var slots = Array.prototype.slice.call(
    document.querySelectorAll(".mta-ad-slot[data-ad-zone]")
  );
  if (!slots.length) return;

  function isVisibleSlot(slot) {
    return slot.isConnected && !slot.closest("[hidden]");
  }

  function runSlot(slot) {
    if (!isVisibleSlot(slot)) return false;
    if (slot.getAttribute("data-ad-status") === "requested") return true;

    var zoneId = slot.getAttribute("data-ad-zone");
    if (!zoneId || !window.aclib || typeof window.aclib.runBanner !== "function") {
      return false;
    }

    // Adcash detects the banner placement from the parent of this script.
    // Keep the provider call in a real script node; never inject it as page text.
    var bannerScript = document.createElement("script");
    bannerScript.type = "text/javascript";
    bannerScript.textContent = "aclib.runBanner({ zoneId: " + JSON.stringify(zoneId) + " });";
    slot.appendChild(bannerScript);
    slot.setAttribute("data-ad-status", "requested");
    return true;
  }

  function initializeVisibleSlots() {
    slots.forEach(runSlot);
  }

  // The carousel's advertising slide starts hidden. Initialize its banner only
  // after the slide is made visible, otherwise some ad formats measure 0x0.
  window.addEventListener("mta:carouselchange", initializeVisibleSlots);
  window.addEventListener("load", initializeVisibleSlots);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) initializeVisibleSlots();
  });

  var attempts = 0;
  function waitForAdcash() {
    initializeVisibleSlots();
    var pending = slots.some(function (slot) {
      return isVisibleSlot(slot) && slot.getAttribute("data-ad-status") !== "requested";
    });
    if (!pending) return;
    attempts += 1;
    if (attempts < 60) {
      window.setTimeout(waitForAdcash, 250);
    } else {
      slots.forEach(function (slot) {
        if (isVisibleSlot(slot) && slot.getAttribute("data-ad-status") !== "requested") {
          slot.setAttribute("data-ad-status", "library-unavailable");
        }
      });
    }
  }

  waitForAdcash();
})();