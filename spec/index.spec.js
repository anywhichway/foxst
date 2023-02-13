import {serializer,reviver,xt} from "../src/index.js";
import chai from "chai";

const expect = chai.expect;

describe("tests",() => {
    it("primitive",() => {
        const result = xt("joe","joe");
        expect(result).to.equal("joe");
    });
    it("function",() => {
        const result = xt((value) => value,"joe");
        expect(result).to.equal("joe");
    });
    it("function throws",() => {
        const result = xt((value) => { throw new Error(); },"joe");
        expect(result).to.equal(undefined);
    });
    it("object does not match literal",() => {
        const result = xt({address:{city:"ny"}},{address:"ny,ny"});
        expect(result).to.equal(null);
    });
    it("literal does not match object",() => {
        const result = xt({address:"ny,ny"},{address:{city:"ny"}});
        expect(result).to.equal(null);
    });
    it("literal flat",() => {
        const result = xt({name:"joe"},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.name).to.equal("joe");
    });
    it("arrow function value",() => {
        const result = xt({age:(age) => age},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.age).to.equal(10);
    });
    it("regular expression key, single property, any value",() => {
        const result = xt({[/ag./]:(age) => age},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.age).to.equal(10);
    });
    it("arrow function key, single property, any value",() => {
        const result = xt({[(key)=>key!=="age"]:(value) => value},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.name).to.equal("joe");
    });
    it("regular expression key, nested, any value",() => {
        const result = xt({[/address/]:{[/city/]:(city) => city}},{address:{city:"ny"}});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.address.city).to.equal("ny");
    });
    it("flatten",() => {
        const result = xt({address:(address) => address.city + ", " + address.state},{address:{city:"ny",state:"ny"}});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.address).to.equal("ny, ny");
    });
    it("regular expression value",() => {
        const result = xt({name:/jo./},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.name).to.equal("joe");
    });
    it("regular expression value not string",() => {
        const result = xt({name:(value) => value,age:/jo./},{name:"joe",age:10});
        expect(Object.keys(result).length).to.equal(1);
        expect(result.name).to.equal("joe");
    });
    it("regular expression primitive not string",() => {
        const result = xt(/jo./,10);
        expect(result).to.equal(undefined);
    })
    it("regular expression primitive string",() => {
        const result = xt(/jo./,"joe");
        expect(result).to.equal("joe");
    });
    it("regular expression primitive string not match",() => {
        const result = xt(/jo./,"bill");
        expect(result).to.equal(undefined);
    });
    it("serialize and deserialize",() => {
        class CustomClass {
            constructor(properties) {
                Object.assign(this,properties);
            }
        }
        function ThrowingConstructor() {
            throw new Error("")
        }
        const throwingInstance = Object.create(ThrowingConstructor.prototype);
        Object.assign(throwingInstance,{name:"joe",age:20});
        Object.defineProperty(ThrowingConstructor.prototype,"age",{value:10});
        throwingInstance.constructor = ThrowingConstructor;
        class CustomArray extends Array {
            constructor(...items) {
                super();
                Object.assign(this,items)
            }
        }
        class CustomArrayThrows extends Array {
            constructor(...items) {
                super();
                throw new Error("")
            }
        }
        const thrownArray = Object.create(CustomArrayThrows.prototype);
        thrownArray.constructor = CustomArrayThrows;
        class Person {
            constructor(config) {
                Object.assign(this,config);
            }
        }
        class Address {
            constructor(config) {
                Object.assign(this,config);
            }
        }
        const data = {
            nan: NaN,
            infinity: Infinity,
            "-infinity": -Infinity,
            Int8Array: new Int8Array([1]),
            Int16Array: new Int16Array([1]),
            Int32Array: new Int32Array([1]),
            Uint8Array: new Uint8Array([1]),
            Uint16Array: new Uint16Array([1]),
            Uint32Array: new Uint32Array([1]),
            notSpecialRevivable: ["@name",1],
            set: new Set([1]),
            map: new Map([[1,1]]),
            array: [1],
            malformedArray: "[[1]",
            regexp: /a/g,
            notregexp: "/a[/",
            function: function() { return 1; },
            arrowFunction: () => 1,
            malformedFunction: "function() {{ return 1;}",
            instance: new CustomClass({name:"joe"}),
            throwingInstance,
            customArray: new CustomArray(1),
            thrownArray,
            arrayWithObject: [ {name:"joe"}],
            nestedObject: new Person({address: new Address({city: "ny"})})
        };
        const stringfied = JSON.stringify(data,serializer(true)),
            result = JSON.parse(stringfied,reviver(true,{CustomClass,ThrowingConstructor,CustomArray,CustomArrayThrows,Address}));
        expect(result.nan).to.be.NaN;
        expect(result.infinity).to.equal(Infinity);
        expect(result["-infinity"]).to.equal(-Infinity);
        expect(result.Int8Array).to.be.instanceof(Int8Array);
        expect(result.Int16Array).to.be.instanceof(Int16Array);
        expect(result.Int32Array).to.be.instanceof(Int32Array);
        expect(result.Uint8Array).to.be.instanceof(Uint8Array);
        expect(result.Uint16Array).to.be.instanceof(Uint16Array);
        expect(result.Uint32Array).to.be.instanceof(Uint32Array);
        expect(result.notSpecialRevivable).to.be.instanceof(Array);
        expect(result.notSpecialRevivable[0]).to.equal("@name");
        expect(result.notSpecialRevivable[1]).to.equal(1);
        expect(result.set).to.be.instanceof(Set);
        expect(result.set.size).to.equal(1);
        expect(result.set.has(1)).to.equal(true);
        expect(result.map).to.be.instanceof(Map);
        expect(result.map.size).to.equal(1);
        expect(result.map.get(1)).to.equal(1);
        expect(result.array).to.be.instanceof(Array);
        expect(result.array.length).to.equal(1);
        expect(result.array[0]).to.equal(1);
        expect(result.malformedArray).to.equal("[[1]");
        expect(result.regexp).to.be.instanceof(RegExp);
        expect(result.regexp.flags[0]).to.equal("g");
        expect(result.regexp.toString()).to.equal("/a/g");
        expect(result.notregexp).to.equal("/a[/");
        expect(result.function+"").to.equal("function() { return 1; }")
        expect(typeof(result.function)).to.equal("function");
        expect(result.function()).to.equal(1);
        expect(result.arrowFunction).to.be.instanceof(Function);
        expect(result.arrowFunction()).to.equal(1);
        expect(result.malformedFunction).to.equal("function() {{ return 1;}");
        expect(result.instance).to.be.instanceof(CustomClass);
        expect(result.instance.name).to.equal("joe");
        expect(result.throwingInstance).to.be.instanceof(ThrowingConstructor);
        expect(result.throwingInstance.name).to.equal("joe");
        expect(result.throwingInstance.age).to.equal(10);
        expect(result.customArray).to.be.instanceof(CustomArray);
        expect(result.customArray.length).to.equal(1);
        expect(result.customArray[0]).to.equal(1);
        expect(result.thrownArray).to.be.instanceof(CustomArrayThrows);
        expect(result.thrownArray.length).to.equal(0);
        expect(result.arrayWithObject).to.be.instanceof(Array);
        expect(result.arrayWithObject.length).to.equal(1);
        expect(result.arrayWithObject[0].name).to.equal("joe");
        expect(result.nestedObject).to.be.instanceof(Object); // not Person since we did not pass in constructor
        expect(result.nestedObject.constructor.name).to.equal("Person"); // class autocreate is on
        expect(result.nestedObject.address).to.be.instanceof(Address);
        expect(result.nestedObject.address.city).to.equal("ny");
    });
    it("POJO",() => {

        class Person {
            constructor(config) {
                Object.assign(this,config);
            }
        }
        class Address {
            constructor(config) {
                Object.assign(this,config);
            }
        }
        const data = {
            person: new Person({address: new Address({city: "ny"})}),
            Int8Array: new Int8Array([1]),
            Int16Array: new Int16Array([1]),
            Int32Array: new Int32Array([1]),
            Uint8Array: new Uint8Array([1]),
            Uint16Array: new Uint16Array([1]),
            Uint32Array: new Uint32Array([1]),
            notSpecialRevivable: ["@name",1],
            set: new Set([1]),
            map: new Map([[1,1]])
        };
        globalThis.Person = null;
        const stringfied = JSON.stringify(data,serializer(false)),
            result = JSON.parse(stringfied,reviver(false,{Address}));
        expect(result.person).to.be.instanceof(Object); // not Person since we did not pass in constructor
        expect(result.person.constructor.name).to.equal("Object");
        expect(result.person.address).to.be.instanceof(Address);
        expect(result.person.address.city).to.equal("ny");
        expect(result.Int8Array).to.equal(undefined);
        expect(result.Int16Array).to.equal(undefined);
        expect(result.Int32Array).to.equal(undefined);
        expect(result.Uint8Array).to.equal(undefined);
        expect(result.Uint16Array).to.equal(undefined);
        expect(result.Uint32Array).to.equal(undefined);
        expect(result.set).to.equal(undefined);
        expect(result.map).to.equal(undefined);
    })
})