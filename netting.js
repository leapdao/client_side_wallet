import web3 from './web3';
import Promise from 'bluebird';
import { Table, ERC20 } from './contracts';
import BigNumber from 'bignumber.js';

function toNtz(amountBabz) {
  return new BigNumber(amountBabz).div(Math.pow(10, 12));
}

async function run(tableAddress) {
  var table = Table.at(tableAddress);
  console.log(`Table address: ${tableAddress}`);
  var seats = [];
  seats.push(await Promise.promisify(table.seats)(0));
  seats.push(await Promise.promisify(table.seats)(1));
  seats[0][1] = (seats[0][1]).toNumber();
  seats[0][3] = seats[0][3].toNumber();
  seats[1][1] = seats[1][1].toNumber();
  seats[1][3] = seats[1][3].toNumber();

  var tokenAddress = await Promise.promisify(table.tokenAddr)();
  console.log(`Token address: ${tokenAddress}`);
  var token = ERC20.at(tokenAddress);

  var lastHandNetted = (await Promise.promisify(table.lastHandNetted)()).toNumber();
  var lastNettingRequestHandId = (await Promise.promisify(table.lastNettingRequestHandId)()).toNumber();
  console.log(`lastHandNetted: ${lastHandNetted}`);
  console.log(`lastNettingRequestHandId: ${lastNettingRequestHandId}`);
  var sumOfSeatBalances = 0;
  for (var j = 0; j < seats.length; j++) {
    console.log(`\nSeat ${j} -----------`);
    console.log(`Sender: ${seats[j][0]}`);
    console.log(`Balance before netting: ${toNtz(seats[j][1])}`);
    console.log(`Signer: ${seats[j][2]}`);
    console.log(`Exit hand: ${seats[j][3]}`);

    for (var i = lastHandNetted; i <= lastNettingRequestHandId; i++ ) {
      var inp = (await Promise.promisify(table.getIn)(i, seats[j][2])).toNumber();
      var outp = (await Promise.promisify(table.getOut)(i, seats[j][2]))[0].toNumber();
      console.log(`Hand ${i}. In: ${toNtz(inp)}. Out: ${toNtz(outp)}`);
      seats[j][1] = seats[j][1] + outp - inp;
    }
    console.log(`Seat balance after netting: ${toNtz(seats[j][1])}`);
    if (seats[j][3] > 0 && lastNettingRequestHandId >= seats[j][3]) {
        if (seats[j][1] > 0) {
          console.log(`Transfer: ${toNtz(seats[j][1])} to ${seats[j][0]}`);
        }
      }
    sumOfSeatBalances += seats[j][1];
  }

   console.log(`\nSum of the seat balances: ${toNtz(sumOfSeatBalances)}`);
   var totalBalance = (await Promise.promisify(token.balanceOf)(tableAddress)).toNumber();
   console.log(`Table balance: ${toNtz(totalBalance)}`);
   console.log(`Rake: ${toNtz(totalBalance - sumOfSeatBalances)}`);

   process.exit(0);
}

if (!process.argv[2]) {
  console.log('Usage: npm start netting <tableAddress>');
  process.exit(0);
}
run(process.argv[2]);
