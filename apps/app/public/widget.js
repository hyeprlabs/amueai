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

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open chat");
  bubble.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "right:20px",
    "width:56px",
    "height:56px",
    "border-radius:9999px",
    "border:none",
    "background:#111827",
    "color:#fff",
    "font-size:24px",
    "cursor:pointer",
    "box-shadow:0 8px 24px rgba(0,0,0,0.2)",
    "z-index:2147483000",
  ].join(";");
  bubble.textContent = "💬";

  var frame = document.createElement("iframe");
  frame.src = origin + "/embed/" + encodeURIComponent(agentId);
  frame.title = "Chat";
  frame.style.cssText = [
    "position:fixed",
    "bottom:88px",
    "right:20px",
    "width:min(380px, calc(100vw - 40px))",
    "height:min(600px, calc(100vh - 120px))",
    "border:none",
    "border-radius:12px",
    "box-shadow:0 8px 24px rgba(0,0,0,0.2)",
    "z-index:2147483000",
    "display:none",
    "background:#fff",
  ].join(";");

  var open = false;
  bubble.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    bubble.textContent = open ? "✕" : "💬";
  });

  document.body.appendChild(frame);
  document.body.appendChild(bubble);
})();
