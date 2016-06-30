tui.util.defineNamespace("fedoc.content", {});
fedoc.content["plugins_raphaelCoordinateTypeChart.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Raphael bubble chart renderer.\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\nvar raphaelRenderUtil = require('./raphaelRenderUtil');\n\nvar raphael = window.Raphael;\n\nvar ANIMATION_DURATION = 700;\nvar CIRCLE_OPACITY = 0.5;\nvar STROKE_OPACITY = 0.3;\nvar EMPHASIS_OPACITY = 0.5;\nvar DE_EMPHASIS_OPACITY = 0.3;\nvar DEFAULT_LUMINANC = 0.2;\nvar OVERLAY_BORDER_WIDTH = 2;\n\n/**\n * bound for circle\n * @typedef {{left: number, top: number, radius: number}} bound\n */\n\n/**\n * Information for rendered circle\n * @typedef {{circle: object, color: string, bound: bound}} circleInfo\n */\n\n/**\n * @classdesc RaphaelBubbleChart is graph renderer for bubble chart.\n * @class RaphaelBubbleChart\n */\nvar RaphaelBubbleChart = tui.util.defineClass(/** @lends RaphaelBubbleChart.prototype */ {\n    /**\n     * Render function of bubble chart\n     * @param {HTMLElement} container - container element\n     * @param {{\n     *      dimension: {width: number, height: number},\n     *      seriesDataModel: SeriesDataModel,\n     *      groupBounds: Array.&lt;Array.&lt;bound>>,\n     *      theme: object\n     * }} data - data for rendering\n     * @param {{showTooltip: function, hideTooltip: function}} callbacks - callbacks for toggle of tooltip.\n     * @returns {object}\n     */\n    render: function(container, data, callbacks) {\n        var dimension = data.dimension,\n            paper;\n\n        this.paper = paper = raphael(container, dimension.width, dimension.height);\n\n        /**\n         * container element\n         * @type {HTMLElement}\n         */\n        this.container = container;\n\n        /**\n         * theme\n         * @type {object}\n         */\n        this.theme = data.theme;\n\n        /**\n         * seriesDataModel\n         * @type {SeriesDataModel}\n         */\n        this.seriesDataModel = data.seriesDataModel;\n\n        /**\n         * group bounds\n         * @type {Array.&lt;Array.&lt;bound>>}\n         */\n        this.groupBounds = data.groupBounds;\n\n        /**\n         * callbacks for toggle of tooltip.\n         * @type {{showTooltip: Function, hideTooltip: Function}}\n         */\n        this.callbacks = callbacks;\n\n        /**\n         * overlay is circle object of raphael, that using for mouseover.\n         * @type {object}\n         */\n        this.overlay = this._renderOverlay();\n\n        /**\n         * two-dimensional array by circleInfo\n         * @type {Array.&lt;Array.&lt;circleInfo>>}\n         */\n        this.groupCircleInfos = this._renderCircles();\n\n        /**\n         * previous selected circle\n         * @type {?object}\n         */\n        this.prevCircle = null;\n\n        /**\n         * previous over circle\n         * @type {?object}\n         */\n        this.prevOverCircle = null;\n\n        /**\n         * animation timeout id\n         * @type {?number}\n         */\n        this.animationTimeoutId = null;\n\n        return paper;\n    },\n\n    /**\n     * Render overlay.\n     * @returns {object}\n     * @private\n     */\n    _renderOverlay: function() {\n        var position = {\n            left: 0,\n            top: 0\n        };\n        var attribute = {\n            fill: 'none',\n            stroke: '#fff',\n            'stroke-opacity': STROKE_OPACITY,\n            'stroke-width': 2\n        };\n        var circle = raphaelRenderUtil.renderCircle(this.paper, position, 0, attribute);\n\n        return circle;\n    },\n\n    /**\n     * Render circles.\n     * @returns {Array.&lt;Array.&lt;circleInfo>>}\n     * @private\n     */\n    _renderCircles: function() {\n        var self = this;\n        var colors = this.theme.colors;\n        var singleColors = [];\n\n        if ((this.groupBounds[0].length === 1) &amp;&amp; this.theme.singleColors) {\n            singleColors = this.theme.singleColors;\n        }\n\n        return tui.util.map(this.groupBounds, function(bounds, groupIndex) {\n            var singleColor = singleColors[groupIndex];\n\n            return tui.util.map(bounds, function(bound, index) {\n                var circleInfo = null;\n                var color, circle;\n\n                if (bound) {\n                    color = singleColor || colors[index];\n                    circle = raphaelRenderUtil.renderCircle(self.paper, bound, 0, {\n                        fill: color,\n                        opacity: 0,\n                        stroke: 'none'\n                    });\n\n                    circle.data('groupIndex', groupIndex);\n                    circle.data('index', index);\n\n                    circleInfo = {\n                        circle: circle,\n                        color: color,\n                        bound: bound\n                    };\n                }\n\n                return circleInfo;\n            });\n        });\n    },\n\n    /**\n     * Animate circle\n     * @param {object} circle - raphael object\n     * @param {number} radius - radius of circle\n     * @private\n     */\n    _animateCircle: function(circle, radius) {\n        circle.animate({\n            r: radius,\n            opacity: CIRCLE_OPACITY\n        }, ANIMATION_DURATION);\n    },\n\n    /**\n     * Animate.\n     * @param {function} onFinish - finish callback function\n     */\n    animate: function(onFinish) {\n        var self = this;\n\n        if (this.animationTimeoutId) {\n            clearTimeout(this.animationTimeoutId);\n            this.animationTimeoutId = null;\n        }\n\n        raphaelRenderUtil.forEach2dArray(this.groupCircleInfos, function(circleInfo) {\n            if (!circleInfo) {\n                return;\n            }\n            self._animateCircle(circleInfo.circle, circleInfo.bound.radius);\n        });\n\n        if (onFinish) {\n            this.animationTimeoutId = setTimeout(function() {\n                onFinish();\n                this.animationTimeoutId = null;\n            }, ANIMATION_DURATION);\n        }\n    },\n\n    /**\n     * Update circle bound\n     * @param {object} circle - raphael object\n     * @param {{left: number, top: number}} bound - bound\n     * @private\n     */\n    _updatePosition: function(circle, bound) {\n        circle.attr({\n            cx: bound.left,\n            cy: bound.top,\n            r: bound.radius\n        });\n    },\n\n    /**\n     * Resize graph of bubble type chart.\n     * @param {object} params parameters\n     *      @param {{width: number, height:number}} params.dimension - dimension\n     *      @param {Array.&lt;Array.&lt;bound>>} params.groupBounds - group bounds\n     */\n    resize: function(params) {\n        var self = this;\n        var dimension = params.dimension;\n        var groupBounds = params.groupBounds;\n\n        this.groupBounds = groupBounds;\n        this.paper.setSize(dimension.width, dimension.height);\n\n        raphaelRenderUtil.forEach2dArray(this.groupCircleInfos, function(circleInfo, groupIndex, index) {\n            var bound = groupBounds[groupIndex][index];\n\n            circleInfo.bound = bound;\n            self._updatePosition(circleInfo.circle, bound);\n        });\n    },\n\n    /**\n     * Click series.\n     * @param {{left: number, top: number}} position mouse position\n     */\n    clickSeries: function(position) {\n        var circle = this.paper.getElementByPoint(position.left, position.top);\n        var prevCircle = this.prevCircle;\n\n        if (circle &amp;&amp; prevCircle) {\n            this._unselectSeries(prevCircle.data('groupIndex'), prevCircle.data('index'));\n        }\n\n        if (prevCircle === circle) {\n            this.prevCircle = null;\n        } else if (circle) {\n            this._selectSeries(circle.data('groupIndex'), circle.data('index'));\n            this.prevCircle = circle;\n        }\n    },\n\n    /**\n     * Get series container bound.\n     * @returns {{left: number, top: number, width: number, height: number}}\n     * @private\n     */\n    _getContainerBound: function() {\n        if (!this.containerBound) {\n            this.containerBound = this.container.getBoundingClientRect();\n        }\n        return this.containerBound;\n    },\n\n    /**\n     * Whether changed or not.\n     * @param {{left: number, top: number}} prevPosition - previous position\n     * @param {{left: number, top: number}} position - position\n     * @returns {boolean} result boolean\n     * @private\n     */\n    _isChangedPosition: function(prevPosition, position) {\n        return !prevPosition || prevPosition.left !== position.left || prevPosition.top !== position.top;\n    },\n\n    /**\n     * Show overlay when mouse over a circle.\n     * @param {number} groupIndex - index of circles group\n     * @param {number} index - index of circles\n     * @private\n     */\n    _showOverlay: function(groupIndex, index) {\n        var circleInfo = this.groupCircleInfos[groupIndex][index];\n        var bound = circleInfo.bound;\n\n        this.overlay.attr({\n            cx: bound.left,\n            cy: bound.top,\n            r: bound.radius + OVERLAY_BORDER_WIDTH,\n            stroke: circleInfo.color,\n            opacity: 1\n        });\n    },\n\n    /**\n     * Hide overlay.\n     * @private\n     */\n    _hideOverlay: function() {\n        this.overlay.attr({\n            cx: 0,\n            cy: 0,\n            r: 0,\n            opacity: 0\n        });\n    },\n\n    /**\n     * Find circle.\n     * @param {{left: number, top: number}} position - position\n     * @returns {?object}\n     * @private\n     */\n    _findCircle: function(position) {\n        var circles = [];\n        var paper = this.paper;\n        var foundCircle, circle;\n\n        while (tui.util.isUndefined(foundCircle)) {\n            circle = paper.getElementByPoint(position.left, position.top);\n\n            if (circle) {\n                if (circle.attrs.opacity > DE_EMPHASIS_OPACITY) {\n                    foundCircle = circle;\n                } else {\n                    circles.push(circle);\n                    circle.hide();\n                }\n            } else {\n                foundCircle = null;\n            }\n        }\n\n        if (!foundCircle) {\n            foundCircle = circles[0];\n        }\n\n        tui.util.forEachArray(circles, function(_circle) {\n            _circle.show();\n        });\n\n        return foundCircle;\n    },\n\n    /**\n     * Move mouse on series.\n     * @param {{left: number, top: number}} position - mouse position\n     */\n    moveMouseOnSeries: function(position) {\n        var circle = this._findCircle(position);\n        var containerBound, isChanged, groupIndex, index, args;\n\n        if (circle &amp;&amp; tui.util.isExisty(circle.data('groupIndex'))) {\n            containerBound = this._getContainerBound();\n            isChanged = (this.prevOverCircle !== circle);\n            groupIndex = circle.data('groupIndex');\n            index = circle.data('index');\n            args = [{}, groupIndex, index, {\n                left: position.left - containerBound.left,\n                top: position.top - containerBound.top\n            }];\n\n            if (isChanged) {\n                this._showOverlay(groupIndex, index);\n            }\n\n            if (this._isChangedPosition(this.prevPosition, position)) {\n                this.callbacks.showTooltip.apply(null, args);\n                this.prevOverCircle = circle;\n            }\n        } else if (this.prevOverCircle) {\n            this._hideOverlay();\n            this.callbacks.hideTooltip();\n            this.prevOverCircle = null;\n        }\n        this.prevPosition = position;\n    },\n\n    /**\n     * Select series.\n     * @param {number} groupIndex - index of group\n     * @param {number} index - index\n     */\n    _selectSeries: function(groupIndex, index) {\n        var circleInfo = this.groupCircleInfos[groupIndex][index];\n        var objColor = raphael.color(circleInfo.color);\n        var themeColor = this.theme.selectionColor;\n        var color = themeColor || raphaelRenderUtil.makeChangedLuminanceColor(objColor.hex, DEFAULT_LUMINANC);\n\n        circleInfo.circle.attr({\n            fill: color\n        });\n    },\n\n    /**\n     * Unselect series.\n     * @param {number} groupIndex - index of group\n     * @param {number} index - index\n     */\n    _unselectSeries: function(groupIndex, index) {\n        var circleInfo = this.groupCircleInfos[groupIndex][index];\n\n        circleInfo.circle.attr({\n            fill: circleInfo.color\n        });\n    },\n\n    /**\n     * Select legend.\n     * @param {?number} legendIndex - index of legend\n     */\n    selectLegend: function(legendIndex) {\n        var noneSelected = tui.util.isNull(legendIndex);\n\n        raphaelRenderUtil.forEach2dArray(this.groupCircleInfos, function(circleInfo, groupIndex, index) {\n            var opacity;\n\n            if (!circleInfo) {\n                return;\n            }\n\n            opacity = (noneSelected || legendIndex === index) ? EMPHASIS_OPACITY : DE_EMPHASIS_OPACITY;\n\n            circleInfo.circle.attr({opacity: opacity});\n        });\n    }\n});\n\nmodule.exports = RaphaelBubbleChart;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"