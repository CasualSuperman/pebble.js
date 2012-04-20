/**
 * pebble.js - A lightweight CSS1 selector engine.
 * Robert Wertman
 */

(function() {
"use strict";

// Anonymous functions.
// This provides a version of indexOf on browsers that don't support it.
var indexOf = (function() {
	// IE < 9 doesn't have indexOf.
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

// Use of arguments variable. This will lex a quoted string.
function lexQuote() {
	var selector = arguments[0];
	var start = arguments[1];
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
		case ',':
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
				// Non-trivial regular expression.
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

// This takes a node and a filter and returns if it passes the filter or not.
function validateMatch(node, chain) {
	if (chain.tagName) {
		if (chain.tagName !== node.tagName) {
			return false;
		}
	}
	if (chain.filters) {
		for (var i = 0, len = chain.filters.length; i < len; ++i) {
			if (!chain.filters[i](node)) {
				return false;
			}
		}
	}
	return true;
}

// This takes an element and a filter and sees which of its ancestors pass the filter.
function ancestorCheck(elem, chain) {
	var results = [];
	while (elem.parentNode) {
		if (validateMatch(elem.parentNode, chain)) {
			results.push(elem.parentNode);
		}
		elem = elem.parentNode;
	}
	return results;
}

// This takes an element and a filter and sees if its parent passes the filter.
function parentCheck(elem, chain) {
	return validateMatch(elem.parentNode, chain) ? [elem.parentNode] : [];
}

// This takes an element and a filter and sees if its next eldest sibling passes the filter.
function nextEldestCheck(elem, chain) {
	var previousSibling = elem.previousSibling;
	while (previousSibling.nodeType !== 1 && previousSibling.previousSibling) {
		previousSibling = previousSibling.previousSibling;
	}
	if (previousSibling) {
		return validateMatch(previousSibling, chain);
	}
	return false;
}

// This takes a filter and an element and finds which elder siblings pass the filter.
function elderSiblingCheck(elem, chain) {
	var results = [];
	while (elem.previousSibling) {
		if (elem.previousSibling.nodeType === 1 &&
			 validateMatch(elem.previousSibling, chain)) {
			results.push(elem.previousSibling);
		}
		elem = elem.previousSibling;
	}
	return results;
}

// This takes a chain of selectors and filters the results.
function performSelection(context, chain) {
	var tempResults = [];
	var results = [];
	if (chain.tagName) {
		results = context.getElementsByTagName(chain.tagName);
	} else {
		results = context.getElementsByTagName("*");
	}
	// forEach
	if (chain.filters) {
		results = Array.prototype.slice.apply(results);
		chain.filters.forEach(function(filter) {
			results = results.filter(filter);
		});
	}
	// Map.
	while (chain.next) {
		results = Array.prototype.slice.apply(results);
		results = results.map(function(elem) {
			if (chain.relationship(elem, chain.next).length > 0) {
				return elem;
			}
		}).filter(function(elem){
			return elem !== undefined;
		});
		chain = chain.next;
	}
	return results;
}

var _pebble = window["pebble"],
	// This takes a selector and an optional context, and does a search over it.
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

	var compound = {filters: []};
	var results = [];

	while (first < len) {
		// Get the next token.
		var last = lex(selector, first),
			token = selector.slice(first, last),
			oldCompound = compound;

		// Make sure we're not caught in an infiite loop of zero-length tokens.
		// Throw statement.
		if (first === last) {
			throw "Invalid selector.";
		}

		token = token.trim(); // Remove extra whitespace.
		var relationship  = null;

		if (token === '') {
			relationship = ancestorCheck;
		} else if (token === '>') {
		 	relationship = parentCheck;
		} else if (token === '+') {
		 	relationship = nextEldestCheck;
		} else if (token === '~') {
			relationship = elderSiblingCheck;
		}  else {
			switch (token.charAt(0)) {
				case '.':
					var classTest = new RegExp("(^| )" + token.slice(1).replace(/\\(.)/, "$1") + "( |$)");
					compound.filters.push(function(node) {
						return classTest.test(node.className);
					});
					break;
				case '#':
					var parsedId = token.slice(1).replace(/\\(.)/, "$1");

					compound.filters.splice(0, 0, function(node) {
						return node.id === parsedId;
					});
					break;
				case ',':
				// reduce
					results = results.reduce(Array.prototype.concat,performSelection(context, compound));
					compound = {filters: []};
					break;
				default:
					compound.tagName = token.replace(/\\(.)/, "$1").toUpperCase();
			}
		}
		if (relationship) {
			compound = {next: oldCompound, relationship: relationship, filters:[]};
		}

		// "Consume" the token.
		first = last;
	}
	return results.concat(performSelection(context, compound));
};

// This allows users to reclaim window.pebble if it's already used by something.
pebble["noConflict"] = function() {
	window["pebble"] = _pebble;
	return pebble;
};

// Try-catch, apply, and a set impemeneted with an object.
window["pebble"] = function() {
	try {
		var nodes = pebble.apply(null, arguments);
		var unique = {};
		var results = [];
		nodes.forEach(function(node) {
			unique[node] = true;
		});
		for (var node in unique) {
				results.push(node);
		}
		return results;
	} catch (e) {
		return [];
	}
};

}());
// vim:noexpandtab: set ts=3 sw=3:
