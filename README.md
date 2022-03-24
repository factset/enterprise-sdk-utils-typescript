<img alt="FactSet" src="https://www.factset.com/hubfs/Assets/images/factset-logo.svg" height="56" width="290">

# FactSet SDK Utilities for TypeScript and JavaScript

![npm](https://img.shields.io/npm/v/@factset/sdk-utils)
[![Apache-2 license](https://img.shields.io/badge/license-Apache2-brightgreen.svg)](https://www.apache.org/licenses/LICENSE-2.0)

This repository contains a collection of utilities that supports FactSet's SDK in TypeScript and JavaScript, and facilitate usage of FactSet APIs.

## Installations

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

### Authentication

First, you need to create the OAuth 2.0 client configuration that will be used to authenticate against FactSet's APIs:

1. Create a [new application](https://developer.factset.com/applications) on FactSet's Developer Portal.
2. When prompted, download the configuration file and move it to your development environment.

```ts
import { ConfidentialClient } from '@factset/sdk-utils';
import axios from 'axios';

async function exampleRequest() {
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

## Contributing

Please refer to the [contributing guide](CONTRIBUTING.md).

## Copyright

Copyright 2022 FactSet Research Systems Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
