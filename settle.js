import 'dotenv/config';

import Promise from 'bluebird';
import BigNumber from 'bignumber.js';
import web3 from './web3';
import { Receipt } from 'poker-helper';
import { Table, ERC20 } from './contracts';

async function run(tableAddress) {
  let table = Table.at(tableAddress);
  console.log(`Table address: ${tableAddress}`);

  let oraclePrivKey = process.env.ORACLE_PRIV_KEY;

  var half_rake = new BigNumber(-50000000000);

  var receipt = new Receipt(tableAddress)
    //.settle(16, 17, [half_rake, half_rake]) // uncomment and adjust balance diffs and hands
    .sign(oraclePrivKey);

  console.log(`Raw settle receipt:`)
  console.log(receipt);
  console.log(`\nFor params:`)
  let params = Receipt.parseToParams(receipt);
  console.log(params);
  console.log(`\nParsed:`)
  console.log(Receipt.parse(receipt));
  console.log('');


  let networkParams = {
    from: (await Promise.promisify(web3.eth.getAccounts)())[0],
    gas: 300000,
    gasPrice: 5000000000 // 5 gwei
  };

  console.log(networkParams);

  table.settle.estimateGas(...params, networkParams, function(err, tx) { // remove estimateGas to send tx
    console.log(err);
    console.log(`https://etherscan.io/tx/${tx}`);
    process.exit(0);
  });
}

if (!process.argv[2]) {
  console.log('Usage: npm start settle <tableAddress>');
  process.exit(0);
}
run(process.argv[2]);
