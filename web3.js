import 'dotenv/config';

let Web3 = require('web3');
let HDWalletProvider = require(".");
let provider = new HDWalletProvider(process.env.MNEMONIC || "", "https://mainnet.infura.io:443", process.env.ACCOUNT_INDEX || 0);

export default new Web3(provider.engine);
