import web3 from './web3';
import Promise from 'bluebird';
import { Receipt } from 'poker-helper';
import { Table, ERC20 } from './contracts';
import BigNumber from 'bignumber.js';
import { fromGwei, toNtz, getSeats, confirmSubmit } from './util';

async function run(tableAddress, receiptBin) {
  var table = Table.at(tableAddress);
  console.log(`Table address: ${tableAddress}`);
  let params = Receipt.parseToParams(receiptBin);
  console.log('\nReceipt:\n');
  console.log(params);
  let receipt = Receipt.parse(receiptBin);
  console.log(receipt);

  let seats = await getSeats(table);
  if (seats.findIndex((s) => s[2] == receipt.leaverAddr ) < 0) {
    console.log(`Player is not at the table: ${receipt.leaverAddr}`);
    return process.exit(0);
  }

  let networkParams = {
    from: (await Promise.promisify(web3.eth.getAccounts)())[0],
    gas: 300000,
    gasPrice: fromGwei(45)
  };

  table.leave.estimateGas(...params, networkParams, function(err, estimatedGas) {
    if (!estimatedGas || estimatedGas >= networkParams.gas) {
      console.log(`Too much gas estimated: ${estimatedGas}`);
      return process.exit(0);
    }
    networkParams.gas = estimatedGas;
    console.log(`\nNetwork params:\n`);
    console.log(networkParams);

    confirmSubmit(() => {
      console.log('Submitting tx..');
      table.leave(...params, networkParams, function(err, tx) {
        if (err) {
          console.log(err);
          return process.exit(0);
        }
        console.log('Tx submitted.')
        console.log(`\nhttps://etherscan.io/tx/${tx}`);
        process.exit(0);
      });
    });
  });
  return;
}

if (!process.argv[3]) {
  console.log('Usage: npm start leave <tableAddress> <receipt>');
  process.exit(0);
}
run(process.argv[2], process.argv[3]);
