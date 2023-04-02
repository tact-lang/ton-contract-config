import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4 } from "ton";
import { ConfigContract } from './ConfigContract';

describe('ConfigContract', () => {
    it('should parse mainnet config', async () => {
        let client = new TonClient4({ endpoint: await getHttpV4Endpoint() });
        let config = await client.openAt(28493373, ConfigContract.create()).getConfig();
        expect(config).toMatchSnapshot();
    });
    it('should parse testnet config', async () => {
        let client = new TonClient4({ endpoint: await getHttpV4Endpoint({ network: 'testnet' }) });
        let config = await client.openAt(8347988, ConfigContract.create()).getConfig();
        expect(config).toMatchSnapshot();
    });
});