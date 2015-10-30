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
/*
  ENGAGED TIME TRACKING

  This tracker works by listening to a series of events that indicate user
  interaction with a webpage. Many times per second, the tracker checks whether
  any of these events have been triggered in the last few seconds. It accumulates
  the time between positive checks, resulting in a number of "engaged seconds"
  with a fairly high time resolution. Every few seconds (on a separate timeout
  from the accumulator) another function validates the accumulator's value and
  makes a pixel request.
 */
(function() {
    var root = window.CONFIG,
        settings = root.settings || {},
        $ = root.$,
        util = root.util;

    root.onReady();

    // Allow publishers to disable engaged time pings all together
    if (typeof root.enableHeartbeats === "boolean" && !root.enableHeartbeats) {
        return;
    }

    var MIN_TIME_BETWEEN_HEARTBEATS = 1,  // 1 sec
        MAX_TIME_BETWEEN_HEARTBEATS = 15,  // 15 secs
        MIN_ACTIVE_TIMEOUT = 1,  // 1 sec
        MAX_ACTIVE_TIMEOUT = 60,  // 60 secs
        SAMPLE_RATE_SECONDS = 0.1,  // 100 milliseconds
        EVENT_NAMES = ["focus", "mousedown", "mouseup", "mousemove", "scroll",
                       "touchstart", "touchenter", "keyup", "keydown"];

    var secondsBetweenHeartbeats = 5.5;  // default, 5.5s
    // Allow publishers to configure secondsBetweenHeartbeats if, for example, they
    // wish to send fewer pixels for mobile devices
    if ($.isNumeric(root.secondsBetweenHeartbeats) &&
        root.secondsBetweenHeartbeats >= MIN_TIME_BETWEEN_HEARTBEATS &&
        root.secondsBetweenHeartbeats <= MAX_TIME_BETWEEN_HEARTBEATS) {
        secondsBetweenHeartbeats = root.secondsBetweenHeartbeats;
    }

    var activeTimeout = 5;  // default, 5 seconds
    if ($.isNumeric(root.activeTimeout) &&
        root.activeTimeout >= MIN_ACTIVE_TIMEOUT &&
        root.activeTimeout <= MAX_ACTIVE_TIMEOUT) {
        activeTimeout = root.activeTimeout;
    }

    var now = new Date().getTime();

    root.engagedTime = root.engagedTime || {};

    // keep track of how recently we saw the last event
    root._lastEventTime = now;
    // time of the last sample, used for time accumulation
    root._lastSampleTime = now;
    // total number of engaged seconds to report next
    root._engagedMs = 0;
    // externally visible indicator of engaged status
    root.isEngaged = true;
    // externally visible indicator of interacting status
    root.isInteracting = true;
    // maintain a focused property that indicates whether the document has focus
    root.focused = true;
    // externally visible indicator of whether a video is being tracked and is playing
    root.videoPlaying = false;

    // Counts used for testing only
    if (settings.test === true) {
        root._handleEngagementActivityCalls = 0;
    }

    $(document).on("show.visibility", function() {
        root.focused = true;
    });
    $(document).on("hide.visibility", function() {
        root.focused = false;
    });

    // trigger the activity timeout with any of EVENT_NAMES
    var handleEngagementActivity = function() {
        root._lastEventTime = new Date().getTime();
        if (settings.test === true) {
            root._handleEngagementActivityCalls++;
        }
    };
    $.each(EVENT_NAMES, function(i, eventName) {
        util.windowAddEventListener(eventName, handleEngagementActivity);
    });

    /*
     * Track embedded YouTube videos
     * https://developers.google.com/youtube/js_api_reference#Events
     */
    var YT_PLAYING = 1, YT_UNSTARTED = -1, YT_ENDED = 0, YT_PAUSED = 2;
    root.listenToYTVideoPlayer = function(player) {
        if (!$.isFunction(player["addEventListener"])) {
            return false;
        } else {
            player.addEventListener("onStateChange", function(event) {
                if (event.data === YT_UNSTARTED || event.data === YT_ENDED ||
                    event.data === YT_PAUSED)
                {
                    root.videoPlaying = false;
                } else if (event.data === YT_PLAYING) {
                    root.videoPlaying = true;
                    handleEngagementActivity();
                }
            });
        }
    };

    // Utility function to expose private members to unit tests
    root.engagedTime.getParams = function() {
        return {
            minTimeBetweenHeartbeats: MIN_TIME_BETWEEN_HEARTBEATS,
            maxTimeBetweenHeartbeats: MAX_TIME_BETWEEN_HEARTBEATS,
            minActiveTimeout: MIN_ACTIVE_TIMEOUT,
            maxActiveTimeout: MAX_ACTIVE_TIMEOUT,
            activeTimeout: activeTimeout
        };
    };

    root.engagedTime.sample = function(currentTime, lastEventTime, lastSampleTime, videoPlaying, focused, engagedMs) {
        // Allows us to override for unit testing
        currentTime = typeof currentTime === 'undefined' ? new Date().getTime() : currentTime;
        lastEventTime = typeof lastEventTime === 'undefined' ? root._lastEventTime : lastEventTime;
        lastSampleTime = typeof lastSampleTime === 'undefined' ? root._lastSampleTime : lastSampleTime;
        videoPlaying = typeof videoPlaying === 'undefined' ? root.videoPlaying : videoPlaying;
        focused = typeof focused === 'undefined' ? root.focused : focused;
        engagedMs = typeof engagedMs === 'undefined' ? root._engagedMs : engagedMs;

        root.isInteracting = (currentTime - lastEventTime) < (activeTimeout * 1000);
        root.isEngaged = (root.isInteracting && focused) || videoPlaying;
        // accumulate the amount of engaged time since last heartbeat
        root._engagedMs += root.isEngaged ? (currentTime - lastSampleTime) : 0;
        root._lastSampleTime = currentTime;

        return root;
    };
    if (typeof settings.test === 'undefined' || settings.test === false) {
        window.setInterval(root.engagedTime.sample, SAMPLE_RATE_SECONDS * 1000);
    }

    root.engagedTime.sendHeartbeat = function(enableHeartbeats, engagedMs) {
        // Allows us to override for unit testing
        enableHeartbeats = typeof enableHeartbeats === 'undefined' ? root.enableHeartbeats : enableHeartbeats;
        engagedMs = typeof engagedMs === 'undefined' ? root._engagedMs : engagedMs;

        var windowAlias = util.getWindow();
        var heartbeatsEnabled = (typeof enableHeartbeats === 'undefined' || enableHeartbeats === true);
        if (heartbeatsEnabled) {
            var engagedSecs = engagedMs / 1000;
            var roundedSecs = Math.round(engagedSecs);
            if (roundedSecs > 0 && engagedSecs <= (secondsBetweenHeartbeats + 0.25)) {
                /*
                PARSELY.beacon.pixel.beacon({
                    date: new Date().toString(),
                    action: "heartbeat",
                    inc: roundedSecs,
                    url: root.lastRequest ? root.lastRequest.url : windowAlias.location.href,
                    urlref: root.lastRequest ? root.lastRequest.urlref : windowAlias.document.referrer
                });

                if ($.isFunction(root.onHeartbeat)) {
                    root.onHeartbeat(engagedSecs);
                }
                */
            }
        }
        root._engagedMs = 0;
    };
    // every secondsBetweenHeartbeats, attempt to send a pixel
    if (typeof settings.test === 'undefined' || settings.test === false) {
        window.setInterval(root.engagedTime.sendHeartbeat, secondsBetweenHeartbeats * 1000);
    }

    // Make a best attempt to fire a heartbeat before the browser is closed
    // have to use a wrapper function here since the an event listener will
    // normally receive arguments that will collide with those sendHeartbeat
    // is expecting
    util.windowAddEventListener('beforeunload', function handleBeforeUnload() { root.engagedTime.sendHeartbeat(); });
}());
