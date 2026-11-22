(function () {
  "use strict";

  var slots = Array.prototype.slice.call(
    document.querySelectorAll(".mta-ad-slot[data-ad-zone]")
  );
  if (!slots.length) return;

  function isVisibleSlot(slot) {
    return slot.isConnected && !slot.closest("[hidden]");
  }

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
  }

  function runSlot(slot) {
    if (!isVisibleSlot(slot)) return false;
    if (slot.getAttribute("data-ad-status") === "requested") return true;

    var zoneId = isMobileViewport()
      ? (slot.getAttribute("data-ad-zone-mobile") || slot.getAttribute("data-ad-zone"))
      : slot.getAttribute("data-ad-zone");
    if (!zoneId || !window.aclib || typeof window.aclib.runBanner !== "function") {
      return false;
    }

    // Adcash uses the executing script's parent as the banner container.
    // Execute it inside the slot, then remove the source node immediately so
    // provider code and zone identifiers can never be rendered as page text.
    var bannerScript = document.createElement("script");
    bannerScript.type = "text/javascript";
    bannerScript.text = "aclib.runBanner({ zoneId: " + JSON.stringify(zoneId) + " });";
    slot.appendChild(bannerScript);
    if (bannerScript.parentNode) bannerScript.parentNode.removeChild(bannerScript);
    slot.setAttribute("data-ad-status", "requested");
    return true;
  }

  function initializeVisibleSlots() {
    slots.forEach(runSlot);
  }

  // Hidden carousel slides are initialized only when they become visible.
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
