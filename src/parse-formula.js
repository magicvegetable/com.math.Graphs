const SYMBOLS_TO_REPLACE = {
    'atan': 'Math.atan',
    'tan': 'Math.tan',
    'acosh': 'Math.acosh',
    'asinh': 'Math.asinh',
    'acos': 'Math.acos',
    'asin': 'Math.asin',
    'sinh': 'Math.sinh',
    'cosh': 'Math.cosh',
    'sin': 'Math.sin',
    'cos': 'Math.cos',
    '^': '**',
    'ln': 'Math.log',
    'log2': 'Math.log2',
    'log': 'Math.log10',
    'sqrt': 'Math.sqrt',
    'cbrt': 'Math.cbrt',
    'e': 'Math.E',
    'pi': 'Math.PI'
};

const parse_module = str => {
    let i = 0;
    const parsed = str.split('').map((c) => {
        if (c === '|') {
            if (i % 2) {
                i = 0;
                return ')'
            } else {
                i = 1;
                return 'Math.abs(';
            }
        }
        return c;
    }).join('');
    return parsed;
    
};

export const parse = (str) => {
    const finded = {};

    // find
    for (const symbol of Object.keys(SYMBOLS_TO_REPLACE)) {
        let id = str.indexOf(symbol);
        if (id !== -1) {
            finded[symbol] = new Set([]);
            while (id !== -1) {
                finded[symbol].add(id);
                id = str.indexOf(symbol, id + 1);
            }
        }
    }
    
    // filter
    for (const [s, ids] of Object.entries(finded)) {
        for (const [ns, nids] of Object.entries(finded)) {
            if (ns.includes(s) && ns.length > s.length) {
                const dif = ns.indexOf(s);
                for (const id of ids) {
                    for (const nid of nids) {
                        if (nid === id - dif) finded[s].delete(id);
                    }
                }
            }
        }
    }

    // replace
    let parsed_str = '';
    for (let i = 0; i < str.length; i++) {
        let replaced = false;
        for (const [s, ids] of Object.entries(finded)) {
            for (const id of ids) {
                if (i === id) {
                    parsed_str += SYMBOLS_TO_REPLACE[s];
                    i += s.length - 1;
                    finded[s].delete(i);
                    replaced = true;
                    break;
                }
            }
            if (replaced) break;
        }
        if (!replaced) parsed_str += str[i];
    }

    parsed_str = parse_module(parsed_str);

    return parsed_str;
};

