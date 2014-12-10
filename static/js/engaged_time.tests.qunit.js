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
        $ = window.jQuery;

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

    var disable = function() {
        QUnit.asyncTest("Engaged Time - Disable heartbeats", function(assert) {
            QUnit.expect(1);

            var startEngagedSecs = engagedSecs;

            var disableTest = function() {
                assert.numberAlmostEqual(engagedSecs - startEngagedSecs, 0, 0);

                QUnit.start();
            };

            setTimeout(disableTest, 6000)
        });
    };

    var youtube = function() {
        QUnit.asyncTest("Engaged Time - YouTube Video Playing", function(assert) {
            QUnit.expect(1);

            var ytVideoTest = function() {
                assert.numberAlmostEqual(engagedSecs, 26, 5);

                $.each(window.ytPlayers, function(i, player) {
                    player.pauseVideo();
                });
                window.CONFIG.enableHeartbeats = false;
                triggerEvent(window, "mousedown");
                triggerEvent(window, "mouseup");

                QUnit.start();

                disable();
            };

            setTimeout(ytVideoTest, 18500)
        });
    };

    var userActivity = function() {
        QUnit.asyncTest("Engaged Time - User Activity", function(assert) {
            QUnit.expect(2);

            var interactionTest = function() {
                assert.numberAlmostEqual(engagedSecs, 10, 3);
                assert.numberAlmostEqual(window.timeSinceLastHeartbeat, 3*1000, 1*1000)

                QUnit.start();

                // Trigger YT videos for the next test
                $.each(window.ytPlayers, function(i, player) {
                    player.playVideo();
                });

                youtube();
            };

            setTimeout(interactionTest, 21500);
        });
    };

    QUnit.asyncTest("Engaged Time - Basic", function(assert) {
        QUnit.expect(1);

        var initialHeartbeatTest = function() {
            // QUnit.ok(true);
            assert.numberAlmostEqual(engagedSecs, 5, 2);
            // QUnit.test("Initial heartbeat ping", function() {

            // });

            QUnit.start();

            console.log("Triggering window.mousedown and window.mouseup");
            triggerEvent(window, "mousedown");
            triggerEvent(window, "mouseup");
            triggerEvent(document, "mousedown");
            triggerEvent(document, "mouseup");

            userActivity();
        };

        setTimeout(initialHeartbeatTest, 5500);
    });

})();
