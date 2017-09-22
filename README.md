
## install

```
npm install
```

Customize variables in `.env` if needed:

```
cp .env.template .env
```

## script setup

In CLI

```
node
```

Then

```
var HDWalletProvider = require("truffle-hdwallet-provider");
var Web3 = require('web3');
var mnemonic = "secret";
var provider = new HDWalletProvider(mnemonic, "https://rinkeby.infura.io:443");
var web3 = new Web3(provider.engine);

// check your wallet address
provider.getAddress()
=> '0x6ede26d58a3f582c808991ce7d15bc8744b0c943'
```


## netting dry-run script

`npm start netting <table address>`
