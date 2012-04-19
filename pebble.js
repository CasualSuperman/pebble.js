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

function lexAttribute(selector, start) {
	var last = start + 1,
		selectorLength = selector.length,
		lexing = true;
	while (lexing && last < selector.length) {
		var character = selector.charAt(start);
	}
}

function lexQuote(selector, start) {
	var quoteCharacter = selector.charAt(start),
		lexing = true,
		last = start + 1,
		selectorLength = selector.length;
	while (lexing && last < selectorLength) {
		switch (selector.charAt(start)) {
		case '\\':
			last += 2;
			break;
		case quoteCharacter:
			lexing = false;
		default:
			last++;
			break;
		}
	}
	return last;
}

// Find the next section of a compound from the end of a given point.
function lex(selector, start) {
	var last = start,
		inQuotedSection = false,
		lexing = true,
		selectorLength = selector.length;
	while (lexing && last < selectorLength) {
		var character = selector.charAt(last);

		switch (character) {
		case '\\':
			last += 2;
			break;
		case '"':
		case "'":
			if (start === last) {
				last = lexQuote(selector, last);
			}
			return last;
		case '#':
		case '.':
		case ':':
		case '!':
		case ',':
		case '[':
			if (start === last) {
				last++;
			} else {
				lexing = false;
			}
			break;
		case '~':
		case '>':
		case '+':
		case ' ':
			if (start === last) {
				// We should scan for selectors to prevent
				// [" ", "+", " "]-esque things as showing up as the next
				// few symbols
				lexing = false;
				last++;
				var next = lex(selector, last);
				if (/^\s*[+~ >]\s*$/.test(selector.slice(last, next))) {
					last = next;
				}
			}
			lexing = false;
			break;
		// We haven't hit a new section yet.
		default:
			last++;
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

	var len = selector.length,
		first = 0;

	while (first < len) {
		var last = lex(selector, first),
			token = selector.slice(first, last);
		if (token.length > 0) {
			console.log('"' + token + '"');
		} else {
			console.log("Breaking out because of an empty match.");
			last = len;
		}
		first = last;
	}
};

pebble["noConflict"] = function() {
	window["pebble"] = _pebble;
	return pebble;
};

window["pebble"] = pebble;

}());
// vim:noexpandtab: set ts=4 sw=4:
