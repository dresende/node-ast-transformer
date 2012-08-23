[![build status](https://secure.travis-ci.org/dresende/node-ast-transformer.png)](http://travis-ci.org/dresende/node-ast-transformer)
## UglifyJS AST Transformer

The goal of this NodeJS module is to be able to make transformations on AST (Abstract Syntax Tree)
other than mangling. The next example shows what you can do and the main purpose of this module.
Imagin you have a file with this code:

    // file.js
    console.log(_("Hello, world!"));

And you want to convert `_("...")` to `"..."` similar to what `gettext()` does.

    var transformer = require("ast-transformer");
    
    fs.readFileSync("file.js", function (err, data) {
        if (err) return console.log(err);

        var code = new transformer.Transformer(transformer.parse(data));
        code.replaceFunctionCall("_", function (text) {
            return "Hola, mundo!";
        });

        // will output:
        // console.log("Hola, mundo!");
        console.log(code.generate());
    });
