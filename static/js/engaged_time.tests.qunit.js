/*
Copyright 2014 Parse.ly, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/**
 Unit test cases using QUnit
 */
/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
  /*
    ======== A Handy Little QUnit Reference ========
    http://docs.jquery.com/QUnit

    Test methods:
      expect(numAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      raises(block, [expected], [message])
  */
(function() {
    var QUnit = window.QUnit,
        $ = window.jQuery,
        isIE678 = navigator.userAgent.match(/; MSIE [678]\.0;/) !== null,
        isPhantomJS = navigator.userAgent.indexOf('PhantomJS') >= 0,
        root = window.CONFIG;

    // Fire spoofed events in a cross-browser manner (including IE<=8)
    // http://stackoverflow.com/a/11181451/735204
    var htmlEvents = {
        onload:1, onunload:1, onblur:1, onchange:1, onfocus:1,
        onreset:1, onselect:1, onsubmit:1, onabort:1, onkeydown:1,
        onkeypress:1, onkeyup:1, onclick:1, ondblclick:1, onmousedown:1,
        onmousemove:1, onmouseout:1, onmouseover:1, onmouseup:1
    };
    var triggerEvent = function (el, eventName){
        var event;
        if(document.createEvent){
            event = document.createEvent('HTMLEvents');
            event.initEvent(eventName, true, true);
        } else if(document.createEventObject) {  // IE < 9
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        if(el.dispatchEvent) {
            el.dispatchEvent(event);
        } else if(el.fireEvent && htmlEvents['on'+eventName]) {  // IE < 9
            el.fireEvent('on' + event.eventType, event);
        } else if(el[eventName]) {
            el[eventName]();
        } else if(el['on'+eventName]) {
            el['on' + eventName]();
        }
    };

    // Trigger an interaction for the next test

    QUnit.assert.numberAlmostEqual = function (actual, expected, allowedDeviation, message) {
        var min, max, message;
        if (allowedDeviation > 0 && allowedDeviation < 1) {
            // percentage based range
            min = expected * (1 - allowedDeviation);
            max = expected * (1 + allowedDeviation);
        } else {
            // value based range
            min = expected - allowedDeviation;
            max = expected + allowedDeviation;
        }
        message = message || "actual (" + actual + ") should be between [" +
                  min + ", " + max + "]";

        QUnit.push(actual >= min && actual <= max, actual, expected, message);
    };

    root.enableHeartbeats = true;
    QUnit.module("Engaged time sample() tests", {
        beforeEach: function() {
            this.currentTime = 1430452800000;
        },
        afterEach: function() {
            // This variable is built up cumulatively, need to reset after each
            // test
            root._engagedMs = 0
        }
    });
    QUnit.test('sample() engagement outside activeTimeout', function(assert) {
        var timeout = (root.engagedTime.getParams().activeTimeout * 1000) + 10,
            lastEventTime = this.currentTime - timeout,
            lastSampleTime = null,
            videoPlaying = false,
            focused = true;

        var sample = root.engagedTime.sample(this.currentTime, lastEventTime, lastSampleTime, videoPlaying, focused);
        assert.strictEqual(sample.isInteracting, false, 'should not be interacting outside of activeTimeout');
        assert.strictEqual(sample.isEngaged, false, 'should not be engaged if not interacting');
        assert.strictEqual(sample._engagedMs, 0, 'no engaged time if not engaged');
        assert.strictEqual(sample._lastSampleTime, this.currentTime);
    });
    QUnit.test('sample() engagement inside activeTimeout and focused', function(assert) {
        var timeout = (root.engagedTime.getParams().activeTimeout * 1000) - 10,
            lastEventTime = this.currentTime - timeout,
            lastSampleTime = this.currentTime - 100,
            videoPlaying = false,
            focused = true,
            engagedMs = 0;

        var sample = root.engagedTime.sample(this.currentTime, lastEventTime, lastSampleTime, videoPlaying, focused, engagedMs);
        assert.strictEqual(sample.isInteracting, true, 'should be interacting inside of activeTimeout');
        assert.strictEqual(sample.isEngaged, true, 'should not be engaged focused + interacting');
        assert.strictEqual(sample._engagedMs, 100);
        assert.strictEqual(sample._lastSampleTime, this.currentTime);
    });
    QUnit.test('sample() engagement inside activeTimeout, but not focused', function(assert) {
        var timeout = (root.engagedTime.getParams().activeTimeout * 1000) - 10,
            lastEventTime = this.currentTime - timeout,
            lastSampleTime = this.currentTime - 100,
            videoPlaying = false,
            focused = false,
            engagedMs = 0;

        var sample = root.engagedTime.sample(this.currentTime, lastEventTime, lastSampleTime, videoPlaying, focused, engagedMs);
        assert.strictEqual(sample.isInteracting, true);
        assert.strictEqual(sample.isEngaged, false);
        assert.strictEqual(sample._engagedMs, 0);
        assert.strictEqual(sample._lastSampleTime, this.currentTime);
    });
    QUnit.test('sample() no engagement, not focused, but video playing', function(assert) {
        var timeout = (root.engagedTime.getParams().activeTimeout * 1000) + 10,
            lastEventTime = this.currentTime - timeout,
            lastSampleTime = this.currentTime - 100,
            videoPlaying = true,
            focused = false,
            engagedMs = 0;

        var sample = root.engagedTime.sample(this.currentTime, lastEventTime, lastSampleTime, videoPlaying, focused, engagedMs);
        assert.strictEqual(sample.isInteracting, false);
        assert.strictEqual(sample.isEngaged, true);
        assert.strictEqual(sample._engagedMs, 100);
        assert.strictEqual(sample._lastSampleTime, this.currentTime)
    });






    QUnit.module("Engaged time sendHeartbeat() tests", {
        beforeEach: function() {
            this.currentTime = 1430452800000;
        },
        afterEach: function() {
            // This variable is built up cumulatively, need to reset after each
            // test
            root._engagedMs = 0
        }
    });
    QUnit.test('sendHeartbeat() heartbeats enabled but no cumulative engagement time', function(assert) {
        var enableHeartbeats = true,
            engagedMs = 0;

        var pixelCount = window.pixels.length;
        root.engagedTime.sendHeartbeat(enableHeartbeats, engagedMs);
        assert.strictEqual(window.pixels.length, pixelCount, 'no pixel should be fired');
    });
    QUnit.test('sendHeartbeat() heartbeats enabled and cumulative engagement time', function(assert) {
        var enableHeartbeats = true,
            engagedMs = 600;

        root.engagedTime.sendHeartbeat(enableHeartbeats, engagedMs);
        assert.strictEqual(root.lastRequest.action, 'heartbeat');
        assert.strictEqual(root.lastRequest.inc, 1);
        assert.strictEqual(root._engagedMs, 0);
    });
    QUnit.test('sendHeartbeat() heartbeats enabled but invalid cumulative engagement time', function(assert) {
        var enableHeartbeats = true,
            engagedMs = 90000;

        var pixelCount = window.pixels.length;
        root.engagedTime.sendHeartbeat(enableHeartbeats, engagedMs);
        assert.strictEqual(window.pixels.length, pixelCount, 'no pixel should be fired');
    });
    QUnit.test('sendHeartbeat() heartbeats disabled', function(assert) {
        var enableHeartbeats = false,
            engagedMs = 600;

        var pixelCount = window.pixels.length;
        root.engagedTime.sendHeartbeat(enableHeartbeats, engagedMs);
        assert.strictEqual(window.pixels.length, pixelCount, 'no pixel should be fired');
    });
    QUnit.test('sendHeartbeat() new page view changes heartbeat url/urlref', function(assert) {
        var newURL = location.href.replace(".html", "") + "123",
            urlref = location.href,
            enableHeartbeats = true,
            engagedMs = 600;

        root.beacon.trackPageView({"url": newURL, "urlref": urlref});
        root.engagedTime.sendHeartbeat(enableHeartbeats, engagedMs);
        assert.strictEqual(root.lastRequest.action, 'heartbeat');
        assert.strictEqual(root.lastRequest.inc, 1);
        assert.strictEqual(root.lastRequest.url, newURL);
        assert.strictEqual(root.lastRequest.urlref, urlref);
        assert.strictEqual(root._engagedMs, 0);
    });






    QUnit.module('Engaged time engagement listener tests');
    QUnit.test('Ensure that code listens for engagement events', function(assert) {
        // This is a tough one to really test for fully since we can't trigger
        // touch events on older browsers, so we'll cover the basics here
        $.each(['mousedown', 'mouseup', 'mousemove', 'keyup', 'keydown', 'scroll'], function(i, eventType) {
            var currentCalls = root._handleEngagementActivityCalls;
            if (isIE678) {
                if (eventType === 'scroll') {
                    return;
                }
                triggerEvent(document, eventType);
            } else {
                triggerEvent(window, eventType);
            }
            assert.strictEqual(root._handleEngagementActivityCalls, currentCalls + 1, 'on' + eventType + ' triggers event listener');
        });
    });






    // TODO: testing of visibility events?

    // IE 6/7/8 and PhantomJS have difficulty with the YT player API, so skip those tests there
    if (!isIE678 && !isPhantomJS) {
        QUnit.module('Engaged time YouTube video integration tests');
        QUnit.test('Ensure YouTube video integration works', function(assert) {
            var done = assert.async(),
                currentCalls = root._handleEngagementActivityCalls;

            function afterPlay() {
                assert.strictEqual(root.videoPlaying, true, 'videoPlaying flag should be set');
                assert.strictEqual(root._handleEngagementActivityCalls, currentCalls + 1, 'engagement activity should be registered');
                currentCalls++;

                $.each(window.ytPlayers, function pauseVideos(i, player) {
                    player.pauseVideo();
                });
            }

            function afterPause() {
                assert.strictEqual(root.videoPlaying, false, 'videoPlaying flag should be unset');
                assert.strictEqual(root._handleEngagementActivityCalls, currentCalls, 'no additional engagement activity should be registered');
                done();
            }

            $.each(window.ytPlayers, function playVideos(i, player) {
                player.playVideo();
            });

            setTimeout(function() {
                afterPlay();
                setTimeout(afterPause, 1500);
            }, 1500);
        });
    }

})();
