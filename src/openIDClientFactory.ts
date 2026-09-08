import {ConfidentialClientConfiguration, WellKnownURIError} from '.';
import * as client from 'openid-client';
import * as jose from 'jose';
import {fetch as undiciFetch, Headers as UndiciHeaders, ProxyAgent} from 'undici';
import debugModule from 'debug';
import {JWT_EXPIRE_AFTER_SECS, JWT_NOT_BEFORE_SECS, PACKAGE_NAME} from './constants';
import {unixTimestamp} from './unixTimestamp';

const debug = debugModule(`${PACKAGE_NAME}:OpenIDClientFactory`);

export class OpenIDClientFactory {
  public static async getClient(
    config: ConfidentialClientConfiguration,
    proxyUrl?: string
  ): Promise<client.Configuration> {
    try {
      debug('Attempting metadata retrieval from well_known_uri: %s', config.wellKnownUri);

      // Import the JWK into a signing key. openid-client v6 authenticates with a
      // CryptoKey (or KeyObject) rather than the raw JWK set used in v5.
      const privateKey = (await jose.importJWK(config.jwk, config.jwk.alg)) as CryptoKey;

      // private_key_jwt client authentication. The nbf/iat/exp claims that used to
      // be passed as `clientAssertionPayload` on each grant are now set here, right
      // before the client assertion is signed. Passing the `kid` preserves the key
      // hint that FactSet's authorization server uses to select the verifying key.
      const clientAuth = client.PrivateKeyJwt(
        {key: privateKey, kid: config.jwk.kid},
        {
          [client.modifyAssertion]: (_header, payload) => {
            const now = unixTimestamp();
            payload.nbf = now - JWT_NOT_BEFORE_SECS;
            payload.iat = now;
            payload.exp = now + JWT_EXPIRE_AFTER_SECS;
          },
        }
      );

      const options: client.DiscoveryRequestOptions = {};

      if (proxyUrl) {
        const proxyAgent = new ProxyAgent(proxyUrl);
        const userAgent = `fds-sdk/javascript/utils/2.1.4 (${process.platform}; node ${process.version})`;

        // v6 uses the global fetch, so the v5 `custom.setHttpOptionsDefaults({agent})`
        // no longer applies. Route requests through an undici ProxyAgent dispatcher and
        // add the user-agent header via a custom fetch. Assigning it on the discovery
        // options also applies it to every subsequent request made with the resulting
        // Configuration (i.e. the token request).
        const customFetch = ((url: string, requestOptions: Parameters<typeof undiciFetch>[1]) => {
          const headers = new UndiciHeaders(requestOptions?.headers);
          headers.set('user-agent', userAgent);

          return undiciFetch(url, {...requestOptions, headers, dispatcher: proxyAgent});
        }) as unknown as client.CustomFetch;

        options[client.customFetch] = customFetch;
      }

      const configuration = await client.discovery(
        new URL(config.wellKnownUri),
        config.clientId,
        {token_endpoint_auth_method: 'private_key_jwt'},
        clientAuth,
        options
      );

      debug('Metadata retrieval was successfull');

      const serverMetadata = configuration.serverMetadata();
      debug(
        'Retrieved issuer: %s and token_endpoint: %s from well_known_uri',
        serverMetadata.issuer,
        serverMetadata.token_endpoint
      );

      return configuration;
    } catch (error) {
      throw new WellKnownURIError(`Error retrieving contents from the well_known_uri: ${config.wellKnownUri}`, error);
    }
  }
}
