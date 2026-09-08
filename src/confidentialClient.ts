import {AccessTokenError, ConfidentialClientConfiguration, OAuth2Client, Token} from '.';
import {OpenIDClientFactory} from './openIDClientFactory';
import {Configuration} from './configuration';
import * as client from 'openid-client';
import {PACKAGE_NAME} from './constants';
import {unixTimestamp} from './unixTimestamp';
import debugModule from 'debug';

const debug = debugModule(`${PACKAGE_NAME}:ConfidentialClient`);

/**
 * Helper class that supports FactSet's implementation of the OAuth 2.0
 * client credentials flow.
 *
 * The main purpose of this class is to provide an access token that can
 * be used to authenticate against FactSet's APIs. It takes care of fetching
 * the access token, caching it and refreshing it as needed.
 */
export class ConfidentialClient implements OAuth2Client {
  private readonly _config: ConfidentialClientConfiguration;
  private _token: Token;
  private _openIDClient!: client.Configuration;
  private _options: {proxyUrl: string} | null;

  /**
   * @param path Path to credentials configuration file.
   * @param _options HTTP proxy options.
   */
  constructor(path: string, _options?: {proxyUrl: string});

  /**
   * Example config
   *
   * ```json
   * {
   *   "name": "Application Name registered with FactSet:Developer",
   *   "clientId": "Client ID registered with FactSet:Developer",
   *   "clientAuthType": "Confidential",
   *   "owners": ["Owner ID(s) of this configuration"],
   *   "jwk": {
   *     "kty": "RSA",
   *     "use": "sig",
   *     "alg": "RS256",
   *     "kid": "Key ID",
   *     "d": "ECC Private Key",
   *     "n": "Modulus",
   *     "e": "Exponent",
   *     "p": "First Prime Factor",
   *     "q": "Second Prime Factor",
   *     "dp": "First Factor CRT Exponent",
   *     "dq": "Second Factor CRT Exponent",
   *     "qi": "First CRT Coefficient",
   *   }
   * }
   * ```
   *
   * @param config FacSet ConfidentialClient configuration object
   */
  constructor(config: ConfidentialClientConfiguration);
  constructor(param: ConfidentialClientConfiguration | string, _options?: {proxyUrl: string}) {
    this._config = Configuration.loadConfig(param);
    this._token = new Token('', 0);
    this._options = _options ?? null;
  }

  /**
   * Returns an access token that can be used for authentication.
   *
   * If the cache contains a valid access token, it's returned. Otherwise
   * a new access token is retrieved from FactSet's authorization server.
   *
   * The access token should be used immediately and not stored to avoid
   * any issues with token expiry.
   *
   * The access token is used in the Authorization header when when accessing
   * FactSet's APIs. Example: `{"Authorization": "Bearer access-token"}`
   *
   * @returns access token for protected resource requests
   */
  public async getAccessToken(): Promise<string> {
    if (this._token.isExpired() === false) {
      debug('Retrieving cached token. Expires at %d, in %d seconds.', this._token.expiresAt, this._token.expiresIn);
      return this._token.token;
    }
    debug('Token is expired or invalid');

    this._openIDClient = await OpenIDClientFactory.getClient(this._config, this._options?.proxyUrl);

    this._token = await this.fetchAccessToken();

    return this._token.token;
  }

  private async fetchAccessToken(): Promise<Token> {
    debug('Fetching new access token');

    try {
      const now = unixTimestamp();

      // grant_type and the signed client assertion (incl. nbf/iat/exp) are handled
      // internally by clientCredentialsGrant and the private_key_jwt client auth.
      const tokenSet = await client.clientCredentialsGrant(this._openIDClient);

      if (tokenSet.access_token === undefined || tokenSet.expires_in === undefined) {
        throw new AccessTokenError('Got an invalid token');
      }

      // v6 returns expires_in (relative seconds); Token expects an absolute expiry.
      const expiresAt = now + tokenSet.expires_in;
      debug('Got access token that expires at %d, in %d seconds', expiresAt, tokenSet.expires_in);
      return new Token(tokenSet.access_token, expiresAt);
    } catch (error) {
      if (error instanceof AccessTokenError) {
        throw error;
      }

      throw new AccessTokenError('Error attempting to get access token', error);
    }
  }
}
