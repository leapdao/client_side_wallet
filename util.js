import BigNumber from 'bignumber.js';
import Promise from 'bluebird';

export function toNtz(amountBabz) {
  return new BigNumber(amountBabz).div(Math.pow(10, 12));
}

export function fromGwei(amountGwei) {
  return amountGwei * 1000000000;
}

export async function getSeats(table) {
  var seats = [];
  seats.push(await Promise.promisify(table.seats)(0));
  seats.push(await Promise.promisify(table.seats)(1));
  seats[0][1] = (seats[0][1]).toNumber();
  seats[0][3] = seats[0][3].toNumber();
  seats[1][1] = seats[1][1].toNumber();
  seats[1][3] = seats[1][3].toNumber();
  return seats;
}
