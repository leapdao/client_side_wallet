let Web3 = require('web3');
let HDWalletProvider = require(".");
let mnemonic = "";
let provider = new HDWalletProvider(mnemonic, "https://mainnet.infura.io:443", 1);

export default new Web3(provider.engine);
