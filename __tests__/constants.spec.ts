import {readFileSync} from 'fs';
import {FACTSET_WELL_KNOWN_URI} from '../src';
import {PACKAGE_VERSION} from '../src/constants';

describe('Check constants', () => {
  test('check well known uri', () => {
    expect(FACTSET_WELL_KNOWN_URI).toBe('https://auth.factset.com/.well-known/openid-configuration');
  });

  test('PACKAGE_VERSION should match the version in package.json', () => {
    const {version} = JSON.parse(readFileSync('./package.json', 'utf8'));

    expect(PACKAGE_VERSION).toBe(version);
  });
});
