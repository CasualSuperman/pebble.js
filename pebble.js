// Anonymous Function
(function(window, undefined) {

// The various relationships a compound in a selector can have with others.
var relationships = {
	descendant: 0,
	child: 1,
	younger_sibling: 2,
	next_eldest_sibling: 3
};

// A constructor function for a default compound.
var Compound = function() {
	this.tag = "";
	this.classes = [];
	this.id = "";
	this.subject = false;
	this.attributes = [];
};

var _pebble = window["pebble"];

/* Checks to see if the charater at the given index is escaped.
 * Returns 0 if it is not escaped, or the number of slashes escaping the value
 * if it is escaped.
 */
var isEscaped = function(selector, index) {
	// Last possible index for an escape.
	var lastSlash = index - 1;
	// Loop backwards through the slashes.
	while (selector.charAt(lastSlash) === '\\') {
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
	var inEscapedSection = false;
	var lexing = true;
	while (lexing) {
		var char = selector.charAt(last);

		switch (char) {
		case ' ':
		case '.':
		case '#':
		case '~':
		case '>':
		case '+':
		case ',':
			if (inEscapedSection) {
				last--;
			} else {
				var escaped = isEscaped(selector, last));
				if (!escaped && char === ' ') {
					// A space will not be included in the token if it's not escaped.
					last++;
				}
				last -= escaped;
			}
			break;
		// We haven't hit a new section yet.
		default:
			last--;
			break;
		}
	}

	return last + 1;
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

	while (last > 0) {
		var first = lexFromEnd(selector, last),
			token = selector.slice(first, last + 1);
		console.log(token);
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
