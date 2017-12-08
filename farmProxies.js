import web3 from './web3';
import Promise from 'bluebird';
import { Table, ERC20, FishFactory } from './contracts';
import BigNumber from 'bignumber.js';
import { fromGwei, toNtz, getSeats } from './util';
import AWS from 'aws-sdk';

AWS.config = {
  region: 'eu-west-1',
};

const ffAddr = '0x869bdbb21bf8703353c16e2f3a19f937d14ea7c5';
const domainName = 'pr-accounts';
const proxiesDomain = 'pr-proxies';
const sdb = new AWS.SimpleDB({ region : 'eu-west-1' });

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
      SelectExpression: "select proxyAddr from `" + domainName + "` where proxyAddr IN ('" + proxies.join("','") + "')"
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
      SelectExpression: "select ItemName from `" + proxiesDomain + "` where ItemName() IN ('" + proxies.join("','") + "')"
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
    var params = {
      DomainName: proxiesDomain,
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

async function createProxies(ff, count=1, gasPrice=1) {
  const from = (await Promise.promisify(web3.eth.getAccounts)())[0];

  const nonce = await Promise.promisify(web3.eth.getTransactionCount)(from);

  function create(nonce) {
    ff.create('0x4b678e549c71e1b15d257a67aac281df5f006f7d', '0xeaaa9055cd3ec255ecad3e3620705a2f99d8d032', {
      from: from,
      gas: 500000,
      gasPrice: fromGwei(gasPrice),
      nonce: nonce
    }, function(e,a){ console.log(e); console.log(`https://etherscan.io/tx/${a}`); });
  }

  for (let i = nonce; i < nonce + count; i++) {
    create(i);
  }

}

async function run(numberOfProxies, gasPrice) {
  if (numberOfProxies) {
    numberOfProxies = parseInt(numberOfProxies);
  }

  if (gasPrice) {
    gasPrice = parseInt(gasPrice);
  }

  const ff = FishFactory.at(ffAddr);

  const blockToScanFrom = (await Promise.promisify(web3.eth.getBlockNumber)()) - 10;

  await createProxies(ff, numberOfProxies, gasPrice);

  while (true) {
    await sleep(10000);
    console.log('Looking for new proxies mined..');
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
  console.log('Usage: npm start farmProxies <count to farm> [<gas price>]');
  process.exit(0);
}

run(process.argv[2], process.argv[3]);
