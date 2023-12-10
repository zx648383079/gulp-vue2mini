"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatArgv = void 0;
function parseValue(val) {
    const num = +val;
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
function formatArgv(argv = process.argv, defaultParams) {
    const args = {
        _: argv.slice(0, 2),
        additional: [],
        params: defaultParams || {}
    };
    let prev = [];
    function addValueToPrev(val) {
        let k = prev.length;
        while (k--) {
            const name = prev[k];
            args.params[name] = parseValue(val);
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
        const [names, vals] = val.split('=');
        if (names[names.length - 1] === '-') {
            return;
        }
        prev = names.indexOf('--') === 0 ? [names.substring(2)] : names.substring(1).split('');
        if (vals !== undefined) {
            parse(vals);
        }
    }
    for (let i = 2, l = argv.length; i < l; i++) {
        parse(argv[i]);
    }
    if (prev.length) {
        addValueToPrev('true');
    }
    return args;
}
exports.formatArgv = formatArgv;
