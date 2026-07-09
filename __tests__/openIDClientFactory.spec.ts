import {OpenIDClientFactory} from '../src/openIDClientFactory';
import * as client from 'openid-client';
import * as jose from 'jose';
import {fetch as undiciFetch, Headers as UndiciHeaders, ProxyAgent} from 'undici';
import {PACKAGE_VERSION} from '../src/constants';

vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>();
  return {
    ...actual,
    discovery: vi.fn(),
    PrivateKeyJwt: vi.fn(() => 'mock-client-auth'),
    clientCredentialsGrant: vi.fn(),
  };
});
vi.mock('jose');
vi.mock('undici');

const config = {
  name: 'name',
  clientAuthType: 'clientAuthType',
  clientId: 'clientId',
  owners: ['owner_id'],
  wellKnownUri: 'https://auth.example.com/.well-known/openid-configuration',
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

const fakeConfiguration = {
  serverMetadata: () => ({issuer: 'test', token_endpoint: 'token_endpoint'}),
} as unknown as client.Configuration;

describe('Test OpenIDClientFactory class', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jose.importJWK).mockResolvedValue({} as jose.CryptoKey);
  });

  describe('Test getClient function', () => {
    test('should discover and return a configuration', async () => {
      vi.mocked(client.discovery).mockResolvedValue(fakeConfiguration);

      const configuration = await OpenIDClientFactory.getClient(config);

      expect(configuration).toBe(fakeConfiguration);
      expect(jose.importJWK).toHaveBeenCalledWith(config.jwk, config.jwk.alg);

      const [server, clientId, metadata, clientAuth] = vi.mocked(client.discovery).mock.calls[0];
      expect((server as URL).href).toBe(config.wellKnownUri);
      expect(clientId).toBe('clientId');
      expect(metadata).toEqual({token_endpoint_auth_method: 'private_key_jwt'});
      expect(client.PrivateKeyJwt).toHaveBeenCalled();
      expect(clientAuth).toBe('mock-client-auth');
    });

    test('should set the JWT assertion timing claims via modifyAssertion', async () => {
      vi.mocked(client.discovery).mockResolvedValue(fakeConfiguration);

      await OpenIDClientFactory.getClient(config);

      const options = vi.mocked(client.PrivateKeyJwt).mock.calls[0][1];
      const payload: Record<string, number> = {};
      options?.[client.modifyAssertion]?.({}, payload);

      // JWT_NOT_BEFORE_SECS = 5, JWT_EXPIRE_AFTER_SECS = 300
      expect(payload.iat).toBeTypeOf('number');
      expect(payload.nbf).toBe(payload.iat - 5);
      expect(payload.exp).toBe(payload.iat + 300);
    });

    test('should configure a proxy via customFetch', async () => {
      const proxyUrl = 'http://proxy.example.com:8080';
      const userAgent = `fds-sdk/javascript/utils/${PACKAGE_VERSION} (${process.platform}; node ${process.version})`;
      vi.mocked(client.discovery).mockResolvedValue(fakeConfiguration);

      await OpenIDClientFactory.getClient(config, proxyUrl);

      expect(ProxyAgent).toHaveBeenCalledWith(proxyUrl);

      const options = vi.mocked(client.discovery).mock.calls[0][4];
      const customFetch = options?.[client.customFetch];
      expect(customFetch).toBeTypeOf('function');

      // Exercise the custom fetch: it should add the user-agent header and route the
      // request through the proxy dispatcher.
      await customFetch!('https://token.example.com', {
        method: 'POST',
      } as Parameters<NonNullable<typeof customFetch>>[1]);
      expect(undiciFetch).toHaveBeenCalled();
      const fetchOptions = vi.mocked(undiciFetch).mock.calls[0][1];
      expect(fetchOptions?.dispatcher).toBeDefined();
      expect(vi.mocked(undiciFetch).mock.calls[0][0]).toBe('https://token.example.com');
      expect(fetchOptions?.headers).toBeDefined();
      expect(UndiciHeaders).toHaveBeenCalled();
      const headers = vi.mocked(UndiciHeaders).mock.instances[0];
      expect(headers.set).toHaveBeenCalledWith('user-agent', userAgent);
    });

    test('should not configure a custom fetch when no proxy is provided', async () => {
      vi.mocked(client.discovery).mockResolvedValue(fakeConfiguration);

      await OpenIDClientFactory.getClient(config);

      const options = vi.mocked(client.discovery).mock.calls[0][4];
      expect(options?.[client.customFetch]).toBeUndefined();
      expect(ProxyAgent).not.toHaveBeenCalled();
    });

    test('should throw an error while retrieving contents from well known uri', async () => {
      vi.mocked(client.discovery).mockRejectedValue('test_error');

      await expect(OpenIDClientFactory.getClient(config)).rejects.toThrow(
        'Error retrieving contents from the well_known_uri: https://auth.example.com/.well-known/openid-configuration'
      );

      expect(client.discovery).toHaveBeenCalled();
    });
  });
});
