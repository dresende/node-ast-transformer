var fs = require("fs"),
    vm = require("vm"),
    transformer = require("./../lib/ast-transformer");

fs.readFile("./code/function-replace.js", function (err, data) {
	if (err) return console.log(err);

	var tf = new transformer.Transformer(transformer.parse(data));

	tf.replaceFunctionCall("a", function () { return "a transformed"; })
	  .replaceFunctionCall("o.o.b", "o.o.b transformed");

	vm.runInNewContext(tf.generate(), { console: console });
});