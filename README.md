Parse.ly - Time Engaged Tracking
================================

![](http://www.parsely.com/static/img/parsely-small.png)

This repository contains Parse.ly's implementation of "time engaged" tracking.
For an explanation of the methodology informing this implementation,
see the [Parse.ly technical documentation](http://www.parsely.com/docs/integration/tracking/time_engaged.html).

While the code tracking time engaged itself is unchanged from Parse.ly's
production implementation, the support logic contained in this repository is
simplified for clarity. Notably, the javascript bundle is loaded synchronously
in this implemtation instead of asynchronously, as it is in the production
Parse.ly JavaScript tracker.

Testing
-------

To run local tests displaying time engaged tracking, you must first install
the project dependencies from npm.

    $ npm install

Once all dependencies have been installed, you can run the test server on
localhost with

    $ grunt run-local

Then, navigate in a browser to
`http://localhost:8000/standard_engaged_time_local.html`. Keep the window
and browser tab focused, and the tests will run one at a time.

Directory Structure
-------------------

* `src/tracker`: contains `engaged_time.js`, the core time engaged
  implementation, along with supporting files in the `lib` subdirectory
* `test`: contains the javascript file that uses qunit to define the unit tests
  run by the test page
* `src/templates`: contains the template file used to generate the html test
  page
* `static`: contains the static image, js, and css files needed to render the
  test page along with `standard_engaged_time_local.html`, the generated test
  page accessible via the browser
* `tasks`: contains `mockserver.js`, the small local server used to run the
  test page

License
-------

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
