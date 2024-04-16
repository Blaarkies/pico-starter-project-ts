import { Stream } from 'kefir';
import { subject } from './stream';

describe('subject()', () => {

    test('returns a new subject', () => {
        let subject$ = subject();

        expect(subject$).toBeInstanceOf(Stream);
    });


    test('calls to next() triggers subscribers', (done) => {
        let subject$ = subject();

        subject$.onValue(() => done());

        subject$.next();
    }, 1);


    test('argument calls to next(value) emits the value', (done) => {
        let testValue = 'test';
        let subject$ = subject<string>();

        subject$.onValue(value => {
            expect(value).toBe(testValue);
            done();
        });

        subject$.next(testValue);
    }, 1);

});