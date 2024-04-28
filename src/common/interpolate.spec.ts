import { lerp } from './interpolate';

describe('lerp()', () => {

    test.each`
v0     |  v1    |  t     |  expected
${0}   | ${1}   | ${0}   | ${0}
${0}   | ${1}   | ${.5}  | ${.5}
${0}   | ${1}   | ${1}   | ${1}
${-1}  | ${0}   | ${0}   | ${-1}
${-1}  | ${0}   | ${.5}  | ${-.5}
${-1}  | ${0}   | ${1}   | ${0}
${-25} | ${821} | ${.23} | ${169.58}
`('lerping from $v0 to $v1 at t=$t should return $expected',
        ({v0, v1, t, expected}) => {
            let result = lerp(v0, v1, t);
            expect(result).toEqual(expected);
        });

});