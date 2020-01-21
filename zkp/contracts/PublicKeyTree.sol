
contract PublicKeyTree {
uint256 public constant treeHeight = 32;
uint256 public constant treeWidth = 2 ** treeHeight; // 2 ** treeHeight

  /**
  To implement blacklisting, we need a merkle tree of whitelisted public keys. Unfortunately
  this can't use Timber because we need to change leaves after creating them.  Therefore we
  need to store the tree in this contract and use a full update algorithm:
  Updates each node of the Merkle Tree on the path from leaf to root.
  p - is the leafIndex of the new token within M.
  */
  function updatePathToRoot(uint p) private returns (bytes27) {

  /*
  If Z were the token, then the p's mark the 'path', and the s's mark the 'sibling path'
                   p
          p                  s
     s         p        EF        GH
  A    B    Z    s    E    F    G    H
  */

      uint s; //s is the 'sister' path of p.
      uint t; //temp index for the next p (i.e. the path node of the row above)
      for (uint r = merkleDepth-1; r > 0; r--) {
          if (p%2 == 0) { //p even index in M
              s = p-1;
              t = (p-1)/2;
              M[t] = bytes27(sha256(abi.encodePacked(M[s],M[p]))<<40);
          } else { //p odd index in M
              s = p+1;
              t = p/2;
              M[t] = bytes27(sha256(abi.encodePacked(M[p],M[s]))<<40);
          }
          p = t; //move to the path node on the next highest row of the tree
      }
      return M[0]; //the root of M
  }
}
