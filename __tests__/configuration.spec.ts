import {Configuration} from '../src/configuration';

const validTestConfig = {
  name: 'name',
  clientAuthType: 'clientAuthType',
  clientId: 'clientId',
  owners: ['owner_id'],
  wellKnownUri: 'https://auth.factset.com/.well-known/openid-configuration',
  jwk: {
    kty: 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid: 'jwk_kid',
    d: 'd',
    n: 'n',
    e: 'e',
    p: 'p',
    q: 'q',
    dp: 'dp',
    dq: 'dq',
    qi: 'qi',
  },
};

describe('test validateConfig function', () => {
  test('should return a validated config', () => {
    expect(() => {
      const config = Configuration.validateConfig(validTestConfig);
      expect(config).toEqual(validTestConfig);
    }).not.toThrow();
  });

  test('should throw an configuration error', () => {
    let error: Error | undefined;
    try {
      Configuration.validateConfig({});
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Configuration is not valid');
    // All missing required fields are reported...
    for (const field of ['name', 'clientId', 'clientAuthType', 'owners', 'jwk']) {
      expect(error?.message).toContain(field);
    }
    // ...but wellKnownUri has a default, so it is not reported as missing.
    expect(error?.message).not.toContain('wellKnownUri');
  });

  test('should throw a configuration error for a non-object input', () => {
    expect(() => {
      Configuration.validateConfig('not an object' as unknown);
    }).toThrow('Configuration is not valid');
  });

  test('should accept and preserve unknown top-level properties', () => {
    const configWithExtras = {...validTestConfig, scope: 'all', futureOption: {x: true}};
    const config = Configuration.validateConfig(configWithExtras);
    expect(config).toEqual(configWithExtras);
  });
});

describe('test loadConfig function', () => {
  test('should load a config from file', () => {
    expect(() => {
      const config = Configuration.loadConfig('./__tests__/fixtures/validConfig.json');
      expect(config).toEqual(validTestConfig);
    }).not.toThrow();
  });

  test('should load a config from parmeter', () => {
    expect(() => {
      const config = Configuration.loadConfig(validTestConfig);
      expect(config).toEqual(validTestConfig);
    }).not.toThrow();
  });

  test('should throw an config error', () => {
    expect(() => {
      Configuration.loadConfig('./__tests__/fixtures/invalidConfig.json');
    }).toThrow('Configuration is not valid');
    expect(() => {
      Configuration.loadConfig('./__tests__/fixtures/invalidConfig.json');
    }).toThrow('clientId');
  });

  test('should throw an file error', () => {
    expect(() => {
      Configuration.loadConfig('./__tests__/fixtures/validConfig.json.not.there');
    }).toThrow(
      "Could not load config: ./__tests__/fixtures/validConfig.json.not.there (Error: ENOENT: no such file or directory, open './__tests__/fixtures/validConfig.json.not.there')"
    );
  });

  test('should throw an invalid type error', () => {
    expect(() => {
      Configuration.loadConfig(12345 as unknown as string);
    }).toThrow(
      'Invalid parameter type, needs to be a path (string) or configuration (ConfidentialClientConfiguration)'
    );
  });
});
