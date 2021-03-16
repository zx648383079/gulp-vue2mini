export interface IArgv<T extends Record<string, any>> {
    /**
     * 这是执行路径，第一个为node 第二个为脚本名
     */
    _: Array<string>;
    /**
     * 这其他的名
     */
    additional: Array<string|number>;
    /**
     * 这是一些参数
     */
    params: T;
}

function parseValue(val: string): string|number|boolean {
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

/**
 * 格式化argv
 * @param argv process.argv
 * @param defaultParams 默认的参数
 */
export function formatArgv<T extends Record<string, any>>(argv: Array<string> = process.argv, defaultParams?: T): IArgv<T> {
    const args: IArgv<T> = {
        _: argv.slice(0, 2),
        additional: [],
        params: defaultParams || {} as T
    };

    let prev: string[] = [];

    function addValueToPrev(val: string) {
        let k = prev.length;
        while (k--) {
            const name = prev[k];
            (args.params as any)[name] = parseValue(val);
        }
        prev = [];
    }

    function parse(val: string) {
        if (val[0] !== '-') {
            if (prev.length) {
                addValueToPrev(val);
            } else {
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
        prev = names.indexOf('--') === 0 ? [names.substr(2)] : names.substr(1).split('');
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
