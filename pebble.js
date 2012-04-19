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

var has = function(arr, item) {
	return arr.indexOf(item) !== -1;
}

window['has'] = has;

function lexAttribute(selector, start) {
	var last = start + 1,
		selectorLength = selector.length,
		lexing = true;
	while (lexing && last < selector.length) {
		var character = selector.charAt(last);
		switch (character) {
			case '\\':
				last += 2;
				break;
			case '"':
			case "'":
				var next = lexQuote(selector, last);
				if (next == last) {
					return start;
				}
				last = next;
			case ']':
				return last + 1;
			default:
				last++;
				break;
		}
	}
	return start;
}

function lexQuote(selector, start) {
	var quoteCharacter = selector.charAt(start),
		last = start + 1,
		selectorLength = selector.length;
	while (last < selectorLength) {
		switch (selector.charAt(last)) {
		case '\\':
			last += 2;
			break;
		case quoteCharacter:
			return last + 1;
		default:
			last++;
			break;
		}
	}
	return start;
}

var stoppingNonSelectors = ['#', '.', ':', '!', ',', '['],
	stoppingSelectors = ['~', '>', '+', ' '],
	initializers = stoppingNonSelectors.concat(stoppingSelectors);

// Find the next section of a compound from the end of a given point.
function lex(selector, start) {
	var last = start,
		inQuotedSection = false,
		lexing = true,
		selectorLength = selector.length;
	while (lexing && last < selectorLength) {
		var character = selector.charAt(last);

		if (has(['"', "'"], character)) {
			if (start === last) {
				last = lexQuote(selector, last);
			}
			return last;
		} else if (character === '[') {
			if (start === last) {
				last = lexAttribute(selector, last);
			}
			return last;
		} else if (has(initializers, character)) {
			var isSelector = has(stoppingSelectors, character);
			if (isSelector && start === last) {
				for (var next = last + 1; /^\s*[+~ >]\s*$/.test(selector.slice(last, next)); next++) {}
				last = next - 1;
			}
			if (isSelector || start !== last) {
				return last;
			}
			last++;
		} else if (character === '\\') {
			last += 2;
		} else {
			last++;
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
