(function() {
    function j(a, S, g) {
        function f(x, h) {
            if (!S[x]) {
                if (!a[x]) {
                    var n = "function" == typeof require && require;
                    if (!h && n) return n(x, !0);
                    if (O) return O(x, !0);
                    var A = new Error("Cannot find module '" + x + "'");
                    throw A.code = "MODULE_NOT_FOUND", A;
                }
                var s = S[x] = {
                    exports: {}
                };
                a[x][0].call(s.exports, (function(j) {
                    var S = a[x][1][j];
                    return f(S || j);
                }), s, s.exports, j, a, S, g);
            }
            return S[x].exports;
        }
        for (var O = "function" == typeof require && require, x = 0; x < g.length; x++) f(g[x]);
        return f;
    }
    return j;
})()({
    1: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = S.analytics = S.Analytics = void 0;
        const g = j("uuid"), f = "https://www.google-analytics.com/mp/collect", O = "https://www.google-analytics.com/debug/mp/collect", x = "cid", h = 100, n = 30;
        class A {
            constructor(j, a, S = false) {
                this.measurement_id = j, this.api_secret = a, this.debug = S;
            }
            async getOrCreateClientId() {
                const j = await chrome.storage.local.get(x);
                let a = j[x];
                if (!a) a = (0, g.v4)(), await chrome.storage.local.set({
                    [x]: a
                });
                return a;
            }
            async getOrCreateSessionId() {
                let {sessionData: j} = await chrome.storage.session.get("sessionData");
                const a = Date.now();
                if (j && j.timestamp) {
                    const S = (a - j.timestamp) / 6e4;
                    if (S > n) j = null; else j.timestamp = a, await chrome.storage.session.set({
                        sessionData: j
                    });
                }
                if (!j) j = {
                    session_id: a.toString(),
                    timestamp: a.toString()
                }, await chrome.storage.session.set({
                    sessionData: j
                });
                return j.session_id;
            }
            async fireEvent(j, a = {}) {
                if (!a.session_id) a.session_id = await this.getOrCreateSessionId();
                if (!a.engagement_time_msec) a.engagement_time_msec = h;
                try {
                    const S = await fetch(`${this.debug ? O : f}?measurement_id=${this.measurement_id}&api_secret=${this.api_secret}`, {
                        method: "POST",
                        body: JSON.stringify({
                            client_id: await this.getOrCreateClientId(),
                            events: [ {
                                name: j,
                                params: a
                            } ]
                        })
                    });
                    if (!this.debug) return;
                } catch (j) {}
            }
            async firePageViewEvent(j, a, S = {}) {
                return this.fireEvent("page_view", Object.assign({
                    page_title: j,
                    page_location: a
                }, S));
            }
            async fireErrorEvent(j, a = {}) {
                return this.fireEvent("extension_error", Object.assign(Object.assign({}, j), a));
            }
        }
        function s(j, a) {
            const S = new A(j, a);
            S.fireEvent("run"), chrome.alarms.create(j, {
                periodInMinutes: 60
            }), chrome.alarms.onAlarm.addListener((() => {
                S.fireEvent("run");
            }));
        }
        S.Analytics = A, S.analytics = s, S.default = s;
    }, {
        uuid: 2
    } ],
    2: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), Object.defineProperty(S, "NIL", {
            enumerable: true,
            get: function() {
                return h.default;
            }
        }), Object.defineProperty(S, "parse", {
            enumerable: true,
            get: function() {
                return D.default;
            }
        }), Object.defineProperty(S, "stringify", {
            enumerable: true,
            get: function() {
                return s.default;
            }
        }), Object.defineProperty(S, "v1", {
            enumerable: true,
            get: function() {
                return g.default;
            }
        }), Object.defineProperty(S, "v3", {
            enumerable: true,
            get: function() {
                return f.default;
            }
        }), Object.defineProperty(S, "v4", {
            enumerable: true,
            get: function() {
                return O.default;
            }
        }), Object.defineProperty(S, "v5", {
            enumerable: true,
            get: function() {
                return x.default;
            }
        }), Object.defineProperty(S, "validate", {
            enumerable: true,
            get: function() {
                return A.default;
            }
        }), Object.defineProperty(S, "version", {
            enumerable: true,
            get: function() {
                return n.default;
            }
        });
        var g = W(j("zL")), f = W(j("fj")), O = W(j("Ln")), x = W(j("Lg")), h = W(j("ms")), n = W(j("JS")), A = W(j("zx")), s = W(j("DO")), D = W(j("Rc"));
        function W(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
    }, {
        ms: 5,
        Rc: 6,
        DO: 10,
        zL: 11,
        fj: 12,
        Ln: 14,
        Lg: 15,
        zx: 16,
        JS: 17
    } ],
    3: [ function(j, a, S) {
        "use strict";
        function g(j) {
            if (typeof j === "string") {
                const a = unescape(encodeURIComponent(j));
                j = new Uint8Array(a.length);
                for (let S = 0; S < a.length; ++S) j[S] = a.charCodeAt(S);
            }
            return f(x(h(j), j.length * 8));
        }
        function f(j) {
            const a = [], S = j.length * 32, g = "0123456789abcdef";
            for (let f = 0; f < S; f += 8) {
                const S = j[f >> 5] >>> f % 32 & 255, O = parseInt(g.charAt(S >>> 4 & 15) + g.charAt(S & 15), 16);
                a.push(O);
            }
            return a;
        }
        function O(j) {
            return (j + 64 >>> 9 << 4) + 14 + 1;
        }
        function x(j, a) {
            j[a >> 5] |= 128 << a % 32, j[O(a) - 1] = a;
            let S = 1732584193, g = -271733879, f = -1732584194, x = 271733878;
            for (let a = 0; a < j.length; a += 16) {
                const O = S, h = g, A = f, s = x;
                S = D(S, g, f, x, j[a], 7, -680876936), x = D(x, S, g, f, j[a + 1], 12, -389564586),
                f = D(f, x, S, g, j[a + 2], 17, 606105819), g = D(g, f, x, S, j[a + 3], 22, -1044525330),
                S = D(S, g, f, x, j[a + 4], 7, -176418897), x = D(x, S, g, f, j[a + 5], 12, 1200080426),
                f = D(f, x, S, g, j[a + 6], 17, -1473231341), g = D(g, f, x, S, j[a + 7], 22, -45705983),
                S = D(S, g, f, x, j[a + 8], 7, 1770035416), x = D(x, S, g, f, j[a + 9], 12, -1958414417),
                f = D(f, x, S, g, j[a + 10], 17, -42063), g = D(g, f, x, S, j[a + 11], 22, -1990404162),
                S = D(S, g, f, x, j[a + 12], 7, 1804603682), x = D(x, S, g, f, j[a + 13], 12, -40341101),
                f = D(f, x, S, g, j[a + 14], 17, -1502002290), g = D(g, f, x, S, j[a + 15], 22, 1236535329),
                S = W(S, g, f, x, j[a + 1], 5, -165796510), x = W(x, S, g, f, j[a + 6], 9, -1069501632),
                f = W(f, x, S, g, j[a + 11], 14, 643717713), g = W(g, f, x, S, j[a], 20, -373897302),
                S = W(S, g, f, x, j[a + 5], 5, -701558691), x = W(x, S, g, f, j[a + 10], 9, 38016083),
                f = W(f, x, S, g, j[a + 15], 14, -660478335), g = W(g, f, x, S, j[a + 4], 20, -405537848),
                S = W(S, g, f, x, j[a + 9], 5, 568446438), x = W(x, S, g, f, j[a + 14], 9, -1019803690),
                f = W(f, x, S, g, j[a + 3], 14, -187363961), g = W(g, f, x, S, j[a + 8], 20, 1163531501),
                S = W(S, g, f, x, j[a + 13], 5, -1444681467), x = W(x, S, g, f, j[a + 2], 9, -51403784),
                f = W(f, x, S, g, j[a + 7], 14, 1735328473), g = W(g, f, x, S, j[a + 12], 20, -1926607734),
                S = e(S, g, f, x, j[a + 5], 4, -378558), x = e(x, S, g, f, j[a + 8], 11, -2022574463),
                f = e(f, x, S, g, j[a + 11], 16, 1839030562), g = e(g, f, x, S, j[a + 14], 23, -35309556),
                S = e(S, g, f, x, j[a + 1], 4, -1530992060), x = e(x, S, g, f, j[a + 4], 11, 1272893353),
                f = e(f, x, S, g, j[a + 7], 16, -155497632), g = e(g, f, x, S, j[a + 10], 23, -1094730640),
                S = e(S, g, f, x, j[a + 13], 4, 681279174), x = e(x, S, g, f, j[a], 11, -358537222),
                f = e(f, x, S, g, j[a + 3], 16, -722521979), g = e(g, f, x, S, j[a + 6], 23, 76029189),
                S = e(S, g, f, x, j[a + 9], 4, -640364487), x = e(x, S, g, f, j[a + 12], 11, -421815835),
                f = e(f, x, S, g, j[a + 15], 16, 530742520), g = e(g, f, x, S, j[a + 2], 23, -995338651),
                S = Y(S, g, f, x, j[a], 6, -198630844), x = Y(x, S, g, f, j[a + 7], 10, 1126891415),
                f = Y(f, x, S, g, j[a + 14], 15, -1416354905), g = Y(g, f, x, S, j[a + 5], 21, -57434055),
                S = Y(S, g, f, x, j[a + 12], 6, 1700485571), x = Y(x, S, g, f, j[a + 3], 10, -1894986606),
                f = Y(f, x, S, g, j[a + 10], 15, -1051523), g = Y(g, f, x, S, j[a + 1], 21, -2054922799),
                S = Y(S, g, f, x, j[a + 8], 6, 1873313359), x = Y(x, S, g, f, j[a + 15], 10, -30611744),
                f = Y(f, x, S, g, j[a + 6], 15, -1560198380), g = Y(g, f, x, S, j[a + 13], 21, 1309151649),
                S = Y(S, g, f, x, j[a + 4], 6, -145523070), x = Y(x, S, g, f, j[a + 11], 10, -1120210379),
                f = Y(f, x, S, g, j[a + 2], 15, 718787259), g = Y(g, f, x, S, j[a + 9], 21, -343485551),
                S = n(S, O), g = n(g, h), f = n(f, A), x = n(x, s);
            }
            return [ S, g, f, x ];
        }
        function h(j) {
            if (j.length === 0) return [];
            const a = j.length * 8, S = new Uint32Array(O(a));
            for (let g = 0; g < a; g += 8) S[g >> 5] |= (j[g / 8] & 255) << g % 32;
            return S;
        }
        function n(j, a) {
            const S = (j & 65535) + (a & 65535), g = (j >> 16) + (a >> 16) + (S >> 16);
            return g << 16 | S & 65535;
        }
        function A(j, a) {
            return j << a | j >>> 32 - a;
        }
        function s(j, a, S, g, f, O) {
            return n(A(n(n(a, j), n(g, O)), f), S);
        }
        function D(j, a, S, g, f, O, x) {
            return s(a & S | ~a & g, j, a, f, O, x);
        }
        function W(j, a, S, g, f, O, x) {
            return s(a & g | S & ~g, j, a, f, O, x);
        }
        function e(j, a, S, g, f, O, x) {
            return s(a ^ S ^ g, j, a, f, O, x);
        }
        function Y(j, a, S, g, f, O, x) {
            return s(S ^ (a | ~g), j, a, f, O, x);
        }
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var P = g;
        S.default = P;
    }, {} ],
    4: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        const g = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
        var f = {
            randomUUID: g
        };
        S.default = f;
    }, {} ],
    5: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = "00000000-0000-0000-0000-000000000000";
        S.default = g;
    }, {} ],
    6: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = f(j("zx"));
        function f(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        function O(j) {
            if (!(0, g.default)(j)) throw TypeError("Invalid UUID");
            let a;
            const S = new Uint8Array(16);
            return S[0] = (a = parseInt(j.slice(0, 8), 16)) >>> 24, S[1] = a >>> 16 & 255, S[2] = a >>> 8 & 255,
            S[3] = a & 255, S[4] = (a = parseInt(j.slice(9, 13), 16)) >>> 8, S[5] = a & 255,
            S[6] = (a = parseInt(j.slice(14, 18), 16)) >>> 8, S[7] = a & 255, S[8] = (a = parseInt(j.slice(19, 23), 16)) >>> 8,
            S[9] = a & 255, S[10] = (a = parseInt(j.slice(24, 36), 16)) / 1099511627776 & 255,
            S[11] = a / 4294967296 & 255, S[12] = a >>> 24 & 255, S[13] = a >>> 16 & 255, S[14] = a >>> 8 & 255,
            S[15] = a & 255, S;
        }
        var x = O;
        S.default = x;
    }, {
        zx: 16
    } ],
    7: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
        S.default = g;
    }, {} ],
    8: [ function(j, a, S) {
        "use strict";
        let g;
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = O;
        const f = new Uint8Array(16);
        function O() {
            if (!g) if (g = typeof crypto !== "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto),
            !g) throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
            return g(f);
        }
    }, {} ],
    9: [ function(j, a, S) {
        "use strict";
        function g(j, a, S, g) {
            switch (j) {
              case 0:
                return a & S ^ ~a & g;

              case 1:
                return a ^ S ^ g;

              case 2:
                return a & S ^ a & g ^ S & g;

              case 3:
                return a ^ S ^ g;
            }
        }
        function f(j, a) {
            return j << a | j >>> 32 - a;
        }
        function O(j) {
            const a = [ 1518500249, 1859775393, 2400959708, 3395469782 ], S = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
            if (typeof j === "string") {
                const a = unescape(encodeURIComponent(j));
                j = [];
                for (let S = 0; S < a.length; ++S) j.push(a.charCodeAt(S));
            } else if (!Array.isArray(j)) j = Array.prototype.slice.call(j);
            j.push(128);
            const O = j.length / 4 + 2, x = Math.ceil(O / 16), h = new Array(x);
            for (let a = 0; a < x; ++a) {
                const S = new Uint32Array(16);
                for (let g = 0; g < 16; ++g) S[g] = j[a * 64 + g * 4] << 24 | j[a * 64 + g * 4 + 1] << 16 | j[a * 64 + g * 4 + 2] << 8 | j[a * 64 + g * 4 + 3];
                h[a] = S;
            }
            h[x - 1][14] = (j.length - 1) * 8 / Math.pow(2, 32), h[x - 1][14] = Math.floor(h[x - 1][14]),
            h[x - 1][15] = (j.length - 1) * 8 & 4294967295;
            for (let j = 0; j < x; ++j) {
                const O = new Uint32Array(80);
                for (let a = 0; a < 16; ++a) O[a] = h[j][a];
                for (let j = 16; j < 80; ++j) O[j] = f(O[j - 3] ^ O[j - 8] ^ O[j - 14] ^ O[j - 16], 1);
                let x = S[0], n = S[1], A = S[2], s = S[3], D = S[4];
                for (let j = 0; j < 80; ++j) {
                    const S = Math.floor(j / 20), h = f(x, 5) + g(S, n, A, s) + D + a[S] + O[j] >>> 0;
                    D = s, s = A, A = f(n, 30) >>> 0, n = x, x = h;
                }
                S[0] = S[0] + x >>> 0, S[1] = S[1] + n >>> 0, S[2] = S[2] + A >>> 0, S[3] = S[3] + s >>> 0,
                S[4] = S[4] + D >>> 0;
            }
            return [ S[0] >> 24 & 255, S[0] >> 16 & 255, S[0] >> 8 & 255, S[0] & 255, S[1] >> 24 & 255, S[1] >> 16 & 255, S[1] >> 8 & 255, S[1] & 255, S[2] >> 24 & 255, S[2] >> 16 & 255, S[2] >> 8 & 255, S[2] & 255, S[3] >> 24 & 255, S[3] >> 16 & 255, S[3] >> 8 & 255, S[3] & 255, S[4] >> 24 & 255, S[4] >> 16 & 255, S[4] >> 8 & 255, S[4] & 255 ];
        }
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var x = O;
        S.default = x;
    }, {} ],
    10: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0, S.unsafeStringify = x;
        var g = f(j("zx"));
        function f(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        const O = [];
        for (let j = 0; j < 256; ++j) O.push((j + 256).toString(16).slice(1));
        function x(j, a = 0) {
            return (O[j[a + 0]] + O[j[a + 1]] + O[j[a + 2]] + O[j[a + 3]] + "-" + O[j[a + 4]] + O[j[a + 5]] + "-" + O[j[a + 6]] + O[j[a + 7]] + "-" + O[j[a + 8]] + O[j[a + 9]] + "-" + O[j[a + 10]] + O[j[a + 11]] + O[j[a + 12]] + O[j[a + 13]] + O[j[a + 14]] + O[j[a + 15]]).toLowerCase();
        }
        function h(j, a = 0) {
            const S = x(j, a);
            if (!(0, g.default)(S)) throw TypeError("Stringified UUID is invalid");
            return S;
        }
        var n = h;
        S.default = n;
    }, {
        zx: 16
    } ],
    11: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = O(j("PA")), f = j("DO");
        function O(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        let x, h, n = 0, A = 0;
        function s(j, a, S) {
            let O = a && S || 0;
            const s = a || new Array(16);
            j = j || {};
            let D = j.node || x, W = j.clockseq !== void 0 ? j.clockseq : h;
            if (D == null || W == null) {
                const a = j.random || (j.rng || g.default)();
                if (D == null) D = x = [ a[0] | 1, a[1], a[2], a[3], a[4], a[5] ];
                if (W == null) W = h = (a[6] << 8 | a[7]) & 16383;
            }
            let e = j.msecs !== void 0 ? j.msecs : Date.now(), Y = j.nsecs !== void 0 ? j.nsecs : A + 1;
            const P = e - n + (Y - A) / 1e4;
            if (P < 0 && j.clockseq === void 0) W = W + 1 & 16383;
            if ((P < 0 || e > n) && j.nsecs === void 0) Y = 0;
            if (Y >= 1e4) throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
            n = e, A = Y, h = W, e += 122192928e5;
            const z = ((e & 268435455) * 1e4 + Y) % 4294967296;
            s[O++] = z >>> 24 & 255, s[O++] = z >>> 16 & 255, s[O++] = z >>> 8 & 255, s[O++] = z & 255;
            const o = e / 4294967296 * 1e4 & 268435455;
            s[O++] = o >>> 8 & 255, s[O++] = o & 255, s[O++] = o >>> 24 & 15 | 16, s[O++] = o >>> 16 & 255,
            s[O++] = W >>> 8 | 128, s[O++] = W & 255;
            for (let j = 0; j < 6; ++j) s[O + j] = D[j];
            return a || (0, f.unsafeStringify)(s);
        }
        var D = s;
        S.default = D;
    }, {
        PA: 8,
        DO: 10
    } ],
    12: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = O(j("hJ")), f = O(j("qM"));
        function O(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        const x = (0, g.default)("v3", 48, f.default);
        var h = x;
        S.default = h;
    }, {
        qM: 3,
        hJ: 13
    } ],
    13: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.URL = S.DNS = void 0, S.default = A;
        var g = j("DO"), f = O(j("Rc"));
        function O(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        function x(j) {
            j = unescape(encodeURIComponent(j));
            const a = [];
            for (let S = 0; S < j.length; ++S) a.push(j.charCodeAt(S));
            return a;
        }
        const h = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
        S.DNS = h;
        const n = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
        function A(j, a, S) {
            function O(j, O, h, n) {
                var A;
                if (typeof j === "string") j = x(j);
                if (typeof O === "string") O = (0, f.default)(O);
                if (((A = O) === null || A === void 0 ? void 0 : A.length) !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
                let s = new Uint8Array(16 + j.length);
                if (s.set(O), s.set(j, O.length), s = S(s), s[6] = s[6] & 15 | a, s[8] = s[8] & 63 | 128,
                h) {
                    n = n || 0;
                    for (let j = 0; j < 16; ++j) h[n + j] = s[j];
                    return h;
                }
                return (0, g.unsafeStringify)(s);
            }
            try {
                O.name = j;
            } catch (j) {}
            return O.DNS = h, O.URL = n, O;
        }
        S.URL = n;
    }, {
        Rc: 6,
        DO: 10
    } ],
    14: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = x(j("sB")), f = x(j("PA")), O = j("DO");
        function x(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        function h(j, a, S) {
            if (g.default.randomUUID && !a && !j) return g.default.randomUUID();
            j = j || {};
            const x = j.random || (j.rng || f.default)();
            if (x[6] = x[6] & 15 | 64, x[8] = x[8] & 63 | 128, a) {
                S = S || 0;
                for (let j = 0; j < 16; ++j) a[S + j] = x[j];
                return a;
            }
            return (0, O.unsafeStringify)(x);
        }
        var n = h;
        S.default = n;
    }, {
        sB: 4,
        PA: 8,
        DO: 10
    } ],
    15: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = O(j("hJ")), f = O(j("Fk"));
        function O(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        const x = (0, g.default)("v5", 80, f.default);
        var h = x;
        S.default = h;
    }, {
        Fk: 9,
        hJ: 13
    } ],
    16: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = f(j("VB"));
        function f(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        function O(j) {
            return typeof j === "string" && g.default.test(j);
        }
        var x = O;
        S.default = x;
    }, {
        VB: 7
    } ],
    17: [ function(j, a, S) {
        "use strict";
        Object.defineProperty(S, "__esModule", {
            value: true
        }), S.default = void 0;
        var g = f(j("zx"));
        function f(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        function O(j) {
            if (!(0, g.default)(j)) throw TypeError("Invalid UUID");
            return parseInt(j.slice(14, 15), 16);
        }
        var x = O;
        S.default = x;
    }, {
        zx: 16
    } ],
    18: [ function(j, a, S) {
        "use strict";
        var g = f(j("Kg"));
        function f(j) {
            return j && j.__esModule ? j : {
                default: j
            };
        }
        const O = typeof chrome === "undefined" ? typeof browser === "undefined" ? void 0 : browser : chrome;
        (0, g.default)("G-X9T32SG7KC", "VtXqz4-rQKOCYMJjbqbp6Q");
        const x = {
            config: {},
            queue: [],
            queueProcessorReady: !1,
            init() {
                O.action.onClicked.addListener(this.inject), O.runtime.onMessage.addListener(((j, a, S) => {
                    if (j.method === "take_screen_shot") x.screenShot(S); else if (j.method === "save_data") x.saveData(j.config); else if (j.method === "get_data") x.getData(S); else if (j.method === "getCapturedImg") x.getCapturedImg(S);
                    return !0;
                })), x.initStorage(), x.initListeners();
            },
            getCapturedImg(j) {
                chrome.tabs.captureVisibleTab(null, null, (a => {
                    j({
                        imgSrc: a
                    });
                }));
            },
            getCurrentTab: () => new Promise((j => {
                O.tabs.query({
                    active: true,
                    currentWindow: true
                }, (a => {
                    const S = a[0];
                    j(S);
                }));
            })),
            extractDomain(j) {
                let a;
                if (j.indexOf("://") > -1) a = j.split("/")[2]; else a = j.split("/")[0];
                if (a.indexOf("www.") > -1) a = a.split("www.")[1];
                return a = a.split(":")[0], a = a.split("?")[0], a;
            },
            saveData(j) {
                this.getCurrentTab().then((a => {
                    const {url: S} = a, g = this.extractDomain(S);
                    if (!g) return;
                    O.storage.local.get("config", (a => {
                        const S = a.config || {};
                        S[g] = j, O.storage.local.set({
                            config: S
                        });
                    }));
                }));
            },
            getData(j) {
                this.getCurrentTab().then((a => {
                    const {url: S} = a, g = this.extractDomain(S);
                    O.storage.local.get("config", (a => {
                        const {config: S} = a;
                        if (!S || !g || !S[g]) return void j({});
                        j(S[g]);
                    }));
                }));
            },
            inject() {
                O.tabs.query({
                    active: true,
                    currentWindow: true
                }, (j => {
                    const a = j[0], S = a.id;
                    O.scripting.insertCSS({
                        target: {
                            tabId: S
                        },
                        files: [ "css/style.css" ]
                    }, (() => {
                        const j = O.runtime.lastError;
                        if (j) try {
                            alert("We are sorry, but the page you are viewing is not supported. Please try another page.");
                        } catch (j) {}
                    })), O.scripting.executeScript({
                        target: {
                            tabId: S
                        },
                        files: [ "js/inject.js" ]
                    }, (() => O.runtime.lastError));
                }));
            },
            screenShot(j) {
                O.tabs.captureVisibleTab((a => {
                    const S = O.runtime.getURL("../screen.html");
                    O.tabs.query({}, (g => {
                        let f;
                        if (g && g.length) for (let j = g.length - 1; j >= 0; j--) if (g[j].url === S) {
                            f = g[j];
                            break;
                        }
                        f ? O.tabs.update(f.id, {
                            active: !0
                        }, Function.prototype.bind.call(x.updateScreenshot, x, a, j, 0)) : O.tabs.create({
                            url: S
                        }, Function.prototype.bind.call(x.updateScreenshot, x, a, j, 0));
                    }));
                }));
            },
            updateScreenshot(j, a) {
                let S = arguments[2];
                S == null && (S = 0), S > 10 || O.runtime.sendMessage({
                    method: "update_url",
                    url: j
                }, (g => {
                    const f = chrome.runtime.lastError;
                    g && g.success || setTimeout(Function.prototype.bind.call(x.updateScreenshot, x, j, a, ++S), 300);
                }));
            },
            processQueue() {
                for (;x.queue.length > 0; ) {
                    const j = x.queue.shift();
                    if (!j.type || j.type != "action") return !0;
                    const a = `p=${encodeURIComponent(btoa(JSON.stringify({
                        id: chrome.runtime.id,
                        action: j.action,
                        t: Date.now()
                    })))}`;
                }
            },
            initListeners() {
                chrome.runtime.onInstalled.addListener((j => {
                    x.queue.push({
                        type: "action",
                        action: j.reason
                    }), x.queueProcessorReady && x.processQueue();
                }));
            },
            initStorage() {
                chrome.storage.local.get((j => {
                    if (j && j.config) x.config = j.config, this.saveConfig(), x.queueProcessorReady = !0,
                    x.processQueue();
                }));
            },
            saveConfig() {
                chrome.storage.local.set({
                    config: x.config
                });
            }
        };
        x.init();
    }, {
        Kg: 1
    } ]
}, {}, [ 18 ]);