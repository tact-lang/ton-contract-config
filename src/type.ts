import { Address, Dictionary } from "ton-core";

export type ConfigVotingSetup = {
    minTotalRounds: number;
    maxTotalRounds: number;
    minWins: number;
    maxLoses: number;
    minStoreSec: number;
    maxStoreSec: number;
    bitPrice: number;
    cellPrice: number;
}

export type ConfigStoragePrices = {
    utimeSince: number,
    bitPricePs: bigint,
    cellPricePs: bigint,
    mcBitPricePs: bigint,
    mcCellPricePs: bigint
}

export type ConfigGasLimitsPrices = {
    flatLimit: bigint,
    flatGasPrice: bigint,
    other: {
        gasPrice: bigint,
        gasLimit: bigint,
        specialGasLimit: bigint | null,
        gasCredit: bigint,
        blockGasLimit: bigint,
        freezeDueLimit: bigint,
        deleteDueLimit: bigint
    }
}

export type ConfigMessagePrice = {
    lumpPrice: bigint;
    bitPrice: bigint;
    cellPrice: bigint;
    ihrPriceFactor: number;
    firstFrac: number;
    nextFrac: number;
}

export type ConfigValidatorDescriptor = {
    publicKey: Buffer,
    weight: bigint,
    adnlAddress: Buffer | null
}

export type ConfigValidatorSet = {
    timeSince: number;
    timeUntil: number;
    total: number;
    main: number;
    list: Dictionary<number, ConfigValidatorDescriptor>;
}

export type ConfigValidatorPunishment = {
    defaultFlatFine: bigint;
    defaultProportionaFine: bigint;
    severityFlatMult: number;
    severityProportionalMult: number;
    unfunishableInterval: number;
    longInterval: number;
    longFlatMult: number;
    longProportionalMult: number;
    mediumInterval: number;
    mediumFlatMult: number;
    mediumProportionalMult: number;
}

export type Config = {
    configAddress: Address,
    electorAddress: Address,
    minterAddress: Address | null,
    feeCollectorAddress: Address | null,
    dnsRootAddress: Address | null,
    globalVersion: {
        version: number,
        capabilities: bigint
    },
    voting: {
        normalParams: ConfigVotingSetup,
        criticalParams: ConfigVotingSetup,
    },
    validating: {
        minStake: bigint;
        maxStake: bigint;
        minTotalStake: bigint;
        maxStakeFactor: number;
        maxValidators: number;
        maxMainValidators: number;
        minValidators: number;
        validatorsElectedFor: number;
        electorsStartBefore: number;
        electorsEndBefore: number;
        stakeHeldFor: number;
    },
    validators: {
        prevValidators: ConfigValidatorSet | null,
        prevTempValidators: ConfigValidatorSet | null,
        currentValidators: ConfigValidatorSet,
        currentTempValidators: ConfigValidatorSet | null,
        nextValidators: ConfigValidatorSet | null,
        nextTempValidators: ConfigValidatorSet | null
    },
    punishment: ConfigValidatorPunishment | null,
    storagePrices: ConfigStoragePrices[],
    gasPrices: {
        masterchain: ConfigGasLimitsPrices,
        workchain: ConfigGasLimitsPrices,
    },
    messagePrices: {
        masterchain: ConfigMessagePrice,
        workchain: ConfigMessagePrice,
    }
};