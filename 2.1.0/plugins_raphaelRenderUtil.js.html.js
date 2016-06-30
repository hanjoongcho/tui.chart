tui.util.defineNamespace("fedoc.content", {});
fedoc.content["plugins_raphaelRenderUtil.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Util for raphael rendering.\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\n/**\n * Util for raphael rendering.\n * @module raphaelRenderUtil\n */\nvar raphaelRenderUtil = {\n    /**\n     * Make line path.\n     * @memberOf module:raphaelRenderUtil\n     * @param {{top: number, left: number}} fromPos from position\n     * @param {{top: number, left: number}} toPos to position\n     * @param {number} width width\n     * @returns {string} path\n     */\n    makeLinePath: function(fromPos, toPos, width) {\n        var fromPoint = [fromPos.left, fromPos.top],\n            toPoint = [toPos.left, toPos.top];\n\n        width = width || 1;\n\n        tui.util.forEachArray(fromPoint, function(from, index) {\n            if (from === toPoint[index]) {\n                fromPoint[index] = toPoint[index] = Math.round(from) - (width % 2 / 2);\n            }\n        });\n        return ['M'].concat(fromPoint).concat('L').concat(toPoint);\n    },\n\n    /**\n     * Render line.\n     * @memberOf module:raphaelRenderUtil\n     * @param {object} paper raphael paper\n     * @param {string} path line path\n     * @param {string} color line color\n     * @param {number} strokeWidth stroke width\n     * @returns {object} raphael line\n     */\n    renderLine: function(paper, path, color, strokeWidth) {\n        var line = paper.path([path]),\n            strokeStyle = {\n                stroke: color,\n                'stroke-width': strokeWidth || 2\n            };\n\n        if (color === 'transparent') {\n            strokeStyle.stroke = '#fff';\n            strokeStyle['stroke-opacity'] = 0;\n        }\n        line.attr(strokeStyle);\n\n        return line;\n    },\n\n    /**\n     * Render area graph.\n     * @param {object} paper raphael paper\n     * @param {string} path path\n     * @param {object} fillStyle fill style\n     *      @param {string} fillStyle.fill fill color\n     *      @param {?number} fillStyle.opacity fill opacity\n     *      @param {string} fillStyle.stroke stroke color\n     *      @param {?number} fillStyle.stroke-opacity stroke opacity\n     * @returns {Array.&lt;object>} raphael object\n     */\n    renderArea: function(paper, path, fillStyle) {\n        var area = paper.path(path);\n\n        fillStyle = tui.util.extend({\n            'stroke-opacity': 0\n        }, fillStyle);\n        area.attr(fillStyle);\n\n        return area;\n    },\n\n    /**\n     * Render circle.\n     * @param {object} paper - raphael object\n     * @param {{left: number, top: number}} position - position\n     * @param {number} radius - radius\n     * @param {object} attributes - attributes\n     * @returns {object}\n     * @private\n     */\n    renderCircle: function(paper, position, radius, attributes) {\n        var circle = paper.circle(position.left, position.top, radius);\n\n        if (attributes) {\n            circle.attr(attributes);\n        }\n\n        return circle;\n    },\n\n    /**\n     * Render rect.\n     * @param {object} paper - raphael object\n     * @param {{left: number, top: number, width: number, height, number}} bound - bound\n     * @param {object} attributes - attributes\n     * @returns {*}\n     */\n    renderRect: function(paper, bound, attributes) {\n        var rect = paper.rect(bound.left, bound.top, bound.width, bound.height);\n\n        if (attributes) {\n            rect.attr(attributes);\n        }\n\n        return rect;\n    },\n\n    /**\n     * Render items of line type chart.\n     * @param {Array.&lt;Array.&lt;object>>} groupItems group items\n     * @param {function} funcRenderItem function\n     */\n    forEach2dArray: function(groupItems, funcRenderItem) {\n        tui.util.forEachArray(groupItems, function(items, groupIndex) {\n            tui.util.forEachArray(items, function(item, index) {\n                funcRenderItem(item, groupIndex, index);\n            });\n        });\n    },\n\n    /**\n     * Make changed luminance color.\n     * @param {string} hex hax color\n     * @param {number} lum luminance\n     * @returns {string} changed color\n     */\n    makeChangedLuminanceColor: function(hex, lum) {\n        /*eslint no-magic-numbers: 0*/\n        var changedHex;\n\n        hex = hex.replace('#', '');\n        lum = lum || 0;\n\n        changedHex = tui.util.map(tui.util.range(3), function(index) {\n            var hd = parseInt(hex.substr(index * 2, 2), 16);\n            var newHd = hd + (hd * lum);\n\n            newHd = Math.round(Math.min(Math.max(0, newHd), 255)).toString(16);\n            return tui.chart.renderUtil.formatToZeroFill(newHd, 2);\n        }).join('');\n\n        return '#' + changedHex;\n    }\n};\n\nmodule.exports = raphaelRenderUtil;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"