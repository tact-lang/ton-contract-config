import { Address, Cell, Contract, ContractProvider, Dictionary } from "ton-core";
import { parseConfig } from "./parsing";

export class ConfigContract implements Contract {

    static create(address?: Address) {
        return new ConfigContract(address || Address.parseRaw('-1:5555555555555555555555555555555555555555555555555555555555555555'));
    }

    readonly address: Address;

    private constructor(address: Address) {
        this.address = address;
    }

    async getConfigsRaw(provider: ContractProvider) {
        let state = (await provider.getState());
        if (state.state.type !== 'active') {
            throw new Error('Contract is not active');
        }
        let slice = Cell.fromBoc(state.state.data!)[0].beginParse();
        let dd = slice.loadRef();
        let dict = dd.beginParse().loadDictDirect(Dictionary.Keys.Int(32), Dictionary.Values.Cell());
        return dict;
    }

    async getConfig(provider: ContractProvider) {
        return parseConfig(await this.getConfigsRaw(provider));
    }
} 