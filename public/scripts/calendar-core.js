/**
 * Gedeelde kalender-UI (maandrooster, NL labels).
 * @param {typeof window} g
 */
(function (g) {
  var MONTHS = [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December",
  ];
  var WDAY = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  function iso(y, m1, d) {
    return y + "-" + String(m1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }

  /** Maandag = 0 … zondag = 6 (t.o.v. JS getDay) */
  function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  /**
   * @param {number} y
   * @param {number} m0 0–11
   * @param {Set<string>} booked
   * @param {{ interactive?: boolean, onToggle?: (iso: string) => void }} opts
   */
  function monthBlock(y, m0, booked, opts) {
    var interactive = !!(opts && opts.interactive);
    var onToggle = opts && opts.onToggle;
    var section = document.createElement("section");
    section.className = "cp-cal__month";
    section.setAttribute("aria-labelledby", "cp-cal-h-" + y + "-" + m0);

    var h = document.createElement("h2");
    h.className = "cp-cal__month-title";
    h.id = "cp-cal-h-" + y + "-" + m0;
    h.textContent = MONTHS[m0] + " " + y;
    section.appendChild(h);

    var head = document.createElement("div");
    head.className = "cp-cal__weekdays";
    for (var w = 0; w < 7; w++) {
      var wh = document.createElement("div");
      wh.className = "cp-cal__weekday";
      wh.textContent = WDAY[w];
      head.appendChild(wh);
    }
    section.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "cp-cal__days";
    if (interactive) {
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", "Dagen " + MONTHS[m0] + " " + y);
    }

    var first = new Date(y, m0, 1);
    var lead = mondayIndex(first.getDay());
    var dim = new Date(y, m0 + 1, 0).getDate();

    for (var p = 0; p < lead; p++) {
      var ph = document.createElement("div");
      ph.className = "cp-cal__pad";
      ph.setAttribute("aria-hidden", "true");
      grid.appendChild(ph);
    }

    for (var d = 1; d <= dim; d++) {
      var id = iso(y, m0 + 1, d);
      var isBooked = booked.has(id);
      var cell = document.createElement(interactive ? "button" : "div");
      cell.className = "cp-cal__day" + (isBooked ? " cp-cal__day--booked" : " cp-cal__day--free");
      cell.textContent = String(d);
      cell.setAttribute("data-date", id);
      if (interactive) {
        cell.type = "button";
        cell.setAttribute("aria-pressed", isBooked ? "true" : "false");
        cell.setAttribute(
          "aria-label",
          d + " " + MONTHS[m0] + " " + y + (isBooked ? ", gemarkeerd als bezet" : ", vrij")
        );
        cell.addEventListener("click", function (ev) {
          var t = ev.currentTarget;
          var ds = t.getAttribute("data-date");
          if (onToggle) onToggle(ds);
        });
      } else {
        cell.setAttribute("role", "img");
        cell.setAttribute("aria-label", d + " " + MONTHS[m0] + " " + y + (isBooked ? " bezet" : " vrij"));
      }
      grid.appendChild(cell);
    }

    var total = lead + dim;
    var tail = (7 - (total % 7)) % 7;
    for (var q = 0; q < tail; q++) {
      var pt = document.createElement("div");
      pt.className = "cp-cal__pad";
      pt.setAttribute("aria-hidden", "true");
      grid.appendChild(pt);
    }

    section.appendChild(grid);
    return section;
  }

  /** Vernieuw visuele staat van cellen in een maand-sectie */
  function syncMonth(section, booked) {
    var cells = section.querySelectorAll(".cp-cal__day[data-date]");
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var id = c.getAttribute("data-date");
      var isBooked = booked.has(id);
      c.classList.toggle("cp-cal__day--booked", isBooked);
      c.classList.toggle("cp-cal__day--free", !isBooked);
      if (c.tagName === "BUTTON") {
        c.setAttribute("aria-pressed", isBooked ? "true" : "false");
      }
    }
  }

  g.CpCal = {
    MONTHS: MONTHS,
    WDAY: WDAY,
    iso: iso,
    monthBlock: monthBlock,
    syncMonth: syncMonth,
  };
})(typeof window !== "undefined" ? window : globalThis);
