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
 *   data-max-width Max widget width in px. Default: 360.
 *   data-height    Widget height in px. Default: 560.
 *
 * The widget renders in an isolated iframe (no CSS/JS collisions with your
 * page) sized to fit its content without scrolling at the default 360×560.
 * (Was 540 — docs/kayak-redesign-spec.md §5.2: el formulario apilado gana
 * ~20px con el CTA como fila propia a sangre de la tarjeta.)
 * No tracking is added to your site.
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

  var maxWidth = parseInt(attr("max-width", "360"), 10) || 360;
  var height = parseInt(attr("height", "560"), 10) || 560;

  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/embed" + (params.length ? "?" + params.join("&") : "");
  iframe.title = "Currency comparison by mangomundi";
  iframe.loading = "lazy";
  iframe.setAttribute("frameborder", "0");
  // docs/kayak-redesign-spec.md §5.1 — geometría de buscador: radio 8
  // (--radius-compact) y la sombra corta de dos capas (--shadow-compare),
  // en vez del radio 16 + sombra difusa de 60px que hacía que el widget se
  // leyera como una tarjeta de marketing flotando sobre la página del
  // tercero, en vez de como un buscador embebido.
  //
  // Los valores van escritos LITERALES a propósito: este loader corre en la
  // página del tercero, fuera del bundle, y no tiene forma de leer los
  // tokens de src/styles.css. Es la única excepción autorizada a la regla
  // "nunca hardcodear un token" de docs/design-system.md. Si cambian
  // --radius-compact o --shadow-compare, hay que cambiarlos acá también.
  iframe.style.cssText =
    "width:100%;max-width:" +
    maxWidth +
    "px;height:" +
    height +
    "px;border:0;border-radius:8px;" +
    "box-shadow:0 3px 6px rgba(25,32,36,0.16),0 -1px 4px rgba(25,32,36,0.04);display:block;";

  // Insert in place of the script tag so it lands exactly where it was pasted.
  s.parentNode.insertBefore(iframe, s);
})();
