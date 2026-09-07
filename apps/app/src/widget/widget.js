// AmueAI embeddable widget loader.
//
// Hand-written vanilla JS, zero dependencies, on purpose: this file is
// fetched by every visitor of every customer site that embeds an agent, so
// its size and its cost on the host page's own critical rendering path
// matter more than almost any other asset in the product. Do not import a
// bundler runtime, a framework, or a shared util module into this file -
// `scripts/build-widget.mjs` enforces a 5kb-gzipped budget on exactly this
// source and fails the build if it's exceeded.
//
// Architecture: a closed Shadow DOM host holds only the always-present
// launcher button (near-zero cost). The full Next.js chat app is a
// cross-origin iframe created lazily on first click, never on page load,
// so an embed that's never opened costs the host page nothing beyond this
// script tag.
(function () {
  "use strict";

  var currentScript = document.currentScript;
  if (!currentScript) return;

  var agentId = currentScript.getAttribute("data-agent-id");
  if (!agentId) {
    console.error("[AmueAI widget] missing data-agent-id attribute");
    return;
  }

  var origin = new URL(currentScript.src).origin;
  var position = currentScript.getAttribute("data-position") || "bottom-right";
  var side = position === "bottom-left" ? "left" : "right";
  var reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var LAUNCHER_CSS =
    ":host{all:initial}" +
    "button{position:fixed;bottom:20px;" +
    side +
    ":20px;width:56px;height:56px;min-width:44px;min-height:44px;" +
    "border-radius:9999px;border:0;background:#111827;color:#fff;font-size:24px;" +
    "line-height:56px;text-align:center;padding:0;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.2);font-family:system-ui,sans-serif}" +
    "button:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
    ".amueai-fallback{position:fixed;bottom:88px;" +
    side +
    ":20px;max-width:280px;padding:12px 14px;border-radius:12px;background:#fff;" +
    "color:#111827;font:13px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.16)}";

  function floatingIframeCss() {
    return (
      "border:0;position:fixed;bottom:90px;" +
      side +
      ":20px;width:min(380px, calc(100vw - 40px));height:0;opacity:0;" +
      "border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.16);z-index:1;" +
      (reducedMotion ? "" : "transition:opacity 150ms ease, height 150ms ease;")
    );
  }

  var FULLSCREEN_CSS =
    "border:0;position:fixed;inset:0;width:100%;height:100%;" +
    "border-radius:0;box-shadow:none;opacity:1;z-index:1;";

  function init() {
    var host = document.createElement("div");
    host.style.cssText = "position:fixed;z-index:2147483647";
    var shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML =
      "<style>" +
      LAUNCHER_CSS +
      "</style>" +
      '<button aria-label="Open chat" aria-expanded="false" id="launcher" type="button">\u{1F4AC}</button>';
    document.body.appendChild(host);

    var launcher = shadow.getElementById("launcher");
    var iframe = null;
    var isOpen = false;
    var isFullscreen = false;
    var loadTimer = null;

    function showFallback(message) {
      var el = document.createElement("div");
      el.className = "amueai-fallback";
      el.setAttribute("role", "alert");
      el.textContent = message;
      shadow.appendChild(el);
      window.setTimeout(function () {
        el.remove();
      }, 6000);
    }

    function createIframe() {
      var el = document.createElement("iframe");
      el.src = origin + "/embed/" + encodeURIComponent(agentId);
      el.title = "Chat";
      el.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
      el.loading = "lazy";
      el.style.cssText = floatingIframeCss();

      loadTimer = window.setTimeout(function () {
        showFallback("Chat isn't available right now - please try again shortly.");
        el.remove();
        iframe = null;
        isOpen = false;
        launcher.setAttribute("aria-expanded", "false");
      }, 5000);

      el.addEventListener("load", function () {
        window.clearTimeout(loadTimer);
      });

      shadow.appendChild(el);
      return el;
    }

    function open() {
      if (!iframe) iframe = createIframe();
      isOpen = true;
      launcher.setAttribute("aria-expanded", "true");
      launcher.textContent = "✕";
      iframe.focus();
    }

    function close() {
      isOpen = false;
      launcher.setAttribute("aria-expanded", "false");
      launcher.textContent = "\u{1F4AC}";
      if (iframe) {
        iframe.style.cssText = isFullscreen ? "display:none" : floatingIframeCss();
      }
      launcher.focus();
    }

    launcher.addEventListener("click", function () {
      if (isOpen) close();
      else open();
    });

    window.addEventListener("message", function (event) {
      if (event.origin !== origin || !iframe) return;
      var data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "amueai:resize" && !isFullscreen) {
        var height = Math.min(data.height, window.innerHeight * 0.8);
        iframe.style.height = height + "px";
        iframe.style.opacity = "1";
      } else if (data.type === "amueai:fullscreen") {
        isFullscreen = !!data.value;
        iframe.style.cssText = isFullscreen ? FULLSCREEN_CSS : floatingIframeCss();
      } else if (data.type === "amueai:close") {
        close();
      }
    });
  }

  var idle =
    window.requestIdleCallback ||
    function (cb) {
      window.setTimeout(cb, 1);
    };

  if (document.readyState === "complete") idle(init);
  else
    window.addEventListener("load", function () {
      idle(init);
    });
})();
