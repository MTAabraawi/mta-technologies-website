(function () {
  "use strict";
  var slots = Array.prototype.slice.call(document.querySelectorAll(".mta-ad-slot[data-ad-zone]"));
  if (!slots.length) return;

  slots.forEach(function (slot, index) {
    if (!slot.id) slot.id = "mta-ad-slot-" + (index + 1);
    slot.setAttribute("data-ad-status", "waiting-library");
  });

  function isVisibleSlot(slot) {
    return slot.isConnected && !slot.closest("[hidden]") &&
      window.getComputedStyle(slot).display !== "none";
  }
  function isMobileViewport() {
    return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
  }
  function requestBanner(slot) {
    if (!isVisibleSlot(slot) || slot.getAttribute("data-ad-status") === "requested" ||
        slot.getAttribute("data-ad-status") === "rendered") return false;

    var zoneId = isMobileViewport()
      ? (slot.getAttribute("data-ad-zone-mobile") || slot.getAttribute("data-ad-zone"))
      : slot.getAttribute("data-ad-zone");
    if (!zoneId || !window.aclib || typeof window.aclib.runBanner !== "function") return false;

    try {
      slot.setAttribute("data-ad-status", "requesting");
      // Adcash Display zones support renderIn to target a specific page element.
      window.aclib.runBanner({
        zoneId: String(zoneId),
        renderIn: "#" + slot.id
      });
      slot.setAttribute("data-ad-status", "requested");
      window.dispatchEvent(new CustomEvent("mta:adstatus", {
        detail: { slot: slot.id, zone: String(zoneId), status: "requested" }
      }));
      return true;
    } catch (error) {
      slot.setAttribute("data-ad-status", "error");
      slot.setAttribute("data-ad-error", String(error && error.message || error));
      window.dispatchEvent(new CustomEvent("mta:adstatus", {
        detail: { slot: slot.id, zone: String(zoneId), status: "error" }
      }));
      return false;
    }
  }

  // Keep the slot state honest: a request is not the same as a served impression.
  if (window.MutationObserver) {
    slots.forEach(function (slot) {
      var observer = new MutationObserver(function () {
        var creative = slot.querySelector("iframe, ins, [data-ad], img[src]");
        if (creative && slot.getAttribute("data-ad-status") === "requested") {
          slot.setAttribute("data-ad-status", "creative-inserted");
        }
      });
      observer.observe(slot, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    });
  }

  function initializeVisibleSlots() {
    slots.forEach(requestBanner);
  }
  window.addEventListener("mta:carouselchange", initializeVisibleSlots);
  window.addEventListener("load", initializeVisibleSlots);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) initializeVisibleSlots();
  });
  window.addEventListener("resize", initializeVisibleSlots);

  var attempts = 0;
  function waitForLibrary() {
    initializeVisibleSlots();
    var waiting = slots.some(function (slot) {
      return isVisibleSlot(slot) && slot.getAttribute("data-ad-status") === "waiting-library";
    });
    if (!waiting) return;
    attempts += 1;
    if (attempts < 60) {
      window.setTimeout(waitForLibrary, 250);
    } else {
      slots.forEach(function (slot) {
        if (isVisibleSlot(slot) && slot.getAttribute("data-ad-status") === "waiting-library") {
          slot.setAttribute("data-ad-status", "library-unavailable");
        }
      });
      window.dispatchEvent(new CustomEvent("mta:adstatus", {
        detail: { status: "library-unavailable" }
      }));
    }
  }
  waitForLibrary();
})();