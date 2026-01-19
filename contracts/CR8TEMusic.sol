// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract CR8TEMusic is ERC1155, ERC1155URIStorage, Ownable, ERC2981 {
    uint256 public nextTokenId;

    struct Track {
        uint256 id;
        address artist;
        string uri;
    }

    Track[] public tracks;

    constructor() ERC1155("") Ownable(msg.sender) {}

    function mintTrack(
        string memory _tokenURI,
        uint96 _royaltyFeeNumerator,
        address _royaltyReceiver
    ) public returns (uint256) {
        uint256 tokenId = nextTokenId;
        _mint(msg.sender, tokenId, 1, ""); // Mint 1 edition (Stream-to-Own Master)
        _setURI(tokenId, _tokenURI);

        // Set Royalty to the specified receiver (Artist or Splitter Contract)
        _setTokenRoyalty(tokenId, _royaltyReceiver, _royaltyFeeNumerator);

        // Store Track Data
        tracks.push(Track(tokenId, msg.sender, _tokenURI));

        return tokenId;
    }

    /**
     * @dev Mint a track to a specific address (Server-Side / Gasless Minting)
     * Only the Owner (Admin Wallet) can call this.
     */
    function mintTo(
        address _to,
        string memory _tokenURI,
        uint96 _royaltyFeeNumerator,
        address _royaltyReceiver
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = nextTokenId;
        _mint(_to, tokenId, 1, ""); // Mint 1 edition to the specified user
        _setURI(tokenId, _tokenURI);

        // Set Royalty
        _setTokenRoyalty(tokenId, _royaltyReceiver, _royaltyFeeNumerator);

        // Store Track Data (Artist is the receiver)
        tracks.push(Track(tokenId, _to, _tokenURI));

        nextTokenId++;
        return tokenId;
    }

    function getAllTracks() public view returns (Track[] memory) {
        return tracks;
    }

    // Overrides required by Solidity
    function uri(
        uint256 tokenId
    ) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
