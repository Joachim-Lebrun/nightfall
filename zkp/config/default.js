import { deferConfig as defer } from 'config/defer';

/* PATH NAMING CONVENTIONS:

FILENAME_FILEPATH - path up to and including a file called /fileName.extension


DIRNAME_DIRPATH - path to inside a folder called /dirName/.
E.g. for .../parentDir/dirName/fileName.extension, DIRNAME_DIRPATH is to within .../parentDir/dirName/

FILENAME_DIRPATH - path to inside the folder which contains fileName.extension.
E.g. for .../dirName/fileName.extension, FILENAME_DIRPATH is to within .../dirName/


DIRNAME_PARENTPATH - path to inside the parent directory of a directory. E.g. for /parentDir/dirName/fileName.extension, DIRNAME_PARENTPATH is to /parentDir/

FILENAME_PARENTPATH - path to inside the parent directory of a file's containing folder.
E.g. for .../parentDir/dirName/filename.extension, FILENAME_PARENTPATH is .../parentDir/

REL - relative path (relative from process.env.PWD, which in our repo is from path-to-/nightfall/zkp/) (the ./nightfall shell script executes all of this zkp node code from within path-to/zkp/)
i.e. DIRNAME_DIRPATH_REL: "/dirName/" is a relative path which (on the host machine) points to: path-to-/nightfall/zkp/dirName/

ABS - absolute path
*/
module.exports = {
  // Tree parameters. You also need to set these in the MerkleTree.sol contract, and in Nightfall's ./config/merkle-tree/default.js config file.
  LEAF_HASHLENGTH: 32, // expected length of an input to a hash in bytes
  NODE_HASHLENGTH: 27, // expected length of inputs to hashes up the merkle tree, in bytes
  PUBLIC_KEY_TREE_HEIGHT: 32, // Height of the PUBLIC KEY Merkle tree (defined so that of there was just a root, height would be 0)
  // *****

  BATCH_PROOF_SIZE: 20, // the number of proofs in a batch (you will need to redo the proofs if you change this)

  // *****
  // the various parameters needed to describe the Babyjubjub curve that we use for El-Gamal
  BABYJUBJUB: {
    JUBJUBA: BigInt(168700),
    JUBJUBD: BigInt(168696),
    INFINITY: [BigInt(0), BigInt(1)],
    GENERATOR: [
      BigInt('16540640123574156134436876038791482806971768689494387082833631921987005038935'),
      BigInt('20819045374670962167435360035096875258406992893633759881276124905556507972311'),
    ],
    JUBJUBE: BigInt(
      '21888242871839275222246405745257275088614511777268538073601725287587578984328',
    ),
    JUBJUBC: BigInt(8),
    MONTA: BigInt(168698),
    MONTB: BigInt(1),
  },
  // Private keys we can use for test purposes
  TEST_PRIVATE_KEYS: [
    BigInt('1725287587578984328'),
    BigInt('1451177726853807360'),
    BigInt('2464057452572750886'),
  ],

  ZOKRATES_PRIME: BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
  ), // decimal representation of the prime p of GaloisField(p)

  // *****

  ZOKRATES_PACKING_SIZE: '128', // ZOKRATES_PRIME is approx 253-254bits (just shy of 256), so we pack field elements into blocks of 128 bits.

  VK_PATHS: {
    NFTokenShield: {
      mint: './code/gm17/nft-mint/nft-mint-vk.json',
      transfer: './code/gm17/nft-transfer/nft-transfer-vk.json',
      burn: './code/gm17/nft-burn/nft-burn-vk.json',
    },
    FTokenShield: {
      mint: './code/gm17/ft-mint/ft-mint-vk.json',
      transfer: './code/gm17/ft-transfer/ft-transfer-vk.json',
      simpleBatchTransfer: './code/gm17/ft-batch-transfer/ft-batch-transfer-vk.json',
      burn: './code/gm17/ft-burn/ft-burn-vk.json',
    },
  },

  GASPRICE: 20000000000,

  web3ProviderURL: defer(function getWeb3ProviderURL() {
    return `${process.env.BLOCKCHAIN_HOST}:${process.env.BLOCKCHAIN_PORT}`;
  }),

  merkleTree: {
    host: process.env.MERKLE_TREE_HOST,
    port: process.env.MERKLE_TREE_PORT,
    url: defer(function getAccountURL() {
      return `${this.merkleTree.host}:${this.merkleTree.port}`;
    }),
  },

  POLLING_FREQUENCY: 6000, // How many milliseconds to wait between each poll

  zkpCodeVolume: process.env.ZKP_CODE_VOLUME,
};
