import { Router } from 'express';
import { erc20, elgamal } from '@eyblockchain/nightlite';
import contract from 'truffle-contract';

import utils from '../zkpUtils';
import fTokenController from '../f-token-controller';
import { getTruffleContractInstance } from '../contractUtils';

const router = Router();
elgamal.setAuthorityPrivateKeys(); // setup test keys

/**
 * This function is to mint a fungible token commitment
 * req.body = {
 *  value: 20,
 *  owner: {
 *    name: 'alice',
 *    publicKey: '0x70dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af36b8'
 *  }
 * }
 * @param {*} req
 * @param {*} res
 */
async function mint(req, res, next) {
  const { address } = req.headers;
  const { value, owner } = req.body;
  const salt = await utils.rndHex(32);
  const {
    contractJson: fTokenShieldJson,
    contractInstance: fTokenShield,
  } = await getTruffleContractInstance('FTokenShield');

  try {
    const { commitment, commitmentIndex } = await erc20.mint(
      value,
      owner.publicKey,
      salt,
      {
        fTokenShieldJson,
        fTokenShieldAddress: fTokenShield.address,
        account: address,
      },
      {
        codePath: `${process.cwd()}/code/gm17/ft-mint/out`,
        outputDirectory: `${process.cwd()}/code/gm17/ft-mint`,
        pkPath: `${process.cwd()}/code/gm17/ft-mint/proving.key`,
      },
    );
    res.data = {
      commitment,
      commitmentIndex,
      salt,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function is to tramsfer a fungible token commitment to a receiver
 * req.body = {
 *  inputCommitments: [{
 *      value: '0x00000000000000000000000000002710',
 *      salt: '0x14de022c9b4a437b346f04646bd7809deb81c38288e9614478351d',
 *      commitment: '0x39aaa6fe40c2106f49f72c67bc24d377e180baf3fe211c5c90e254',
 *      commitmentIndex: 0,
 *      owner,
 *  }],
 *  outputCommitments: [],
 *  receiver: {
 *    name: 'bob',
 *    publicKey: '0x70dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af36b8'
 *  }
 *  sender: {
 *    name: 'alice',
 *    secretKey: '0x30dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af3603'
 *  }
 * }
 * @param {*} req
 * @param {*} res
 */
async function transfer(req, res, next) {
  const { address } = req.headers;
  const { inputCommitments, outputCommitments, receiver, sender } = req.body;
  const {
    contractJson: fTokenShieldJson,
    contractInstance: fTokenShield,
  } = await getTruffleContractInstance('FTokenShield');

  outputCommitments[0].salt = await utils.rndHex(32);
  outputCommitments[1].salt = await utils.rndHex(32);

  try {
    const { txReceipt } = await erc20.transfer(
      inputCommitments,
      outputCommitments,
      receiver.publicKey,
      sender.secretKey,
      {
        fTokenShieldJson,
        fTokenShieldAddress: fTokenShield.address,
        account: address,
      },
      {
        codePath: `${process.cwd()}/code/gm17/ft-transfer/out`,
        outputDirectory: `${process.cwd()}/code/gm17/ft-transfer`,
        pkPath: `${process.cwd()}/code/gm17/ft-transfer/proving.key`,
      },
    );
    res.data = { outputCommitments, txReceipt };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function is to burn a fungible token commitment
 * req.body = {
 *  value: 20,
 *  salt: '0x14de022c9b4a437b346f04646bd7809deb81c38288e9614478351d',
 *  commitment: '0x39aaa6fe40c2106f49f72c67bc24d377e180baf3fe211c5c90e254',
 *  commitmentIndex: 0,
 *  receiver: {
 *    name: 'bob',
 *    address: '0x70dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af36b8'
 *  }
 *  sender: {
 *    name: 'alice',
 *    secretKey: '0x30dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af3603'
 *  }
 * }
 * @param {*} req
 * @param {*} res
 */
async function burn(req, res, next) {
  const { value, salt, commitment, commitmentIndex, receiver, sender } = req.body;
  const { address } = req.headers;
  const {
    contractJson: fTokenShieldJson,
    contractInstance: fTokenShield,
  } = await getTruffleContractInstance('FTokenShield');

  try {
    await erc20.burn(
      value,
      sender.secretKey,
      salt,
      commitment,
      commitmentIndex,
      {
        fTokenShieldJson,
        fTokenShieldAddress: fTokenShield.address,
        account: address,
        tokenReceiver: receiver.address,
      },
      {
        codePath: `${process.cwd()}/code/gm17/ft-burn/out`,
        outputDirectory: `${process.cwd()}/code/gm17/ft-burn`,
        pkPath: `${process.cwd()}/code/gm17/ft-burn/proving.key`,
      },
    );
    res.data = { message: 'Burn successful' };
    next();
  } catch (err) {
    next(err);
  }
}

async function checkCorrectness(req, res, next) {
  console.log('\nzkp/src/routes/ft-commitment', '\n/checkCorrectness', '\nreq.body', req.body);

  try {
    const { address } = req.headers;
    const { value, salt, pk, commitment, commitmentIndex, blockNumber } = req.body;

    const results = await fTokenController.checkCorrectness(
      value,
      pk,
      salt,
      commitment,
      commitmentIndex,
      blockNumber,
      address,
    );
    res.data = results;
    next();
  } catch (err) {
    next(err);
  }
}

async function setFTCommitmentShieldAddress(req, res, next) {
  const { address } = req.headers;
  const { ftCommitmentShield } = req.body;

  try {
    await fTokenController.setShield(ftCommitmentShield, address);
    await fTokenController.getBalance(address);
    res.data = {
      message: 'FTokenShield Address Set.',
    };
    next();
  } catch (err) {
    next(err);
  }
}

async function getFTCommitmentShieldAddress(req, res, next) {
  const { address } = req.headers;

  try {
    const shieldAddress = await fTokenController.getShieldAddress(address);
    const { name } = await fTokenController.getTokenInfo(address);
    res.data = {
      shieldAddress,
      name,
    };
    next();
  } catch (err) {
    next(err);
  }
}

async function unsetFTCommitmentShieldAddress(req, res, next) {
  const { address } = req.headers;

  try {
    fTokenController.unSetShield(address);
    res.data = {
      message: 'CoinShield Address Unset.',
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function will do batch fungible commitment transfer
 * req.body {
 *    inputCommitments: [{
 *      value: "0x00000000000000000000000000000028",
 *      salt: "0x75f9ceee5b886382c4fe81958da985cd812303b875210b9ca2d75378bb9bd801",
 *      commitment: "0x00000000008ec724591fde260927e3fcf85f039de689f4198ee841fcb63b16ed",
 *      commitmentIndex: 1,
 *    }],
 *    outputCommitments: [
 *      {
 *        "value": "0x00000000000000000000000000000002",
 *        "receiver": {
 *          name: "b",
 *        }
 *      },
 *      {
 *        "value": "0x00000000000000000000000000000002",
 *        "receiver": {
 *          name: "a",
 *        }
 *      }
 *    ],
 *  sender: {
 *    name: 'alice',
 *    secretKey: '0x30dd53411043c9ff4711ba6b6c779cec028bd43e6f525a25af3603'
 *  }
  }
 * @param {*} req
 * @param {*} res
 */
async function simpleFTCommitmentBatchTransfer(req, res, next) {
  const { address } = req.headers;
  const { inputCommitment, outputCommitments, sender } = req.body;
  const {
    contractJson: fTokenShieldJson,
    contractInstance: fTokenShield,
  } = await getTruffleContractInstance('FTokenShield');
  const receiversPublicKeys = [];

  if (!outputCommitments || outputCommitments.length !== 20) throw new Error('Invalid data input');

  for (const data of outputCommitments) {
    /* eslint-disable no-await-in-loop */
    data.salt = await utils.rndHex(32);
    receiversPublicKeys.push(data.receiver.publicKey);
  }

  try {
    const { maxOutputCommitmentIndex, txReceipt } = await erc20.simpleFungibleBatchTransfer(
      inputCommitment,
      outputCommitments,
      receiversPublicKeys,
      sender.secretKey,
      {
        account: address,
        fTokenShieldJson,
        fTokenShieldAddress: fTokenShield.address,
      },
      {
        codePath: `${process.cwd()}/code/gm17/ft-batch-transfer/out`,
        outputDirectory: `${process.cwd()}/code/gm17/ft-batch-transfer`,
        pkPath: `${process.cwd()}/code/gm17/ft-batch-transfer/proving.key`,
      },
    );

    let lastCommitmentIndex = parseInt(maxOutputCommitmentIndex, 10);

    outputCommitments.forEach((transferCommitment, indx) => {
      outputCommitments[indx].commitmentIndex =
        lastCommitmentIndex - (outputCommitments.length - 1);
      lastCommitmentIndex += 1;
    });

    res.data = {
      outputCommitments,
      txReceipt,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function will blacklist an account address.
 * req.body {
 *    malfeasantAddress: "0x137246e44b7b9e2f1e3ca8530e16d515bb1db586"
 * }
 * @param {*} req
 * @param {*} res
 */
async function setAddressToBlacklist(req, res, next) {
  const { address } = req.headers;
  const { malfeasantAddress } = req.body;
  try {
    const {
      contractJson: fTokenShieldJson,
      contractInstance: fTokenShield,
    } = await getTruffleContractInstance('FTokenShield');

    await erc20.blacklist(malfeasantAddress, {
      account: address,
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address,
    });
    res.data = { message: 'added to blacklist' };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function will remove an account address from blacklist.
 * req.body {
 *    blacklistedAddress: "0x137246e44b7b9e2f1e3ca8530e16d515bb1db586"
 * }
 * @param {*} req
 * @param {*} res
 */
async function unsetAddressFromBlacklist(req, res, next) {
  const { address } = req.headers;
  const { blacklistedAddress } = req.body;
  try {
    const {
      contractJson: fTokenShieldJson,
      contractInstance: fTokenShield,
    } = await getTruffleContractInstance('FTokenShield');

    await erc20.unblacklist(blacklistedAddress, {
      account: address,
      fTokenShieldJson,
      fTokenShieldAddress: fTokenShield.address,
    });
    res.data = { message: 'removed from blacklist' };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function return transaction object from transaction hash.
 * req.body {
 *    txHash: "0xb7b47b1ac480694ccf196b31ebffb114e9cb4630fa9f132baf037fc475c3bc1d",
 *  ` type: Transfer`
 * }
 * @param {*} req
 * @param {*} res
 */
async function decodeTransaction(req, res, next) {
  const { txHash, type, publicKeys } = req.body;
  let guessers = [];

  if (type === 'Transfer') {
    guessers = [elgamal.rangeGenerator(1000000000), publicKeys, publicKeys];
  } else {
    // case burn
    guessers = [publicKeys];
  }

  try {
    const { contractJson: fTokenShieldJson } = await getTruffleContractInstance('FTokenShield');

    const txReceipt = await fTokenController.getTxRecipt(txHash);
    const fTokenShieldEvents = contract(fTokenShieldJson).events;

    if (!txReceipt) throw Error('No Transaction receipt found.');

    for (const log of txReceipt.logs) {
      log.event = '';
      log.args = [];

      const event = fTokenShieldEvents[log.topics[0]];
      if (event) {
        log.event = event.name;
        log.args = await fTokenController.getTxLogDecoded(event.inputs, log.data);
      }
    }

    res.data = await erc20.decryptTransaction(txReceipt, {
      type,
      guessers,
    });
    next();
  } catch (err) {
    next(err);
  }
}

router.post('/mintFTCommitment', mint);
router.post('/transferFTCommitment', transfer);
router.post('/burnFTCommitment', burn);
router.post('/checkCorrectnessForFTCommitment', checkCorrectness);
router.post('/setFTokenShieldContractAddress', setFTCommitmentShieldAddress);
router.get('/getFTokenShieldContractAddress', getFTCommitmentShieldAddress);
router.delete('/removeFTCommitmentshield', unsetFTCommitmentShieldAddress);
router.post('/simpleFTCommitmentBatchTransfer', simpleFTCommitmentBatchTransfer);
router.post('/setAddressToBlacklist', setAddressToBlacklist);
router.post('/unsetAddressFromBlacklist', unsetAddressFromBlacklist);
router.post('/decodeTransaction', decodeTransaction);

export default router;
