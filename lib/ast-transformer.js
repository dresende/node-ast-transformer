exports.Transformer = Transformer;
exports.parse = function (code) {
	return require("uglify-js").parser.parse(String(code));
};

function Transformer(ast) {
	this.ast = ast;
	this.functionCalls = {};
	this.identifiers = {};
};
Transformer.prototype.replaceFunctionCall = function (functionName, cb) {
	this.functionCalls[functionName] = cb;
	return this;
};
Transformer.prototype.replaceIdentifier = function (identifier, value) {
	this.identifiers[identifier] = value;
	return this;
};
Transformer.prototype.transform = function () {
	//console.log(JSON.stringify(this.ast));
	return this.__crawlAST(this.ast);
};
Transformer.prototype.generate = function () {
	var js_compressor = require("uglify-js").uglify,
	    ast = this.transform();

	return js_compressor.gen_code(ast);
};
Transformer.prototype.__crawlAST = function (ast, prefix) {
	if (ast == undefined) return;

	switch (ast[0]) {
		case "block":
			if (ast.length == 1 || !ast[1].length) break;
		case "toplevel":
		case "try":
			// console.log("------------------");
			// console.log(JSON.stringify(ast));
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i] = this.__crawlAST(ast[1][i]);
			}
			break;
		case "var":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i][1] = this.__crawlAST(ast[1][i][1]);
			}
			break;
		case "function":
		case "defun":
			// @TODO: check function arguments
			for (var i = 0; i < ast[3].length; i++) {
				ast[3][i] = this.__crawlAST(ast[3][i]);
			}
			break;
		case "if":
		case "conditional":
		case "for":
		case "for-in":
			for (var i = 1; i < ast.length; i++) {
				ast[i] = this.__crawlAST(ast[i]);
			}
			break;
		case "assign":
		case "binary":
		case "unary-prefix":
		case "unary-postfix":
			for (var i = 2; i < ast.length; i++) {
				ast[i] = this.__crawlAST(ast[i]);
			}
			break;
		case "stat":
		case "return":
		case "form":
		case "throw":
			ast[1] = this.__crawlAST(ast[1]);
			break;
		case "new":
			ast[1] = this.__crawlAST(ast[1]);
			for (var i = 0; i < ast[2].length; i++) {
				ast[2][i] = this.__crawlAST(ast[2][i]);
			}
			break;
		case "dot":
			if (ast[1][0] == "name") break;

			ast[1] = this.__crawlAST(ast[1]);
			break;
		case "call":
			var functionCall = this.__callPath(ast[1]);

			if (functionCall !== null && this.functionCalls.hasOwnProperty(functionCall)) {
				ast = this.__handleFunctionCall(functionCall, ast, true);
				break;
			}

			switch (ast[1][0]) {
				case "call":
				case "function":
					ast[1] = this.__crawlAST(ast[1]);
					break;
				case "name":
				case "sub":
					//console.log(ast);
				case "dot":
					for (var i = 0; i < ast[2].length; i++) {
						ast[2][i] = this.__crawlAST(ast[2][i], ast);
					}
					break;
				default:
					console.log("---------- unknown call --------------");
					console.log(ast);
					console.log(JSON.stringify(ast));
			}
			break;
		case "object":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i][1] = this.__crawlAST(ast[1][i][1]);
			}
			break;
		case "array":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i] = this.__crawlAST(ast[1][i]);
			}
			break;
		case "string":
		case "num":
		case "break":
		case "continue":
		case "sub": // I actually don't know this much
			// ignore
			break;
		case "name":
			if (this.identifiers.hasOwnProperty(ast[1])) {
				ast = this.__toAST(this.identifiers[ast[1]]);
			}
			break;
		case "switch":
			ast[1] = this.__crawlAST(ast[1]);
			for (var i = 0; i < ast[2].length; i++) {
				for (var j = 0; j < ast[2][i][1].length; j++) {
					this.__crawlAST(ast[2][i][1][j]);
				}
			}
			break;
		default:
			console.log("---------- unknown --------------");
			console.log(ast);
			//console.log(JSON.stringify(ast));
	}
	return ast;
};
Transformer.prototype.__handleFunctionCall = function (functionCall, ast, return_ast) {
	if (typeof this.functionCalls[functionCall] == "function") {
		var args = [];

		for (var i = 0; i < ast[2].length; i++) {
			args.push(this.__toVar(ast[2][i]));
		}

		if (return_ast) {
			return this.__toAST(this.functionCalls[functionCall].apply(null, args));
		}
		return this.functionCalls[functionCall].apply(null, args);
	} else {
		if (return_ast) {
			return this.__toAST(this.functionCalls[functionCall]);
		}
		return this.functionCalls[functionCall];
	}
};
Transformer.prototype.__toVar = function (ast) {
	switch (ast[0]) {
		case "num":
		case "string":
			return ast[1];
		case "array":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i] = this.__toVar(ast[1][i]);
			}
			return ast[1];
		case "call":
			var functionCall = this.__callPath(ast[1]);
			if (functionCall !== null && this.functionCalls.hasOwnProperty(functionCall)) {
				return this.__handleFunctionCall(functionCall, ast, false);
			}
			return null;
		case "object":
		// @TODO
		default:
			console.log(ast);
			throw { code: 999, message: "__toVar(): type '" + ast[0] + "' not done yet" };
	}
};
Transformer.prototype.__toAST = function (v) {
	switch (typeof v) {
		case "string":
			return [ "string", v ];
		case "number":
			return [ "num", v ];
		case "boolean":
			return [ "name", v.toString() ];
		case "undefined":
			return [ "name", "undefined" ];
		case "object":
			if (v instanceof Array) {
				for (k in v) {
					v[k] = this.__toAST(v[k]);
				}

				return [ "array", v ];
			}
			for (k in v) {
				if (v.hasOwnProperty(k)) {
					v[k] = this.__toAST(v[k]);
				}
			}

			return [ "object", v ];
		default:
			throw { code: 999, message: "__toAST(): typeof v '" + (typeof v) + "' not done yet" };
	}
};
Transformer.prototype.__callPath = function (ast) {
	switch (ast[0]) {
		case "name":
			return ast[1];
		case "sub":
			return this.__callPath(ast[1]) + "[" + this.__callPath(ast[2]) + "]";
		case "dot":
			return this.__callPath(ast[1]) + "." + ast[2];
	}
	return null;
};
