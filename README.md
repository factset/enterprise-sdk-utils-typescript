<img alt="FactSet" src="https://www.factset.com/hubfs/Assets/images/factset-logo.svg" height="56" width="290">

# FactSet SDK Utilities for TypeScript and JavaScript

![npm](https://img.shields.io/npm/v/@factset/sdk-utils) [![Apache-2 license](https://img.shields.io/badge/license-Apache2-brightgreen.svg)](https://www.apache.org/licenses/LICENSE-2.0)

This repository contains a collection of utilities that supports FactSet's SDK in TypeScript and JavaScript, and facilitate usage of FactSet APIs.

## Installation

### npm

```sh
npm install @factset/sdk-utils
```

### yarn

```sh
yarn add @factset/sdk-utils
```

## Usage

This library contains multiple modules, sample usage of each module is below.

### How to authenticate

First, you need to create the OAuth 2.0 client configuration that will be used to authenticate against FactSet's APIs:

1. [Create a new application](https://developer.factset.com/learn/authentication-oauth2#creating-an-application) on FactSet's Developer Portal.
2. When prompted, download the configuration file and move it to your development environment.

```ts
import {ConfidentialClient} from '@factset/sdk-utils';
import axios from 'axios';

async function exampleRequest() {
  // The ConfidentialClient instance should be reused in production environments.
  const confidentialClient = new ConfidentialClient('/path/to/config.json');
  const accessToken = await confidentialClient.getAccessToken();

  const response = await axios.get('https://api.factset.com/analytics/lookups/v3/currencies', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log(response.data);
}

exampleRequest();
```

### Configure a Proxy

You can pass proxy settings to the ConfidentialClient if necessary. The proxy URL can be passed as an object with the proxyUrl property:

```ts
const confidentialClient = new ConfidentialClient('/path/to/config.json', {
  proxyUrl: 'http://username:password@proxy.example.com:8080',
});
```

## Modules

Information about the various utility modules contained in this library can be found below.

### Authentication

The [authentication module](src) provides helper classes that facilitate [OAuth 2.0](https://developer.factset.com/learn/authentication-oauth2) authentication and authorization with FactSet's APIs. Currently, the module has support for the [client credentials flow](https://github.com/factset/oauth2-guidelines#client-credentials-flow-1).

Each helper class in the module has the following features:

- Accepts a `Configuration` instance that contains information about the OAuth 2.0 client, including the client ID and private key.
- Performs authentication with FactSet's OAuth 2.0 authorization server and retrieves an access token.
- Caches the access token for reuse and requests a new access token as needed when one expires.
  - In order for this to work correctly, the helper class instance should be reused in production environments.

#### Configuration

Classes in the authentication module require OAuth 2.0 client configuration information to be passed to the constructor in the `ConfidentialClient` through a JSON-formatted file or a `ConfidentialClientConfiguration` object. Below is an example of a JSON-formatted file:

```json
{
  "name": "Application name registered with FactSet's Developer Portal",
  "clientId": "OAuth 2.0 Client ID registered with FactSet's Developer Portal",
  "clientAuthType": "Confidential",
  "owners": ["USERNAME-SERIAL"],
  "jwk": {
    "kty": "RSA",
    "use": "sig",
    "alg": "RS256",
    "kid": "Key ID",
    "d": "ECC Private Key",
    "n": "Modulus",
    "e": "Exponent",
    "p": "First Prime Factor",
    "q": "Second Prime Factor",
    "dp": "First Factor CRT Exponent",
    "dq": "Second Factor CRT Exponent",
    "qi": "First CRT Coefficient"
  }
}
```

The other option is to pass in the `ConfidentialClientConfiguration` instance which is initialised as shown below:

```ts
const confidentialClientConfiguration = {
  name: "Application name registered with FactSet's Developer Portal",
  clientId: "OAuth 2.0 Client ID registered with FactSet's Developer Portal",
  clientAuthType: 'Confidential',
  owners: ['USERNAME-SERIAL'],
  jwk: {
    kty: 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid: 'Key ID',
    d: 'ECC Private Key',
    n: 'Modulus',
    e: 'Exponent',
    p: 'First Prime Factor',
    q: 'Second Prime Factor',
    dp: 'First Factor CRT Exponent',
    dq: 'Second Factor CRT Exponent',
    qi: 'First CRT Coefficient',
  },
};
```

If you're just starting out, you can visit FactSet's Developer Portal to [create a new application](https://developer.factset.com/applications) and download a configuration file in this format.

If you're creating and managing your signing key pair yourself, see the required [JWK parameters](https://github.com/factset/oauth2-guidelines#jwk-parameters) for public-private key pairs.

## Contributing

Please refer to the [contributing guide](CONTRIBUTING.md).

## Copyright

Copyright 2025 FactSet Research Systems Inc

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
