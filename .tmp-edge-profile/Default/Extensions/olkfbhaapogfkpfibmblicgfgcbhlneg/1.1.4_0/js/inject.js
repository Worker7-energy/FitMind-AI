window.TextCursor || (window.TextCursor = function(j, a) {
    this.fillStyle = j || "rgba(0, 0, 0, 0.7)", this.width = a || 2, this.left = 0,
    this.top = 0;
}, window.TextCursor.prototype = {
    getHeight(j) {
        const a = j.measureText("W").width;
        return a + a / 6;
    },
    createPath(j) {
        j.beginPath(), j.rect(this.left, this.top, this.width, this.getHeight(j));
    },
    draw(j, a, S) {
        j.save(), this.left = a, this.top = S - this.getHeight(j), this.createPath(j), j.lineWidth = 1,
        j.fillStyle = this.fillStyle, j.fill(), j.restore();
    },
    erase(j) {
        window.NOTEPAD.restoreCanvas([ this.left - 1, this.top, this.width + 2, this.getHeight(j) ]);
    }
}), window.TextLine || (window.TextLine = function(j, a) {
    this.text = "", this.left = j, this.bottom = a, this.caret = 0;
}, window.TextLine.prototype = {
    insert(j) {
        let a = this.text.slice(0, this.caret);
        const S = this.text.slice(this.caret);
        a += j, this.text = a, this.text += S, this.caret += j.length;
    },
    getCaretX(j) {
        const a = this.text.substring(0, this.caret), S = j.measureText(a).width;
        return this.left + S;
    },
    removeCharacterBeforeCaret() {
        this.caret !== 0 && (this.text = this.text.substring(0, this.caret - 1) + this.text.substring(this.caret),
        this.caret--);
    },
    removeLastCharacter() {
        this.text = this.text.slice(0, -1);
    },
    getWidth(j) {
        return j.measureText(this.text).width;
    },
    getHeight(j) {
        const a = j.measureText("W").width;
        return a + a / 6;
    },
    draw(j) {
        j.save(), j.textAlign = "start", j.textBaseline = "bottom", j.lineWidth = 1, j.strokeText(this.text, this.left, this.bottom),
        j.fillText(this.text, this.left, this.bottom), j.restore();
    },
    erase() {
        window.NOTEPAD.restoreCanvas();
    }
}), window.Paragraph || (window.Paragraph = function(j, a, S, g, f) {
    this.context = j, this.drawingSurface = g, this.left = a, this.top = S, this.lines = [],
    this.activeLine = void 0, this.cursor = f, this.blinkingInterval = void 0;
}, window.Paragraph.prototype = {
    clearIntervals(j) {
        this.blinkingInterval = window.clearInterval(this.blinkingInterval), this.blinkingTimeout = window.clearTimeout(this.blinkingTimeout),
        this.cursor.erase(this.context, this.drawingSurface), typeof j !== "function" || this.blinkingInterval ? this.blinkingInterval && this.clearIntervals(j) : j();
    },
    isPointInside(j) {
        const a = this.context;
        return a.beginPath(), a.rect(this.left, this.top, this.getWidth(), this.getHeight()),
        a.isPointInPath(j.x, j.y);
    },
    getHeight() {
        let j = 0;
        return this.lines.forEach(Function.prototype.bind.call((function(a) {
            j += a.getHeight(this.context);
        }), this)), j;
    },
    getWidth() {
        let j = 0, a = 0;
        return this.lines.forEach(Function.prototype.bind.call((function(S) {
            j = S.getWidth(this.context), a < j && (a = j);
        }), this)), a;
    },
    draw() {
        this.lines.forEach(Function.prototype.bind.call((function(j) {
            j.draw(this.context);
        }), this));
    },
    erase() {
        window.NOTEPAD.restoreCanvas();
    },
    addLine(j) {
        this.lines.push(j), this.activeLine = j, this.moveCursor(j.left, j.bottom);
    },
    insert(j) {
        this.erase(this.context, this.drawingSurface), this.activeLine.insert(j);
        const a = this.activeLine.text.substring(0, this.activeLine.caret), S = this.context.measureText(a).width;
        this.moveCursor(this.activeLine.left + S, this.activeLine.bottom), this.draw(this.context);
    },
    blinkCursor() {
        const j = this;
        this.blinkingInterval && (this.blinkingInterval = window.clearInterval(this.blinkingInterval)),
        this.blinkingInterval = setInterval((() => {
            const a = window.NOTEPAD.drawOptions[window.NOTEPAD.selectedDrawOption];
            a && (a.type === "text" ? (j.cursor.erase(j.context, j.drawingSurface), j.blinkingTimeout && (j.blinkingTimeout = window.clearTimeout(j.blinkingTimeout)),
            j.blinkingTimeout = setTimeout((() => {
                j.cursor.draw(j.context, j.cursor.left, j.cursor.top + j.cursor.getHeight(j.context));
            }), 200)) : j.blinkingInterval = window.clearInterval(j.blinkingInterval));
        }), 900);
    },
    moveCursorCloseTo(j, a) {
        const S = this.getLine(a);
        S && (S.caret = this.getColumn(S, j), this.activeLine = S, this.moveCursor(S.getCaretX(this.context), S.bottom));
    },
    moveCursor(j, a) {
        this.cursor.erase(this.context, this.drawingSurface), this.cursor.draw(this.context, j, a),
        this.blinkingInterval || this.blinkCursor(j, a);
    },
    moveLinesDown(j) {
        for (var a, S = j; S < this.lines.length; ++S) a = this.lines[S], a.bottom += a.getHeight(this.context);
    },
    newline() {
        let j, a;
        const S = this.activeLine.text.substring(0, this.activeLine.caret), g = this.activeLine.text.substring(this.activeLine.caret), f = this.context.measureText("W").width + this.context.measureText("W").width / 6, O = this.activeLine.bottom + f;
        this.erase(this.context, this.drawingSurface), this.activeLine.text = S, (a = new TextLine(this.activeLine.left, O)).insert(g),
        j = this.lines.indexOf(this.activeLine), this.lines.splice(j + 1, 0, a), this.activeLine = a,
        this.activeLine.caret = 0;
        for (let S = (j = this.lines.indexOf(this.activeLine)) + 1; S < this.lines.length; ++S) (a = this.lines[S]).bottom += f;
        this.draw(), this.cursor.draw(this.context, this.activeLine.left, this.activeLine.bottom);
    },
    getLine(j) {
        for (var a, S = 0; S < this.lines.length; ++S) if (j > (a = this.lines[S]).bottom - a.getHeight(this.context) && j < a.bottom) return a;
    },
    getColumn(j, a) {
        let S, g, f, O, x = !1;
        for ((f = new TextLine(j.left, j.bottom)).insert(j.text); !x && f.text.length > 0; ) S = f.left + f.getWidth(this.context),
        f.removeLastCharacter(), (g = f.left + f.getWidth(this.context)) < a && (O = (a - g < S - a ? g : S) === S ? f.text.length + 1 : f.text.length,
        x = !0);
        return O;
    },
    activeLineIsOutOfText() {
        return this.activeLine.text.length === 0;
    },
    activeLineIsTopLine() {
        return this.lines[0] === this.activeLine;
    },
    moveUpOneLine() {
        let j, a;
        j = `${this.activeLine.text}`;
        const S = this.lines.indexOf(this.activeLine);
        this.activeLine = this.lines[S - 1], this.activeLine.caret = this.activeLine.text.length,
        this.lines.splice(S, 1), this.moveCursor(this.activeLine.left + this.activeLine.getWidth(this.context), this.activeLine.bottom),
        this.activeLine.text += j;
        for (let j = S; j < this.lines.length; ++j) (a = this.lines[j]).bottom -= a.getHeight(this.context);
    },
    backspace() {
        let j, a;
        this.context.save(), this.activeLine.caret === 0 ? this.activeLineIsTopLine() || (this.erase(this.context, this.drawingSurface),
        this.moveUpOneLine(), this.draw()) : (this.erase(this.context, this.drawingSurface),
        this.activeLine.removeCharacterBeforeCaret(), j = this.activeLine.text.slice(0, this.activeLine.caret),
        a = this.context.measureText(j).width, this.moveCursor(this.activeLine.left + a, this.activeLine.bottom),
        this.draw(this.context), this.context.restore());
    }
}), Function.prototype.bind || (Function.prototype.bind = function(j) {
    if (typeof this !== "function") throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    const a = Array.prototype.slice.call(arguments, 1), S = this, g = function() {}, f = function() {
        return S.apply(this instanceof g && j ? this : j, a.concat(Array.prototype.slice.call(arguments)));
    };
    return g.prototype = this.prototype, f.prototype = new g, f;
});

