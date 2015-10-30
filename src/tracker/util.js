/**
 * Utility functions
 */
(function() {
    this.CONFIG = window.CONFIG || {};

    var root = this.CONFIG,
        $ = root.$,
        util;

    root.util = {};
    util = root.util;

    /**
     * Reduce an array of values to a single value using fnReduce and an
     * optional initialValue.
     * @param  {Array} arr The array of values to reduce.
     * @param  {Function} fnReduce Callback function which is always passed two values and expected to return one.
     * @param  {Object} initialValue The initial value to use when reducing, default is first element in the array.
     * @return {Object} The result of performing fnReduce to all pairwise elements in arr.
     * @example
     *
     * util.reduce([1,2,3], function(a, b) { return a + b; });
     * // 6
     */
    util.reduce = function(arr, fnReduce, initialValue) {
        if (arguments.length === 2) {
            initialValue = arr[0];
            arr = arr.splice(1, arr.length - 1);
        }

        $.each(arr, function(i, value) {
            initialValue = fnReduce.apply(value, [initialValue, value]);
        });

        return initialValue;
    };

    /**
     * Brute force check to see if an array contains a value.
     * @param  {Array} arr The array to search.
     * @param  {Object} value The value to search for in the array.
     * @return {Boolean} true if the array contains the value, false otherwise
     * @example
     *
     * util.arrayContains([1,2,3], 1)
     * // true
     * util.arrayContains([1,2,3], 5)
     * // false
     */
    util.arrayContains = function(arr, value) {
        var containsValue = false;

        $.each(arr, function(i, v) {
            if (v === value) {
                containsValue = true;
                return false; // break .each()
            }
        });

        return containsValue;
    };


    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * util.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    util.objectValues = function(object) {
        var values = [];
        for (var k in object) {
            values.push(object[k]);
        }

        return values;
    };


    /**
     * The actual alias we use is a little bit tricky.  In theory, we always
     * want window.top, but it's possible that some third-party site (let's say
     * Google) offers a version of the page in an iFrame.  Now we have a
     * scenario where we have the publisher's content in an iFrame.  If the
     * publisher has our JS in the page, then we should just use window.  If
     * our JS is in an iFrame, we should use window.parent. We have to be
     * careful that we have access to window.top or window.parent and resort
     * to window as a fallback.
     *
     * @returns {Window} A safe window object to use.
     */
    util.getWindow = function() {
        try {
            var w = window.top.location.href; // jshint ignore:line
            return window.top;
        } catch (ex1) {
            // We didn't have access to window.top, try window.parent
            try {
                var w = window.parent.location.href; // jshint ignore:line
                return window.parent;
            } catch (ex2) {
                // We didn't have access to window.top or window.parent, fallback
                // to window
                return window; // fallback
            }
        }
    };

    /**
     * Cross-browser safe way to add an event listener to the window (or
     * document for IE).
     */
    util.windowAddEventListener = function(evt, callback, useCapture) {
        useCapture = typeof useCapture === 'undefined' ? false : useCapture;
        if (typeof window.addEventListener !== 'undefined') {
            return window.addEventListener(evt, callback, useCapture);
        } else if (typeof document.attachEvent !== 'undefined') {
            return document.attachEvent("on" + evt, callback);
        }

        return false;
    };

    /**
     * Cross-browser safe way to remove an event listener from the window (or
     * document for IE).
     */
    util.windowRemoveEventListener = function(evt, callback, useCapture) {
        useCapture = typeof useCapture === 'undefined' ? false : useCapture;
        if (typeof window.removeEventListener !== 'undefined') {
            return window.removeEventListener(evt, callback, useCapture);
        } else if (typeof document.detachEvent !== 'undefined') {
            return document.detachEvent("on" + evt, callback);
        }

        return false;
    };

    /**
     * Cross-browser safe way to add an event listener to an object.
     * @param  {Object}   obj        object to add the listener to
     * @param  {String}   evt        the event type to listen for (e.g. "click")
     * @param  {Function} callback   callback function after event is triggered
     * @param  {Boolean}  useCapture see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     * @return {Object}              the result of addEventListener/attachEvent
     */
    util.objAddEventListener = function(obj, evt, callback, useCapture) {
        useCapture = typeof useCapture === 'undefined' ? false : useCapture;
        if (typeof obj.addEventListener !== 'undefined') {
            return obj.addEventListener(evt, callback, useCapture);
        } else if (typeof obj.attachEvent !== 'undefined') {
            return obj.attachEvent('on' + evt, callback);
        }

        return false;
    };


    /**
     * Cross-browser safe way to remove an event listener from an object.
     * @param  {Object}   obj        object to add the listener to
     * @param  {String}   evt        the event type to listen for (e.g. "click")
     * @param  {Function} callback   callback function after event is triggered
     * @param  {Boolean}  useCapture see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     * @return {Object}              the result of removeEventListener/detachEvent
     */
    util.objRemoveEventListener = function(obj, evt, callback, useCapture) {
        useCapture = typeof useCapture === 'undefined' ? false : useCapture;
        if (typeof obj.removeEventListener !== 'undefined') {
            return obj.removeEventListener(evt, callback, useCapture);
        } else if (typeof obj.detachEvent !== 'undefined') {
            return obj.detachEvent('on' + evt, callback);
        }

        return false;
    };

}());
