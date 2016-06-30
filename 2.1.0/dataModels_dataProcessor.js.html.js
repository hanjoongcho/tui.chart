tui.util.defineNamespace("fedoc.content", {});
fedoc.content["dataModels_dataProcessor.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview DataProcessor process rawData.\n * rawData.categories --> categories\n * rawData.series --> SeriesDataModel, legendLabels, legendData\n * @author NHN Ent.\n *         FE Development Lab &lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar chartConst = require('../const');\nvar SeriesDataModel = require('../dataModels/seriesDataModel');\nvar SeriesGroup = require('./seriesGroup');\nvar rawDataHandler = require('../helpers/rawDataHandler');\nvar predicate = require('../helpers/predicate');\nvar renderUtil = require('../helpers/renderUtil');\n\nvar concat = Array.prototype.concat;\n\n/**\n * Raw series datum.\n * @typedef {{name: ?string, data: Array.&lt;number>, stack: ?string}} rawSeriesDatum\n */\n\n/**\n * Raw series data.\n * @typedef {Array.&lt;rawSeriesDatum>} rawSeriesData\n */\n\n/**\n * Raw data by user.\n * @typedef {{\n *      categories: ?Array.&lt;string>,\n *      series: (rawSeriesData|{line: ?rawSeriesData, column: ?rawSeriesData})\n * }} rawData\n */\n\n/**\n * SeriesDataModel is base model for drawing graph of chart series area,\n *      and create from rawSeriesData by user,\n * SeriesDataModel.groups has SeriesGroups.\n */\n\n/**\n * SeriesGroup is a element of SeriesDataModel.groups.\n * SeriesGroup.items has SeriesItem.\n */\n\nvar DataProcessor = tui.util.defineClass(/** @lends DataProcessor.prototype */{\n    /**\n     * Data processor.\n     * @constructs DataProcessor\n     * @param {rawData} rawData raw data\n     * @param {string} chartType chart type\n     * @param {object} options options\n     * @param {Array.&lt;string>} seriesNames chart types\n     */\n    init: function(rawData, chartType, options, seriesNames) {\n        var seriesOption = options.series || {};\n\n        /**\n         * original raw data.\n         * @type {{categories: ?Array.&lt;string>, series: Array.&lt;object>}}\n         */\n        this.originalRawData = JSON.parse(JSON.stringify(rawData));\n\n        /**\n         * chart type\n         * @type {string}\n         */\n        this.chartType = chartType;\n\n        /**\n         * chart options\n         * @type {Object}\n         */\n        this.options = options;\n\n        /**\n         * seriesNames is sorted chart types for rendering series area of combo chart.\n         * @type {Array.&lt;string>}\n         */\n        this.seriesNames = seriesNames;\n\n        /**\n         * diverging option\n         * @type {boolean}\n         */\n        this.divergingOption = predicate.isBarTypeChart(options.chartType) &amp;&amp; seriesOption.diverging;\n\n        /**\n         * legend data for rendering legend of group tooltip\n         * @type {Array.&lt;{chartType: string, label: string}>}\n         */\n        this.originalLegendData = null;\n\n        /**\n         * dynamic data array for adding data.\n         * @type {Array.&lt;{category: string | number, values: Array.&lt;number>}>}\n         */\n        this.dynamicData = [];\n\n        this.initData(rawData);\n        this.initZoomedRawData();\n    },\n\n    /**\n     * Get original raw data.\n     * @returns {rawData} raw data\n     */\n    getOriginalRawData: function() {\n        return JSON.parse(JSON.stringify(this.originalRawData));\n    },\n\n    /**\n     * Get zoomed raw data.\n     * @returns {*|null}\n     */\n    getZoomedRawData: function() {\n        var zoomedRawData = this.zoomedRawData;\n        if (zoomedRawData) {\n            zoomedRawData = JSON.parse(JSON.stringify(zoomedRawData));\n        } else {\n            zoomedRawData = this.getOriginalRawData();\n        }\n\n        return zoomedRawData;\n    },\n\n    /**\n     * Filter raw data by index range.\n     * @param {{series: Array.&lt;object>, categories: Array.&lt;string>}} rawData - raw data\n     * @param {Array.&lt;number>} indexRange - index range for zoom\n     * @returns {*}\n     * @private\n     */\n    _filterRawDataByIndexRange: function(rawData, indexRange) {\n        var startIndex = indexRange[0];\n        var endIndex = indexRange[1];\n\n        rawData.series = tui.util.map(rawData.series, function(seriesData) {\n            seriesData.data = seriesData.data.slice(startIndex, endIndex + 1);\n            return seriesData;\n        });\n        rawData.categories = rawData.categories.slice(startIndex, endIndex + 1);\n\n        return rawData;\n    },\n\n    /**\n     * Update raw data for zoom\n     * @param {Array.&lt;number>} indexRange - index range for zoom\n     */\n    updateRawDataForZoom: function(indexRange) {\n        var rawData = this.getRawData();\n        var zoomedRawData = this.getZoomedRawData();\n\n        this.zoomedRawData = this._filterRawDataByIndexRange(zoomedRawData, indexRange);\n        rawData = this._filterRawDataByIndexRange(rawData, indexRange);\n        this.initData(rawData);\n    },\n\n    /**\n     * Init zoomed raw data.\n     */\n    initZoomedRawData: function() {\n        this.zoomedRawData = null;\n    },\n\n    /**\n     * Initialize data.\n     * @param {rawData} rawData raw data\n     */\n    initData: function(rawData) {\n        /**\n         * raw data\n         * @type {rawData}\n         */\n        this.rawData = rawData;\n\n        /**\n         * categories\n         * @type {Array.&lt;string>}\n         */\n        this.categoriesMap = null;\n\n        /**\n         * stacks\n         * @type {Array.&lt;number>}\n         */\n        this.stacks = null;\n\n        /**\n         * seriesDataModel map\n         * @type {object.&lt;string, SeriesDataModel>}\n         */\n        this.seriesDataModelMap = {};\n\n        /**\n         * SeriesGroups\n         * @type {Array.&lt;SeriesGroup>}\n         */\n        this.seriesGroups = null;\n\n        /**\n         * map of values of SeriesItems\n         * @type {Object.&lt;string, Array.&lt;number>>}\n         */\n        this.valuesMap = {};\n\n        /**\n         * legend labels for rendering legend area\n         * @type {{column: Array.&lt;string>, line: Array.&lt;string> | Array.&lt;string>}}\n         */\n        this.legendLabels = null;\n\n        /**\n         * legend data for rendering legend\n         * @type {Array.&lt;{chartType: string, label: string}>}\n         */\n        this.legendData = null;\n\n        /**\n         * functions for formatting\n         * @type {Array.&lt;function>}\n         */\n        this.formatFunctions = null;\n\n        /**\n         * multiline categories\n         * @type {Array.&lt;string>}\n         */\n        this.multilineCategories = null;\n    },\n\n    /**\n     * Get raw data.\n     * @returns {rawData}\n     */\n    getRawData: function() {\n        return this.rawData;\n    },\n\n    /**\n     * Find chart type from series name.\n     * @param {string} seriesName - series name\n     * @returns {*}\n     */\n    findChartType: function(seriesName) {\n        return rawDataHandler.findChartType(this.rawData.seriesAlias, seriesName);\n    },\n\n    /**\n     * Escape categories\n     * @param {Array.&lt;string, number>} categories - cetegories\n     * @returns {*|Array.&lt;Object>|Array}\n     * @private\n     */\n    _escapeCategories: function(categories) {\n        return tui.util.map(categories, function(category) {\n            return tui.util.encodeHTMLEntity(String(category));\n        });\n    },\n\n    /**\n     * Process categories\n     * @param {string} type - category type (x or y)\n     * @returns {null | Array.&lt;string>} processed categories\n     * @private\n     */\n    _processCategories: function(type) {\n        var rawCategories = this.rawData.categories;\n        var categoriesMap = {};\n\n        if (tui.util.isArray(rawCategories)) {\n            categoriesMap[type] = this._escapeCategories(rawCategories);\n        } else if (rawCategories) {\n            if (rawCategories.x) {\n                categoriesMap.x = this._escapeCategories(rawCategories.x);\n            }\n\n            if (rawCategories.y) {\n                categoriesMap.y = this._escapeCategories(rawCategories.y).reverse();\n            }\n        }\n\n        return categoriesMap;\n    },\n\n    /**\n     * Get Categories\n     * @param {boolean} isVertical - whether vertical or not\n     * @returns {Array.&lt;string>}}\n     */\n    getCategories: function(isVertical) {\n        var type = isVertical ? 'y' : 'x';\n        var foundCategories = [];\n\n        if (!this.categoriesMap) {\n            this.categoriesMap = this._processCategories(type);\n        }\n\n        if (tui.util.isExisty(isVertical)) {\n            foundCategories = this.categoriesMap[type] || [];\n        } else {\n            tui.util.forEach(this.categoriesMap, function(categories) {\n                foundCategories = categories;\n                return false;\n            });\n        }\n\n        return foundCategories;\n    },\n\n    /**\n     * Get category count.\n     * @param {boolean} isVertical - whether vertical or not\n     * @returns {*}\n     */\n    getCategoryCount: function(isVertical) {\n        var categories = this.getCategories(isVertical);\n        return categories ? categories.length : 0;\n    },\n\n    /**\n     * Whether has categories or not.\n     * @param {boolean} isVertical - whether vertical or not\n     * @returns {boolean}\n     */\n    hasCategories: function(isVertical) {\n        return !!this.getCategoryCount(isVertical);\n    },\n\n    /**\n     * Get category.\n     * @param {number} index index\n     * @param {boolean} isVertical - whether vertical or not\n     * @returns {string} category\n     */\n    getCategory: function(index, isVertical) {\n        return this.getCategories(isVertical)[index];\n    },\n\n    /**\n     * Get category for tooltip.\n     * @param {number} firstIndex - index\n     * @param {number} oppositeIndex - opposite index\n     * @param {boolean} isVerticalChart - whether vertical chart or not\n     * @returns {string}\n     */\n    getTooltipCategory: function(firstIndex, oppositeIndex, isVerticalChart) {\n        var isHorizontal = !isVerticalChart;\n        var category = this.getCategory(firstIndex, isHorizontal);\n        var categoryCount = this.getCategoryCount(!isHorizontal);\n\n        if (categoryCount) {\n            category += ', ' + this.getCategory(categoryCount - oppositeIndex - 1, isVerticalChart);\n        }\n\n        return category;\n    },\n\n    /**\n     * Get stacks.\n     * @returns {Array.&lt;string>}\n     */\n    getStacks: function() {\n        if (!this.stacks) {\n            this.stacks = rawDataHandler.pickStacks(this.rawData.series);\n        }\n\n        return this.stacks;\n    },\n\n    /**\n     * Get stack count.\n     * @returns {Number}\n     */\n    getStackCount: function() {\n        return this.getStacks().length;\n    },\n\n    /**\n     * Find stack index.\n     * @param {string} stack stack\n     * @returns {number}\n     */\n    findStackIndex: function(stack) {\n        return tui.util.inArray(stack, this.getStacks());\n    },\n\n    /**\n     * Get SeriesDataModel.\n     * @param {string} seriesName - series name\n     * @returns {SeriesDataModel}\n     */\n    getSeriesDataModel: function(seriesName) {\n        var rawSeriesData, chartType;\n\n        if (!this.seriesDataModelMap[seriesName]) {\n            chartType = this.findChartType(seriesName);\n            rawSeriesData = this.rawData.series[seriesName] || this.rawData.series;\n            this.seriesDataModelMap[seriesName] = new SeriesDataModel(rawSeriesData, chartType,\n                this.options, this.getFormatFunctions());\n        }\n\n        return this.seriesDataModelMap[seriesName];\n    },\n\n    /**\n     * Get group count.\n     * @param {string} chartType chart type\n     * @returns {number}\n     */\n    getGroupCount: function(chartType) {\n        return this.getSeriesDataModel(chartType).getGroupCount();\n    },\n\n    /**\n     * Push category.\n     * @param {string} category - category\n     * @private\n     */\n    _pushCategory: function(category) {\n        this.rawData.categories.push(category);\n        this.originalRawData.categories.push(category);\n    },\n\n    /**\n     * Shift category.\n     * @private\n     */\n    _shiftCategory: function() {\n        this.rawData.categories.shift();\n        this.originalRawData.categories.shift();\n    },\n\n    /**\n     * Find raw serise datum by name.\n     * @param {string} name - name\n     * @returns {null | object}\n     * @private\n     */\n    _findRawSeriesDatumByName: function(name) {\n        var foundSeriesDatum = null;\n\n        tui.util.forEachArray(this.rawData.series, function(seriesDatum) {\n            var isEqual = seriesDatum.name === name;\n\n            if (isEqual) {\n                foundSeriesDatum = seriesDatum;\n            }\n\n            return !isEqual;\n        });\n\n        return foundSeriesDatum;\n    },\n\n    /**\n     * Push series data.\n     * @param {Array.&lt;number>} values - values\n     * @private\n     */\n    _pushSeriesData: function(values) {\n        var self = this;\n\n        tui.util.forEachArray(this.originalRawData.series, function(seriesDatum, index) {\n            var value = values[index];\n            var rawSeriesDatum = self._findRawSeriesDatumByName(seriesDatum.name);\n\n            seriesDatum.data.push(value);\n            if (rawSeriesDatum) {\n                rawSeriesDatum.data.push(value);\n            }\n        });\n    },\n\n    /**\n     * Shift series data.\n     * @private\n     */\n    _shiftSeriesData: function() {\n        var self = this;\n\n        tui.util.forEachArray(this.originalRawData.series, function(seriesDatum) {\n            var rawSeriesDatum = self._findRawSeriesDatumByName(seriesDatum.name);\n\n            seriesDatum.data.shift();\n            if (rawSeriesDatum) {\n                rawSeriesDatum.data.shift();\n            }\n        });\n    },\n\n    /**\n     * Add dynamic data.\n     * @param {string} category - category\n     * @param {Array.&lt;number>} values - values\n     */\n    addDynamicData: function(category, values) {\n        this.dynamicData.push({\n            category: category,\n            values: values\n        });\n    },\n\n    /**\n     * Add data from dynapmic data.\n     * @returns {boolean}\n     */\n    addDataFromDynamicData: function() {\n        var datum = this.dynamicData.shift();\n\n        if (!datum) {\n            return false;\n        }\n\n        this._pushCategory(datum.category);\n        this._pushSeriesData(datum.values);\n\n        this.initData(this.rawData);\n\n        return true;\n    },\n\n    /**\n     * Shift data.\n     */\n    shiftData: function() {\n        this._shiftCategory();\n        this._shiftSeriesData();\n\n        this.initData(this.rawData);\n    },\n\n    /**\n     * Add data from remain dynamic data.\n     * @param {boolean} shiftingOption - whether has shifting option or not.\n     */\n    addDataFromRemainDynamicData: function(shiftingOption) {\n        var self = this;\n        var dynamicData = this.dynamicData;\n\n        this.dynamicData = [];\n\n        tui.util.forEach(dynamicData, function(datum) {\n            self._pushCategory(datum.category);\n            self._pushSeriesData(datum.values);\n            if (shiftingOption) {\n                self._shiftCategory();\n                self._shiftSeriesData();\n            }\n        });\n\n        this.initData(this.rawData);\n    },\n\n    /**\n     * Traverse all SeriesDataModel by seriesNames, and executes iteratee function.\n     * @param {function} iteratee iteratee function\n     * @private\n     */\n    _eachByAllSeriesDataModel: function(iteratee) {\n        var self = this,\n            seriesNames = this.seriesNames || [this.chartType];\n\n        tui.util.forEachArray(seriesNames, function(chartType) {\n            return iteratee(self.getSeriesDataModel(chartType), chartType);\n        });\n    },\n\n    /**\n     * Whether valid all SeriesDataModel or not.\n     * @returns {boolean}\n     */\n    isValidAllSeriesDataModel: function() {\n        var isValid = true;\n\n        this._eachByAllSeriesDataModel(function(seriesDataModel) {\n            isValid = !!seriesDataModel.getGroupCount();\n\n            return isValid;\n        });\n\n        return isValid;\n    },\n\n    /**\n     * Make SeriesGroups.\n     * @returns {Array.&lt;SeriesGroup>}\n     * @private\n     */\n    _makeSeriesGroups: function() {\n        var joinedGroups = [],\n            seriesGroups;\n\n        this._eachByAllSeriesDataModel(function(seriesDataModel) {\n            seriesDataModel.each(function(seriesGroup, index) {\n                if (!joinedGroups[index]) {\n                    joinedGroups[index] = [];\n                }\n                joinedGroups[index] = joinedGroups[index].concat(seriesGroup.items);\n            });\n        });\n\n        seriesGroups = tui.util.map(joinedGroups, function(items) {\n            return new SeriesGroup(items);\n        });\n\n        return seriesGroups;\n    },\n\n    /**\n     * Get SeriesGroups.\n     * @returns {Array.&lt;SeriesGroup>}\n     */\n    getSeriesGroups: function() {\n        if (!this.seriesGroups) {\n            this.seriesGroups = this._makeSeriesGroups();\n        }\n        return this.seriesGroups;\n    },\n\n    /**\n     * Get value.\n     * @param {number} groupIndex group index\n     * @param {number} index index\n     * @param {?string} chartType chart type\n     * @returns {number} value\n     */\n    getValue: function(groupIndex, index, chartType) {\n        return this.getSeriesDataModel(chartType).getValue(groupIndex, index);\n    },\n\n    /**\n     * Create values that picked value from SeriesItems of specific SeriesDataModel.\n     * @param {?string} chartType - type of chart\n     * @param {?string} valueType - type of value like value, x, y, r.\n     * @returns {Array.&lt;number>}\n     * @private\n     */\n    _createValues: function(chartType, valueType) {\n        var values;\n\n        if (chartType === chartConst.DUMMY_KEY) {\n            values = [];\n            this._eachByAllSeriesDataModel(function(seriesDataModel) {\n                values = values.concat(seriesDataModel.getValues(valueType));\n            });\n        } else {\n            values = this.getSeriesDataModel(chartType).getValues(valueType);\n        }\n        return values;\n    },\n\n    /**\n     * Get values from valuesMap.\n     * @param {?string} chartType - type of chart\n     * @param {?string} valueType - type of value like value, x, y, r.\n     * @returns {Array.&lt;number>}\n     */\n    getValues: function(chartType, valueType) {\n        var mapKey;\n\n        chartType = chartType || chartConst.DUMMY_KEY;\n\n        mapKey = chartType + valueType;\n\n        if (!this.valuesMap[mapKey]) {\n            this.valuesMap[mapKey] = this._createValues(chartType, valueType);\n        }\n\n        return this.valuesMap[mapKey];\n    },\n\n    /**\n     * Get max value.\n     * @param {?string} chartType - type of chart\n     * @param {?string} valueType - type of value like value, x, y, r\n     * @returns {number}\n     */\n    getMaxValue: function(chartType, valueType) {\n        return tui.util.max(this.getValues(chartType, valueType));\n    },\n\n    /**\n     * Get formatted max value.\n     * @param {?string} chartType - type of chart\n     * @param {?string} areaType - type of area like circleLegend\n     * @param {?string} valueType - type of value like value, x, y, r\n     * @returns {string | number}\n     */\n    getFormattedMaxValue: function(chartType, areaType, valueType) {\n        var maxValue = this.getMaxValue(chartType, valueType);\n        var formatFunctions = this.getFormatFunctions();\n\n        return renderUtil.formatValue(maxValue, formatFunctions, areaType, valueType);\n    },\n\n    /**\n     * Traverse SeriesGroup of all SeriesDataModel, and executes iteratee function.\n     * @param {function} iteratee iteratee function\n     */\n    eachBySeriesGroup: function(iteratee) {\n        this._eachByAllSeriesDataModel(function(seriesDataModel, chartType) {\n            seriesDataModel.each(function(seriesGroup, groupIndex) {\n                iteratee(seriesGroup, groupIndex, chartType);\n            });\n        });\n    },\n\n    /**\n     * Pick legend label.\n     * @param {object} item item\n     * @returns {string} label\n     * @private\n     */\n    _pickLegendLabel: function(item) {\n        return item.name ? tui.util.encodeHTMLEntity(item.name) : null;\n    },\n\n    /**\n     * Pick legend labels from raw data.\n     * @returns {string[]} labels\n     */\n    _pickLegendLabels: function() {\n        var self = this;\n        var seriesData = this.rawData.series;\n        var legendLabels;\n\n        if (tui.util.isArray(seriesData)) {\n            legendLabels = tui.util.map(seriesData, this._pickLegendLabel);\n        } else {\n            legendLabels = {};\n            tui.util.forEach(seriesData, function(seriesDatum, type) {\n                legendLabels[type] = tui.util.map(seriesDatum, self._pickLegendLabel);\n            });\n        }\n\n        legendLabels = tui.util.filter(legendLabels, function(label) {\n            return tui.util.isExisty(label);\n        });\n\n        return legendLabels;\n    },\n\n    /**\n     * Get legend labels.\n     * @param {?string} chartType chart type\n     * @returns {Array.&lt;string> | {column: ?Array.&lt;string>, line: ?Array.&lt;string>}} legend labels\n     */\n    getLegendLabels: function(chartType) {\n        if (!this.legendLabels) {\n            this.legendLabels = this._pickLegendLabels();\n        }\n        return this.legendLabels[chartType] || this.legendLabels;\n    },\n\n    /**\n     * Make legend data.\n     * @returns {Array} labels\n     * @private\n     */\n    _makeLegendData: function() {\n        var legendLabels = this.getLegendLabels(),\n            seriesNames = this.seriesNames || [this.chartType],\n            legendLabelsMap, legendData;\n\n        if (tui.util.isArray(legendLabels)) {\n            legendLabelsMap = [this.chartType];\n            legendLabelsMap[this.chartType] = legendLabels;\n        } else {\n            seriesNames = this.seriesNames;\n            legendLabelsMap = legendLabels;\n        }\n\n        legendData = tui.util.map(seriesNames, function(chartType) {\n            return tui.util.map(legendLabelsMap[chartType], function(label) {\n                return {\n                    chartType: chartType,\n                    label: label\n                };\n            });\n        });\n\n        return concat.apply([], legendData);\n    },\n\n    /**\n     * Get legend data.\n     * @returns {Array.&lt;{chartType: string, label: string}>} legend data\n     */\n    getLegendData: function() {\n        if (!this.legendData) {\n            this.legendData = this._makeLegendData();\n        }\n\n        if (!this.originalLegendData) {\n            this.originalLegendData = this.legendData;\n        }\n\n        return this.legendData;\n    },\n\n    /**\n     * get original legend data.\n     * @returns {Array.&lt;{chartType: string, label: string}>}\n     */\n    getOriginalLegendData: function() {\n        return this.originalLegendData;\n    },\n\n    /**\n     * Get legend item.\n     * @param {number} index index\n     * @returns {{chartType: string, label: string}} legend data\n     */\n    getLegendItem: function(index) {\n        return this.getLegendData()[index];\n    },\n\n    /**\n     * Get format functions.\n     * @returns {Array.&lt;function>} functions\n     */\n    getFormatFunctions: function() {\n        if (!this.formatFunctions) {\n            this.formatFunctions = this._findFormatFunctions();\n        }\n\n        return this.formatFunctions;\n    },\n\n    /**\n     * Get first label of SeriesItem.\n     * @param {?string} chartType chartType\n     * @returns {string} formatted value\n     */\n    getFirstItemLabel: function(chartType) {\n        return this.getSeriesDataModel(chartType).getFirstItemLabel();\n    },\n\n    /**\n     * Pick max length under point.\n     * @param {string[]} values chart values\n     * @returns {number} max length under point\n     * @private\n     */\n    _pickMaxLenUnderPoint: function(values) {\n        var max = 0;\n\n        tui.util.forEachArray(values, function(value) {\n            var len = tui.util.getDecimalLength(value);\n            if (len > max) {\n                max = len;\n            }\n        });\n\n        return max;\n    },\n\n    /**\n     * Whether zero fill format or not.\n     * @param {string} format format\n     * @returns {boolean} result boolean\n     * @private\n     */\n    _isZeroFill: function(format) {\n        return format.length > 2 &amp;&amp; format.charAt(0) === '0';\n    },\n\n    /**\n     * Whether decimal format or not.\n     * @param {string} format format\n     * @returns {boolean} result boolean\n     * @private\n     */\n    _isDecimal: function(format) {\n        var indexOf = format.indexOf('.');\n\n        return indexOf > -1 &amp;&amp; indexOf &lt; format.length - 1;\n    },\n\n    /**\n     * Whether comma format or not.\n     * @param {string} format format\n     * @returns {boolean} result boolean\n     * @private\n     */\n    _isComma: function(format) {\n        return format.indexOf(',') > -1;\n    },\n\n    /**\n     * Format to zero fill.\n     * @param {number} len length of result\n     * @param {string} value target value\n     * @returns {string} formatted value\n     * @private\n     */\n    _formatToZeroFill: function(len, value) {\n        var isMinus = value &lt; 0;\n\n        value = renderUtil.formatToZeroFill(Math.abs(value), len);\n\n        return (isMinus ? '-' : '') + value;\n    },\n\n    /**\n     * Format to Decimal.\n     * @param {number} len length of under decimal point\n     * @param {string} value target value\n     * @returns {string} formatted value\n     * @private\n     */\n    _formatToDecimal: function(len, value) {\n        return renderUtil.formatToDecimal(value, len);\n    },\n\n    /**\n     * Find simple type format functions.\n     * @param {string} format - simple format\n     * @returns {Array.&lt;function>}\n     */\n    _findSimpleTypeFormatFunctions: function(format) {\n        var funcs = [];\n        var len;\n\n        if (this._isDecimal(format)) {\n            len = this._pickMaxLenUnderPoint([format]);\n            funcs = [tui.util.bind(this._formatToDecimal, this, len)];\n        } else if (this._isZeroFill(format)) {\n            len = format.length;\n            funcs = [tui.util.bind(this._formatToZeroFill, this, len)];\n            return funcs;\n        }\n\n        if (this._isComma(format)) {\n            funcs.push(renderUtil.formatToComma);\n        }\n\n        return funcs;\n    },\n\n    /**\n     * Find format functions.\n     * @returns {function[]} functions\n     */\n    _findFormatFunctions: function() {\n        var format = tui.util.pick(this.options, 'chart', 'format');\n        var funcs = [];\n\n        if (tui.util.isFunction(format)) {\n            funcs = [format];\n        } else if (tui.util.isString(format)) {\n            funcs = this._findSimpleTypeFormatFunctions(format);\n        }\n\n        return funcs;\n    },\n\n    /**\n     * Make multiline category.\n     * @param {string} category category\n     * @param {number} limitWidth limit width\n     * @param {object} theme label theme\n     * @returns {string} multiline category\n     * @private\n     */\n    _makeMultilineCategory: function(category, limitWidth, theme) {\n        var words = String(category).split(/\\s+/),\n            lineWords = words[0],\n            lines = [];\n\n        tui.util.forEachArray(words.slice(1), function(word) {\n            var width = renderUtil.getRenderedLabelWidth(lineWords + ' ' + word, theme);\n\n            if (width > limitWidth) {\n                lines.push(lineWords);\n                lineWords = word;\n            } else {\n                lineWords += ' ' + word;\n            }\n        });\n\n        if (lineWords) {\n            lines.push(lineWords);\n        }\n\n        return lines.join('&lt;br>');\n    },\n\n    /**\n     * Get multiline categories.\n     * @param {number} limitWidth limit width\n     * @param {object} theme label theme\n     * @param {Array.&lt;(number | string)>} xAxisLabels labels of xAxis\n     * @returns {Array} multiline categories\n     */\n    getMultilineCategories: function(limitWidth, theme, xAxisLabels) {\n        var self = this;\n\n        if (!this.multilineCategories) {\n            this.multilineCategories = tui.util.map(xAxisLabels, function(category) {\n                return self._makeMultilineCategory(category, limitWidth, theme);\n            });\n        }\n\n        return this.multilineCategories;\n    },\n\n    /**\n     * Add data ratios of pie chart.\n     * @param {string} chartType - type of chart.\n     */\n    addDataRatiosOfPieChart: function(chartType) {\n        this.getSeriesDataModel(chartType).addDataRatiosOfPieChart();\n    },\n\n    /**\n     * Add data ratios for chart of coordinate type.\n     * @param {string} chartType - type of chart.\n     * @param {{x: {min: number, max: number}, y: {min: number, max: number}}} limitMap - limit map\n     * @param {boolean} [hasRadius] - whether has radius or not\n     */\n    addDataRatiosForCoordinateType: function(chartType, limitMap, hasRadius) {\n        this.getSeriesDataModel(chartType).addDataRatiosForCoordinateType(limitMap, hasRadius);\n    },\n\n    /**\n     * Add start value to all series item.\n     * @param {{min: number, max: number}} limit - limit\n     * @param {string} chartType - chart type\n     * @private\n     */\n    _addStartValueToAllSeriesItem: function(limit, chartType) {\n        var start = 0;\n\n        if (limit.min >= 0) {\n            start = limit.min;\n        } else if (limit.max &lt;= 0) {\n            start = limit.max;\n        }\n\n        this.getSeriesDataModel(chartType).addStartValueToAllSeriesItem(start);\n    },\n\n    /**\n     * Register percent values.\n     * @param {{min: number, max: number}} limit axis limit\n     * @param {string} stackType stackType option\n     * @param {string} chartType chart type\n     * @private\n     */\n    addDataRatios: function(limit, stackType, chartType) {\n        var seriesDataModel = this.getSeriesDataModel(chartType);\n\n        this._addStartValueToAllSeriesItem(limit, chartType);\n        seriesDataModel.addDataRatios(limit, stackType);\n    }\n});\n\nmodule.exports = DataProcessor;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"