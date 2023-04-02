# TON Config

Small library for working with  TON  config contract.

## Installation

```bash
yarn add @ton-contract/config ton-core ton-crypto
```

## Usage

```ts
import { ConfigContract, Config } from "@ton-contract/config";

// Load config from network
const config = client.open(ConfigContract.create());
const rawConfig: Dictionary<number, Cell> = await config.getRawConfig(); // Dictionary<number, Cell>
const config: Config = await config.getConfig();

```

## License

MIT