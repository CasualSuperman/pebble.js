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
	this.relationship = relationships.descendant;
};

var lex = function(string) {
	// If we start with whitespace, return it.
	var whitespace = string.match(/^\s+/);

	if (whitespace) {
		console.log("Whitespace found.");
		return [whitespace[0], ' '];
	}

	var ident = string.charAt(0);

	switch (ident) {
	case '>': // Child selector
	case '!': // Subject selector
	case '*': // Any-tag selector
	case '+': // Next-sibling selector
	case '~': // Sibling selector
	case ',': // List of selectors
		return [ident, ident];

	case '.': // Classes
		return string.match(/^(\.)([-]?[_a-z][_a-z0-9-]*)/i);

	case '#': // IDs
		return string.match(/^(#)([-]?[_a-z][_a-z0-9-]*)/i);

	case ':': // Pseudo-classes
		break;

	case '[': // Attribute selectors
		return string.match(/^(\[)/i);

	default: // Tag names
		return string.match(/^([-]?[_a-z][_a-z0-9-]*)/i);
	}
};

// Converts a selector string into a sequence of processed compounds.
var processSelector = function(selector) {
	// Start our list.
	var chains = [new Compound(null)];
	// Our current element.
	var current = chains[0];

	var token = "";

	do {
		token = lex(selector);
		console.log(token);
		if (token) {
			selector = selector.slice(token.length);
			if (token[1].length === 1) {
				switch (token[1]) {
					// Move on to next compound, this is the end of the selector.
					case ' ':
						current.next = new Compound(current);
						current = current.next;
						break;
					case '#':
						current.id = token[2];
						break;
					case '.':
						current.classes.push(token[2]);
						break;
					case '*':
						current.tag = "*";
						break;
					case '!':
						current.subject = true;
						break;
					case '+':
						current.prev.relationship = relationships.next_eldest_sibling;
						break;
					case '~':
						current.prev.relationship = relationships.younger_sibling;
						break;
					case '>':
						current.prev.relationship = relationships.child;
						break;
					case ',':
						current = chains[chains.length] = new Compound(null);
						break;
				}
			}
		}
	} while (token && selector.length);
}

var _pebble = window["pebble"];

var pebble = function(selector, context) {
	if (selector === undefined) {
		return [];
	} else {
		selector = processSelector(selector);
	}
	context = context || document;
};

this.restore = function() {
	window["pebble"] = _pebble;
	return pebble;
};

window["pebble"] = pebble;

})(this);
// vim:noexpandtab: set ts=4 sw=4:
