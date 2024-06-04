import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import { parse } from '../src/parse-formula.js';

const CONSTANTS = {
    'e': 'Math.E',
    'pi': 'Math.PI'
};

const FUNCTIONS = {
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
    'ln': 'Math.log',
    'log2': 'Math.log2',
    'log': 'Math.log10',
    'sqrt': 'Math.sqrt',
    'cbrt': 'Math.cbrt',
};

const randConst = () => {
    const cns = Object.entries(CONSTANTS)
    const i = Math.round(Math.random() * (cns.length - 1))
    return cns[i]
}

describe('parse', async () => {
    it('no change one arg', () => {
        assert.strictEqual(parse('x'), 'x', 'x just x')
        assert.strictEqual(parse('3 * x + 33'), '3 * x + 33', '3 * x + 33 just 3 * x + 33')
    })

    const checkFn = (fn, rp) => {
        assert.strictEqual(parse(`${fn}(x)`), `${rp}(x)`, `${fn}(x) -> ${rp}(x)`)
    }

    it('function replacement', () => {
        for (const [fn, rp] of Object.entries(FUNCTIONS)) {
            checkFn(fn, rp)
        }
    })

    const checkConst = (cn, rp) => {
        assert.strictEqual(parse(`${cn}`), `${rp}`, `${cn} -> ${rp}`)
    }

    it('constant replacement', () => {
        for (const [cn, rp] of Object.entries(CONSTANTS)) {
            checkConst(cn, rp)
        }
    })

    it('absolute value', () => {
        assert.strictEqual(parse('|x|'), 'Math.abs(x)', '|x| -> Math.abs(x)')
    })

    it('power', () => {
        assert.strictEqual(parse('x ^ x'), 'x ** x', 'x ^ x -> x ** x')
    })


    it('nested', () => {
        for (const [fn0, rp0] of Object.entries(FUNCTIONS)) {
            const [cn, cnrp] = randConst()
            const arg0 = `${fn0}(x) + ${cn}`
            const exp0 = `${rp0}(x) + ${cnrp}`
            for (const [fn1, rp1] of Object.entries(FUNCTIONS)) {
                const arg = `${fn1}(${arg0}) - ${cn}`
                const exp = `${rp1}(${exp0}) - ${cnrp}`
                assert.strictEqual(parse(arg), exp, `${arg} -> ${exp}`)
            }
        }
    })
})

