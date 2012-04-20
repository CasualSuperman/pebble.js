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

function parentCheck(elem, chain) {
	validateMatch(elem.parentNode, chain) ? [elem.parentNode] : [];
}

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

function elderSiblingCheck(elem, chain) {
	var results = [];
	while (elem.previousSibling) {
		if (elem.previousSibling.nodeType === 1 && validateMatch(elem.previousSibling, chain)) {
			results.push(elem.previousSibling);
		}
		elem = elem.previousSibling;
	}
	return results;
}

function performSelection(context, chain) {
	var tempResults = [];
	var results = [];
	if (chain.tagName) {
		results = context.getElementsByTagName(chain.tagName);
	} else {
		results = context.getElementsByTagName("*");
	}
	if (chain.filters) {
		results = Array.prototype.slice.apply(results);
		for (var i = 0, len = chain.filters.length; i < len; ++i) {
			results = results.filter(chain.filters[i]);
		}
	}
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
		if (first === last) {
			break;
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
					results = results.concat(performSelection(compound));
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
	console.log(performSelection(context, compound));
};

pebble["noConflict"] = function() {
	window["pebble"] = _pebble;
	return pebble;
};

window["pebble"] = pebble;

}());
// vim:noexpandtab: set ts=4 sw=4:
