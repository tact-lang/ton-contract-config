import { Address, Cell, Dictionary, DictionaryValue, Slice } from "ton-core";
import { Config, ConfigGasLimitsPrices, ConfigMessagePrice, ConfigStoragePrices, ConfigValidatorDescriptor, ConfigValidatorPunishment, ConfigValidatorSet } from "./type";

export function parseConfig(configs: Dictionary<number, Cell>): Config {
    return {
        configAddress: required(configs, 0, configParseMasterAddress),
        electorAddress: required(configs, 1, configParseMasterAddress),
        minterAddress: optional(configs, 2, configParseMasterAddress),
        feeCollectorAddress: optional(configs, 3, configParseMasterAddress),
        dnsRootAddress: optional(configs, 4, configParseMasterAddress),
        globalVersion: required(configs, 8, configParseGlobalVersion),

        // Validating
        voting: required(configs, 11, parseVotingSetup),
        validating: {
            ...required(configs, 15, configParseElectionsConfig),
            ...required(configs, 16, configParseValidatorsConfig),
            ...required(configs, 17, configParseStakeConfig)
        },
        validators: {
            prevValidators: optional(configs, 32, configParseValidatorSet),
            prevTempValidators: optional(configs, 33, configParseValidatorSet),
            currentValidators: required(configs, 34, configParseValidatorSet),
            currentTempValidators: optional(configs, 35, configParseValidatorSet),
            nextValidators: optional(configs, 36, configParseValidatorSet),
            nextTempValidators: optional(configs, 37, configParseValidatorSet)
        },
        punishment: optional(configs, 40, configParseValidatorPunishment),

        // Prices
        storagePrices: required(configs, 18, configParseStoragePrices),
        gasPrices: {
            masterchain: required(configs, 20, configParseGasLimitsPrices),
            workchain: required(configs, 21, configParseGasLimitsPrices),
        },
        messagePrices: {
            masterchain: required(configs, 24, configParseMsessagePrices),
            workchain: required(configs, 25, configParseMsessagePrices),
        },
    };
}


export function configParseMasterAddress(slice: Cell) {
    return new Address(-1, slice.beginParse().loadBuffer(32));
}

export function configParseValidatorDescr(slice: Slice) {
    let header = slice.loadUint(8);
    if (slice.loadUint(32) !== 0x8e81278a) {
        throw Error('Invalid config');
    }
    let publicKey = slice.loadBuffer(32);
    let weight = slice.loadUintBig(64);
    if (header === 0x53) {
        return {
            publicKey,
            weight,
            adnlAddress: null
        };
    } else if (header === 0x73) {
        return {
            publicKey,
            weight,
            adnlAddress: slice.loadBuffer(32)
        };
    } else {
        throw Error('Invalid config');
    }
}

export function configParseValidatorSet(cell: Cell): ConfigValidatorSet {
    let slice = cell.beginParse();
    const ValidatorDescriptorValue: DictionaryValue<ConfigValidatorDescriptor> = {
        serialize(src, builder) {
            if (src.adnlAddress) {
                builder.storeUint(0x73, 8);
                builder.storeUint(0x8e81278a, 32);
                builder.storeBuffer(src.publicKey);
                builder.storeUint(src.weight, 64);
                builder.storeBuffer(src.adnlAddress);
            } else {
                builder.storeUint(0x53, 8);
                builder.storeUint(0x8e81278a, 32);
                builder.storeBuffer(src.publicKey);
                builder.storeUint(src.weight, 64);
            }
        },
        parse(slice) {
            let header = slice.loadUint(8);
            if (slice.loadUint(32) !== 0x8e81278a) {
                throw Error('Invalid config');
            }
            let publicKey = slice.loadBuffer(32);
            if (header === 0x53) {
                return {
                    publicKey,
                    weight: slice.loadUintBig(64),
                    adnlAddress: null
                };
            } else if (header === 0x73) {
                return {
                    publicKey,
                    weight: slice.loadUintBig(64),
                    adnlAddress: slice.loadBuffer(32)
                };
            } else {
                throw Error('Invalid config');
            }
        }
    }
    let header = slice.loadUint(8);
    if (header === 0x11) {
        let timeSince = slice.loadUint(32);
        let timeUntil = slice.loadUint(32);
        let total = slice.loadUint(16);
        let main = slice.loadUint(16);
        let list = slice.loadDictDirect(Dictionary.Keys.Int(16), ValidatorDescriptorValue);
        return {
            timeSince,
            timeUntil,
            total,
            main,
            list
        };
    } else if (header === 0x12) {
        let timeSince = slice.loadUint(32);
        let timeUntil = slice.loadUint(32);
        let total = slice.loadUint(16);
        let main = slice.loadUint(16);
        let totalWeight = slice.loadUintBig(64);
        let list = slice.loadDict(Dictionary.Keys.Int(16), ValidatorDescriptorValue)
        let t = 0n;
        for (let a of list) {
            t += a[1].weight;
        }
        if (t !== totalWeight) {
            throw Error('Invalid config');
        }
        return {
            timeSince,
            timeUntil,
            total,
            main,
            list
        };
    } else {
        throw Error('Invalid config');
    }
}

export function configParseElectionsConfig(cell: Cell) {
    let slice = cell.beginParse();
    let validatorsElectedFor = slice.loadUint(32);
    let electorsStartBefore = slice.loadUint(32);
    let electorsEndBefore = slice.loadUint(32);
    let stakeHeldFor = slice.loadUint(32);
    return {
        validatorsElectedFor,
        electorsStartBefore,
        electorsEndBefore,
        stakeHeldFor
    };
}

export function configParseValidatorsConfig(cell: Cell) {
    let slice = cell.beginParse();
    let maxValidators = slice.loadUint(16);
    let maxMainValidators = slice.loadUint(16);
    let minValidators = slice.loadUint(16);
    return {
        maxValidators,
        maxMainValidators,
        minValidators
    };
}

export function configParseStakeConfig(cell: Cell) {
    let slice = cell.beginParse();
    let minStake = slice.loadCoins();
    let maxStake = slice.loadCoins();
    let minTotalStake = slice.loadCoins();
    let maxStakeFactor = slice.loadUint(32);
    return {
        minStake,
        maxStake,
        minTotalStake,
        maxStakeFactor
    };
}

export function configParseStoragePrices(cell: Cell): ConfigStoragePrices[] {
    const StoragePriceValue: DictionaryValue<ConfigStoragePrices> = {
        serialize(src, builder) {
            builder.storeUint(0xcc, 8);
            builder.storeUint(src.utimeSince, 32);
            builder.storeUint(src.bitPricePs, 64);
            builder.storeUint(src.cellPricePs, 64);
            builder.storeUint(src.mcBitPricePs, 64);
            builder.storeUint(src.mcCellPricePs, 64);
        },
        parse(slice) {
            let header = slice.loadUint(8);
            if (header !== 0xcc) {
                throw Error('Invalid config');
            }
            let utimeSince = slice.loadUint(32);
            let bitPricePs = slice.loadUintBig(64);
            let cellPricePs = slice.loadUintBig(64);
            let mcBitPricePs = slice.loadUintBig(64);
            let mcCellPricePs = slice.loadUintBig(64);
            return {
                utimeSince,
                bitPricePs,
                cellPricePs,
                mcBitPricePs,
                mcCellPricePs
            };
        }
    }
    let slice = cell.beginParse();
    let result: ConfigStoragePrices[] = [];
    let dict = slice.loadDictDirect(Dictionary.Keys.Int(32), StoragePriceValue);
    for (let [k, v] of dict) {
        result.push(v);
    }
    return result;
}

export function configParseGlobalVersion(cell: Cell) {
    let slice = cell.beginParse();
    let version = slice.loadUint(32);
    let capabilities = slice.loadUintBig(64);
    return {
        version,
        capabilities
    }
}

export function configParseValidatorPunishment(cell: Cell): ConfigValidatorPunishment {
    let slice = cell.beginParse();

    let header = slice.loadUint(8);
    if (header !== 1) {
        throw Error('Invalid config');
    }

    let defaultFlatFine = slice.loadCoins();
    let defaultProportionaFine = slice.loadCoins();
    let severityFlatMult = slice.loadUint(16);
    let severityProportionalMult = slice.loadUint(16);
    let unfunishableInterval = slice.loadUint(16);
    let longInterval = slice.loadUint(16);
    let longFlatMult = slice.loadUint(16);
    let longProportionalMult = slice.loadUint(16);
    let mediumInterval = slice.loadUint(16);
    let mediumFlatMult = slice.loadUint(16);
    let mediumProportionalMult = slice.loadUint(16);
    return {
        defaultFlatFine,
        defaultProportionaFine,
        severityFlatMult,
        severityProportionalMult,
        unfunishableInterval,
        longInterval,
        longFlatMult,
        longProportionalMult,
        mediumInterval,
        mediumFlatMult,
        mediumProportionalMult
    };
}

