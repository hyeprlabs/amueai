(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var agentId = script.getAttribute("data-agent-id");
  if (!agentId) return;

  var origin = new URL(script.src).origin;
  var side = script.getAttribute("data-position") === "bottom-left" ? "left" : "right";

  var CSS =
    ":host{all:initial}" +
    "button{position:fixed;bottom:20px;" +
    side +
    ":20px;width:56px;height:56px;border-radius:9999px;border:0;background:#111827;" +
    "color:#fff;font:24px/56px system-ui,sans-serif;text-align:center;padding:0;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.2)}" +
    "button:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
    "iframe{position:fixed;bottom:88px;" +
    side +
    ":20px;width:min(400px,calc(100vw - 40px));height:min(620px,calc(100vh - 128px));" +
    "border:0;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.16);background:#fff;" +
    "opacity:0;transform:translateY(8px);pointer-events:none;visibility:hidden;" +
    "transition:opacity .15s ease,transform .15s ease,visibility .15s}" +
    "iframe[data-open]{opacity:1;transform:none;pointer-events:auto;visibility:visible}" +
    "@media (max-width:480px){iframe{inset:0;width:100%;height:100%;border-radius:0}}" +
    "@media (prefers-reduced-motion:reduce){iframe{transition:none}}";

  function init() {
    var host = document.createElement("div");
    host.style.cssText = "position:fixed;z-index:2147483647";
    var shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML =
      "<style>" +
      CSS +
      '</style><button aria-label="Open chat" aria-expanded="false" type="button">\u{1F4AC}</button>';
    document.body.appendChild(host);

    var launcher = shadow.querySelector("button");
    var iframe = null;

    function toggle(open) {
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.src = origin + "/embed/" + encodeURIComponent(agentId);
        iframe.title = "Chat";
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
        shadow.appendChild(iframe);
      }

      iframe.toggleAttribute("data-open", open);
      launcher.setAttribute("aria-expanded", String(open));
      launcher.textContent = open ? "✕" : "\u{1F4AC}";
      (open ? iframe : launcher).focus();
    }

    launcher.addEventListener("click", function () {
      toggle(!iframe || !iframe.hasAttribute("data-open"));
    });

    window.addEventListener("message", function (event) {
      if (event.origin === origin && event.data && event.data.type === "amueai:close")
        toggle(false);
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
