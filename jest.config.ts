import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { default as tsconfig } from './tsconfig.json';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.ts'],
    moduleNameMapper: pathsToModuleNameMapper(
        tsconfig.compilerOptions.paths,
        {prefix: '<rootDir>'}),
};

export default config;