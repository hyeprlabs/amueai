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
    "iframe{position:fixed;bottom:16px;" +
    side +
    ":16px;width:56px;height:56px;border:0;border-radius:9999px;color-scheme:dark;" +
    "background:#1a1a1a;background:oklch(0.205 0 0);" +
    "box-shadow:0 8px 24px rgba(0,0,0,.24);z-index:2147483647}" +
    "iframe[data-open]{width:min(400px,calc(100vw - 32px));height:min(664px,calc(100vh - 32px));" +
    "border-radius:16px;background:transparent;box-shadow:none}" +
    "@media (max-width:480px){iframe[data-open]{inset:0;width:100%;height:100%;" +
    "border-radius:0;box-shadow:none}}";

  function init() {
    var host = document.createElement("div");
    var shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = "<style>" + CSS + "</style>";
    document.body.appendChild(host);

    var params = [];
    if (side === "left") params.push("side=left");
    if (window.matchMedia("(max-width: 480px)").matches) params.push("mobile=1");

    var iframe = document.createElement("iframe");
    iframe.src =
      origin +
      "/embed/" +
      encodeURIComponent(agentId) +
      (params.length ? "?" + params.join("&") : "");
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
