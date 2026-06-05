Date.prototype.timeNow = function() {
    return `${(this.getHours() < 10 ? "0" : "") + this.getHours()}-${this.getMinutes() < 10 ? "0" : ""}${this.getMinutes()}-${this.getSeconds() < 10 ? "0" : ""}${this.getSeconds()}`;
}, function() {
    const j = Math.min, a = Math.max;
    function S(j, a) {
        j.className.indexOf(a) >= 0 || (j.className = `${j.className} ${a}`);
    }
    function g(j, a) {
        j.className = j.className.replace(new RegExp(`\\b${a}\\b`, "g"), "");
    }
    function f() {
        x();
        const j = b.naturalWidth, a = b.naturalHeight, S = O();
        t.width = S.width > j ? j : S.width, t.height = S.height - 60 > a ? a : S.height - 60,
        Z.drawImage(b, 0, 0, j, a, 0, 0, t.width, t.height);
        const g = t.toDataURL(t);
        B.src = g;
    }
    function O() {
        return {
            width: a(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            height: a(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
    function x() {
        V = [], I = 0, i = null, y = null, c = !1, p = new Image, g(t, "crop"), S(q, "hide"),
        S(Q, "hide"), g(l, "hide"), t.removeEventListener("mousedown", D), t.removeEventListener("touchstart", D),
        t.removeEventListener("mousemove", e), t.removeEventListener("touchmove", e), t.removeEventListener("mouseup", Y),
        t.removeEventListener("touchend", Y);
    }
    function h() {
        Z.clearRect(0, 0, t.width, t.height), Z.drawImage(N, 0, 0);
    }
    function n() {
        N.width = t.width, N.height = t.height, N.getContext("2d").drawImage(t, 0, 0);
    }
    function A(j, a) {
        const S = Math.round, g = t.getBoundingClientRect();
        return {
            x: S(j) - g.left * (t.width / g.width),
            y: S(a) - g.top * (t.height / g.height)
        };
    }
    function s() {
        S(t, "crop"), g(q, "hide"), S(l, "hide"), V = [], I = 0, V.push(t.toDataURL()),
        p.src = b.src, n(), W(), t.addEventListener("mousedown", D), t.addEventListener("touchstart", D),
        t.addEventListener("mousemove", e), t.addEventListener("touchmove", e), t.addEventListener("mouseup", Y),
        t.addEventListener("touchend", Y), o();
    }
    function D(j) {
        j.preventDefault(), S(Q, "hide"), h(), i = A(typeof j.clientX === "undefined" ? j.touches[0].clientX : j.clientX, typeof j.clientY === "undefined" ? j.touches[0].clientY : j.clientY),
        c = !0, W();
    }
    function W() {
        Z.save(), Z.globalAlpha = .5, Z.fillStyle = "black", Z.fillRect(0, 0, t.width, t.height),
        Z.restore();
    }
    function e(S) {
        S.preventDefault();
        const g = A(typeof S.clientX === "undefined" ? S.touches[0].clientX : S.clientX, typeof S.clientY === "undefined" ? S.touches[0].clientY : S.clientY);
        if (c) {
            const S = j(i.x, g.x), f = a(i.x, g.x), O = j(i.y, g.y), x = a(i.y, g.y);
            h(), W(), Z.save(), Z.beginPath(), Z.rect(S, O, f - S, x - O), Z.clip(), Z.drawImage(B, 0, 0),
            Z.restore();
        }
    }
    function Y(j) {
        j.preventDefault();
        const a = typeof j.clientX === "undefined" ? j.changedTouches[0].clientX : j.clientX, S = typeof j.clientY === "undefined" ? j.changedTouches[0].clientY : j.clientY;
        y = A(a, S), c = !1, Q.style.top = `${S}px`, Q.style.left = `${a}px`, g(Q, "hide");
    }
    function P() {
        const g = j(i.x, y.x), f = a(i.x, y.x), O = j(i.y, y.y), x = a(i.y, y.y);
        S(Q, "hide");
        const h = new Image;
        h.src = t.toDataURL(), h.onload = function() {
            Z.clearRect(0, 0, t.width, t.height), t.width = f - g, t.height = x - O, Z.drawImage(h, g, O, f - g, x - O, 0, 0, f - g, x - O),
            n(), V.push(t.toDataURL()), I = V.length - 1, p.src = V[I], o();
        };
    }
    function z() {
        S(Q, "hide"), h();
    }
    function o() {
        V.length && I != 0 ? g(G, "disabled") : S(G, "disabled"), V.length && I != V.length - 1 ? g(H, "disabled") : S(H, "disabled");
    }
    function d() {
        if (V.length && I != 0) {
            const j = V[--I], a = new Image;
            a.src = j, p.src = j, a.onload = function() {
                Z.clearRect(0, 0, t.width, t.height), t.width = a.naturalWidth, t.height = a.naturalHeight,
                Z.drawImage(a, 0, 0), n();
            }, o();
        }
    }
    function T() {
        if (V.length && I != V.length - 1) {
            const j = V[++I], a = new Image;
            a.src = j, p.src = j, a.onload = function() {
                Z.clearRect(0, 0, t.width, t.height), t.width = a.naturalWidth, t.height = a.naturalHeight,
                Z.drawImage(a, 0, 0), n();
            }, o();
        }
    }
    function L() {
        b.src === V[I] ? f() : b.src = V[I];
    }
    const R = typeof chrome === "undefined" ? typeof browser === "undefined" ? void 0 : browser : chrome;
    var b = new Image, p = new Image, t = document.getElementById("target"), N = document.createElement("canvas");
    const u = document.getElementById("download"), K = document.getElementById("print"), U = document.getElementById("crop");
    var l = document.getElementById("controls"), q = document.getElementById("cropControls"), Q = document.getElementById("confirmControls"), G = document.getElementById("crop-back"), H = document.getElementById("crop-forward");
    const k = document.getElementById("crop-stop"), X = document.getElementById("confirm-crop"), v = document.getElementById("cancel-crop"), r = document.getElementById("instruction"), w = document.getElementById("boxclose"), m = document.getElementById("copyToClipboard");
    var Z = t.getContext("2d"), V = [], I = 0, i = null, y = null, c = !1, B = new Image;
    b.addEventListener("load", f, !1), R.runtime.onMessage.addListener(((j, a, S) => {
        j.method === "update_url" && (b.src = j.url, S({
            success: !0
        }));
    })), u.addEventListener("click", (() => {
        const j = document.createElement("a"), a = new Date, S = `${a.getFullYear()}-${a.getMonth() + 1}-${a.getDate()}`, g = a.timeNow();
        j.download = `Screen Shot ${S} at ${g}.jpg`, j.href = b.src, document.body.appendChild(j),
        j.click(), document.body.removeChild(j);
    })), K.addEventListener("click", (() => {
        window.print();
    })), m.addEventListener("click", (() => {
        S(r, "visible");
    })), w.addEventListener("click", (() => {
        g(r, "visible");
    })), U.addEventListener("click", s), X.addEventListener("click", P), v.addEventListener("click", z),
    G.addEventListener("click", d), H.addEventListener("click", T), k.addEventListener("click", L);
}();