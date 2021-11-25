import { Configuration } from '../src/configuration';

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
    expect(() => {
      Configuration.validateConfig({});
    }).toThrow(
      'Configuration is not valid: "name" is required. "clientId" is required. "clientAuthType" is required. "owners" is required. "jwk" is required',
    );
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
    }).toThrow('Configuration is not valid: "clientId" is required');
  });

  test('should throw an file error', () => {
    expect(() => {
      Configuration.loadConfig('./__tests__/fixtures/validConfig.json.not.there');
    }).toThrow(
      "Could not load config: ./__tests__/fixtures/validConfig.json.not.there (Error: ENOENT: no such file or directory, open './__tests__/fixtures/validConfig.json.not.there')",
    );
  });

  test('should throw an invalid type error', () => {
    expect(() => {
      Configuration.loadConfig(12345 as unknown as string);
    }).toThrow(
      'Invalid parameter type, needs to be a path (string) or configuration (ConfidentialClientConfiguration)',
    );
  });
});
