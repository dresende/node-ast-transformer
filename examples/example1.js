var fs = require("fs"),
    transformer = require("./../lib/ast-transformer");

fs.readFile("./test.js", function (err, data) {
	if (err) return console.log(err);

	var tf = new transformer.Transformer(transformer.parse(data));

	tf.replaceIdentifier("MY_CONST", 1)
	  .replaceFunctionCall("_", function (text, locale) {
		switch (text) {
			case "Hello, world!":
				switch (locale) {
					case "es_ES":
						return "Hola, mundo!";
					case "pt_PT":
						return "Olá, mundo!";
				}
		}
		return "??";
	});

	console.log(tf.generate());
});