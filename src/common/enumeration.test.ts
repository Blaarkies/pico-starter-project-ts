import { makeNumberList } from './enumeration';

describe('makeNumberList()', () => {

    test.each`
      count | offset       | expected
      ${0}  | ${undefined} | ${[]}
      ${1}  | ${undefined} | ${[0]}
      ${2}  | ${undefined} | ${[0,1]}
      
      ${0}  | ${0}         | ${[]}
      ${1}  | ${0}         | ${[0]}
      ${2}  | ${0}         | ${[0,1]}
      
      ${0}  | ${1}         | ${[]}
      ${1}  | ${1}         | ${[1]}
      ${2}  | ${1}         | ${[1,2]}
      `('Count=$count, offset=$offset returns $expected',
        ({count, offset, expected}) => {
            let result = makeNumberList(count, offset);
            expect(result).toEqual(expected);
        });

});