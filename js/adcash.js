(function () {
  "use strict";

  var slots = Array.prototype.slice.call(document.querySelectorAll(".mta-ad-slot[data-ad-zone]"));
  if (!slots.length) return;
  var attempts = 0;
  var maxAttempts = 60;
  var retryDelay = 500;

  function isVisibleSlot(slot) {
    return slot.isConnected && !slot.closest("[hidden]") &&
      slot.getClientRects().length > 0 && getComputedStyle(slot).visibility !== "hidden";
  }

  function markRendered(slot) {
    if (slot.querySelector("iframe, img, a[href]")) {
      slot.setAttribute("data-ad-status", "rendered");
      return true;
    }
    return false;
  }

  function runSlot(slot, position) {
    if (!isVisibleSlot(slot)) return false;
    var status = slot.getAttribute("data-ad-status");
    if (status === "request-sent" || status === "rendered" || status === "no-fill") return true;
    var zoneId = slot.getAttribute("data-ad-zone");
    if (!zoneId || !window.aclib || typeof window.aclib.runBanner !== "function") return false;

    if (!slot.id) slot.id = "mta-ad-slot-" + (position + 1);
    slot.setAttribute("data-ad-status", "requesting");

    if ("MutationObserver" in window) {
      var observer = new MutationObserver(function () {
        if (markRendered(slot)) observer.disconnect();
      });
      observer.observe(slot, { childList: true, subtree: true });
    }

    // Adcash documents renderIn for banners placed inside a specific element.
    // Keep the execution node in the slot so the provider can complete its work.
    var bannerScript = document.createElement("script");
    bannerScript.type = "text/javascript";
    bannerScript.hidden = true;
    bannerScript.text = "aclib.runBanner({ zoneId: " + JSON.stringify(zoneId) +
      ", renderIn: " + JSON.stringify("#" + slot.id) + " });";
    try {
      slot.appendChild(bannerScript);
      slot.setAttribute("data-ad-status", "request-sent");
    } catch (error) {
      slot.setAttribute("data-ad-status", "script-error");
      return false;
    }

    window.setTimeout(function () {
      if (!markRendered(slot) && slot.getAttribute("data-ad-status") === "request-sent") {
        slot.setAttribute("data-ad-status", "no-fill");
      }
    }, 15000);
    return true;
  }

  function initializeVisibleSlots() {
    slots.forEach(function (slot, index) { runSlot(slot, index); });
  }

  window.addEventListener("mta:carouselchange", initializeVisibleSlots);
  window.addEventListener("load", initializeVisibleSlots);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) initializeVisibleSlots();
  });

  function waitForAdcash() {
    initializeVisibleSlots();
    var pending = slots.some(function (slot) {
      return isVisibleSlot(slot) && !["request-sent", "rendered", "no-fill", "script-error"].includes(slot.getAttribute("data-ad-status"));
    });
    if (!pending) return;
    attempts += 1;
    if (attempts < maxAttempts) window.setTimeout(waitForAdcash, retryDelay);
    else slots.forEach(function (slot) {
      if (isVisibleSlot(slot) && !slot.hasAttribute("data-ad-status")) {
        slot.setAttribute("data-ad-status", "library-unavailable");
      }
    });
  }

  waitForAdcash();
})();