function parseGasLimitsInternal(slice: Slice) {
    const tag = slice.loadUint(8);
    if (tag === 0xde) {
        const gasPrice = slice.loadUintBig(64);
        const gasLimit = slice.loadUintBig(64);
        const specialGasLimit = slice.loadUintBig(64);
        const gasCredit = slice.loadUintBig(64);
        const blockGasLimit = slice.loadUintBig(64);
        const freezeDueLimit = slice.loadUintBig(64);
        const deleteDueLimit = slice.loadUintBig(64);
        return {
            gasPrice,
            gasLimit,
            specialGasLimit,
            gasCredit,
            blockGasLimit,
            freezeDueLimit,
            deleteDueLimit
        };
    } else if (tag === 0xdd) {
        const gasPrice = slice.loadUintBig(64);
        const gasLimit = slice.loadUintBig(64);
        const gasCredit = slice.loadUintBig(64);
        const blockGasLimit = slice.loadUintBig(64);
        const freezeDueLimit = slice.loadUintBig(64);
        const deleteDueLimit = slice.loadUintBig(64);
        return {
            gasPrice,
            gasLimit,
            specialGasLimit: null,
            gasCredit,
            blockGasLimit,
            freezeDueLimit,
            deleteDueLimit
        }
    } else {
        throw Error('Invalid config');
    }
}

export function configParseGasLimitsPrices(cell: Cell): ConfigGasLimitsPrices {
    let slice = cell.beginParse();
    const tag = slice.loadUint(8);
    if (tag === 0xd1) {
        const flatLimit = slice.loadUintBig(64);
        const flatGasPrice = slice.loadUintBig(64);
        const other = parseGasLimitsInternal(slice);
        return {
            flatLimit,
            flatGasPrice,
            other
        }
    } else {
        throw Error('Invalid config');
    }
}

export function configParseMsessagePrices(cell: Cell): ConfigMessagePrice {
    let slice = cell.beginParse();
    let magic = slice.loadUint(8);
    if (magic !== 0xea) {
        throw new Error('Invalid msg prices param');
    }
    return {
        lumpPrice: slice.loadUintBig(64),
        bitPrice: slice.loadUintBig(64),
        cellPrice: slice.loadUintBig(64),
        ihrPriceFactor: slice.loadUint(32),
        firstFrac: slice.loadUint(16),
        nextFrac: slice.loadUint(16)
    };
}

// cfg_vote_cfg#36 min_tot_rounds:uint8 max_tot_rounds:uint8 min_wins:uint8 max_losses:uint8 min_store_sec:uint32 max_store_sec:uint32 bit_price:uint32 cell_price:uint32 = ConfigProposalSetup;
function parseProposalSetup(slice: Slice) {
    let magic = slice.loadUint(8);
    if (magic !== 0x36) {
        throw new Error('Invalid config');
    }
    let minTotalRounds = slice.loadUint(8);
    let maxTotalRounds = slice.loadUint(8);
    let minWins = slice.loadUint(8);
    let maxLoses = slice.loadUint(8);
    let minStoreSec = slice.loadUint(32);
    let maxStoreSec = slice.loadUint(32);
    let bitPrice = slice.loadUint(32);
    let cellPrice = slice.loadUint(32);
    return { minTotalRounds, maxTotalRounds, minWins, maxLoses, minStoreSec, maxStoreSec, bitPrice, cellPrice };
}

// cfg_vote_setup#91 normal_params:^ConfigProposalSetup critical_params:^ConfigProposalSetup = ConfigVotingSetup;
export function parseVotingSetup(cell: Cell) {
    let slice = cell.beginParse();
    let magic = slice.loadUint(8);
    if (magic !== 0x91) {
        throw new Error('Invalid config');
    }
    let normalParams = parseProposalSetup(slice.loadRef().beginParse());
    let criticalParams = parseProposalSetup(slice.loadRef().beginParse());
    return { normalParams, criticalParams };
}

//
// Helpers
//

function required<T>(configs: Dictionary<number, Cell>, id: number, v: (cell: Cell) => T): T {
    let c = configs.get(id);
    if (!c) {
        throw new Error(`Config ${id} is required`);
    }
    return v(c);
}

function optional<T>(configs: Dictionary<number, Cell>, id: number, v: (cell: Cell) => T): T | null {
    let res = configs.get(id);
    if (res) {
        return v(res);
    } else {
        return null;
    }
}