// Anonymous Function
(function(window, undefined) {

var _pebble = window["pebble"];

/* Checks to see if the charater at the given index is escaped.
 * Returns 0 if it is not escaped, or the number of slashes escaping the value
 * if it is escaped.
 */
var isEscaped = function(selector, index) {
	// Last possible index for an escape.
	var lastSlash = index - 1;
	// Loop backwards through the slashes.
	while (lastSlash >= 0 && selector.charAt(lastSlash) === '\\') {
		lastSlash--;
	}
	// Check the number of escaped escape characters.
	if ((index - lastSlash) & 1) {
		// If it's odd, we're not escaped, and we should break
		return 0;
	} else {
		// If it's even, we're escaped, and we should keep going.
		return (index - lastSlash);
	}
}

// Find the next section of a compound from the end of a given point.
var lexFromEnd = function(selector, last) {
	var start = last;
	var inQuotedSection = false;
	var lexing = true;
	while (lexing && last >= 0) {
		var char = selector.charAt(last);

		switch (char) {
		case ' ':
		case '.':
		case '#':
		case '~':
		case '>':
		case '+':
		case ',':
			if (inQuotedSection) {
				last--;
			} else {
				var escaped = isEscaped(selector, last);
				if (!escaped && (start === last || char !== ' ')) {
						last--;
				}
				lexing = !(!escaped);
				last -= escaped;
			}
			break;
		// We haven't hit a new section yet.
		default:
			last--;
			break;
		}
	}

	return last;
};

var pebble = function(selector, context) {
	if (selector === undefined || selector === "") {
		return [];
	}
	// Make sure we have a root element to work with.
	context = context || document;
	// Get those nasty spaces gone.
	selector = selector.trim();

	var last = selector.length - 1;

	while (last >= 0) {
		var first = lexFromEnd(selector, last);
		var token = selector.slice(first + 1, last + 1);
		console.log((first + 1) + " to " + (last + 1) + ":", token);
		last = first;
	}
};

this.restore = function() {
	window["pebble"] = _pebble;
	return pebble;
};

window["pebble"] = pebble;

})(this);
// vim:noexpandtab: set ts=3 sw=3:
