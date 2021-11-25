import { ConfidentialClientConfiguration, WellKnownURIError } from '.';
import * as jose from 'jose';
import { Client, Issuer, ClientAuthMethod } from 'openid-client';
import debugModule from 'debug';
import { PACKAGE_NAME } from './constants';
const debug = debugModule(`${PACKAGE_NAME}:OpenIDClientFactory`);

export class OpenIDClientFactory {
  public static async getClient(config: ConfidentialClientConfiguration): Promise<Client> {
    const jwks = {
      keys: [config.jwk],
    } as jose.JSONWebKeySet;

    const clientAuthMethod: ClientAuthMethod = 'private_key_jwt';

    const metadata = {
      client_id: config.clientId,
      token_endpoint_auth_method: clientAuthMethod,
    };
    const wellKnownUri = config.wellKnownUri;

    try {
      debug('Attempting metadata retrieval from well_known_uri: %s', config.wellKnownUri);
      const issuer = await Issuer.discover(wellKnownUri);
      debug('Metadata retrieval was successfull');

      debug(
        'Retrieved issuer: %s and token_endpoint: %s from well_known_uri',
        issuer.metadata.issuer,
        issuer.metadata.token_endpoint,
      );

      return new issuer.Client(metadata, jwks);
    } catch (error) {
      throw new WellKnownURIError(`Error retrieving contents from the well_known_uri: ${config.wellKnownUri}`, error);
    }
  }
}
