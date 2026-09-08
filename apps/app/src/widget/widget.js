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
    "iframe{position:fixed;bottom:20px;" +
    side +
    ":20px;width:64px;height:64px;border:0;border-radius:9999px;background:transparent;" +
    "transition:width .15s ease,height .15s ease,border-radius .15s ease;" +
    "z-index:2147483647}" +
    "iframe[data-open]{width:min(400px,calc(100vw - 40px));height:min(620px,calc(100vh - 128px));" +
    "border-radius:16px}" +
    "@media (max-width:480px){iframe[data-open]{inset:0;width:100%;height:100%;border-radius:0}}" +
    "@media (prefers-reduced-motion:reduce){iframe{transition:none}}";

  function init() {
    var host = document.createElement("div");
    var shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = "<style>" + CSS + "</style>";
    document.body.appendChild(host);

    var iframe = document.createElement("iframe");
    iframe.src =
      origin + "/embed/" + encodeURIComponent(agentId) + (side === "left" ? "?side=left" : "");
    iframe.title = "Chat";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
    shadow.appendChild(iframe);

    window.addEventListener("message", function (event) {
      if (event.origin !== origin || !event.data) return;
      if (event.data.type === "amueai:open") iframe.toggleAttribute("data-open", true);
      if (event.data.type === "amueai:close") iframe.toggleAttribute("data-open", false);
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
