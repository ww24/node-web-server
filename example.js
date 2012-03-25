var nws = require('./lib/index.js');

nws.stop();
// => Server is not running.

nws.run({
	host: "localhost",
	port: 8080
});
// => Server running at ~

setTimeout(nws.stop, 1000 * 10);
// => Server stop.