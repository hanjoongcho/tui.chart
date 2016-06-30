tui.util.defineNamespace("fedoc.content", {});
fedoc.content["series_lineTypeSeriesBase.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview LineTypeSeriesBase is base class for line type series.\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar seriesTemplate = require('./seriesTemplate');\nvar chartConst = require('../const');\nvar predicate = require('../helpers/predicate');\nvar renderUtil = require('../helpers/renderUtil');\n\nvar concat = Array.prototype.concat;\n\n/**\n * @classdesc LineTypeSeriesBase is base class for line type series.\n * @class LineTypeSeriesBase\n * @mixin\n */\nvar LineTypeSeriesBase = tui.util.defineClass(/** @lends LineTypeSeriesBase.prototype */ {\n    /**\n     * Make basic positions for rendering line graph.\n     * @param {number} [seriesWidth] - width of series area\n     * @returns {Array.&lt;Array.&lt;object>>}\n     * @private\n     */\n    _makeBasicPositions: function(seriesWidth) {\n        var dimension = this.boundsMaker.getDimension('series'),\n            seriesDataModel = this.dataProcessor.getSeriesDataModel(this.seriesName),\n            width = seriesWidth || dimension.width || 0,\n            height = dimension.height,\n            len = seriesDataModel.getGroupCount(),\n            start = chartConst.SERIES_EXPAND_SIZE,\n            step;\n\n        if (this.data.aligned) {\n            step = width / (len - 1);\n        } else {\n            step = width / len;\n            start += (step / 2);\n        }\n\n        return seriesDataModel.map(function(seriesGroup) {\n            return seriesGroup.map(function(seriesItem, index) {\n                var position = {\n                    left: start + (step * index),\n                    top: height - (seriesItem.ratio * height) + chartConst.SERIES_EXPAND_SIZE\n                };\n\n                if (tui.util.isExisty(seriesItem.startRatio)) {\n                    position.startTop = height - (seriesItem.startRatio * height) + chartConst.SERIES_EXPAND_SIZE;\n                }\n\n                return position;\n            });\n        }, true);\n    },\n\n    /**\n     * Calculate label position top.\n     * @param {{top: number, startTop: number}} basePosition - base position\n     * @param {number} value - value of seriesItem\n     * @param {number} labelHeight - label height\n     * @param {boolean} isStart - whether start value of seriesItem or not\n     * @returns {number} position top\n     * @private\n     */\n    _calculateLabelPositionTop: function(basePosition, value, labelHeight, isStart) {\n        var baseTop = basePosition.top,\n            top;\n\n        if (predicate.isValidStackOption(this.options.stackType)) {\n            top = (basePosition.startTop + baseTop - labelHeight) / 2 + 1;\n        } else if ((value >= 0 &amp;&amp; !isStart) || (value &lt; 0 &amp;&amp; isStart)) {\n            top = baseTop - labelHeight - chartConst.SERIES_LABEL_PADDING;\n        } else {\n            top = baseTop + chartConst.SERIES_LABEL_PADDING;\n        }\n\n        return top;\n    },\n\n    /**\n     * Make label position for rendering label of series area.\n     * @param {{left: number, top: number, startTop: ?number}} basePosition - base position for calculating\n     * @param {number} labelHeight - label height\n     * @param {(string | number)} label - label of seriesItem\n     * @param {number} value - value of seriesItem\n     * @param {boolean} isStart - whether start label position or not\n     * @returns {{left: number, top: number}}\n     * @private\n     */\n    _makeLabelPosition: function(basePosition, labelHeight, label, value, isStart) {\n        var labelWidth = renderUtil.getRenderedLabelWidth(label, this.theme.label);\n        var dimension = this.boundsMaker.getDimension('extendedSeries');\n\n        return {\n            left: (basePosition.left - (labelWidth / 2)) / dimension.width * 100,\n            top: this._calculateLabelPositionTop(basePosition, value, labelHeight, isStart) / dimension.height * 100\n        };\n    },\n\n    /**\n     * Make html for series label for line type chart.\n     * @param {number} groupIndex - index of seriesDataModel.groups\n     * @param {number} index - index of seriesGroup.items\n     * @param {SeriesItem} seriesItem - series item\n     * @param {number} labelHeight - label height\n     * @param {boolean} isStart - whether start label position or not\n     * @returns {string}\n     * @private\n     */\n    _makeSeriesLabelHtmlForLineType: function(groupIndex, index, seriesItem, labelHeight, isStart) {\n        var basePosition = tui.util.extend({}, this.seriesData.groupPositions[groupIndex][index]),\n            label, position;\n\n        if (isStart) {\n            label = seriesItem.startLabel;\n            basePosition.top = basePosition.startTop;\n        } else {\n            label = seriesItem.endLabel;\n        }\n\n        position = this._makeLabelPosition(basePosition, labelHeight, label, seriesItem.value, isStart);\n\n        return this._makeSeriesLabelHtml(position, label, groupIndex, seriesTemplate.tplCssTextForLineType, isStart);\n    },\n\n    /**\n     * Render series label.\n     * @param {HTMLElement} elSeriesLabelArea series label area element\n     * @private\n     */\n    _renderSeriesLabel: function(elSeriesLabelArea) {\n        var self = this,\n            seriesDataModel = this.dataProcessor.getSeriesDataModel(this.seriesName),\n            firstLabel = seriesDataModel.getFirstItemLabel(),\n            labelHeight = renderUtil.getRenderedLabelHeight(firstLabel, this.theme.label),\n            htmls;\n\n        htmls = seriesDataModel.map(function(seriesGroup, groupIndex) {\n            return seriesGroup.map(function(seriesItem, index) {\n                var labelHtml = self._makeSeriesLabelHtmlForLineType(groupIndex, index, seriesItem, labelHeight);\n\n                if (seriesItem.isRange) {\n                    labelHtml += self._makeSeriesLabelHtmlForLineType(groupIndex, index, seriesItem, labelHeight, true);\n                }\n\n                return labelHtml;\n            }).join('');\n        }, true);\n\n        elSeriesLabelArea.innerHTML = htmls.join('');\n    },\n\n    /**\n     * Whether changed or not.\n     * @param {number} groupIndex group index\n     * @param {number} index index\n     * @returns {boolean} whether changed or not\n     * @private\n     */\n    _isChanged: function(groupIndex, index) {\n        var prevIndexes = this.prevIndexes;\n\n        this.prevIndexes = {\n            groupIndex: groupIndex,\n            index: index\n        };\n\n        return !prevIndexes || (prevIndexes.groupIndex !== groupIndex) || (prevIndexes.index !== index);\n    },\n\n    /**\n     * To call showGroupTooltipLine function of graphRenderer.\n     * @param {{\n     *      dimension: {width: number, height: number},\n     *      position: {left: number, top: number}\n     * }} bound bound\n     */\n    onShowGroupTooltipLine: function(bound) {\n        if (!this.graphRenderer.showGroupTooltipLine) {\n            return;\n        }\n        this.graphRenderer.showGroupTooltipLine(bound);\n    },\n\n    /**\n     * To call hideGroupTooltipLine function of graphRenderer.\n     */\n    onHideGroupTooltipLine: function() {\n        if (!this.graphRenderer.hideGroupTooltipLine) {\n            return;\n        }\n        this.graphRenderer.hideGroupTooltipLine();\n    },\n\n    /**\n     * Zoom by mouse drag.\n     * @param {object} data - data\n     */\n    zoom: function(data) {\n        this._cancelMovingAnimation();\n        this._clearContainer();\n        this._renderSeriesArea(this.seriesContainer, data, tui.util.bind(this._renderGraph, this));\n\n        this._showGraphWithoutAnimation();\n\n        if (!tui.util.isNull(this.selectedLegendIndex)) {\n            this.graphRenderer.selectLegend(this.selectedLegendIndex);\n        }\n    },\n\n    /**\n     * Whether changed limit(min, max) or not.\n     * @returns {boolean}\n     * @private\n     */\n    _isChangedLimit: function() {\n        var beforeLimit = this.data.limit;\n        var afterLimit = this.boundsMaker.getAxesData().yAxis.limit;\n\n        return beforeLimit.min !== afterLimit.min || beforeLimit.max !== afterLimit.max;\n    },\n\n    /**\n     * Animate for motion of series area.\n     * @param {function} callback - callback function\n     * @private\n     */\n    _animate: function(callback) {\n        var self = this;\n        var changedLimit = this._isChangedLimit();\n\n        this.movingAnimation = renderUtil.startAnimation(300, function(ratio) {\n            if (changedLimit &amp;&amp; self.seriesLabelContainer) {\n                self.seriesLabelContainer.innerHTML = '';\n            }\n            callback(ratio);\n        }, function() {\n            self.movingAnimation = null;\n        });\n    },\n\n    /**\n     * Pick first label elements.\n     * @returns {Array.&lt;HTMLElement>}\n     * @private\n     */\n    _pickFirstLabelElements: function() {\n        var itemCount = this.dataProcessor.getCategoryCount() - 1;\n        var seriesLabelContainer = this.seriesLabelContainer;\n        var labelElements = seriesLabelContainer.childNodes;\n        var filteredElements = [];\n        var firstLabelElements;\n\n        tui.util.forEachArray(labelElements, function(element) {\n            if (!element.getAttribute('data-range')) {\n                filteredElements.push(element);\n            }\n        });\n        filteredElements = tui.util.filter(filteredElements, function(element, index) {\n            return ((parseInt(index, 10) + 1) % itemCount) === 1;\n        });\n\n        firstLabelElements = tui.util.map(filteredElements, function(element) {\n            var nextElement = element.nextSibling;\n            var elements = [element];\n            if (nextElement &amp;&amp; nextElement.getAttribute('data-range')) {\n                elements.push(nextElement);\n            }\n            return elements;\n        });\n\n        return concat.apply([], firstLabelElements);\n    },\n\n    /**\n     * Hide first labels.\n     * @private\n     */\n    _hideFirstLabels: function() {\n        var seriesLabelContainer = this.seriesLabelContainer;\n        var firsLabelElements;\n\n        if (!seriesLabelContainer) {\n            return;\n        }\n\n        firsLabelElements = this._pickFirstLabelElements();\n        tui.util.forEachArray(firsLabelElements, function(element) {\n            seriesLabelContainer.removeChild(element);\n        });\n    },\n\n    /**\n     * Animate for moving of graph container.\n     * @param {number} interval - interval for moving\n     * @private\n     */\n    _animateForMoving: function(interval) {\n        var graphRenderer = this.graphRenderer;\n        var childrenForMoving = this.seriesContainer.childNodes;\n        var beforeLeft = parseInt(childrenForMoving[0].style.left, 10) || 0;\n        var areaWidth = this.boundsMaker.getDimension('extendedSeries').width;\n\n        this._hideFirstLabels();\n        this._animate(function(ratio) {\n            var left = interval * ratio;\n\n            tui.util.forEachArray(childrenForMoving, function(child) {\n                child.style.left = (beforeLeft - left) + 'px';\n            });\n\n            graphRenderer.setSize(areaWidth + left);\n        });\n    },\n\n    /**\n     * Animate for resizing of label container.\n     * @param {number} interval - interval for stacking\n     * @private\n     */\n    _animateForResizing: function(interval) {\n        var seriesLabelContainer = this.seriesLabelContainer;\n        var areaWidth;\n\n        if (!seriesLabelContainer) {\n            return;\n        }\n\n        areaWidth = this.boundsMaker.getDimension('extendedSeries').width;\n\n        this._animate(function(ratio) {\n            var left = interval * ratio;\n\n            seriesLabelContainer.style.width = (areaWidth - left) + 'px';\n        });\n    },\n\n    /**\n     * Make top of zero point for adding data.\n     * @returns {number}\n     * @private\n     * @override\n     */\n    _makeZeroTopForAddingData: function() {\n        var seriesHeight = this.boundsMaker.getDimension('series').height;\n        var limit = this.boundsMaker.getAxesData().yAxis.limit;\n\n        return this._getLimitDistanceFromZeroPoint(seriesHeight, limit).toMax + chartConst.SERIES_EXPAND_SIZE;\n    },\n\n    /**\n     * Animate for adding data.\n     * @param {{tickSize: number}} params - parameters for adding data.\n     */\n    animateForAddingData: function(params) {\n        var seriesData = this._makeSeriesData();\n        var dimension = this.boundsMaker.getDimension('extendedSeries');\n        var seriesWidth = this.boundsMaker.getDimension('series').width;\n        var paramsForRendering = this._makeParamsForGraphRendering(dimension, seriesData);\n        var tickSize = params.tickSize;\n        var shiftingOption = this.options.shifting;\n        var groupPositions, zeroTop;\n\n        if (shiftingOption) {\n            seriesWidth += tickSize;\n        }\n\n        groupPositions = this._makePositions(seriesWidth);\n        zeroTop = this._makeZeroTopForAddingData();\n\n        this.graphRenderer.animateForAddingData(paramsForRendering, tickSize, groupPositions, shiftingOption, zeroTop);\n\n        if (shiftingOption) {\n            this._animateForMoving(tickSize);\n        } else {\n            this._animateForResizing(tickSize);\n        }\n    },\n\n    /**\n     * Cancel moving animation.\n     * @private\n     */\n    _cancelMovingAnimation: function() {\n        if (this.movingAnimation) {\n            cancelAnimationFrame(this.movingAnimation.id);\n            this.movingAnimation = null;\n        }\n    }\n});\n\nLineTypeSeriesBase.mixin = function(func) {\n    tui.util.extend(func.prototype, LineTypeSeriesBase.prototype);\n};\n\nmodule.exports = LineTypeSeriesBase;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"