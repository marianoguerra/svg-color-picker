/*global document*/
(function () {
    "use strict";
    var
        lightGradientMiddle,
        saturationGradientMiddle,
        saturationGradientEnd,
        currentColor,

        hueHandle,
        lightHandle,
        saturationHandle,

        hueBar,
        lightBar,
        saturationBar,

        container,
        
        newHue = 50, newLightness = 50, newSaturation = 100,
        SVG_NS = "http://www.w3.org/2000/svg";

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

    lightGradientMiddle = byId("light-gradient-middle");
    saturationGradientMiddle = byId("saturation-gradient-middle");
    saturationGradientEnd = byId("saturation-gradient-end");
    currentColor        = byId("current-color");
    container           = byId("cont");

    hueHandle   = newHandle("hue-handle", 10, 9);
    lightHandle = newHandle("light-handle", 170, 29);
    saturationHandle = newHandle("saturation-handle", 330, 49);

    hueBar   = byId("hue-bar");
    lightBar = byId("light-bar");
    saturationBar = byId("saturation-bar");

    container.appendChild(hueHandle);
    container.appendChild(lightHandle);
    container.appendChild(saturationHandle);

    function updateCurrentColor() {
        var color = "hsl(" + newHue + ", " + newSaturation + "%, " + newLightness + "%)";
        currentColor.style.fill = color;
    }

    function onHueHandleMove(newX) {
        newHue = newX + 50;
        lightGradientMiddle.setAttribute("stop-color", "hsl(" + newHue + ", 100%, 50%)");
        saturationGradientMiddle.setAttribute("stop-color", "hsl(" + newHue + ", 50%, 50%)");
        saturationGradientEnd.setAttribute("stop-color", "hsl(" + newHue + ", 100%, 50%)");
        updateCurrentColor();
    }

    function onLightHandleMove(newX) {
        newLightness = (newX - 10) / 320 * 100;
        updateCurrentColor();
    }

    function onSaturationHandleMove(newX) {
        newSaturation = (newX - 2) / 320 * 100;
        updateCurrentColor();
    }

    function addMoveListener(handle, minX, maxX, callback) {
        var dx;

        function mousemoveListener(evt) {
            var id, newHue, newX = evt.clientX + dx;

            if (evt.clientX > maxX || evt.clientX < minX) {
                return;
            }

            id = handle.ownerSVGElement.suspendRedraw(1000);
            handle.x.baseVal.value = newX;
            handle.ownerSVGElement.unsuspendRedraw(id);
            callback(newX);
        }

        function mouseupListener(evt) {
            document.removeEventListener("mousemove", mousemoveListener, true);
            document.removeEventListener("mouseup", mouseupListener, true);
        }

        function mousedownListener(evt) {
            dx = handle.x.baseVal.value - evt.clientX;
            document.addEventListener("mousemove", mousemoveListener, true);
            document.addEventListener("mouseup", mouseupListener, true);
        }

        handle.addEventListener("mousedown", mousedownListener, false);
    }

    function addClickListener(bar, offsetX, handle, callback) {
        bar.addEventListener("mouseup", function (event) {
            handle.x.baseVal.value = event.clientX;
            callback(event.clientX);
        });
    }

    addMoveListener(hueHandle, 10, 330, onHueHandleMove);
    addMoveListener(lightHandle, 10, 330, onLightHandleMove);
    addMoveListener(saturationHandle, 10, 330, onSaturationHandleMove);

    addClickListener(hueBar, 10, hueHandle, onHueHandleMove);
    addClickListener(lightBar, 10, lightHandle, onLightHandleMove);
    addClickListener(saturationBar, 10, saturationHandle, onSaturationHandleMove);
}());
