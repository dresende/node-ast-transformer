## UglifyJS AST Transformer

The goal of this NodeJS module is to be able to make transformations on AST (Abstract Syntax Tree)
other than mangling. The next example shows what you can do and the main purpose of this module.
Imagin you have a file with this code:

    // file.js
    console.log(_("Hello, world!"));

And you want to convert `_("...")` to `"..."` similar to what `gettext()` does.

    var js_parser = require("uglify-js").parser,
        js_compressor = require("uglify-js").uglify,
        Transformer = require("ast-transformer").Transformer;
    
    fs.readFileSync("file.js", function (err, data) {
        if (err) return console.log(err);

        var transformer = new Transformer(js_parser.parse(String(data)));
        transformer.replaceFunctionCall("_", function (text) {
            // text = "Hello, world!"
            return "Hola, mundo!";
        });

        // will output:
        // console.log("Hola, mundo!");
        console.log(js_compressor.gen_code(transformer.get()));
    });
