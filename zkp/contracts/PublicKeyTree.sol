
pragma solidity ^0.5.8;

import "./MiMC.sol";
import "./Ownable.sol";

contract PublicKeyTree is MiMC, Ownable {
  uint256 internal constant TREE_HEIGHT = 32; // here we define height so that a tree consisting of just a root would have a height of 0
  uint256 internal constant FIRST_LEAF_INDEX = 2**(TREE_HEIGHT) - 1; //this is the difference between a node index (numbered from the root=0) and a leaf index (numbered from the first leaf on the left=0)
  uint256 private constant q = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
  mapping (uint256 => bytes32) public M; //storage for the Merkle Tree nodes
  mapping (bytes32 => uint256) public L; // lookup for a leaf index
  mapping (address => bytes32) internal keyLookup; // stores a lookup of the zkp public key if you know the ETH address
  uint256 internal nextAvailableIndex = FIRST_LEAF_INDEX; //holds the next empty slot that we can store a key in
  mapping (address => uint256) internal blacklist;
  mapping (bytes32 => bytes32) internal publicKeyRoots; //list of all valid roots

  /**
  This function adds a key to the Merkle tree at the next available leaf
  updating state variables as needed.
  */
  function addPublicKeyToTree(bytes32 key) internal {
    // firstly we need to mod the key to Fq(zok) because that's what Zokrates and MiMC will do
    key = bytes32(uint256(key) % q);
    require(M[nextAvailableIndex] == 0, "Trying to add key to a non-empty leaf");
    require(L[key] == 0, "The key being added is already in the Public Key tree");
    M[nextAvailableIndex] = key;
    L[key] = nextAvailableIndex; // reverse lookup for a leaf
    bytes32 root = updatePathToRoot(nextAvailableIndex++);
    publicKeyRoots[root] = root;
  }

  function blacklistAddress(address addr) external onlyOwner {
    //add the malfeasant to the blacklist
    blacklist[addr] = 1; // there is scope here for different 'blacklisting codes'
    // remove them from the Merkle tree
    bytes32 blacklistedKey = bytes32(uint256(keyLookup[addr]) % q); //keyLookup stores the key before conversition to Fq
    require(uint256(blacklistedKey) != 0, 'The key being blacklisted does not exist');
    uint256 blacklistedIndex = L[blacklistedKey];
    require(blacklistedIndex >= FIRST_LEAF_INDEX, 'The blacklisted index is not that of a leaf');
    delete M[blacklistedIndex];
    // delete L[blacklistedKey]; may as well keep this so that the sibling path calculation can still run (but won't prove)
    // and recalculate the root
    bytes32 root = updatePathToRoot(blacklistedIndex);
    publicKeyRoots[root] = root;
  }

  /**
  To implement blacklisting, we need a merkle tree of whitelisted public keys. Unfortunately
  this can't use Timber because we need to change leaves after creating them.  Therefore we
  need to store the tree in this contract and use a full update algorithm:
  Updates each node of the Merkle Tree on the path from leaf to root.
  p - is the Index of the new token within M.
  */
  function updatePathToRoot(uint256 p) internal returns (bytes32) {

  /*
  If Z were the token, then the p's mark the 'path', and the s's mark the 'sibling path'
                   p
          p                  s
     s         p        EF        GH
  A    B    Z    s    E    F    G    H
  */

    uint256 s; //s is the 'sister' path of p.
    uint256 t; //temp index for the next p (i.e. the path node of the row above)
    for (uint256 r = TREE_HEIGHT; r > 0; r--) {
      if (p%2 == 0) { //p even index in M
        s = p-1;
        t = (p-1)/2;
        M[t] = mimcHash2([M[s],M[p]]);
      } else { //p odd index in M
        s = p+1;
        t = p/2;
        M[t] = mimcHash2([M[p],M[s]]);
      }
      p = t; //move to the path node on the next highest row of the tree
    }
    return M[0]; //the root of M
  }
}
