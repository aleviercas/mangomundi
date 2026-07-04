/**
 * mangomundi embeddable widget loader.
 *
 * Usage — drop this one line where the widget should appear:
 *   <script src="https://mangomundi.com/widget.js"
 *           data-currency="USD" data-lang="auto" async></script>
 *
 * Optional data-* attributes:
 *   data-currency  Sending currency preset (e.g. "USD", "EUR"). Default: geo-detected.
 *   data-amount    Amount preset (e.g. "1000"). Default: 1000.
 *   data-lang      UI language ("es", "de", …) or "auto" to detect. Default: auto.
 *   data-max-width Max widget width in px. Default: 440.
 *   data-height    Widget height in px. Default: 600.
 *
 * The widget renders in an isolated iframe (no CSS/JS collisions with your page)
 * and scrolls internally. No tracking is added to your site.
 */
(function () {
  var ORIGIN = "https://mangomundi.com";
  var s = document.currentScript;
  if (!s) return;

  function attr(name, fallback) {
    var v = s.getAttribute("data-" + name);
    return v === null || v === "" ? fallback : v;
  }

  var params = [];
  var currency = attr("currency", "");
  var amount = attr("amount", "");
  var lang = attr("lang", "auto");
  if (currency) params.push("currency=" + encodeURIComponent(currency));
  if (amount) params.push("amount=" + encodeURIComponent(amount));
  if (lang && lang !== "auto") params.push("lang=" + encodeURIComponent(lang));

  var maxWidth = parseInt(attr("max-width", "440"), 10) || 440;
  var height = parseInt(attr("height", "600"), 10) || 600;

  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/embed" + (params.length ? "?" + params.join("&") : "");
  iframe.title = "Currency comparison by mangomundi";
  iframe.loading = "lazy";
  iframe.setAttribute("frameborder", "0");
  iframe.style.cssText =
    "width:100%;max-width:" +
    maxWidth +
    "px;height:" +
    height +
    "px;border:0;border-radius:16px;" +
    "box-shadow:0 20px 60px -25px rgba(15,23,42,0.25);display:block;";

  // Insert in place of the script tag so it lands exactly where it was pasted.
  s.parentNode.insertBefore(iframe, s);
})();
