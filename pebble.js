// Anonymous Function
(function() {
"use strict";

var indexOf = (function() {
	if (Array.prototype.indexOf) {
		return function(arr, item) {
			return arr.indexOf(item);
		};
	}
	return function(arr, item) {
		for (var i = 0, len = arr.length; i < len; ++i) {
			if (item === arr[i]) {
				return i;
			}
		}
		return -1;
	};
}());

/* Checks to see if the charater at the given index is escaped.
 * Returns 0 if it is not escaped, or the number of slashes escaping the value
 * if it is escaped.
 */
function isEscaped(selector, index) {
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
function lexFromEnd(selector, last) {
	var start = last,
		inQuotedSection = false,
		lexing = true;
	while (lexing && last >= 0) {
		var character = selector.charAt(last),
			escaped;

		switch (character) {
		case '#':
		case '.':
		case ':':
			if (inQuotedSection) {
				last--;
			} else {
				escaped = isEscaped(selector, last);
				if (!escaped) {
					last--;
					lexing = false;
				}
				last -= escaped;
			}
			break;

		case '!':
		case ',':
		case ')':
		case '(':
		case '[':
		case ']':
			if (inQuotedSection) {
				last--;
			} else {
				escaped = isEscaped(selector, last);
				if (!escaped && start === last) {
						last--;
				}
				lexing = !(!escaped);
				last -= escaped;
			}
			break;

		case '~':
		case '>':
		case '+':
		case ' ':
			if (inQuotedSection) {
				last--;
			} else {
				escaped = isEscaped(selector, last);
				if (!escaped && start === last) {
					lexing = false;
					last--;
					// We should scan for selectors to prevent
					// [" ", "+", " "]-esque things as showing up as the next
					// few symbols
					var seeking = true;
					while (seeking && last > 0) {
						var next = lexFromEnd(selector, last);
						if (/^\s*[+~ >]\s*$/.test(selector.slice(next + 1, last + 1))) {
							last--;
						} else {
							seeking = false;
						}
					}
				} else if (!escaped) {
					lexing = false;
				} else {
					last -= escaped;
				}
			}
			break;
		// We haven't hit a new section yet.
		default:
			last--;
			break;
		}
	}

	return last;
}

var _pebble = window["pebble"],
	pebble = function(selector, context) {
	if (selector === undefined || selector === "") {
		return [];
	}
	// Make sure we have a root element to work with.
	context = context || document;
	// Get those nasty spaces gone.
	selector = selector.trim();

	var last = selector.length - 1;

	while (last >= 0) {
		var first = lexFromEnd(selector, last),
			token = selector.slice(first + 1, last + 1);
		if (token.length > 0) {
			console.log('"' + token.trim() + '"');
		}
		last = first;
	}
};

pebble["noConflict"] = function() {
	window["pebble"] = _pebble;
	return pebble;
};

window["pebble"] = pebble;

}());
// vim:noexpandtab: set ts=4 sw=4:
