/**
module to provide a cli for blacklist manipulation - remove once UI is working
*/

import Web3 from 'web3';
import contract from 'truffle-contract';
import jsonfile from 'jsonfile';
import yargs from 'yargs';
import { BABYJUBJUB } from 'config';
import { dec, scalarMult } from './el-gamal';

const web3 = new Web3(
  Web3.givenProvider || new Web3.providers.HttpProvider('http://localhost:8545'),
);

const { GENERATOR } = BABYJUBJUB;

const FTokenShield = contract(jsonfile.readFileSync('./build/contracts/FTokenShield.json'));
FTokenShield.setProvider(web3.currentProvider);

const options = yargs
  .option('D', { alias: 'decrypt', describe: 'Decrypt a transaction', type: 'string' })
  .option('blacklisted', { describe: 'is the address blacklisted?', type: 'string' })
  .option('add', { describe: 'add address to blacklist', type: 'string' })
  .option('list', { describe: 'list accounts on this node', type: 'boolean' })
  .option('remove', { describe: 'remove address from blacklist', type: 'string' }).argv;

function bruteForce(m1) {
  let i = 0;
  let p = [];
  do {
    p = scalarMult(i, GENERATOR);
    i++;
    if (i > 1000000) throw new Error('value range exceeded and no decrypt found');
  } while (p[0] !== m1[0] && p[1] !== m1[1]);
  return i - 1;
}

web3.eth.getAccounts().then(accounts => {
  if (options.list) console.log(accounts);
  FTokenShield.deployed().then(shield => {
    if (options.add) shield.addToblacklist(options.add, { from: accounts[0] });
    if (options.remove) shield.removeFromblacklist(options.remove, { from: accounts[0] });
    if (options.blacklisted)
      shield.isblacklisted.call(options.blacklisted).then(answer => console.log(answer));
    if (options.enable) shield.enableblacklist({ from: accounts[0] });
    if (options.disable) shield.disableblacklist({ from: accounts[0] });
    if (options.decrypt) {
      // first get the encoded data from the transaction
      web3.eth
        .getTransaction(options.decrypt)
        .then(tx => {
          const signature = tx.input.slice(0, 10); // extract the function signature
          const data = tx.input.slice(10);
          console.log('signature', signature);
          const word = [];
          // split the data into 256 bit words
          for (let i = 0; i < data.length / 64; i++) {
            word[i] = '0x'.concat(data.slice(64 * i, 64 * (i + 1)));
          }
          if (signature === '0x7200c4ad') {
            // mint
            const c0 = [BigInt(word[28]), BigInt(word[29])];
            const c1 = [BigInt(word[30]), BigInt(word[31])];
            const c2 = [BigInt(word[32]), BigInt(word[33])];
            const { m1, m2 } = dec(c0, c1, c2);
            console.log('recovered public key was:', m2);
            console.log('brute forcing the value ...');
            console.log('recovered value was:', bruteForce(m1));
          } else if (signature === '0x26ab7021') {
            // transfer
            const ce0 = [BigInt(word[35]), BigInt(word[36])];
            const ce1 = [BigInt(word[37]), BigInt(word[38])];
            const ce2 = [BigInt(word[39]), BigInt(word[40])];
            const cf0 = [BigInt(word[41]), BigInt(word[42])];
            const cf1 = [BigInt(word[43]), BigInt(word[44])];
            const cf2 = [BigInt(word[45]), BigInt(word[46])];
            const { m1: me1, m2: me2 } = dec(ce0, ce1, ce2);
            console.log('recovered recipient public key was:', me2);
            console.log('brute forcing the value ...');
            console.log('recovered value was:', bruteForce(me1));
            const { m1: mf1, m2: mf2 } = dec(cf0, cf1, cf2);
            console.log('recovered sender public key was:', mf2);
            console.log('brute forcing the value ...');
            console.log('recovered value was:', bruteForce(mf1));
          } else throw new Error('Unknown contract signature - is this a ZKP transaction?');
        })
        .catch(err => console.log(err));
    }
  });
});
