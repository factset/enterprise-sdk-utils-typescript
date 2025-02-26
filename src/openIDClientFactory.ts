import { ConfidentialClientConfiguration, WellKnownURIError } from '.';
import { Client, ClientAuthMethod, custom, Issuer } from 'openid-client';
import debugModule from 'debug';
import { PACKAGE_NAME } from './constants';
import { Agent } from 'node:http';

const debug = debugModule(`${PACKAGE_NAME}:OpenIDClientFactory`);

export class OpenIDClientFactory {
  public static async getClient(config: ConfidentialClientConfiguration, proxyAgent?: Agent): Promise<Client> {
    const jwks = {
      keys: [config.jwk],
    };

    if (proxyAgent) {
      custom.setHttpOptionsDefaults({
        agent: proxyAgent,
        headers: {
          'user-agent': `fds-sdk/javascript/utils/2.1.0 (${process.platform}; node ${process.version})`,
        },
      });
    }

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
