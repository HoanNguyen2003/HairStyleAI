// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./HairStyleNFT.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    struct Sale {
        address seller;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Sale) public sales;
    uint256[] private listedTokenIds;
    uint256 public platformFeePercent = 250; // 2.5%
    
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    IERC721 public nftContract;
    HairStyleNFT public hairStyleNFT; // ✅ Add typed interface for better interaction
    
    constructor(address _nftContract, address initialOwner) Ownable(initialOwner) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        require(initialOwner != address(0), "Invalid owner address");
        nftContract = IERC721(_nftContract);
        hairStyleNFT = HairStyleNFT(_nftContract); // ✅ Initialize typed interface
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }
    
    modifier onlySeller(uint256 tokenId) {
        require(sales[tokenId].seller == msg.sender, "You are not the seller");
        _;
    }
    
    function listNFT(uint256 tokenId, uint256 price) external validTokenId(tokenId) {
        require(price > 0, "Price must be greater than 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        require(nftContract.getApproved(tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
        require(!sales[tokenId].active, "NFT already listed");
        
        if (sales[tokenId].seller == address(0)) {
            listedTokenIds.push(tokenId);
        }
        
        sales[tokenId] = Sale({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    function delistNFT(uint256 tokenId) external onlySeller(tokenId) {
        require(sales[tokenId].active, "NFT is not listed");
        
        sales[tokenId].active = false;
        _removeFromListedTokens(tokenId);
        
        emit NFTDelisted(tokenId, msg.sender);
    }
    
    // ✅ ENHANCED buyNFT: Clear sale status after purchase
    function buyNFT(uint256 tokenId) external payable nonReentrant validTokenId(tokenId) {
        Sale memory sale = sales[tokenId];
        require(sale.active, "NFT is not for sale");
        require(msg.value >= sale.price, "Insufficient payment");
        require(msg.sender != sale.seller, "Cannot buy your own NFT");
        require(nftContract.ownerOf(tokenId) == sale.seller, "Seller no longer owns this NFT");
        
        address seller = sale.seller;
        uint256 price = sale.price;
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercent) / 10000;
        uint256 sellerAmount = price - platformFee;
        
        // ✅ STEP 1: Mark as sold BEFORE transfers
        sales[tokenId].active = false;
        _removeFromListedTokens(tokenId);
        
        // ✅ STEP 2: Clear sale status in NFT contract BEFORE transfer
        // This prevents the new owner from seeing "Remove from Sale" button
        try hairStyleNFT.removeFromSale(tokenId) {} catch {
            // If it fails, it's okay - the _update hook will handle it
        }
        
        // ✅ STEP 3: Transfer NFT ownership (this will trigger _update hook)
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // ✅ STEP 4: Transfer payments
        if (sellerAmount > 0) {
            (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
            require(sellerSuccess, "Payment to seller failed");
        }
        
        // Refund excess payment
        if (msg.value > price) {
            uint256 refundAmount = msg.value - price;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            require(refundSuccess, "Refund to buyer failed");
        }
        
        emit NFTSold(tokenId, seller, msg.sender, price);
    }
    
    function getAllListedNFTs() external view returns (
        uint256[] memory tokenIds, 
        address[] memory sellers, 
        uint256[] memory prices
    ) {
        uint256 activeCount = _getActiveListingsCount();
        
        tokenIds = new uint256[](activeCount);
        sellers = new address[](activeCount);
        prices = new uint256[](activeCount);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < listedTokenIds.length && currentIndex < activeCount; i++) {
            uint256 tokenId = listedTokenIds[i];
            if (sales[tokenId].active && _exists(tokenId)) {
                tokenIds[currentIndex] = tokenId;
                sellers[currentIndex] = sales[tokenId].seller;
                prices[currentIndex] = sales[tokenId].price;
                currentIndex++;
            }
        }
        
        return (tokenIds, sellers, prices);
    }
    
    function getListingDetails(uint256 tokenId) external view returns (
        address seller, 
        uint256 price, 
        bool active
    ) {
        Sale memory sale = sales[tokenId];
        return (sale.seller, sale.price, sale.active);
    }
    
    function getActiveListingsCount() external view returns (uint256) {
        return _getActiveListingsCount();
    }
    
    function _getActiveListingsCount() internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (sales[listedTokenIds[i]].active && _exists(listedTokenIds[i])) {
                count++;
            }
        }
        return count;
    }
    
    function _removeFromListedTokens(uint256 tokenId) private {
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        try nftContract.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    function setPlatformFee(uint256 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 1000, "Platform fee cannot exceed 10%");
        
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _platformFeePercent;
        
        emit PlatformFeeUpdated(oldFee, _platformFeePercent);
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function emergencyDelistNFT(uint256 tokenId) external onlyOwner {
        require(sales[tokenId].active, "NFT is not listed");
        
        address seller = sales[tokenId].seller;
        sales[tokenId].active = false;
        _removeFromListedTokens(tokenId);
        
        emit NFTDelisted(tokenId, seller);
    }
    
    function isNFTListed(uint256 tokenId) external view returns (bool) {
        return sales[tokenId].active;
    }
    
    function getListedTokenIds() external view returns (uint256[] memory) {
        uint256 activeCount = _getActiveListingsCount();
        uint256[] memory activeTokenIds = new uint256[](activeCount);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < listedTokenIds.length && currentIndex < activeCount; i++) {
            uint256 tokenId = listedTokenIds[i];
            if (sales[tokenId].active && _exists(tokenId)) {
                activeTokenIds[currentIndex] = tokenId;
                currentIndex++;
            }
        }
        
        return activeTokenIds;
    }

    function getListing(uint256 tokenId) external view returns (
        address seller,
        uint256 price, 
        bool active
    ) {
        Sale memory sale = sales[tokenId];
        return (sale.seller, sale.price, sale.active);
    }

    function getMultipleListings(uint256[] memory tokenIds) external view returns (
        address[] memory sellers,
        uint256[] memory prices,
        bool[] memory actives
    ) {
        sellers = new address[](tokenIds.length);
        prices = new uint256[](tokenIds.length);
        actives = new bool[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            Sale memory sale = sales[tokenIds[i]];
            sellers[i] = sale.seller;
            prices[i] = sale.price;
            actives[i] = sale.active;
        }
        
        return (sellers, prices, actives);
    }

    function isListedForSale(uint256 tokenId) external view returns (bool) {
        return sales[tokenId].active && _exists(tokenId);
    }
    
    function getContractInfo() external view returns (
        address nftContractAddress,
        uint256 totalListings,
        uint256 activeListings,
        uint256 platformFee
    ) {
        return (
            address(nftContract),
            listedTokenIds.length,
            _getActiveListingsCount(),
            platformFeePercent
        );
    }
}