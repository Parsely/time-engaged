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
    // Allow integrators to configure secondsBetweenHeartbeats if, for example, they
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

    // how recently we saw the last event
    root._lastEvent = now;
    // time of the last sample, used for time accumulation
    root._lastSample = now;
    // accumulator of engaged seconds
    root._engagedMs = 0;
    // externally visible indicator of engaged status
    root.isEngaged = true;
    // externally visible indicator of interacting status
    root.isInteracting = true;
    // maintain a focused property that indicates whether the document has focus
    root.focused = true;
    // externally visible indicator of whether a video is being tracked and is playing
    root.videoPlaying = false;

    // maintain a flag that indicates whether the window is currently focused
    $(document).on("show.visibility", function() {
        root.focused = true;
    });
    $(document).on("hide.visibility", function() {
        root.focused = false;
    });

    // any time one of the events in EVENT_NAMES is triggered, note the time
    // at which it occurred.
    var registerEvent = function() {
        root._lastEvent = new Date().getTime();
    };
    for (var i = 0; i < EVENT_NAMES.length; i++) {
        if (window.addEventListener) {
            window.addEventListener(EVENT_NAMES[i], registerEvent, false);
        } else {
            document.attachEvent("on" + EVENT_NAMES[i], registerEvent);
        }
    }

    /*
     * Track embedded YouTube videos
     * https://developers.google.com/youtube/js_api_reference#Events
     *
     * Maintain a flag that indicates whether the tracker is aware of
     * any currently playing videos.
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
                    registerEvent();
                }
            });
        }
    };

    /*
     * Every SAMPLE_RATE_SECONDS, increase the counter root._engagedMs
     * by the amount of time engaged measured since the last sample was taken.
     */
    var sample = function() {
        var currentTime = new Date().getTime();
        // define "interacting" as "it is currently less than activeTimeout seconds
        // since the last engagement event was triggered
        root.isInteracting = currentTime - root._lastEvent < activeTimeout * 1000;
        root.isEngaged = (root.isInteracting && root.focused) || root.videoPlaying;
        // accumulate the amount of engaged time since last heartbeat
        root._engagedMs += root.isEngaged ? (currentTime - root._lastSample) : 0;
        root._lastSample = currentTime;
    };
    window.setInterval(sample, SAMPLE_RATE_SECONDS * 1000);

    /*
     * Every secondsBetweenHeartbeats seconds, send a heartbeat and reset the
     * accumulator
     */
    var sendHeartbeat = function() {
        if (typeof root.enableHeartbeats === "undefined" ||
            (typeof root.enableHeartbeats === "boolean" && root.enableHeartbeats))
        {
            var engagedSecs = Math.round(root._engagedMs / 1000);
            if (engagedSecs > 0 && engagedSecs <= Math.round(secondsBetweenHeartbeats))
            {
                // Insert a pixel request here
                console.log("Sent a heartbeat with inc=" + engagedSecs);

                if ($.isFunction(root.onHeartbeat)) {
                    root.onHeartbeat(engagedSecs);
                }
            }
        }
        // reset the accumulator
        root._engagedMs = 0;
    };
    // every secondsBetweenHeartbeats, attempt to send a pixel
    window.setInterval(sendHeartbeat, secondsBetweenHeartbeats * 1000);
    window.onbeforeunload = sendHeartbeat;
}());
