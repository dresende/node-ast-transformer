var o = { a: oa, b: ob, o: { a: ooa, b: oob } }

console.log(a());
console.log(b());
console.log(o.a());
console.log(o.b());
console.log(o.o.a());
console.log(o.o.b());

function a() { return "a" }
function b() { return "b" }

function oa() { return "o.a" }
function ob() { return "o.b" }

function ooa() { return "o.o.a" }
function oob() { return "o.o.b" }