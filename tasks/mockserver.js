/**
 * A specialty mock server that can act as static when testing
 * locally.
 */
module.exports = function(grunt) {
  grunt.registerTask('mockserver',
                     'A specialty mock server that can act as static,' +
                     'when testing locally',
                     function sauceMock(){
    var http = require('http');
    var url  = require('url');
    var path = require('path');
    var mime = require('mime');
    var fs   = require('fs');

    var port = 8000;
    var base = path.resolve('./static');

    var onFileError = function(error) {
      grunt.log.writeln(error);
      res.statusCode = 500;
      res.write('Application error');
      res.end();
    };

    var app  = http.createServer(function(req, res) {
      var parsedUrl = url.parse(req.url, true);
      var pathname = parsedUrl.pathname;
      grunt.log.writeln('GET ' + parsedUrl.path);

      var localPathname = base + pathname;

      fs.stat(localPathname, function(err, stats) {
          if (err || !stats.isFile()) {
          res.writeHead(404);
          res.write('Not found');
          res.end();
          } else if (stats.isFile()) {
          var type = mime.lookup(localPathname);
          res.setHeader('Content-Type', type);
          res.statusCode = 200;
          var file = fs.createReadStream(localPathname);
          file.on('open', function() { file.pipe(res); });
          file.on('error', onFileError)
          }
      });
    }); // end app

    app.listen(port);
  }); // end sauceMock
}; // end module.exports
