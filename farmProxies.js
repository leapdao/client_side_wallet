import web3 from './web3';
import Promise from 'bluebird';
import { Table, ERC20, FishFactory } from './contracts';
import BigNumber from 'bignumber.js';
import { fromGwei, toNtz, getSeats } from './util';
import AWS from 'aws-sdk';

AWS.config = {
  region: 'eu-west-1',
};

// how many blocks to look behind when searching for onchain proxies
const lookBehindBlocks = 10;

// app configuration. Only public data here. Sensitive data should be set in ENV variables (see .env.template)
const config = {
  production: {
    fishFactory: '0x869bdbb21bf8703353c16e2f3a19f937d14ea7c5',
    accountsDomain: 'pr-accounts',
    proxiesDomain: 'pr-proxies',
    ownerAddress: '0x4b678e549c71e1b15d257a67aac281df5f006f7d',
    lockAddress: '0xeaaa9055cd3ec255ecad3e3620705a2f99d8d032',
    oraclePrivKey: process.env.PRODUCTION_ORACLE_PRIV_KEY
  },
  staging: {
    fishFactory: '0x25aeb2d4d069b6e211a21577be8d63a059946503',
    accountsDomain: 'st-accounts',
    proxiesDomain: 'st-proxies',
    ownerAddress: '0xc5a72c0bf9f59ed5a1d2ac9f29bd80c55279d2d3',
    lockAddress: '0x82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f',
    oraclePrivKey: process.env.STAGING_ORACLE_PRIV_KEY
  }
}

const sdb = new AWS.SimpleDB({ region : 'eu-west-1' });

function etherscanLink(env, txid) {
  const network = env == 'production' ? 'mainnet' : 'rinkeby';
  return network == 'rinkeby' ? `https://rinkeby.etherscan.io/tx/${txid}` : `https://etherscan.io/tx/${txid}`;
}

function getOnchainProxies(fishFactory, fromBlock) {
  const createdAccounts = fishFactory.AccountCreated({}, { fromBlock: fromBlock, toBlock: 'latest'});

  return new Promise((resolve, reject) => {
    createdAccounts.get(function(error, logs) {
      if (error) return reject(error);
      resolve(logs.map(e => e.args.proxy));
    });
  });
}

function getTaken(proxies) {
  return new Promise((resolve, reject) => {
    sdb.select({
      SelectExpression: "select proxyAddr from `" + config[env].accountsDomain + "` where proxyAddr IN ('" + proxies.join("','") + "')"
    }, (err, data) => {
      if (err) return reject(err);
      if (!data || !data.Items) return resolve([]);
      resolve(data.Items.map(i => i.Attributes.find(a => a.Name == 'proxyAddr').Value));
    });
  });
}

function rejectTaken(proxies) {
  return getTaken(proxies)
    .then((takenProxies) => {
      return proxies.filter(p => takenProxies.indexOf(p) === -1);
    });
}

function getAlreadyInPool(proxies) {
  return new Promise((resolve, reject) => {
    sdb.select({
      SelectExpression: "select ItemName from `" + config[env].proxiesDomain + "` where ItemName() IN ('" + proxies.join("','") + "')"
    }, (err, data) => {
      if (err) return reject(err);
      if (!data || !data.Items) return resolve([]);
      resolve(data.Items.map(i => i.Name));
    });
  });
}


function rejectAlreadyInPool(proxies) {
  return getAlreadyInPool(proxies)
    .then((pooledProxies) => {
      return proxies.filter(p => pooledProxies.indexOf(p) === -1);
    });
}

function addToThePool(proxies) {
  return new Promise((resolve, reject) => {
    const proxiesAttrItems = proxies.map(p => {
       return {
         Name: p,
         Attributes: [
           { Name: 'proxyAddr', Value: p },
           { Name: 'created', Value: new Date().toString(), Replace: true }
         ]
       };
    });
    const params = {
      DomainName: config[env].proxiesDomain,
      Items: proxiesAttrItems
    };
    sdb.batchPutAttributes(params, function(err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createProxies(ff, count=1, gasPrice=10) {
  if (count == 0) return;
  console.log(`Creating ${count} proxies..`);

  const from = (await Promise.promisify(web3.eth.getAccounts)())[0];

  const nonce = await Promise.promisify(web3.eth.getTransactionCount)(from);

  function create(nonce) {
    console.log(config[env].ownerAddress);
    console.log(config[env].lockAddress);
    console.log({
      from: from,
      gas: 500000,
      gasPrice: fromGwei(gasPrice),
      nonce: nonce
    });
    ff.create(config[env].ownerAddress, config[env].lockAddress, {
      from: from,
      gas: 500000,
      gasPrice: fromGwei(gasPrice),
      nonce: nonce
    }, function(e,a){ console.log(e); console.log(etherscanLink(a)); });
  }

  for (let i = nonce; i < nonce + count; i++) {
    create(i);
  }

}

async function run(numberOfProxies, gasPrice) {
  console.log(`Env: ${env}`);
  if (numberOfProxies) {
    numberOfProxies = parseInt(numberOfProxies);
  }

  if (gasPrice) {
    gasPrice = parseInt(gasPrice);
  }

  const ff = FishFactory.at(config[env].fishFactory);
  console.log(ff);

  const blockToScanFrom = (await Promise.promisify(web3.eth.getBlockNumber)()) - lookBehindBlocks;

  await createProxies(ff, numberOfProxies, gasPrice);

  while (true) {
    await sleep(10000);
    console.log('Looking for unused proxies on the chain..');
    const newProxies = await getOnchainProxies(ff, blockToScanFrom)
      .then(rejectTaken)
      .then(rejectAlreadyInPool);

    if (newProxies.length > 0) {
      console.log(`New proxies found: ${newProxies}`);
      await addToThePool(newProxies)
        .catch(e => {
          console.error(e);
        });
    }
  }

}

if (!process.argv[2]) {
  console.log('Usage: npm start farmProxies <environment> <count to farm> [<gas price>]\n\nExample: npm start farmProxies staging 5 1');
  process.exit(0);
}

const env = process.argv[2];

run(process.argv[3], process.argv[4]);
