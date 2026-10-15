// Both notification pages use the database timestamp, displayed in Philippine time.
(function () {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  function createElement(epochSeconds) {
    if (epochSeconds === null || epochSeconds === undefined || epochSeconds === "") return null;
    const date = new Date(Number(epochSeconds) * 1000);
    if (!Number.isFinite(date.getTime())) return null;
    const time = document.createElement("time");
    time.className = "notification-timestamp";
    time.dateTime = date.toISOString();
    time.textContent = `${formatter.format(date)} (PHT)`;
    return time;
  }

  window.ProfConsultNotificationTime = { createElement };
})();
