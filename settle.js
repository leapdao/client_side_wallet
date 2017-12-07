import 'dotenv/config';

import Promise from 'bluebird';
import BigNumber from 'bignumber.js';
import web3 from './web3';
import { Receipt } from 'poker-helper';
import { Table, ERC20 } from './contracts';
import { fromGwei, toNtz, getSeats, confirmSubmit } from './util';

const ntzBabz = new BigNumber(Math.pow(10, 12));

async function run(tableAddress, seat0balanceNtz, seat1balanceNtz) {
  const table = Table.at(tableAddress);
  console.log(`Table address: ${tableAddress}`);

  const tokenAddress = await Promise.promisify(table.tokenAddr)();
  const token = ERC20.at(tokenAddress);
  const totalBalance = (await Promise.promisify(token.balanceOf)(tableAddress)).toNumber();
  console.log(`Table balance: ${toNtz(totalBalance)}`);

  const lastHandNetted = (await Promise.promisify(table.lastHandNetted)()).toNumber();
  const lastNettingRequestHandId = (await Promise.promisify(table.lastNettingRequestHandId)()).toNumber();
  console.log(`lastHandNetted: ${lastHandNetted}`);
  console.log(`lastNettingRequestHandId: ${lastNettingRequestHandId}`);

  const oraclePrivKey = process.env.ORACLE_PRIV_KEY;
  const seats = await getSeats(table);
  const seat0pay = ntzBabz.mul(seat0balanceNtz);
  const seat1pay = ntzBabz.mul(seat1balanceNtz);

  const seat0payoutDiff = seat0pay.sub(seats[0][1]);
  const seat1payoutDiff = seat1pay.sub(seats[1][1]);

  const receipt = new Receipt(tableAddress)
    .settle(lastHandNetted, lastNettingRequestHandId, [seat0payoutDiff, seat1payoutDiff])
    .sign(oraclePrivKey);

  console.log(`Raw settle receipt:`)
  console.log(receipt);
  console.log(`\nFor params:`)
  const params = Receipt.parseToParams(receipt);
  console.log(params);
  console.log(`\nParsed:`)
  console.log(Receipt.parse(receipt));
  console.log('');


  let networkParams = {
    from: (await Promise.promisify(web3.eth.getAccounts)())[0],
    gas: 300000,
    gasPrice: fromGwei(45)
  };

  table.settle.estimateGas(...params, networkParams, function(err, estimatedGas) {
    if (!estimatedGas || estimatedGas >= networkParams.gas) {
      console.log(`Too much gas estimated: ${estimatedGas}`);
      return process.exit(0);
    }
    networkParams.gas = estimatedGas;

    console.log(`\nNetwork params:\n`);
    console.log(networkParams);

    console.log('\nAbout to settle:')
    console.log(`Seat 0 payout: ${toNtz(seat0pay)} NTZ to ${seats[0][0]} (${toNtz(seat0payoutDiff)} NTZ)`);
    console.log(`Seat 1 payout: ${toNtz(seat1pay)} NTZ to ${seats[1][0]} (${toNtz(seat1payoutDiff)} NTZ)`);
    console.log(`Rake: ${toNtz(new BigNumber(totalBalance).sub(seat0pay).sub(seat1pay))}\n`);

    confirmSubmit(() => {
      console.log('Submitting tx..');
      return;
      table.settle(...params, networkParams, function(err, tx) {
        console.log(err);
        console.log(`https://etherscan.io/tx/${tx}`);
        process.exit(0);
      });
    });
  });
}

if (!process.argv[4]) {
  console.log('Usage: npm start settle <tableAddress> <seat 0 target balance NTZ> <seat 1 target balance NTZ>');
  process.exit(0);
}
run(process.argv[2], process.argv[3], process.argv[4]);
