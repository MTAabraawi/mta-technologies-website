(() => {
  if (window.MTA_MARKETPLACE_PORTAL_ENABLED === true) return;
  const isEnglish = document.documentElement.lang === "en";
  const message = isEnglish
    ? "Developer submissions, uploads, moderation, and credential issuance are temporarily disabled. Private file storage, verified sign-in, and the signing key are not configured. No payment or public file hosting is enabled."
    : "تم إيقاف استقبال طلبات المطورين والرفع والمراجعة وإصدار البطاقات مؤقتاً. لم يتم إعداد التخزين الخاص وتسجيل الدخول الموثق ومفتاح التوقيع بعد. لا توجد مدفوعات أو استضافة عامة للملفات.";
  const main = document.querySelector("main");
  if (main) {
    const notice = document.createElement("div");
    notice.className = "notice notice-warning";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    main.insertBefore(notice, main.firstChild);
  }
  const disable = (selector) => document.querySelectorAll(selector).forEach((control) => {
    control.disabled = true;
    control.setAttribute("aria-disabled", "true");
  });
  disable("#submission-form input, #submission-form select, #submission-form textarea, #submission-form button");
  disable("#portal-login-btn, #refresh-submissions");
  disable("#cert-request input, #cert-request select, #cert-request textarea, #cert-request button, #load-certs");
  disable("#admin-refresh, #cert-refresh");
  document.querySelectorAll("#admin-queue button, #cert-requests button, #issued-list button").forEach((control) => {
    control.disabled = true;
    control.setAttribute("aria-disabled", "true");
  });
})();