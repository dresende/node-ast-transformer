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
Transformer.prototype.__crawlAST = function (ast) {
	if (ast == undefined) return;

	switch (ast[0]) {
		case "toplevel":
		case "block":
		case "var":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i] = this.__crawlAST(ast[1][i]);
			}
			break;
		case "function":
		case "defun":
			for (var i = 0; i < ast[3].length; i++) {
				ast[3][i] = this.__crawlAST(ast[3][i]);
			}
			break;
		case "if":
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
			switch (ast[1][0]) {
				case "call":
					ast[1] = this.__crawlAST(ast[1]);
					break;
				case "name":
					if (this.functionCalls.hasOwnProperty(ast[1][1])) {
						var args = [];

						for (var i = 0; i < ast[2].length; i++) {
							// @TODO: check parameter type
							args.push(convertASTToVar(ast[2][i]));
						}

						ast = convertVarToAST(this.functionCalls[ast[1][1]].apply(null, args));
						break;
					}
				case "dot":
					for (var i = 0; i < ast[2].length; i++) {
						ast[2][i] = this.__crawlAST(ast[2][i]);
					}
					break;
				default:
					console.log("---------- unknown call --------------");
					console.log(ast);
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
			// ignore
			break;
		case "name":
			if (this.identifiers.hasOwnProperty(ast[1])) {
				ast = convertVarToAST(this.identifiers[ast[1]]);
			}
			break;
		default:
			console.log("---------- unknown --------------");
			console.log(ast);
	}
	return ast;
};

function convertVarToAST(v) {
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
					v[k] = convertVarToAST(v[k]);
				}

				return [ "array", v ];
			}
			for (k in v) {
				if (v.hasOwnProperty(k)) {
					v[k] = convertVarToAST(v[k]);
				}
			}

			return [ "object", v ];
		default:
			throw { code: 999, message: "convertVarToAST(): typeof v '" + (typeof v) + "' not done yet" };
	}
};

function convertASTToVar(ast) {
	switch (ast[0]) {
		case "num":
		case "string":
			return ast[1];
		case "array":
			for (var i = 0; i < ast[1].length; i++) {
				ast[1][i] = convertASTToVar(ast[1][i]);
			}
			return ast[1];
		case "object":
			// @TODO
		default:
			throw { code: 999, message: "convertASTToVar(): type '" + ast[0] + "' not done yet" };
	}
};