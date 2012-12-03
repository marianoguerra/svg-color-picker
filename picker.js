/*global document window*/
(function () {
    "use strict";
    var SVG_NS = "http://www.w3.org/2000/svg";

    function newSvgElement(name, attrs, parent) {
        var key, e = document.createElementNS(SVG_NS, name);

        for (key in attrs) {
            e.setAttribute(key, attrs[key]);
        }

        if (parent) {
            parent.appendChild(e);
        }

        return e;
    }

    //<rect id="handle" x="10" y="9" width="5" height="12" style="stroke: #000000; fill: #ffffff; stroke-width: 1; cursor: pointer;" />
    function newHandle(id, x, y, width, height, stroke, fill, strokeWidth) {
        width = width || 5;
        height = height || 12;
        stroke = stroke || "#000000";
        fill = fill || "#ffffff";
        strokeWidth = strokeWidth || 1;

        return newSvgElement("rect", {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            style: "stroke: " + stroke + "; fill: " + fill + "; stroke-width: " + strokeWidth + "; cursor: pointer;"
        });
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function LinearGradient(id, stops) {
        var that = this;

        this.gradient = newSvgElement("linearGradient", {
            id: id
        });

        stops.forEach(function (stopAttrs) {
            that.gradient.appendChild(newSvgElement("stop", stopAttrs));
        });
    }

    LinearGradient.prototype = {
        addToParent: function (parent) {
            parent.appendChild(this.gradient);
        }
    };

    function Handle(id, x, y, xMin, xMax, onMove) {
        var
            dx,
            that = this;

        this.handle = newHandle(id, x, y);
        this.id = id;
        this.x = x;
        this.y = y;
        this.xMin = xMin;
        this.xMax = xMax;
        this.width = this.xMax - this.xMin;
        this.onMove = onMove;


        function mousemoveListener(evt) {
            that.setX(evt.clientX);
        }

        function mouseupListener(evt) {
            document.removeEventListener("mousemove", mousemoveListener, true);
            document.removeEventListener("mouseup", mouseupListener, true);
        }

        function mousedownListener(evt) {
            dx = that.handle.x.baseVal.value - evt.clientX;
            document.addEventListener("mousemove", mousemoveListener, true);
            document.addEventListener("mouseup", mouseupListener, true);
        }

        this.handle.addEventListener("mousedown", mousedownListener, false);
    }

    Handle.prototype = {
        addToParent: function (parent) {
            parent.appendChild(this.handle);
        },
        setX: function (x) {
            var id;

            if (x > this.xMax || x < this.xMin) {
                return;
            }

            id = this.handle.ownerSVGElement.suspendRedraw(1000);
            this.handle.x.baseVal.value = x;
            this.handle.ownerSVGElement.unsuspendRedraw(id);
            this.onMove(x);
        },
        setValue: function (value) {
            this.setX(this.x + (value / 100.0 * this.width));
        }
    };

    function Range(id, x, y, width, height, onHandleMove, gradientId, stroke,
                   strokeWidth) {

        var that = this;

        this.handle = new Handle(id + "-handle", x, y - 1, x, x + width,
                                 onHandleMove);

        stroke = stroke || "#000000";
        strokeWidth = strokeWidth || 1;

        this.range = newSvgElement("rect", {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            style: "fill:url(#" + gradientId + "); stroke: " + stroke +
                "; stroke-width: " + strokeWidth + ";",
            onmousedown: "return false"
        });

        this.range.addEventListener("mouseup", function (event) {
            that.handle.handle.x.baseVal.value = event.clientX;
            onHandleMove(event.clientX);
        });
    }

    Range.prototype = {
        addToParent: function (parent) {
            parent.appendChild(this.range);
            this.handle.addToParent(parent);
        },
        setValue: function (position) {
            this.handle.setValue(position);
        }
    };

    function ColorPicker(container, x, y, newHue, newLightness, newSaturation) {
        var
            stamp = Date.now(),
            defs,

            hueGradient,

            lightGradient,
            lightGradientMiddle,

            saturationGradient,
            saturationGradientMiddle,
            saturationGradientEnd,

            currentColor,

            hueBar,
            lightBar,
            saturationBar;

        function ns(id) {
            return id + "-" + stamp;
        }

        newHue = (newHue === undefined) ? 0 : newHue;
        newLightness = (newLightness === undefined) ? 50 : newLightness;
        newSaturation = (newSaturation === undefined) ? 100 : newSaturation;

        //<rect id="current-color" x="340" y="10" width="30" height="50" style="stroke: #000000; fill: hsl(60, 100%, 50%); stroke-width: 1;" onmousedown="return false"/>
        currentColor = newSvgElement("rect", {
            x: x + 320 + 10,
            y: y,
            width: 30,
            height: 50,
            style: "stroke: #000000; fill: hsl(60, 100%, 50%); stroke-width: 1;",
            onmousedown: "return false"
        });

        container.appendChild(currentColor);

        function updateCurrentColor() {
            var color = "hsl(" + newHue + ", " + newSaturation + "%, " + newLightness + "%)";
            currentColor.style.fill = color;
        }

        function onHueHandleMove(newX) {
            newHue = newX - x + 58;
            lightGradientMiddle.setAttribute("stop-color",
                                      "hsl(" + newHue + ", 100%, 50%)");
            saturationGradientMiddle.setAttribute("stop-color",
                                      "hsl(" + newHue + ", 50%, 50%)");
            saturationGradientEnd.setAttribute("stop-color",
                                      "hsl(" + newHue + ", 100%, 50%)");
            updateCurrentColor();
        }

        function onLightHandleMove(newX) {
            newLightness = (newX - x) / 320 * 100;
            updateCurrentColor();
        }

        function onSaturationHandleMove(newX) {
            newSaturation = (newX - 2) / 320 * 100;
            updateCurrentColor();
        }

        hueBar = new Range(ns("hue-bar"), x, y, 320, 10,
                                  onHueHandleMove, ns("hue-gradient"));
        lightBar = new Range(ns("light-bar"), x, y + 20, 320, 10,
                                  onLightHandleMove, ns("light-gradient"));
        saturationBar = new Range(ns("saturation-bar"), x, y + 40, 320, 10,
                                  onSaturationHandleMove, ns("saturation-gradient"));

        defs = newSvgElement("defs", {}, container);

        lightGradient = new LinearGradient(ns("light-gradient"), [
            {
                id: ns("light-gradient-start"),
                offset: "0",
                "stop-color": "hsl(60, 100%, 0%)",
                "stop-opacity": "1"
            },
            {
                id: ns("light-gradient-middle"),
                offset: "0.5",
                "stop-color": "hsl(60, 100%, 50%)",
                "stop-opacity": "1"
            },
            {
                id: ns("light-gradient-end"),
                offset: "1",
                "stop-color": "hsl(60, 100%, 100%)",
                "stop-opacity": "1"
            }
        ]);


        saturationGradient = new LinearGradient(ns("saturation-gradient"), [
            {
                id: ns("saturation-gradient-start"),
                offset: "0",
                "stop-color": "hsl(60, 0%, 50%)",
                "stop-opacity": "1"
            },
            {
                id: ns("saturation-gradient-middle"),
                offset: "0.5",
                "stop-color": "hsl(60, 50%, 50%)",
                "stop-opacity": "1"
            },
            {
                id: ns("saturation-gradient-end"),
                offset: "1",
                "stop-color": "hsl(60, 100%, 50%)",
                "stop-opacity": "1"
            }
        ]);


        hueGradient = new LinearGradient(ns("hue-gradient"), [
            {
                "offset": "0",
                "stop-color": "#ffef15",
                "stop-opacity": "1"
            },
            {
                "offset": "0.16105497",
                "stop-color": "#60ff18",
                "stop-opacity": "1"
            },
            {
                "offset": "0.35173747",
                "stop-color": "#02fff9",
                "stop-opacity": "1"
            },
            {
                "offset": "0.48789391",
                "stop-color": "#0202ff",
                "stop-opacity": "1"
            },
            {
                "offset": "0.70091939",
                "stop-color": "#fd00ca",
                "stop-opacity": "1"
            },
            {
                "offset": "0.83720928",
                "stop-color": "#ff1c1c",
                "stop-opacity": "1"
            },
            {
                "offset": "1",
                "stop-color": "#ff0000",
                "stop-opacity": "1"
            }
        ]);

        hueGradient.addToParent(defs);
        lightGradient.addToParent(defs);
        saturationGradient.addToParent(defs);

        lightGradientMiddle      = byId(ns("light-gradient-middle"));
        saturationGradientMiddle = byId(ns("saturation-gradient-middle"));
        saturationGradientEnd    = byId(ns("saturation-gradient-end"));

        hueBar.addToParent(container);
        lightBar.addToParent(container);
        saturationBar.addToParent(container);

        hueBar.setValue(newHue);
        lightBar.setValue(newLightness);
        saturationBar.setValue(newSaturation);

    }

    window.ColorPicker = ColorPicker;
}());
