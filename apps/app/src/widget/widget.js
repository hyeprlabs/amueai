(function () {
    "use strict";

    try {
      run();
    } catch (e) {}

  function run() {
    if (window.__amueai) return;
    window.__amueai = true;

    var script = document.currentScript;
    if (!script) return;

    var agentId = script.getAttribute("data-agent-id");
    if (!agentId) return;

    var origin = new URL(script.src).origin;
    var side = script.getAttribute("data-position") === "bottom-left" ? "left" : "right";
    var sideProp = side === "left" ? "left" : "right";

    var CHAT_ICON =
      '<svg class="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    var CLOSE_ICON =
      '<svg class="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';

    var CSS =
      ":host{all:initial}" +
      "*{box-sizing:border-box}" +
      "button{font:inherit}" +
      ".btn{position:fixed;bottom:16px;" +
      sideProp +
      ":16px;width:56px;height:56px;border:0;border-radius:9999px;background:oklch(0.205 0 0);" +
      "color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.24);cursor:pointer;display:flex;" +
      "align-items:center;justify-content:center;z-index:2147483647;" +
      "transition:transform .15s ease;-webkit-tap-highlight-color:transparent}" +
      ".btn:hover{transform:scale(1.05)}.btn:active{transform:scale(.95)}" +
      ".btn:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
      ".btn svg{width:24px;height:24px;position:absolute}" +
      ".btn .i-close{opacity:0;transform:scale(.5) rotate(-45deg)}" +
      ".btn[data-open] .i-chat{opacity:0;transform:scale(.5) rotate(45deg)}" +
      ".btn[data-open] .i-close{opacity:1;transform:none}" +
      ".btn svg{transition:opacity .15s ease,transform .15s ease}" +
      ".panel{position:fixed;bottom:84px;" +
      sideProp +
      ":16px;width:min(400px,calc(100vw - 32px));height:min(640px,calc(100vh - 120px));" +
      "border-radius:16px;overflow:hidden;overscroll-behavior:contain;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.24);" +
      "background:oklch(0.145 0 0);opacity:0;transform:translateY(12px) scale(.97);" +
      "pointer-events:none;transition:opacity .18s ease,transform .18s ease;" +
      "z-index:2147483647;display:flex;align-items:center;justify-content:center}" +
      ".panel[data-open]{opacity:1;transform:none;pointer-events:auto}" +
      ".panel iframe{width:100%;height:100%;border:0;opacity:0;transition:opacity .15s ease}" +
      ".panel iframe[data-ready]{opacity:1}" +
      ".spin{width:22px;height:22px;border-radius:9999px;border:2.5px solid rgba(255,255,255,.2);" +
      "border-top-color:#fff;animation:amspin .6s linear infinite;position:absolute}" +
      ".panel[data-ready] .spin,.panel[data-err] .spin{display:none}" +
      ".err{display:none;position:absolute;flex-direction:column;align-items:center;gap:10px;" +
      "max-width:240px;padding:24px;text-align:center;color:#fff;" +
      "font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}" +
      ".panel[data-err] .err{display:flex}" +
      ".err button{border:0;border-radius:9999px;background:#fff;color:#000;padding:8px 16px;" +
      "font:13px/1 inherit;font-weight:500;cursor:pointer}" +
      "@keyframes amspin{to{transform:rotate(360deg)}}" +
      "@media(max-width:480px){.panel{inset:0;bottom:0;width:100%;height:100%;" +
      "border-radius:0;box-shadow:none;transition:transform .22s cubic-bezier(.32,.72,0,1);" +
      "transform:translateY(100%)}.btn[data-open]{display:none}}";

    function isMobile() {
      return window.matchMedia("(max-width: 480px)").matches;
    }

    function init() {
      var host = document.createElement("div");
      var shadow = host.attachShadow({ mode: "closed" });
      shadow.innerHTML =
        "<style>" +
        CSS +
        '</style><button class="btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Open chat">' +
        CHAT_ICON +
        CLOSE_ICON +
        '</button><div class="panel" role="dialog" aria-label="Chat" aria-hidden="true">' +
        '<div class="spin" role="status" aria-label="Loading"></div>' +
        '<div class="err"><span>Chat couldn’t load.</span><button type="button">Try again</button></div>' +
        "</div>";
      document.body.appendChild(host);

      var btn = shadow.querySelector(".btn");
      var panel = shadow.querySelector(".panel");
      var retryBtn = shadow.querySelector(".err button");
      var iframe = null;
      var open = false;
      var loadTimer = null;
      var vvFrame = null;
      var lock = null;

      var link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      document.head.appendChild(link);

      function embedUrl() {
        return origin + "/embed/" + encodeURIComponent(agentId);
      }

      function createIframe() {
        if (iframe) return;
        panel.removeAttribute("data-err");
        iframe = document.createElement("iframe");
        iframe.title = "Chat";
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
        iframe.onerror = fail;
        iframe.src = embedUrl();
        panel.appendChild(iframe);
      }

      function armTimer() {
        if (panel.hasAttribute("data-ready")) return;
        window.clearTimeout(loadTimer);
        loadTimer = window.setTimeout(fail, 10000);
      }

      function fail() {
        window.clearTimeout(loadTimer);
        panel.setAttribute("data-err", "");
      }

      function ready() {
        window.clearTimeout(loadTimer);
        panel.removeAttribute("data-err");
        panel.setAttribute("data-ready", "");
        if (iframe) iframe.setAttribute("data-ready", "");
      }

      function positionForKeyboard() {
        if (!open || !isMobile() || !window.visualViewport) return;
        var vv = window.visualViewport;
        panel.style.top = vv.offsetTop + "px";
        panel.style.height = vv.height + "px";
      }

      function schedulePosition() {
        if (vvFrame) return;
        vvFrame = window.requestAnimationFrame(function () {
          vvFrame = null;
          positionForKeyboard();
        });
      }

      function resetPosition() {
        panel.style.top = "";
        panel.style.height = "";
      }

      function lockScroll() {
        if (lock) return;
        var body = document.body;
        var html = document.documentElement;
        lock = {
          y: window.scrollY || window.pageYOffset || 0,
          position: body.style.position,
          top: body.style.top,
          left: body.style.left,
          right: body.style.right,
          width: body.style.width,
          overflow: body.style.overflow,
          htmlOverflow: html.style.overflow,
        };
        body.style.position = "fixed";
        body.style.top = -lock.y + "px";
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
        body.style.overflow = "hidden";
        html.style.overflow = "hidden";
      }

      function unlockScroll() {
        if (!lock) return;
        var body = document.body;
        var html = document.documentElement;
        body.style.position = lock.position;
        body.style.top = lock.top;
        body.style.left = lock.left;
        body.style.right = lock.right;
        body.style.width = lock.width;
        body.style.overflow = lock.overflow;
        html.style.overflow = lock.htmlOverflow;
        window.scrollTo(0, lock.y);
        lock = null;
      }

      function setOpen(next) {
        open = next;
        btn.toggleAttribute("data-open", next);
        btn.setAttribute("aria-expanded", String(next));
        btn.setAttribute("aria-label", next ? "Close chat" : "Open chat");
        panel.toggleAttribute("data-open", next);
        panel.setAttribute("aria-hidden", String(!next));
        if (next) {
          if (isMobile()) lockScroll();
          createIframe();
          armTimer();
          positionForKeyboard();
          window.setTimeout(function () {
            if (iframe) iframe.focus();
          }, 200);
        } else {
          unlockScroll();
          resetPosition();
        }
      }

      btn.addEventListener("click", function () {
        setOpen(!open);
      });

      retryBtn.addEventListener("click", function () {
        if (iframe) {
          panel.removeChild(iframe);
          iframe = null;
        }
        createIframe();
        armTimer();
      });

      var warm = function () {
        createIframe();
        btn.removeEventListener("pointerenter", warm);
        btn.removeEventListener("focus", warm);
      };
      btn.addEventListener("pointerenter", warm);
      btn.addEventListener("focus", warm);

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && open) setOpen(false);
      });

      document.addEventListener("click", function (event) {
        if (open && event.composedPath().indexOf(host) === -1) setOpen(false);
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", schedulePosition);
        window.visualViewport.addEventListener("scroll", schedulePosition);
      }

      window.addEventListener("message", function (event) {
        if (event.origin !== origin || !event.data) return;
        if (event.data.type === "amueai:ready") ready();
        if (event.data.type === "amueai:close") setOpen(false);
      });
    }

    function safeInit() {
      try {
        init();
      } catch (e) {}
    }

    if (document.body) safeInit();
    else document.addEventListener("DOMContentLoaded", safeInit);
  }
})();