var getCSSAnimationManager = function() {
    for (var j, a, S, g = !1, f = [ "webkit", "Moz", "O", "" ], O = f.length, x = document.documentElement.style; O--; ) if (f[O]) {
        if (void 0 !== x[`${f[O]}AnimationName`]) {
            switch (j = f[O], O) {
              case 0:
                a = `${j.toLowerCase()}AnimationStart`, S = `${j.toLowerCase()}AnimationEnd`, g = !0;
                break;

              case 1:
                a = "animationstart", S = "animationend", g = !0;
                break;

              case 2:
                a = `${j.toLowerCase()}animationstart`, S = `${j.toLowerCase()}animationend`, g = !0;
            }
            break;
        }
    } else if (void 0 !== x.animationName) {
        j = f[O], a = "animationstart", S = "animationend", g = !0;
        break;
    }
    return {
        supported: g,
        prefix: j,
        start: a,
        end: S
    };
};

!function(j, a) {
    typeof unsafeWindow !== "undefined" && unsafeWindow !== null ? unsafeWindow.CTRL_HIDDEN ? j.NOTEPAD.showControlPanel() : unsafeWindow.NOTEPAD_INIT || (j.NOTEPAD = a(j),
    j.NOTEPAD.init()) : (void 0 !== j.NOTEPAD && j.NOTEPAD !== null || (j.NOTEPAD = a(j)),
    j.NOTEPAD.controlPanelHidden ? j.NOTEPAD.showControlPanel() : j.NOTEPAD.initialized || j.NOTEPAD.init());
}(typeof window === "undefined" ? this : window, (j => {
    const a = Math.round, S = Math.max, g = function() {
        this.MAX_ITEMS = 50, this.currentIndex = 0, this.array = [];
    };
    g.prototype.add = function(j) {
        if (this.currentIndex < this.array.length - 1 ? (this.array[++this.currentIndex] = j,
        this.array = this.array.slice(0, this.currentIndex + 1)) : (this.array.push(j),
        this.currentIndex = this.array.length - 1), this.array.length > this.MAX_ITEMS) {
            const j = this.array.length - this.MAX_ITEMS;
            this.array = this.array.splice(-this.MAX_ITEMS), this.currentIndex -= j;
        }
    }, g.prototype.previous = function() {
        return this.currentIndex === 0 ? null : this.array[--this.currentIndex];
    }, g.prototype.next = function() {
        return this.currentIndex === this.array.length - 1 ? null : this.array[++this.currentIndex];
    }, g.prototype.hasPrevious = function() {
        return this.currentIndex > 0;
    }, g.prototype.hasNext = function() {
        return this.currentIndex < this.array.length - 1;
    };
    const f = typeof chrome === "undefined" ? typeof browser === "undefined" ? void 0 : browser : chrome;
    var O = {
        canvas: null,
        context: null,
        buffer: null,
        initialized: !1,
        controlPanelHidden: !1,
        persistTimer: null,
        history: null,
        config: {},
        drawOptions: [ {
            type: "pen",
            title: "Pencil - draw a custom line"
        }, {
            type: "eyedropper",
            title: "Color picker - pick a color from the web page or your drawings and use it for drawing"
        }, {
            type: "text",
            font: "Arial",
            minSize: 15,
            maxSize: 50,
            title: "Text - insert text"
        }, {
            type: "line",
            title: "Line - draw a straight line"
        }, {
            type: "arrow",
            title: "Arrow - create arrow on the canvas"
        }, {
            type: "quadratic_curve",
            title: "Quadratic curve - draw a quadratic curve",
            iteration: 0,
            initLoc: null,
            lastLoc: null
        }, {
            type: "bezier_curve",
            title: "Bezier curve - draw a bezier curve",
            iteration: 0,
            initLoc: null,
            firstPoint: null,
            lastPoint: null
        }, {
            type: "polygon",
            title: "Polygon - draw a polygon",
            initLoc: null,
            lastLoc: null
        }, {
            type: "circle",
            title: "Ellipse - draw an ellipse or a circle"
        }, {
            type: "rectangle",
            title: "Rectangle - draw a rectangle or a square"
        }, {
            type: "cursor",
            title: "Cursor - interact with the web page"
        }, {
            type: "eraser",
            title: "Eraser - erase part of your drawings",
            width: 30,
            height: 30
        }, {
            type: "fill",
            title: "Paint Bucket - fill an area"
        } ],
        selectedDrawOption: null,
        selectedColorOption: null,
        selectedAlphaOption: null,
        mousedown: !1,
        lastMouseDownLoc: null,
        drawingSurfaceImageData: null,
        resizeTimeoutID: null,
        cursor: new TextCursor,
        paragraph: null,
        panel: null,
        browser: {
            isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        },
        createCanvas() {
            this.canvas = j.document.createElement("canvas"), this.context = this.canvas.getContext("2d"),
            this.canvas.setAttribute("id", "NOTEPAD"), this.browser.isChrome || (this.buffer = document.createElement("canvas")),
            j.document.body.appendChild(this.canvas), j.addEventListener("resize", this.resizeBinded),
            j.addEventListener("scroll", this.resizeBinded);
            const a = localStorage.getItem(`WP_CRX_STORAGE_SNAPSHOT_${j.location.pathname}`);
            if (a) {
                const j = new Image;
                j.onload = Function.prototype.bind.call(this.initCanvas, this, j), j.src = a;
            } else this.initCanvas();
        },
        initCanvas(j) {
            j ? (this.handleResize(!0), this.context.drawImage(j, 0, 0), this.storeCanvas(!0)) : this.handleResize(),
            this.storeHistory();
        },
        checkHistoryButtonStatus() {
            this.nextBtn && this.backBtn && (this.history.hasNext() ? this.removeClass(this.nextBtn, "disabled") : this.addClass(this.nextBtn, "disabled"),
            this.history.hasPrevious() ? this.removeClass(this.backBtn, "disabled") : this.addClass(this.backBtn, "disabled"));
        },
        storeHistory() {
            this.history.add(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)),
            this.checkHistoryButtonStatus();
        },
        handleBackButtonClick() {
            this.history.hasPrevious() && (this.finishLastDrawing(), this.context.putImageData(this.history.previous(), 0, 0),
            this.storeCanvas(), this.checkHistoryButtonStatus());
        },
        handleForwardButtonClick() {
            this.history.hasNext() && (this.finishLastDrawing(), this.context.putImageData(this.history.next(), 0, 0),
            this.storeCanvas(), this.checkHistoryButtonStatus());
        },
        persistLocalStorage() {
            const a = this.canvas.toDataURL();
            try {
                j.localStorage.setItem(`WP_CRX_STORAGE_SNAPSHOT_${j.location.pathname}`, a);
            } catch (S) {
                try {
                    j.localStorage.clear(), j.localStorage.setItem(`WP_CRX_STORAGE_SNAPSHOT_${j.location.pathname}`, a);
                } catch (j) {}
            }
        },
        storeCanvas(a) {
            this.buffer = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
            a || (this.persistTimer && (this.persistTimer = j.clearInterval(this.persistTimer)),
            this.persistTimer = j.setTimeout(this.persistLocalStorageBinded, 500));
        },
        restoreCanvas(j) {
            j ? (this.context.clearRect.apply(this.context, j), j.unshift(this.buffer, 0, 0),
            j[j.length - 1] += 1, j[j.length - 2] += 1, this.context.putImageData.apply(this.context, j)) : (this.context.clearRect(0, 0, this.canvas.width, this.canvas.height),
            this.context.putImageData(this.buffer, 0, 0));
        },
        handlePanelAppearing(j) {
            j.target.style.opacity = 1;
        },
        handleResize(a) {
            const g = Math.min;
            let f = !1;
            const O = j.pageYOffset || document.documentElement.scrollTop, x = (j.innerHeight || document.documentElement.clientHeight,
            this.context.lineWidth), h = S(document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth), n = S(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
            let A = g(n - this.canvas.offsetTop, 5e3);
            O - this.canvas.offsetTop > 5e3 ? (A = g(n - O, 5e3), this.canvas.style.top = `${O}px`,
            f = !0) : O < this.canvas.offsetTop && (A = 5e3, this.canvas.style.top = `${S(0, 5e3 * Math.floor(O / 5e3))}px`,
            f = !0), f ? (this.context.clearRect(0, 0, this.canvas.width, this.canvas.height),
            this.paragraph && (this.paragraph.clearIntervals(), this.paragraph = null), this.storeCanvas(!0)) : this.storeCanvas(a),
            this.canvas.width = h, this.canvas.height = A, f || this.restoreCanvas(), this.updatePaintStyle(),
            this.context.lineWidth = x;
        },
        createControlPanel() {
            this.panel = j.document.createElement("div"), this.backBtn = j.document.createElement("div"),
            this.nextBtn = j.document.createElement("div");
            const S = j.document.createElement("div"), g = j.document.createElement("div"), f = j.document.createElement("div"), O = j.document.createElement("div"), x = j.document.createElement("div"), h = j.document.createElement("div"), n = j.document.createElement("div"), A = j.document.createElement("div");
            this.panel.setAttribute("id", "NOTEPAD_controls"), S.setAttribute("class", "NOTEPAD_controls_container"),
            g.setAttribute("class", "NOTEPAD_controls_container"), f.setAttribute("class", "NOTEPAD_controls_draw"),
            O.setAttribute("class", "NOTEPAD_controls_color"), x.setAttribute("class", "NOTEPAD_controls_control"),
            h.setAttribute("class", "NOTEPAD_controls_range_wrapper"), n.setAttribute("class", "NOTEPAD_controls_range alpha_control"),
            A.setAttribute("class", "NOTEPAD_controls_range size_control"), j.document.body.appendChild(this.panel),
            this.panel.appendChild(S), this.panel.appendChild(g), g.appendChild(f), S.appendChild(x),
            S.appendChild(O), S.appendChild(n), S.appendChild(A);
            for (let a = 0; a < this.drawOptions.length; a++) {
                const S = this.drawOptions[a], g = j.document.createElement("div");
                g.setAttribute("class", "NOTEPAD_controls_draw_option"), g.setAttribute("title", S.title),
                this.addClass(g, S.type), g.addEventListener("click", Function.prototype.bind.call(this.onControlPanelClick, this, a)),
                f.appendChild(g), (this.config.tool !== null && void 0 !== this.config.tool || a != 0) && a !== this.config.tool || this.triggerClick(g);
            }
            this.colorPicker = j.document.createElement("input"), this.colorPicker.setAttribute("type", "color"),
            this.colorPicker.value = this.config.color || "#40c0eb", this.colorPicker.setAttribute("title", "Select a color"),
            this.colorPicker.addEventListener("change", Function.prototype.bind.call(this.onColorPanelClick, this), !1),
            O.appendChild(this.colorPicker), this.alphaPicker = j.document.createElement("input"),
            this.alphaPicker.setAttribute("type", "range"), this.alphaPicker.setAttribute("min", "0"),
            this.alphaPicker.setAttribute("max", "1"), this.alphaPicker.setAttribute("step", "0.01"),
            this.alphaPicker.value = this.config.alpha !== null && void 0 !== this.config.alpha ? this.config.alpha : 1,
            this.alphaPicker.setAttribute("title", "Select transparency"), this.alphaPicker.addEventListener("change", Function.prototype.bind.call(this.onAlphaChange, this), !1),
            this.alphaPicker.addEventListener("input", Function.prototype.bind.call(this.onAlphaUpdate, this), !1),
            this.alphaPickerPreview = j.document.createElement("p");
            const s = j.document.createElement("div"), D = j.document.createElement("p");
            D.innerHTML = "Transparency", s.appendChild(D), s.appendChild(this.alphaPickerPreview),
            n.appendChild(s), n.appendChild(this.alphaPicker);
            const W = j.document.createElement("input");
            W.setAttribute("type", "range"), W.setAttribute("min", "1"), W.setAttribute("max", "20"),
            W.setAttribute("step", "1"), W.value = this.config.thickness || 2, W.setAttribute("title", "Select line width"),
            W.addEventListener("change", Function.prototype.bind.call(this.onLineChange, this), !1),
            W.addEventListener("input", Function.prototype.bind.call(this.onLineUpdate, this), !1),
            this.linePickerPreview = j.document.createElement("p");
            const e = j.document.createElement("div"), Y = j.document.createElement("p");
            Y.innerHTML = "Size", e.appendChild(Y), e.appendChild(this.linePickerPreview), A.appendChild(e),
            A.appendChild(W), this.selectedColorOption = this.hexToRgb(this.colorPicker.value),
            this.selectedAlphaOption = this.alphaPicker.value, this.context.lineWidth = W.value,
            this.alphaPickerPreview.innerHTML = `${a(100 * this.selectedAlphaOption)}%`, this.linePickerPreview.innerHTML = `${a(100 * (this.context.lineWidth / 20))}%`,
            this.updatePaintStyle();
            const P = j.document.createElement("div"), z = j.document.createElement("div"), o = j.document.createElement("div"), d = j.document.createElement("div");
            P.setAttribute("class", "NOTEPAD_controls_control_option prtBtn"), P.setAttribute("title", "Take a screenshot of the current web page with your drawings"),
            z.setAttribute("class", "NOTEPAD_controls_control_option exitBtn"), z.setAttribute("title", "Quit"),
            this.backBtn.setAttribute("class", "NOTEPAD_controls_control_option backBtn"), this.backBtn.setAttribute("title", "Step backward"),
            this.nextBtn.setAttribute("class", "NOTEPAD_controls_control_option nextBtn"), this.nextBtn.setAttribute("title", "Step forward"),
            o.setAttribute("class", "NOTEPAD_controls_control_option eraseAllBtn"), o.setAttribute("title", "Erase all"),
            d.setAttribute("class", "NOTEPAD_controls_control_option hideCtrlBtn"), d.setAttribute("title", "Close control panel (Click the extension icon to re-open)"),
            P.addEventListener("click", Function.prototype.bind.call(this.onPrintButtonClick, this)),
            z.addEventListener("click", Function.prototype.bind.call(this.exit, this)), this.backBtn.addEventListener("click", Function.prototype.bind.call(this.handleBackButtonClick, this)),
            this.nextBtn.addEventListener("click", Function.prototype.bind.call(this.handleForwardButtonClick, this)),
            o.addEventListener("click", Function.prototype.bind.call(this.eraseAll, this)),
            d.addEventListener("click", Function.prototype.bind.call(this.hideControlPanel, this)),
            x.appendChild(this.backBtn), x.appendChild(this.nextBtn), x.appendChild(o), x.appendChild(P),
            x.appendChild(d), S.appendChild(z), this.checkHistoryButtonStatus(), this.CSSAnimationManager.supported ? this.panel.addEventListener(this.CSSAnimationManager.end, Function.prototype.bind.call(this.handlePanelAppearing, this), !1) : this.panel.style.opacity = 1;
        },
        handleOptionsClick() {
            chrome.runtime.sendMessage({
                method: "open_options"
            });
        },
        finishLastDrawing() {
            const j = this.drawOptions[this.selectedDrawOption];
            j && j.type === "polygon" && j.lastLoc && j.initLoc ? (this.context.beginPath(),
            this.context.moveTo(j.lastLoc.x, j.lastLoc.y), this.context.lineTo(j.initLoc.x, j.initLoc.y),
            this.context.stroke(), this.context.closePath(), this.mousedown = !1, j.initLoc = null,
            j.lastLoc = null, this.storeCanvas(), this.storeHistory()) : j && j.type === "quadratic_curve" && j.iteration !== 0 ? (this.context.closePath(),
            this.storeCanvas(), this.storeHistory(), this.mousedown = !1, j.iteration = 0, j.initLoc = null,
            j.lastLoc = null) : j && j.type === "bezier_curve" && j.iteration !== 0 ? (this.context.closePath(),
            this.storeCanvas(), this.storeHistory(), this.mousedown = !1, j.iteration = 0, j.initLoc = null,
            j.firstPoint = null, j.lastPoint = null) : j !== "eyedropper" && !0 === this.mousedown && (this.mousedown = !1,
            this.storeCanvas(), this.storeHistory()), this.paragraph && this.paragraph.clearIntervals(Function.prototype.bind.call((function() {
                this.paragraph = null, this.storeCanvas(), this.storeHistory();
            }), this));
        },
        setColor(j) {
            j && (this.colorPicker.value = this.rgbToHex(j.r, j.g, j.b), this.selectedColorOption = {
                r: j.r,
                g: j.g,
                b: j.b
            }, this.alphaPicker.value = j.a / 255, this.selectedAlphaOption = this.alphaPicker.value,
            this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = `${a(100 * this.selectedAlphaOption)}%`),
            this.updatePaintStyle(), this.config.color === this.colorPicker.value && this.config.alpha === this.selectedAlphaOption || (this.config.color = this.colorPicker.value,
            this.config.alpha = this.selectedAlphaOption, this.saveData()));
        },
        getColorOfCurrentPixel(j) {
            chrome.runtime.sendMessage({
                method: "getCapturedImg"
            }, (a => {
                const {imgSrc: S} = a;
                if (!S) return;
                const g = document.createElement("canvas"), f = new Image, O = g.getContext("2d");
                document.documentElement.appendChild(g), f.src = S;
                const x = this.setColorBinded;
                f.onload = () => {
                    g.width = f.naturalWidth, g.height = f.naturalHeight, O.drawImage(f, 0, 0);
                    const a = O.getImageData(0, 0, g.width, g.height), S = 4 * (j.y * a.width + j.x), h = a.data, n = {
                        r: h[S],
                        g: h[S + 1],
                        b: h[S + 2],
                        a: h[S + 3]
                    };
                    document.documentElement.removeChild(g), x(n);
                };
            }));
        },
        onPrintButtonClick() {
            this.addClass(this.panel, "hide"), j.setTimeout((() => {
                f.runtime.sendMessage({
                    method: "take_screen_shot"
                });
            }), 100), j.setTimeout(Function.prototype.bind.call((function() {
                this.removeClass(this.panel, "hide");
            }), this), 500);
        },
        onControlPanelClick(a) {
            if (this.selectedDrawOption !== a) {
                const S = j.document.querySelectorAll("#NOTEPAD_controls .NOTEPAD_controls_draw_option");
                this.finishLastDrawing();
                for (let j = 0; j < S.length; j++) this.removeClass(S[j], "selected");
                this.addClass(S[a], "selected"), this.removeClass(this.canvas, "pen"), this.removeClass(this.canvas, "cross"),
                this.removeClass(this.canvas, "eraser"), this.removeClass(this.canvas, "text"),
                this.removeClass(this.canvas, "cursor"), this.removeClass(this.canvas, "eyedropper"),
                this.removeClass(this.canvas, "fill"), this.selectedDrawOption = a;
                const g = this.drawOptions[this.selectedDrawOption];
                g.type === "pen" ? this.addClass(this.canvas, "pen") : g.type === "eraser" ? this.addClass(this.canvas, "eraser") : g.type === "text" ? this.addClass(this.canvas, "text") : g.type === "cursor" ? this.addClass(this.canvas, "cursor") : g.type === "eyedropper" ? this.addClass(this.canvas, "eyedropper") : g.type === "fill" ? this.addClass(this.canvas, "fill") : this.addClass(this.canvas, "cross"),
                this.config.tool !== this.selectedDrawOption && (this.config.tool = this.selectedDrawOption,
                this.saveData());
            }
        },
        hexToRgb(j) {
            const a = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(j);
            return a ? {
                r: parseInt(a[1], 16),
                g: parseInt(a[2], 16),
                b: parseInt(a[3], 16)
            } : null;
        },
        rgbToHex: (j, a, S) => `#${(16777216 + (j << 16) + (a << 8) + S).toString(16).slice(1)}`,
        onColorPanelClick(j) {
            this.selectedColorOption = this.hexToRgb(j.currentTarget.value), this.updatePaintStyle(),
            this.config.color !== j.currentTarget.value && (this.config.color = j.currentTarget.value,
            this.saveData());
        },
        onAlphaChange(j) {
            this.selectedAlphaOption = j.currentTarget.value, this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = `${a(100 * this.selectedAlphaOption)}%`),
            this.updatePaintStyle(), this.config.alpha !== this.selectedAlphaOption && (this.config.alpha = this.selectedAlphaOption,
            this.saveData());
        },
        onAlphaUpdate(j) {
            this.alphaPickerPreview && (this.alphaPickerPreview.innerHTML = `${a(100 * j.currentTarget.value)}%`);
        },
        onLineChange(j) {
            this.context.lineWidth = j.currentTarget.value, this.linePickerPreview && (this.linePickerPreview.innerHTML = `${a(100 * (this.context.lineWidth / 20))}%`),
            this.config.thickness !== this.context.lineWidth && (this.config.thickness = this.context.lineWidth,
            this.saveData());
        },
        onLineUpdate(j) {
            this.linePickerPreview && (this.linePickerPreview.innerHTML = `${a(100 * (j.currentTarget.value / 20))}%`);
        },
        updatePaintStyle() {
            this.selectedColorOption !== null && this.selectedAlphaOption !== null && (this.cursor.fillStyle = `rgba(${this.selectedColorOption.r},${this.selectedColorOption.g},${this.selectedColorOption.b},${this.selectedAlphaOption})`,
            this.context.strokeStyle = `rgba(${this.selectedColorOption.r},${this.selectedColorOption.g},${this.selectedColorOption.b},${this.selectedAlphaOption})`,
            this.context.fillStyle = `rgba(${this.selectedColorOption.r},${this.selectedColorOption.g},${this.selectedColorOption.b},${this.selectedAlphaOption})`);
        },
        addMouseEventListener() {
            const a = Function.prototype.bind.call(this.handleMouseDown, this), S = Function.prototype.bind.call(this.handleMouseMove, this), g = Function.prototype.bind.call(this.handleMouseUp, this), f = Function.prototype.bind.call(this.handleMouseLeave, this);
            this.canvas.addEventListener("mousedown", a), this.canvas.addEventListener("touchstart", a),
            this.canvas.addEventListener("mousemove", S), this.canvas.addEventListener("touchmove", S),
            this.canvas.addEventListener("mouseup", g), this.canvas.addEventListener("touchend", g),
            this.canvas.addEventListener("mouseleave", f), j.document.addEventListener("keydown", this.keydownBinded),
            j.document.addEventListener("keypress", this.keypressBinded);
        },
        addKeyEventListeners() {
            chrome.storage.local.get((a => {
                a.config.hotkeys && (this.config.hotkeys = a.config.hotkeys, j.document.addEventListener("keydown", this.handleHotKeysDownBinded));
            }));
        },
        handleHotKeysDown(a) {
            const S = j.event ? event : a;
            if ((S.ctrlKey || S.metaKey) && S.shiftKey) for (const j in this.config.hotkeys) if (this.config.hotkeys.hasOwnProperty(j) && this.config.hotkeys[j].charCodeAt(0) === S.keyCode) {
                if (j == "eraseAll") return void this.eraseAll();
                for (let a = 0; a < this.drawOptions.length; a++) if (this.drawOptions[a].type === j) {
                    this.onControlPanelClick(a);
                    break;
                }
                break;
            }
        },
        matchOutlineColor: (j, a, S, g) => j !== 255 && a !== 255 && S !== 255 && g !== 0,
        handleFill(j) {
            const S = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height), g = 4 * (j.y * this.canvas.width + j.x), f = S.data[g], O = S.data[g + 1], x = S.data[g + 2], h = S.data[g + 3], n = this.selectedColorOption.r, A = this.selectedColorOption.g, s = this.selectedColorOption.b, D = a(255 * this.selectedAlphaOption);
            f === n && O === A && x === s && h === D || this.matchOutlineColor(f, O, x, h) || (this.floodFill(j.x, j.y, [ this.selectedColorOption.r, this.selectedColorOption.g, this.selectedColorOption.b, a(255 * this.selectedAlphaOption) ], !1, S, 0, !0),
            this.context.putImageData(S, 0, 0), this.storeCanvas(), this.storeHistory());
        },
        floodFill(j, a, g, f, O, x) {
            let h, n, A;
            const s = O.data, D = [];
            let W = !1, e = !1;
            const Y = O.width, P = O.height, z = new Uint8ClampedArray(Y * P), o = 4 * Y;
            let d = j, T = a;
            const L = T * o + 4 * d, R = s[L], b = s[L + 1], p = s[L + 2], t = s[L + 3];
            let N = !1;
            const u = function(j, a) {
                const f = Math.abs;
                if (j < 0 || a < 0 || P <= a || Y <= j) return !1;
                const O = a * o + 4 * j;
                let h = S(f(R - s[O]), f(b - s[O + 1]), f(p - s[O + 2]), f(t - s[O + 3]));
                h < x && (h = 0);
                const n = f(0 - z[a * Y + j]);
                return N || h !== 0 && n !== 255 && (s[O] = g[0], s[O + 1] = g[1], s[O + 2] = g[2],
                s[O + 3] = (g[3] + s[O + 3]) / 2, z[a * Y + j] = 255), h + n === 0;
            };
            for (D.push([ d, T ]); D.length; ) {
                const j = D.pop();
                for (d = j[0], T = j[1], N = !0; u(d, T - 1); ) T -= 1;
                for (N = !1, f && (!u(d - 1, T) && u(d - 1, T - 1) && D.push([ d - 1, T - 1 ]),
                !u(d + 1, T) && u(d + 1, T - 1) && D.push([ d + 1, T - 1 ])), e = W = !1; u(d, T); ) s[A = (n = T) * o + 4 * (h = d)] = g[0],
                s[A + 1] = g[1], s[A + 2] = g[2], s[A + 3] = g[3], z[n * Y + h] = 255, u(d - 1, T) ? W || (D.push([ d - 1, T ]),
                W = !0) : W && (W = !1), u(d + 1, T) ? e || (D.push([ d + 1, T ]), e = !0) : e && (e = !1),
                T += 1;
                f && (u(d - 1, T) && !W && D.push([ d - 1, T ]), u(d + 1, T) && !e && D.push([ d + 1, T ]));
            }
        },
        handleKeyDown(j) {
            this.paragraph && (j.keyCode !== 8 && j.keyCode !== 13 || j.preventDefault(), j.keyCode === 8 ? this.paragraph.backspace() : j.keyCode === 13 && this.paragraph.newline());
        },
        handleKeyPress(j) {
            if (this.paragraph) {
                const a = String.fromCharCode(j.which);
                if (j.keyCode !== 8 && !j.ctrlKey && !j.metaKey) {
                    j.preventDefault();
                    const S = this.drawOptions[this.selectedDrawOption];
                    this.context.font = `${S.minSize + (S.maxSize - S.minSize) * this.context.lineWidth / 20}px ${S.font}`,
                    this.paragraph.insert(a);
                }
            }
        },
        handleMouseDown(S) {
            S.preventDefault(), this.mousedown = !0;
            const g = this.drawOptions[this.selectedDrawOption];
            if (this.lastMouseDownLoc = this.windowToCanvas(S.clientX, S.clientY), g.type === "pen") this.context.beginPath(),
            this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y + 16); else if (g.type === "eyedropper") this.getColorOfCurrentPixel({
                x: a(j.devicePixelRatio * (void 0 === S.clientX ? S.touches[0].clientX : S.clientX - 2)),
                y: a(j.devicePixelRatio * (void 0 === S.clientY ? S.touches[0].clientY : S.clientY + 22))
            }); else if (g.type === "line") this.storeCanvas(); else if (g.type === "quadratic_curve") {
                if (g.iteration === 0) this.storeCanvas(), g.initLoc = {
                    x: this.lastMouseDownLoc.x,
                    y: this.lastMouseDownLoc.y
                }; else if (g.iteration !== 1) throw new Error("invalid iteration");
            } else if (g.type === "bezier_curve") {
                if (g.iteration === 0) this.storeCanvas(), g.initLoc = {
                    x: this.lastMouseDownLoc.x,
                    y: this.lastMouseDownLoc.y
                }; else if (g.iteration === 1) ; else if (g.iteration !== 2) throw new Error("invalid iteration");
            } else if (g.type === "polygon") this.storeCanvas(), g.lastLoc ? (this.context.beginPath(),
            this.context.moveTo(g.lastLoc.x, g.lastLoc.y), this.context.lineTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.stroke()) : (g.lastLoc = {
                x: this.lastMouseDownLoc.x,
                y: this.lastMouseDownLoc.y
            }, g.initLoc = {
                x: this.lastMouseDownLoc.x,
                y: this.lastMouseDownLoc.y
            }); else if (g.type === "circle") this.storeCanvas(); else if (g.type === "rectangle") this.storeCanvas(); else if (g.type === "eraser") this.restoreCanvas(),
            this.context.save(), this.context.translate(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.clearRect(0, 0, g.width, g.height), this.context.restore(); else if (g.type === "fill") this.handleFill(this.lastMouseDownLoc); else if (g.type === "text") if (this.cursor.erase(this.context, this.drawingSurfaceImageData),
            this.storeCanvas(), this.paragraph && this.paragraph.isPointInside(this.lastMouseDownLoc)) this.paragraph.moveCursorCloseTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y); else {
                this.paragraph && (this.paragraph.clearIntervals(), this.paragraph = null);
                let j = this.context.measureText("W").width;
                j += j / 6, this.paragraph = new Paragraph(this.context, this.lastMouseDownLoc.x, this.lastMouseDownLoc.y - j, this.drawingSurfaceImageData, this.cursor),
                this.paragraph.addLine(new TextLine(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y));
            }
        },
        handleMouseMove(j) {
            const a = Math.sin, S = Math.cos, g = Math.PI, f = Math.atan2;
            j.preventDefault();
            const O = this.drawOptions[this.selectedDrawOption], x = this.windowToCanvas(void 0 === j.clientX ? j.touches[0].clientX : j.clientX, void 0 === j.clientY ? j.touches[0].clientY : j.clientY);
            if (this.setLineProperty(), this.mousedown || O.type != "eraser" || (this.restoreCanvas(),
            this.context.save(), this.context.translate(x.x, x.y), this.context.clearRect(0, 0, O.width, O.height),
            this.context.restore()), O.type === "quadratic_curve" ? O.iteration && O.lastLoc && (this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(O.initLoc.x, O.initLoc.y), this.context.quadraticCurveTo(x.x, x.y, O.lastLoc.x, O.lastLoc.y),
            this.context.stroke()) : O.type === "bezier_curve" && (O.iteration === 1 && O.firstPoint ? (this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(O.initLoc.x, O.initLoc.y), this.context.quadraticCurveTo(x.x, x.y, O.firstPoint.x, O.firstPoint.y),
            this.context.stroke()) : O.iteration === 2 && O.firstPoint && O.lastPoint && (this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(O.initLoc.x, O.initLoc.y), this.context.bezierCurveTo(O.lastPoint.x, O.lastPoint.y, x.x, x.y, O.firstPoint.x, O.firstPoint.y),
            this.context.stroke())), this.mousedown) if (O.type === "pen") this.restoreCanvas(),
            this.context.lineTo(x.x, x.y + 16), this.context.stroke(); else if (O.type === "line") this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.lineTo(x.x, x.y), this.context.stroke(); else if (O.type === "arrow") {
                this.restoreCanvas(), this.context.beginPath();
                const j = x.x - this.lastMouseDownLoc.x, O = x.y - this.lastMouseDownLoc.y, h = f(O, j);
                this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y), this.context.lineTo(x.x, x.y),
                this.context.lineTo(x.x - 20 * S(h - g / 6), x.y - 20 * a(h - g / 6)), this.context.moveTo(x.x, x.y),
                this.context.lineTo(x.x - 20 * S(h + g / 6), x.y - 20 * a(h + g / 6)), this.context.stroke();
            } else if (O.type === "quadratic_curve") O.iteration === 0 && (this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.lineTo(x.x, x.y), this.context.stroke()); else if (O.type === "bezier_curve") O.iteration === 0 && (this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.lineTo(x.x, x.y), this.context.stroke()); else if (O.type === "polygon") this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(O.lastLoc.x, O.lastLoc.y), this.context.lineTo(x.x, x.y),
            this.context.stroke(); else if (O.type === "circle") this.restoreCanvas(), this.drawEllipse(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y, x.x - this.lastMouseDownLoc.x, x.y - this.lastMouseDownLoc.y); else if (O.type === "rectangle") this.restoreCanvas(),
            this.context.beginPath(), this.context.moveTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.lineTo(this.lastMouseDownLoc.x, x.y), this.context.lineTo(x.x, x.y),
            this.context.lineTo(x.x, this.lastMouseDownLoc.y), this.context.lineTo(this.lastMouseDownLoc.x, this.lastMouseDownLoc.y),
            this.context.stroke(); else if (O.type === "eraser") this.context.save(), this.context.translate(x.x, x.y),
            this.context.clearRect(0, 0, O.width, O.height), this.context.restore();
        },
        handleMouseUp(j) {
            j.preventDefault(), this.mousedown = !1;
            const a = this.drawOptions[this.selectedDrawOption], S = this.windowToCanvas(void 0 === j.clientX ? j.changedTouches[0].clientX : j.clientX, void 0 === j.clientY ? j.changedTouches[0].clientY : j.clientY);
            a.type === "arrow" && (this.context.closePath(), this.storeCanvas(), this.storeHistory()),
            a.type === "pen" ? (this.context.closePath(), this.storeCanvas(), this.storeHistory()) : a.type === "line" ? (this.context.closePath(),
            this.storeCanvas(), this.storeHistory()) : a.type === "quadratic_curve" ? a.iteration === 0 ? (a.lastLoc = {
                x: S.x,
                y: S.y
            }, a.iteration++) : a.iteration === 1 && (this.context.closePath(), this.storeCanvas(),
            this.storeHistory(), a.iteration = 0, a.initLoc = null, a.lastLoc = null) : a.type === "bezier_curve" ? a.iteration === 0 ? (a.firstPoint = {
                x: S.x,
                y: S.y
            }, a.iteration++) : a.iteration === 1 ? (a.lastPoint = {
                x: S.x,
                y: S.y
            }, a.iteration++) : a.iteration === 2 && (this.context.closePath(), this.storeCanvas(),
            this.storeHistory(), a.iteration = 0, a.initLoc = null, a.firstPoint = null, a.lastPoint = null) : a.type === "polygon" ? (this.storeCanvas(),
            this.storeHistory(), a.lastLoc = {
                x: S.x,
                y: S.y
            }) : a.type === "circle" ? (this.storeCanvas(), this.storeHistory()) : a.type === "rectangle" ? (this.context.closePath(),
            this.storeCanvas(), this.storeHistory()) : a.type === "eraser" && (this.storeCanvas(),
            this.storeHistory());
        },
        handleMouseLeave() {
            this.drawOptions[this.selectedDrawOption].type === "eraser" && this.restoreCanvas();
        },
        setLineProperty() {
            this.context.lineJoin = "round", this.context.lineCap = "round";
        },
        drawEllipse(j, a, S, g) {
            const f = .5522848 * (S / 2), O = .5522848 * (g / 2), x = j + S, h = a + g, n = j + S / 2, A = a + g / 2;
            this.context.beginPath(), this.context.moveTo(j, A), this.context.bezierCurveTo(j, A - O, n - f, a, n, a),
            this.context.bezierCurveTo(n + f, a, x, A - O, x, A), this.context.bezierCurveTo(x, A + O, n + f, h, n, h),
            this.context.bezierCurveTo(n - f, h, j, A + O, j, A), this.context.stroke();
        },
        addClass(j, a) {
            j.className.indexOf(a) >= 0 || (j.className = `${j.className} ${a}`);
        },
        removeClass(j, a) {
            j.className = j.className.replace(new RegExp(`\\b${a}\\b`, "g"), "");
        },
        triggerClick(j) {
            this.triggerEvent(j, "click");
        },
        triggerEvent(j, a) {
            let S;
            document.createEvent ? (S = document.createEvent("HTMLEvents")).initEvent(a, !0, !0) : document.createEventObject && ((S = document.createEventObject()).eventType = a),
            S.eventName = a, j.dispatchEvent ? j.dispatchEvent(S) : j.fireEvent && htmlEvents[`on${a}`] ? j.fireEvent(`on${S.eventType}`, S) : j[a] ? j[a]() : j[`on${a}`] && j[`on${a}`]();
        },
        initDragging() {
            this.panel.addEventListener("mousedown", this.handleDraggingStart), this.panel.addEventListener("touchstart", this.handleDraggingStart),
            j.document.addEventListener("mouseup", this.handleDragDone), j.document.addEventListener("touchend", this.handleDragDone);
        },
        handleDraggingStart(j) {
            O.pos_x = this.getBoundingClientRect().left - (void 0 === j.clientX ? j.touches[0].clientX : j.clientX),
            O.pos_y = this.getBoundingClientRect().top - (void 0 === j.clientY ? j.touches[0].clientY : j.clientY),
            this.addEventListener("mousemove", O.handleDragging), this.addEventListener("touchmove", O.handleDragging);
        },
        handleDragging(j) {
            j.target.nodeName.toUpperCase() !== "INPUT" && (j.preventDefault(), this.style.top = `${(void 0 === j.clientY ? j.touches[0].clientY : j.clientY) + O.pos_y}px`,
            this.style.left = `${(void 0 === j.clientX ? j.touches[0].clientX : j.clientX) + O.pos_x}px`);
        },
        handleDragDone() {
            O.panel.removeEventListener("mousemove", O.handleDragging), O.panel.removeEventListener("touchmove", O.handleDragging);
        },
        windowToCanvas(j, S) {
            const g = this.canvas.getBoundingClientRect();
            return {
                x: a(j) - g.left * (this.canvas.width / g.width),
                y: a(S) - g.top * (this.canvas.height / g.height)
            };
        },
        handlePostMessageResponse(a) {
            if (a.origin === j.location.origin) {
                const j = a.data;
                j.method === "get_pixel_color_response" ? this.setColor(j.response) : j.method === "get_data_response" && this.render(j.response);
            }
        },
        exit() {
            this.canvas.parentNode.removeChild(this.canvas), this.panel.parentNode.removeChild(this.panel),
            j.document.removeEventListener("keydown", this.keydownBinded), j.document.removeEventListener("keypress", this.keypressBinded),
            j.document.removeEventListener("keydown", this.handleHotKeysDownBinded), j.document.removeEventListener("mouseup", this.handleDragDone),
            j.removeEventListener("resize", this.resizeBinded), j.removeEventListener("scroll", this.resizeBinded),
            this.canvas = null, this.context = null, this.selectedDrawOption = null, this.selectedColorOption = null,
            this.selectedAlphaOption = null, this.mousedown = !1, this.lastMouseDownLoc = null,
            this.drawingSurfaceImageData = null, this.paragraph = null, this.panel = null, this.initialized = !1,
            this.controlPanelHidden = !1, typeof unsafeWindow !== "undefined" && unsafeWindow !== null && (unsafeWindow.NOTEPAD_INIT = !1,
            unsafeWindow.CTRL_HIDDEN = !1);
        },
        eraseAll() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height), this.paragraph && (this.paragraph.clearIntervals(),
            this.paragraph = null), this.storeCanvas(!0), this.storeHistory(), j.localStorage.removeItem(`WP_CRX_STORAGE_SNAPSHOT_${j.location.pathname}`);
        },
        hideControlPanel() {
            this.addClass(this.panel, "hide"), this.controlPanelHidden = !0, typeof unsafeWindow !== "undefined" && unsafeWindow !== null && (unsafeWindow.CTRL_HIDDEN = !0);
        },
        showControlPanel() {
            this.removeClass(this.panel, "hide"), this.controlPanelHidden = !1, typeof unsafeWindow !== "undefined" && unsafeWindow !== null && (unsafeWindow.CTRL_HIDDEN = !1);
        },
        saveData() {
            f.runtime.sendMessage({
                method: "save_data",
                config: this.config
            });
        },
        render(j) {
            this.config = j || {}, this.createCanvas(), this.setLineProperty(), this.createControlPanel(),
            this.initDragging(), this.addMouseEventListener(), this.addKeyEventListeners();
        },
        initConfig() {
            f.runtime.sendMessage({
                method: "get_data"
            }, this.renderBinded);
        },
        init() {
            this.history = new g, this.CSSAnimationManager = getCSSAnimationManager(), this.setColorBinded = Function.prototype.bind.call(this.setColor, this),
            this.renderBinded = Function.prototype.bind.call(this.render, this), this.handlePostMessageResponseBinded = Function.prototype.bind.call(this.handlePostMessageResponse, this),
            this.keydownBinded = Function.prototype.bind.call(this.handleKeyDown, this), this.keypressBinded = Function.prototype.bind.call(this.handleKeyPress, this),
            this.handleHotKeysDownBinded = Function.prototype.bind.call(this.handleHotKeysDown, this),
            this.persistLocalStorageBinded = Function.prototype.bind.call(this.persistLocalStorage, this),
            this.resizeBinded = Function.prototype.bind.call((function() {
                this.resizeTimeoutID && (this.resizeTimeoutID = j.clearTimeout(this.resizeTimeoutID)),
                this.resizeTimeoutID = j.setTimeout(Function.prototype.bind.call(this.handleResize, this), 200);
            }), this), this.initConfig(), this.initialized = !0, typeof unsafeWindow !== "undefined" && unsafeWindow !== null && (unsafeWindow.NOTEPAD_INIT = !0);
        }
    };
    return O;
}));