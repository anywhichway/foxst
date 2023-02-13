const $cf838c15c8b009ba$export$632f83ecc6592643 = (options = false)=>{
    const { functions: functions = options , regexs: regexs = options , infinity: infinity = options , nan: nan = options , builtins: builtins = options  } = typeof options === "boolean" ? {} : options;
    return function serialize(key, value) {
        const type = typeof value;
        if (functions && type === "function" || regexs && value && type === "object" && value instanceof RegExp) return value + "";
        if (infinity && (value === Infinity || value === -Infinity) || nan && type === "number" && isNaN(value)) return "@" + value + "@";
        if (value && type === "object") {
            if (value instanceof Set) return builtins ? JSON.stringify([
                "@Set@",
                ...value.values()
            ], serialize) : undefined;
            if (value instanceof Map) return builtins ? JSON.stringify([
                "@Map@",
                ...value.entries()
            ], serialize) : undefined;
            if ([
                Int8Array,
                Int16Array,
                Int32Array,
                Uint8Array,
                Uint16Array,
                Uint32Array
            ].some((ctor)=>value instanceof ctor)) return builtins ? JSON.stringify([
                "@" + value.constructor.name + "@",
                ...value
            ], serialize) : undefined;
            if (value.constructor.name !== "Array" && (value instanceof Array || Array.isArray(value))) return JSON.stringify([
                "@" + value.constructor.name + "@",
                ...value
            ], serialize);
            if (!Array.isArray(value) && value.constructor.name && value.constructor.name !== "Object") {
                const object = Object.entries(value).reduce((object, [key, value])=>{
                    const type = typeof value;
                    if (value && type === "object") object[key] = JSON.stringify(value, serialize);
                    else if (type === "function" && functions || type === "number" && (infinity && (value == Infinity || value === -Infinity) || nan && isNaN(value))) object[key] = value + "";
                    else object[key] = value;
                    return object;
                }, {});
                return [
                    "@" + value.constructor.name + "@",
                    object
                ];
            }
        }
        return value;
    };
};
const $cf838c15c8b009ba$export$63698c10df99509c = (options = false, ctors = {})=>{
    const { functions: functions = options , regexs: regexs = options , infinity: infinity = options , nan: nan = options , builtins: builtins = options , autocreate: autocreate = options  } = typeof options === "boolean" ? {} : options;
    return function revive(key, value) {
        if (typeof value === "string") {
            if (infinity) {
                if (value === "@Infinity@") return Infinity;
                if (value === "@-Infinity@") return -Infinity;
            }
            if (nan && value === "@NaN@") return NaN;
            if (regexs && value.match(/\/.*\/[gimusy]*/)) {
                const [_, pattern, flags, ...rest] = value.split("/");
                if (rest.length === 0) try {
                    return new RegExp(pattern, flags);
                } catch (e) {}
                return value;
            }
            if (value[0] === "[" && value[value.length - 1] === "]") try {
                return JSON.parse(value, revive);
            } catch (e) {
                return value;
            }
            if (functions && (value.match(/function\s?[A-Z0-9_$]*\(.*\)\s?\{.*\}/gi) || value.match(/\(.*\)\s?=>\{?.*\}?/g))) try {
                const result = new Function("return " + value)(), type = typeof result;
                if (type === "function") return result;
            } catch (e) {}
            return value;
        }
        if (Array.isArray(value)) {
            const [first, ...rest] = value;
            if (typeof first === "string" && first.match(/@[A-Z$][A-Za-z0-9$_]*@/g)) {
                const cname = first.substring(1, first.length - 1);
                if (builtins) {
                    if (cname === "Set") return new Set(rest);
                    if (cname === "Map") return new Map(rest);
                }
                const arrays = {
                    Int8Array: Int8Array,
                    Int16Array: Int16Array,
                    Int32Array: Int32Array,
                    Uint8Array: Uint8Array,
                    Uint16Array: Uint16Array,
                    Uint32Array: Uint32Array
                }, constructors = Object.assign({
                    ...ctors
                }, builtins ? arrays : undefined);
                let ctor = constructors[cname] || globalThis[cname];
                if (!ctor && autocreate && rest.length === 1 && rest[0] && typeof rest[0] === "object") ctor = globalThis[cname] = Function(`return function ${cname}(config) { return this instanceof ${cname} ? Object.assign(this,config) : new ${cname}(config); }`)();
                if (ctor) {
                    let object = Object.create(ctor.prototype);
                    Object.defineProperty(object, "constructor", {
                        value: ctor,
                        enumerable: false
                    });
                    if (arrays[ctor.name] || [
                        Int8Array,
                        Int16Array,
                        Int32Array,
                        Uint8Array,
                        Uint16Array,
                        Uint16Array
                    ].some((ctor)=>object instanceof ctor)) return Object.assign(object, rest);
                    if (object instanceof Array || Array.isArray(object)) {
                        try {
                            object = new ctor();
                        } catch (e) {}
                        return Object.assign(object, rest);
                    }
                    if (rest[0] && typeof rest[0] === "object") Object.entries(rest[0]).forEach(([key, value])=>{
                        if (key === "constructor") return;
                        try {
                            try {
                                value = typeof value === "string" ? JSON.parse(value, revive) : value;
                            } catch (e) {}
                            object[key] = value;
                        } catch (e) {}
                    });
                    return object;
                }
                if (rest.length === 1 && rest[0] && typeof rest[0] === "object") return Object.assign({}, rest[0]);
            }
        }
        return value;
    };
};
const $cf838c15c8b009ba$var$getKeyMatcher = (key)=>{
    try {
        const result = new Function("return " + key)(), type = typeof result;
        if (type === "function") return result;
        if (result && type === "object" && result instanceof RegExp) return (key)=>result.test(key);
    } catch (e) {}
};
const $cf838c15c8b009ba$var$getValueMatcher = (value)=>{
    const type = typeof value;
    if (type === "function") return value;
    if (value && type === "object" && value instanceof RegExp) return (v)=>typeof v === "string" ? (v.match(value) || [])[0] : undefined;
    // objects should always match since the outer algorithm recurses down
    return (v)=>v === value || v && typeof v === "object" && value && typeof value === "object" ? v : undefined;
};
function $cf838c15c8b009ba$export$a58d971a6366cd5(pattern, target) {
    if (pattern === target) return target;
    const type = typeof pattern;
    if (type === "function") try {
        return pattern(target);
    } catch (e) {
        return;
    }
    if (pattern && type === "object") {
        if (pattern instanceof RegExp) return typeof target === "string" ? (target.match(pattern) || [])[0] : undefined;
        if (!target || typeof target !== "object") return;
        return Object.entries(pattern).reduce((result, [key, value])=>{
            const keymatcher = $cf838c15c8b009ba$var$getKeyMatcher(key), valuematcher = $cf838c15c8b009ba$var$getValueMatcher(value);
            if (value && typeof value === "object") {
                if (typeof keymatcher === "function") Object.entries(target).forEach(([key, value])=>{
                    if (keymatcher.call(target, key)) {
                        value = valuematcher(value);
                        if (value !== undefined) {
                            result ||= {};
                            result[key] = value;
                        }
                    }
                });
                else {
                    value = $cf838c15c8b009ba$export$a58d971a6366cd5(value, valuematcher(target[key]));
                    if (value !== undefined) {
                        result ||= {};
                        result[key] = value;
                    }
                }
            } else if (typeof keymatcher === "function") Object.entries(target).forEach(([key, value])=>{
                if (keymatcher.call(target, key)) {
                    value = valuematcher(value);
                    if (value !== undefined) {
                        result ||= {};
                        result[key] = value;
                    }
                }
            });
            else {
                value = valuematcher(target[key]);
                if (value !== undefined) {
                    result ||= {};
                    result[key] = value;
                }
            }
            return result;
        }, null);
    }
}
const $cf838c15c8b009ba$export$2e2bcd8739ae039 = {
    serializer: $cf838c15c8b009ba$export$632f83ecc6592643,
    reviver: $cf838c15c8b009ba$export$63698c10df99509c,
    xt: $cf838c15c8b009ba$export$a58d971a6366cd5
};


export {$cf838c15c8b009ba$export$632f83ecc6592643 as serializer, $cf838c15c8b009ba$export$63698c10df99509c as reviver, $cf838c15c8b009ba$export$a58d971a6366cd5 as xt, $cf838c15c8b009ba$export$2e2bcd8739ae039 as default};
//# sourceMappingURL=index.js.map
