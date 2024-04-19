import { Client } from 'openid-client';
import { mocked } from 'ts-jest/utils';
import { ConfidentialClient } from '../src';
import { OpenIDClientFactory } from '../src/openIDClientFactory';
import { HttpsProxyAgent } from 'https-proxy-agent';

jest.mock('../src/openIDClientFactory');

describe('test ConfidentialClient class', () => {
  describe('test instanciating', () => {
    test('should create an instance', () => {
      const cf = new ConfidentialClient('./__tests__/fixtures/validConfig.json');
      expect(cf).toBeInstanceOf(ConfidentialClient);
    });

    test('should not create an instance, throw config load error', () => {
      expect(() => {
        new ConfidentialClient('./file.not.there');
      }).toThrow(
        "Could not load config: ./file.not.there (Error: ENOENT: no such file or directory, open './file.not.there')",
      );
    });
  });

  describe('test getAccessToken function', () => {
    test('check access token logic', async () => {
      jest.useFakeTimers('modern');

      const mockGrant = jest.fn().mockImplementation(() => {
        const date = Math.floor(Date.now() / 1000);

        return Promise.resolve({
          access_token: 'test_token ' + (date + 900),
          expires_at: date + 900,
        });
      });

      mocked(OpenIDClientFactory.getClient).mockResolvedValue({
        grant: mockGrant,
      } as unknown as Client);

      const cf = new ConfidentialClient('./__tests__/fixtures/validConfig.json');

      jest.setSystemTime(new Date('2020-01-01T12:00:00+00:00'));
      const token1 = await cf.getAccessToken();
      expect(token1).toBe('test_token 1577880900');
      expect(mockGrant).toHaveBeenCalledTimes(1);

      jest.setSystemTime(new Date('2020-01-01T12:10:00+00:00'));
      const token2 = await cf.getAccessToken();
      expect(token2).toBe('test_token 1577880900');
      expect(mockGrant).toHaveBeenCalledTimes(1);

      jest.setSystemTime(new Date('2020-01-01T12:30:00+00:00'));
      const token3 = await cf.getAccessToken();
      expect(token3).toBe('test_token 1577882700');
      expect(mockGrant).toHaveBeenCalledTimes(2);
    });

    test('should throw an invalid token error', async () => {
      mocked(OpenIDClientFactory.getClient).mockResolvedValue({
        grant: jest.fn().mockResolvedValue({
          access_token: 'test_token',
        }),
      } as unknown as Client);

      const confidentialClient = new ConfidentialClient('./__tests__/fixtures/validConfig.json');

      await expect(confidentialClient.getAccessToken()).rejects.toThrow('Got an invalid token');
    });

    test('should throw an get access token error', async () => {
      mocked(OpenIDClientFactory.getClient).mockResolvedValue({
        grant: jest.fn().mockRejectedValue('error'),
      } as unknown as Client);

      const confidentialClient = new ConfidentialClient('./__tests__/fixtures/validConfig.json');

      await expect(confidentialClient.getAccessToken()).rejects.toThrow('Error attempting to get access token');
    });

    test('should use the proxy agent if provided', async () => {
      const proxyUrl = 'http://proxy.example.com:8080';

      mocked(OpenIDClientFactory.getClient).mockResolvedValue({
        grant: jest.fn().mockResolvedValue({
          access_token: 'test_token',
          expires_at: Math.floor(Date.now() / 1000) + 900,
        }),
      } as unknown as Client);

      const confidentialClient = new ConfidentialClient('./__tests__/fixtures/validConfig.json', {
        proxyUrl: proxyUrl,
      });

      await confidentialClient.getAccessToken();

      expect(OpenIDClientFactory.getClient).toHaveBeenCalledWith(
        expect.objectContaining({ proxyUrl: proxyUrl }),
        new HttpsProxyAgent('http://proxy.example.com:8080'),
      );
    });
  });
});
