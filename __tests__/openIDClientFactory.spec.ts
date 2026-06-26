import {OpenIDClientFactory} from '../src/openIDClientFactory';
import {Client, custom, Issuer} from 'openid-client';
import {HttpsProxyAgent} from 'https-proxy-agent';

vi.mock('openid-client');

const config = {
  name: 'name',
  clientAuthType: 'clientAuthType',
  clientId: 'clientId',
  owners: ['owner_id'],
  wellKnownUri: 'testWellKnownUri',
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

describe('Test OpenIDClientFactory class', () => {
  describe('Test getClient function', () => {
    test('should not throw an error', async () => {
      vi.mocked(Issuer.discover).mockResolvedValue({
        metadata: {
          issuer: 'test',
          token_endpoint: 'token_endpint',
        },
        Client: vi.fn().mockImplementation(function () {
          return {grant: vi.fn().mockResolvedValue('testgrant')};
        }),
      } as unknown as Issuer<Client>);

      const client = await OpenIDClientFactory.getClient(config);
      const grant = await client.grant({grant_type: 'client_credentials'});
      expect(grant).toBe('testgrant');

      expect(Issuer.discover).toHaveBeenCalledWith('testWellKnownUri');
    });

    test('should not throw an error and set proxy properly', async () => {
      const proxyUrl = 'http://proxy.example.com:8080';
      const userAgent = `fds-sdk/javascript/utils/2.1.4 (${process.platform}; node ${process.version})`;

      vi.mocked(Issuer.discover).mockResolvedValue({
        metadata: {
          issuer: 'test',
          token_endpoint: 'token_endpoint',
        },
        Client: vi.fn().mockImplementation(function () {
          return {grant: vi.fn().mockResolvedValue('testgrant')};
        }),
      } as unknown as Issuer<Client>);

      const agent = new HttpsProxyAgent(proxyUrl);
      await OpenIDClientFactory.getClient(config, agent);
      expect(custom.setHttpOptionsDefaults).toHaveBeenCalledWith({
        agent: agent,
        headers: {'user-agent': userAgent},
      });
    });

    test('should throw an error while retrieving contents from well known uri', async () => {
      vi.mocked(Issuer.discover).mockRejectedValue('test_error');

      await expect(OpenIDClientFactory.getClient(config)).rejects.toThrow(
        'Error retrieving contents from the well_known_uri: testWellKnownUri'
      );

      expect(Issuer.discover).toHaveBeenCalledWith('testWellKnownUri');
    });
  });
});
