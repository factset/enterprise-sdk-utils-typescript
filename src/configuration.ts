import {z} from 'zod';
import {ConfigurationError} from './errors';
import {FACTSET_WELL_KNOWN_URI, PACKAGE_NAME} from './constants';
import {readFileSync} from 'fs';
import debugModule from 'debug';

const debug = debugModule(`${PACKAGE_NAME}:configuration`);

// The zod schema is the single source of truth for both runtime validation and
// the exported types below (via z.infer), so the two can never drift apart.
const jwkSchema = z.object({
  kty: z.string(),
  use: z.string(),
  alg: z.string(),
  kid: z.string(),
  d: z.string(),
  n: z.string(),
  e: z.string(),
  p: z.string(),
  q: z.string(),
  dp: z.string(),
  dq: z.string(),
  qi: z.string(),
});

// looseObject preserves unknown top-level keys (matching joi's `.unknown(true)`),
// so forward-compatible config options are passed through untouched.
const schema = z.looseObject({
  name: z.string(),
  clientId: z.string(),
  clientAuthType: z.string(),
  owners: z.array(z.string()).min(1),
  wellKnownUri: z.url().default(FACTSET_WELL_KNOWN_URI),
  jwk: jwkSchema,
});

export type ConfidentialClientJwk = z.infer<typeof jwkSchema>;

export type ConfidentialClientConfiguration = z.infer<typeof schema>;

export class Configuration {
  public static validateConfig(config: unknown): ConfidentialClientConfiguration {
    debug('Validating the config');
    const result = schema.safeParse(config);

    if (!result.success) {
      const details = result.error.issues
        .map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join('; ');
      throw new ConfigurationError(`Configuration is not valid: ${details}`);
    }

    debug('Config is vaild');
    return result.data;
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
      'Invalid parameter type, needs to be a path (string) or configuration (ConfidentialClientConfiguration)"'
    );
  }
}
