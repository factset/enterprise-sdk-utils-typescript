import joi from 'joi';
import * as jose from 'jose';
import { ConfigurationError } from './errors';
import { FACTSET_WELL_KNOWN_URI, PACKAGE_NAME } from './constants';
import { readFileSync } from 'fs';
import debugModule from 'debug';

const debug = debugModule(`${PACKAGE_NAME}:configuration`);

export type ConfidentialClientJwk = jose.JWK;

export type ConfidentialClientConfiguration = {
  name: string;
  clientId: string;
  clientAuthType: string;
  owners: Array<string>;
  wellKnownUri: string;
  jwk: ConfidentialClientJwk;
};

const schema = joi.object({
  name: joi.string().required(),
  clientId: joi.string().required(),
  clientAuthType: joi.string().required(),
  owners: joi.array().items(joi.string()).min(1).required(),
  wellKnownUri: joi.string().uri().default(FACTSET_WELL_KNOWN_URI),
  jwk: joi
    .object({
      kty: joi.string().required(),
      use: joi.string().required(),
      alg: joi.string().required(),
      kid: joi.string().required(),
      d: joi.string().required(),
      n: joi.string().required(),
      e: joi.string().required(),
      p: joi.string().required(),
      q: joi.string().required(),
      dp: joi.string().required(),
      dq: joi.string().required(),
      qi: joi.string().required(),
    })
    .required(),
});

export class Configuration {
  public static validateConfig(config: unknown): ConfidentialClientConfiguration {
    debug('Validating the config');
    const result = schema.validate(config, { abortEarly: false, errors: {} });

    if (result.error !== undefined) {
      throw new ConfigurationError(`Configuration is not valid: ${result.error.message}`);
    }

    debug('Config is vaild');
    return result.value;
  }

  public static loadConfig(param: ConfidentialClientConfiguration | string): ConfidentialClientConfiguration {
    debug('Trying to load the config');

    if (typeof param === 'object') {
      debug('Config is an object');
      return Configuration.validateConfig(param);
    } else if (typeof param === 'string') {
      try {
        debug('Config is a string, trying to load from a file: %s', param);
        const configString = readFileSync(param, 'utf8');
        const parsedConfig = JSON.parse(configString);

        return Configuration.validateConfig(parsedConfig);
      } catch (error) {
        if (error instanceof ConfigurationError) {
          throw error;
        }

        throw new ConfigurationError(`Could not load config: ${param} (${error})`, error);
      }
    }

    throw new ConfigurationError(
      'Invalid parameter type, needs to be a path (string) or configuration (ConfidentialClientConfiguration)"',
    );
  }
}
