"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatArgv = void 0;
function parseValue(val) {
    var num = +val;
    if (num) {
        return num;
    }
    if (val === 'true') {
        return true;
    }
    if (val === 'false') {
        return false;
    }
    return val;
}
function formatArgv(argv, defaultParams) {
    if (argv === void 0) { argv = process.argv; }
    var args = {
        _: argv.slice(0, 2),
        additional: [],
        params: defaultParams || {}
    };
    var prev = [];
    function addValueToPrev(val) {
        var k = prev.length;
        while (k--) {
            var name_1 = prev[k];
            args.params[name_1] = parseValue(val);
        }
        prev = [];
    }
    function parse(val) {
        if (val[0] !== '-') {
            if (prev.length) {
                addValueToPrev(val);
            }
            else {
                args.additional.push(val);
            }
            return;
        }
        if (prev.length) {
            addValueToPrev('true');
        }
        var _a = val.split('='), names = _a[0], vals = _a[1];
        if (names[names.length - 1] === '-') {
            return;
        }
        prev = names.indexOf('--') === 0 ? [names.substring(2)] : names.substring(1).split('');
        if (vals !== undefined) {
            parse(vals);
        }
    }
    for (var i = 2, l = argv.length; i < l; i++) {
        parse(argv[i]);
    }
    if (prev.length) {
        addValueToPrev('true');
    }
    return args;
}
exports.formatArgv = formatArgv;
