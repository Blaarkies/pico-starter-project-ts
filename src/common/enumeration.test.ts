import {
    makeNumberList,
    pickRandomElement,
    sum,
} from './enumeration';

describe('makeNumberList()', () => {

    test.each`
      count | offset       | expected
      ${0}  | ${undefined} | ${[]}
      ${1}  | ${undefined} | ${[0]}
      ${2}  | ${undefined} | ${[0, 1]}
      
      ${0}  | ${0}         | ${[]}
      ${1}  | ${0}         | ${[0]}
      ${2}  | ${0}         | ${[0, 1]}
      
      ${0}  | ${1}         | ${[]}
      ${1}  | ${1}         | ${[1]}
      ${2}  | ${1}         | ${[1, 2]}
      `('Count=$count, offset=$offset returns $expected',
        ({count, offset, expected}) => {
            let result = makeNumberList(count, offset);
            expect(result).toEqual(expected);
        });

});

describe('pickRandomElement()', () => {

    let list = [1, 2, 3];
    let spyMathRandom: jest.SpyInstance;

    afterEach(() => {
        spyMathRandom.mockRestore();
    });

    test.each`
    given  | expected
    ${0}   | ${1} 
    ${.5}  | ${2} 
    ${1}   | ${3} 
    `('given a list, when Math.random()=$given, it returns element #$expected',
        ({given, expected}) => {
        spyMathRandom = jest.spyOn(global.Math, 'random')
            .mockReturnValue(given);

        let result = pickRandomElement(list);

        expect(result).toBe(expected);
    });

});

describe('sum()', () => {

    test.each`
      list          | expected
      ${[]}         | ${0}
      ${[0]}        | ${0}
      ${[0, 0]}     | ${0}
      ${[1, 1]}     | ${2}
      ${[1, 2, 3]}  | ${6}
      `('given list $list, it returns the sum=$expected',
        ({list, expected}) => {
            let result = sum(list);
            expect(result).toBe(expected);
        });

});