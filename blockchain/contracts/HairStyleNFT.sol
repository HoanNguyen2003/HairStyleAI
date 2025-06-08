// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HairStyleNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    struct HairStyle {
        address creator;
        string originalImageHash;
        string resultImageHash;
        string hairType;
        string colorType;
        uint256 timestamp;
        uint256 likes;
        bool isForSale;
        uint256 price;
    }
    
    mapping(uint256 => HairStyle) public hairStyles;
    mapping(address => mapping(uint256 => bool)) public hasLikedToken;
    mapping(address => uint256[]) private _creatorTokens;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _tokensForSale;
    
    // ✅ Add marketplace contract address for authorization
    address public marketplaceContract;
    
    event HairStyleMinted(uint256 indexed tokenId, address indexed creator, string hairType, string colorType);
    event HairStyleLiked(uint256 indexed tokenId, address indexed liker);
    event HairStyleListedForSale(uint256 indexed tokenId, uint256 price);
    event HairStyleRemovedFromSale(uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("HairStyleNFT", "HAIR") Ownable(initialOwner) {}

    // ✅ Set marketplace contract address (only owner can call)
    function setMarketplaceContract(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplaceContract = _marketplace;
    }

    function mintHairStyle(
        address to,
        string memory uri,
        string memory originalImageHash,
        string memory resultImageHash,
        string memory hairType,
        string memory colorType
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        hairStyles[tokenId] = HairStyle({
            creator: to,
            originalImageHash: originalImageHash,
            resultImageHash: resultImageHash,
            hairType: hairType,
            colorType: colorType,
            timestamp: block.timestamp,
            likes: 0,
            isForSale: false,
            price: 0
        });
        
        _creatorTokens[to].push(tokenId);
        
        emit HairStyleMinted(tokenId, to, hairType, colorType);
        return tokenId;
    }

    // ✅ OpenZeppelin 5.x: Use _update instead of _beforeTokenTransfer
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Call parent _update first
        address previousOwner = super._update(to, tokenId, auth);
        
        // ✅ CRITICAL FIX: Auto-clear sale status when ownership changes
        if (from != address(0) && from != to && hairStyles[tokenId].isForSale) {
            // Clear sale status when NFT is transferred
            hairStyles[tokenId].isForSale = false;
            hairStyles[tokenId].price = 0;
            
            // Remove from _tokensForSale array
            _removeFromTokensForSaleArray(tokenId);
            
            emit HairStyleRemovedFromSale(tokenId);
        }
        
        // Handle ownership tracking after transfer
        if (from != address(0) && from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        
        if (to != address(0) && from != to) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
        
        return previousOwner;
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = length;
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }

    // ✅ Helper function to remove from _tokensForSale array
    function _removeFromTokensForSaleArray(uint256 tokenId) private {
        for (uint i = 0; i < _tokensForSale.length; i++) {
            if (_tokensForSale[i] == tokenId) {
                _tokensForSale[i] = _tokensForSale[_tokensForSale.length - 1];
                _tokensForSale.pop();
                break;
            }
        }
    }

    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function getCreatorTokens(address creator) public view returns (uint256[] memory) {
        return _creatorTokens[creator];
    }

    function likeHairStyle(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!hasLikedToken[msg.sender][tokenId], "Already liked this NFT");
        
        hairStyles[tokenId].likes++;
        hasLikedToken[msg.sender][tokenId] = true;
        
        emit HairStyleLiked(tokenId, msg.sender);
    }

    function listForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!hairStyles[tokenId].isForSale, "Already listed for sale");
        
        hairStyles[tokenId].isForSale = true;
        hairStyles[tokenId].price = price;
        _tokensForSale.push(tokenId);
        
        emit HairStyleListedForSale(tokenId, price);
    }

    // ✅ UPDATED: Allow marketplace to remove from sale
    function removeFromSale(uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender || 
            owner() == msg.sender || 
            msg.sender == marketplaceContract, // ✅ Allow marketplace to clear sale status
            "Not authorized to remove from sale"
        );
        require(hairStyles[tokenId].isForSale, "Not listed for sale");
        
        hairStyles[tokenId].isForSale = false;
        hairStyles[tokenId].price = 0;
        
        _removeFromTokensForSaleArray(tokenId);
        
        emit HairStyleRemovedFromSale(tokenId);
    }

    function getTokensForSale() public view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _tokensForSale.length; i++) {
            if (hairStyles[_tokensForSale[i]].isForSale) {
                activeCount++;
            }
        }
        
        uint256[] memory activeTokens = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < _tokensForSale.length; i++) {
            if (hairStyles[_tokensForSale[i]].isForSale) {
                activeTokens[currentIndex] = _tokensForSale[i];
                currentIndex++;
            }
        }
        
        return activeTokens;
    }

    function getTotalTokens() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function isTokenForSale(uint256 tokenId) public view returns (bool) {
        return hairStyles[tokenId].isForSale;
    }

    function getTokenPrice(uint256 tokenId) public view returns (uint256) {
        require(hairStyles[tokenId].isForSale, "Token not for sale");
        return hairStyles[tokenId].price;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getTokenInfo(uint256 tokenId) public view returns (
        address owner,
        address creator,
        string memory hairType,
        string memory colorType,
        uint256 likes,
        bool isForSale,
        uint256 price,
        uint256 timestamp
    ) {
        require(exists(tokenId), "Token does not exist");
        
        HairStyle memory hairStyle = hairStyles[tokenId];
        
        return (
            ownerOf(tokenId),
            hairStyle.creator,
            hairStyle.hairType,
            hairStyle.colorType,
            hairStyle.likes,
            hairStyle.isForSale,
            hairStyle.price,
            hairStyle.timestamp
        );
    }

    function getMultipleTokensInfo(uint256[] memory tokenIds) public view returns (
        address[] memory owners,
        uint256[] memory prices,
        bool[] memory forSale
    ) {
        owners = new address[](tokenIds.length);
        prices = new uint256[](tokenIds.length);
        forSale = new bool[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (exists(tokenIds[i])) {
                owners[i] = ownerOf(tokenIds[i]);
                prices[i] = hairStyles[tokenIds[i]].price;
                forSale[i] = hairStyles[tokenIds[i]].isForSale;
            }
        }
        
        return (owners, prices, forSale);
    }

    function emergencyRemoveFromSale(uint256 tokenId) external onlyOwner {
        require(exists(tokenId), "Token does not exist");
        
        if (hairStyles[tokenId].isForSale) {
            hairStyles[tokenId].isForSale = false;
            hairStyles[tokenId].price = 0;
            
            _removeFromTokensForSaleArray(tokenId);
            
            emit HairStyleRemovedFromSale(tokenId);
        }
    }

    function emergencyTransfer(address from, address to, uint256 tokenId) external onlyOwner {
        require(exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == from, "From address is not the owner");
        
        _transfer(from, to, tokenId);
    }
}