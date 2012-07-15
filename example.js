var nws = require('./lib/index.js');

nws.stop();
// => Server is not running.

nws.run({
    host: "localhost",
	port: 8080,
	docRoot: "www"
}, __dirname);
// => Server running at ~

setTimeout(nws.stop, 1000 * 10);
// => Server stop.