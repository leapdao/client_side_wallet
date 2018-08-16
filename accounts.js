import web3 from './web3';
import Promise from 'bluebird';
import { FishProxy, Nutz } from './contracts';
import BigNumber from 'bignumber.js';
import { toNtz } from './util';

async function run(filename) {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(filename)
  });

  let nutz = Nutz.at("0xe1eda226759825e236831714bcdc0ca0b21fd862");

  lineReader.on('line', function (line) {
    let inv = line.split('\t');
    var proxyAddr = inv[0];
    var proxy = FishProxy.at(proxyAddr);
    proxy.getOwner(function(e, owner) {
      inv.unshift(owner);
      nutz.balanceOf(proxyAddr, function(e, balance) {
        let actualBalance = toNtz(balance);
        inv.splice(3, 0, actualBalance);
        web3.eth.getBalance(proxyAddr, function(e, balance) {
          inv.splice(4, 0, web3.fromWei(balance, 'ether').toNumber());
          console.log(inv.join('\t'));
        });
      });
    });
  });
}

run(process.argv[2]);
