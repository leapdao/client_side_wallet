var HDWalletProvider = require(".");
var Web3 = require('web3');
var mnemonic = "";
var provider = new HDWalletProvider(mnemonic, "https://mainnet.infura.io:443", 1);
var web3 = new Web3(provider.engine);
var Promise = require('bluebird');

var table_contract = web3.eth.contract([{"constant":true,"inputs":[],"name":"active","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_handId","type":"uint256"},{"name":"_addr","type":"address"}],"name":"getOut","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"seats","outputs":[{"name":"senderAddr","type":"address"},{"name":"amount","type":"uint256"},{"name":"signerAddr","type":"address"},{"name":"exitHand","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_toggleReceipt","type":"bytes"}],"name":"toggleActive","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"inLineup","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"},{"name":"_pl","type":"bytes32"}],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lastNettingRequestTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastHandNetted","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_sigs","type":"bytes"},{"name":"_newBal1","type":"bytes32"},{"name":"_newBal2","type":"bytes32"}],"name":"settle","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"oracle","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"bytes32[]"}],"name":"submit","outputs":[{"name":"writeCount","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"hands","outputs":[{"name":"claimCount","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_handId","type":"uint256"},{"name":"_addr","type":"address"}],"name":"getIn","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getLineup","outputs":[{"name":"","type":"uint256"},{"name":"addresses","type":"address[]"},{"name":"amounts","type":"uint256[]"},{"name":"exitHands","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastNettingRequestHandId","outputs":[{"name":"","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"},{"name":"_data","type":"bytes"}],"name":"tokenFallback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"net","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"smallBlind","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_token","type":"address"},{"name":"_oracle","type":"address"},{"name":"_smallBlind","type":"uint256"},{"name":"_seats","type":"uint256"},{"name":"_disputeTime","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Join","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hand","type":"uint256"}],"name":"NettingRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"hand","type":"uint256"}],"name":"Netted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addr","type":"address"}],"name":"Leave","type":"event"}]);

var ercC = web3.eth.contract([{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]);

//var tableFactoryContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getTables","outputs":[{"name":"","type":"address[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"disputeTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tables","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"_oracle","type":"address"},{"name":"_disputeTime","type":"uint256"}],"name":"configure","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_smallBlind","type":"uint96"},{"name":"_seats","type":"uint256"}],"name":"create","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"oracleAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"}]);
//var tf = tableFactoryContract.at("0x9508817ad157c1fdc2c9fafc2090a6bfe443c912");

async function run() {
  var tableAddress = "0x81b94ee5dbe3c45aab492069928af651a83d052e";
  var table = table_contract.at(tableAddress);

  var seats = [];
  seats.push(await Promise.promisify(table.seats)(0));
  seats.push(await Promise.promisify(table.seats)(1));
  seats[0][1] = (seats[0][1]).toNumber();
  seats[0][3] = seats[0][3].toNumber();
  seats[1][1] = seats[1][1].toNumber();
  seats[1][3] = seats[1][3].toNumber();
  console.log(seats);

  var tokenAddress = await Promise.promisify(table.tokenAddr)();
  console.log(tokenAddress);
  var token = ercC.at(tokenAddress);

  var lastHandNetted = (await Promise.promisify(table.lastHandNetted)()).toNumber();
  var lastNettingRequestHandId = (await Promise.promisify(table.lastNettingRequestHandId)()).toNumber();
  console.log(`LHN: ${lastHandNetted}`);
  console.log(`LNRH: ${lastNettingRequestHandId}`);
  var sumOfSeatBalances = 0;
  for (var j = 0; j < seats.length; j++) {
    console.log(`Seat balance before netting: ${seats[j][1]}`);
    for (var i = lastHandNetted; i <= lastNettingRequestHandId; i++ ) {
      var inp = (await Promise.promisify(table.getIn)(i, seats[j][2])).toNumber();
      var outp = (await Promise.promisify(table.getOut)(i, seats[j][2]))[1].toNumber();
      seats[j][1] = seats[j][1] + outp - inp;
    }
    console.log(`Seat balance after netting: ${seats[j][1]}`);
    console.log(`Exit hand: ${seats[j][3]}`);
    lastHandNetted = lastNettingRequestHandId;
    if (seats[j][3] > 0 && lastHandNetted >= seats[j][3]) {
        if (seats[j][1] > 0) {
          console.log(`Transfer: ${seat[j][0]} ${seat[j][1]}`);
        }
      }
    sumOfSeatBalances += seats[j][1];
  }

   console.log(`Sum seat balance: ${sumOfSeatBalances}`);
   var totalBalance = (await Promise.promisify(token.balanceOf)(tableAddress)).toNumber();
   console.log(`Table balance: ${totalBalance}`);
   console.log(`Rake: ${totalBalance - sumOfSeatBalances}`);


  console.log('OK');
}

run();
