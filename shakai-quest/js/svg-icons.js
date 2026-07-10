(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function iconShell(inner, label) {
    return [
      '<svg viewBox="0 0 64 64" role="img" aria-label="', esc(label || "収蔵品"), '">',
      inner,
      '</svg>'
    ].join("");
  }

  function renderIcon(key, label) {
    var k = String(key || "generic");
    if (k.includes("globe") || k.includes("chikyugi")) {
      return iconShell('<circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="4"/><path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 48h24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>', label);
    }
    if (k.includes("japan") || k.includes("map")) {
      return iconShell('<path d="M39 9c4 4 1 8 5 11 4 4 8 5 7 10-1 6-8 4-9 10-1 5 4 7 0 11-4 3-9-1-12 2-4 3-10 4-13 0-3-5 3-8 1-13-2-4-8-4-7-9 1-5 7-5 10-8 4-4 3-10 8-13 3-2 7-3 10-1Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="34" cy="31" r="3" fill="currentColor"/>', label);
    }
    if (k.includes("levee") || k.includes("chisui")) {
      return iconShell('<path d="M8 43c8-8 14-8 24 0s16 8 24 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M12 36h40L42 18H22L12 36Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M24 36V22M32 36V22M40 36V22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', label);
    }
    if (k.includes("cabbage") || k.includes("yasai")) {
      return iconShell('<circle cx="25" cy="35" r="13" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="39" cy="33" r="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M18 36c5-7 11-8 19-2M31 29c5-5 11-5 18 1" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', label);
    }
    if (k.includes("matchlock") || k.includes("teppou")) {
      return iconShell('<path d="M9 35h31l8-8h7v8h-6l-7 12H25l-5-7H9v-5Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M31 35v12M44 31l8 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', label);
    }
    if (k.includes("tea") || k.includes("chaki")) {
      return iconShell('<path d="M18 27h27v11c0 8-6 13-14 13s-13-5-13-13V27Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M45 31h4c4 0 6 3 5 7-1 5-5 7-10 5M20 21h23M25 15h13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', label);
    }
    if (k.includes("ration") || k.includes("kippu")) {
      return iconShell('<path d="M14 13h36v38H14V13Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 23h24M20 32h24M20 41h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M43 13v38" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>', label);
    }
    if (k.includes("hood") || k.includes("zukin")) {
      return iconShell('<path d="M18 48V27c0-11 7-18 15-18s15 7 15 18v21H18Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M24 34c5 5 12 5 17 0M28 25h1M37 25h1" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>', label);
    }
    if (k.includes("ijin")) {
      return iconShell('<circle cx="32" cy="21" r="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M16 54c2-12 10-19 16-19s14 7 16 19H16Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M22 13c6-7 14-7 20 0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>', label);
    }
    if (k.includes("item") || k.includes("eq_")) {
      return iconShell('<path d="M16 18h32v32H16V18Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 18c0-6 5-10 12-10s12 4 12 10M25 34h14M32 27v14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>', label);
    }
    if (k.includes("world")) {
      return iconShell('<circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 24c4-4 10-4 14-1 3 3 9 1 12 5M18 38c6-2 10 2 15 4 5 2 8-3 13-1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>', label);
    }
    return iconShell('<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2 7-15Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>', label);
  }

  window.ShakaiUtil = { esc: esc };
  window.ShakaiIcons = {
    render: renderIcon,
    silhouette: function (label) {
      return iconShell('<circle cx="32" cy="24" r="10" fill="none" stroke="currentColor" stroke-width="4" opacity=".55"/><path d="M15 54c2-13 10-20 17-20s15 7 17 20H15Z" fill="none" stroke="currentColor" stroke-width="4" opacity=".55"/><path d="M18 14l28 36M46 14L18 50" stroke="currentColor" stroke-width="3" opacity=".32"/>', label || "未収集");
    },
    world: function () {
      return renderIcon("world", "世界路線");
    }
  };
}());
