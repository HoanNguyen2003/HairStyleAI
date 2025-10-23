import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useWeb3 } from './Web3Context';
import { ethers } from 'ethers';
import '../styles/NFTContext.scss'

const NFTContext = createContext();

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error('useNFT must be used within NFTProvider');
  }
  return context;
};

export const NFTProvider = ({ children }) => {
  const { contracts, account, isConnected } = useWeb3();
  
  // NFT Cache
  const [nftCache, setNFTCache] = useState({});
  const [myNFTs, setMyNFTs] = useState([]);
  const [marketNFTs, setMarketNFTs] = useState([]);
  const [loading, setLoading] = useState({
    myNFTs: false,
    marketplace: false,
    single: {}
  });
  
  // Cache control
  const lastLoadTime = useRef({
    myNFTs: 0,
    marketplace: 0
  });
  const CACHE_DURATION = 30000; // 30 seconds cache
  
  // Loading debounce
  const loadingTimeouts = useRef({});

  // Cache individual NFT data
  const cacheNFT = useCallback((tokenId, data) => {
    setNFTCache(prev => ({
      ...prev,
      [tokenId]: {
        ...data,
        cached_at: Date.now()
      }
    }));
  }, []);

  // Get cached NFT or fetch new
  const getCachedNFT = useCallback((tokenId) => {
    const cached = nftCache[tokenId];
    if (cached && (Date.now() - cached.cached_at) < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, [nftCache]);

  // Load single NFT data (with caching)
  const loadSingleNFT = useCallback(async (tokenId, force = false) => {
    if (!contracts.hairStyleNFT || !account) return null;

    // Check cache first
    if (!force) {
      const cached = getCachedNFT(tokenId);
      if (cached) {
        console.log(`📋 Using cached data for NFT ${tokenId}`);
        return cached;
      }
    }

    // Prevent duplicate loading
    const loadingKey = `nft_${tokenId}`;
    if (loading.single[loadingKey]) {
      console.log(`⏳ Already loading NFT ${tokenId}, skipping...`);
      return null;
    }

    try {
      setLoading(prev => ({
        ...prev,
        single: { ...prev.single, [loadingKey]: true }
      }));

      console.log(`🔍 Loading fresh data for NFT ${tokenId}...`);

      const [owner, hairStyleData] = await Promise.all([
        contracts.hairStyleNFT.ownerOf(tokenId),
        contracts.hairStyleNFT.hairStyles(tokenId)
      ]);

      // Load metadata
      let metadata = {
        name: `Hair Style #${tokenId}`,
        description: 'AI Generated Hair Style',
        image: `https://via.placeholder.com/400x400/667eea/ffffff?text=NFT+${tokenId}`,
        attributes: []
      };

      try {
        const tokenURI = await contracts.hairStyleNFT.tokenURI(tokenId);
        if (tokenURI && tokenURI.startsWith('ipfs://')) {
          const ipfsHash = tokenURI.replace('ipfs://', '');
          const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, { 
            timeout: 5000 
          });
          if (response.ok) {
            const fetchedMetadata = await response.json();
            metadata = { ...metadata, ...fetchedMetadata };
          }
        }
      } catch (metadataError) {
        console.warn(`Metadata loading failed for NFT ${tokenId}`);
      }

      const nftData = {
        tokenId: parseInt(tokenId),
        owner,
        metadata,
        hairStyleData: {
          likes: hairStyleData.likes?.toNumber?.() || 0,
          hairType: hairStyleData.hairType || 'Unknown',
          colorType: hairStyleData.colorType || 'Unknown',
          isForSale: hairStyleData.isForSale || false,
          price: (hairStyleData.isForSale && hairStyleData.price) ? 
                 ethers.utils.formatEther(hairStyleData.price) : '0',
          timestamp: hairStyleData.timestamp?.toNumber ? 
                    new Date(hairStyleData.timestamp.toNumber() * 1000) : new Date()
        },
        loaded_at: Date.now()
      };

      // Cache the result
      cacheNFT(tokenId, nftData);
      console.log(`✅ Loaded and cached NFT ${tokenId}`);
      
      return nftData;

    } catch (error) {
      console.error(`❌ Error loading NFT ${tokenId}:`, error);
      return null;
    } finally {
      setLoading(prev => ({
        ...prev,
        single: { ...prev.single, [loadingKey]: false }
      }));
    }
  }, [contracts, account, getCachedNFT, cacheNFT, loading.single]);

  // Load My NFTs (optimized)
  const loadMyNFTs = useCallback(async (force = false) => {
    if (!contracts.hairStyleNFT || !account) return;

    // Check if recently loaded
    const now = Date.now();
    if (!force && (now - lastLoadTime.current.myNFTs) < CACHE_DURATION) {
      console.log('📋 Using recent My NFTs data (cache)');
      return;
    }

    // Debounce loading
    if (loadingTimeouts.current.myNFTs) {
      clearTimeout(loadingTimeouts.current.myNFTs);
    }

    loadingTimeouts.current.myNFTs = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, myNFTs: true }));
        console.log('🔍 Loading My NFTs...');

        const creatorTokens = await contracts.hairStyleNFT.getCreatorTokens(account);
        console.log(`📝 Found ${creatorTokens.length} tokens for account`);

        if (creatorTokens.length === 0) {
          setMyNFTs([]);
          lastLoadTime.current.myNFTs = now;
          return;
        }

        // Process tokens (try cache first)
        const nftPromises = creatorTokens.map(async (tokenId) => {
          const tokenIdNumber = tokenId.toNumber();
          
          // Try cache first
          let nftData = getCachedNFT(tokenIdNumber);
          if (!nftData) {
            nftData = await loadSingleNFT(tokenIdNumber);
          }

          // Only include if owned by current account
          if (nftData && nftData.owner.toLowerCase() === account.toLowerCase()) {
            return nftData;
          }
          return null;
        });

        const results = await Promise.all(nftPromises);
        const validNFTs = results.filter(nft => nft !== null);
        
        console.log(`✅ Loaded ${validNFTs.length} My NFTs`);
        setMyNFTs(validNFTs);
        lastLoadTime.current.myNFTs = now;

      } catch (error) {
        console.error('❌ Error loading My NFTs:', error);
      } finally {
        setLoading(prev => ({ ...prev, myNFTs: false }));
      }
    }, 100); // 100ms debounce

  }, [contracts, account, getCachedNFT, loadSingleNFT]);

  // Load Marketplace NFTs (NEW)
  const loadMarketplaceNFTs = useCallback(async (force = false) => {
    if (!contracts.marketplace || !contracts.hairStyleNFT) {
        console.warn('⚠️ Marketplace or NFT contracts not available');
        return;
    }

    // Check if recently loaded
    const now = Date.now();
    if (!force && (now - lastLoadTime.current.marketplace) < CACHE_DURATION) {
        console.log('📋 Using recent Marketplace data (cache)');
        return;
    }

    // Debounce loading
    if (loadingTimeouts.current.marketplace) {
        clearTimeout(loadingTimeouts.current.marketplace);
    }

    loadingTimeouts.current.marketplace = setTimeout(async () => {
        try {
        setLoading(prev => ({ ...prev, marketplace: true }));
        console.log('🏪 Loading Marketplace NFTs...');

        // METHOD 1: Get total tokens and check each one
        const totalTokens = await contracts.hairStyleNFT.getTotalTokens();
        console.log(`🔍 Checking ${totalTokens} total tokens for marketplace listings...`);

        const marketNFTPromises = [];
        
        for (let tokenId = 0; tokenId < totalTokens; tokenId++) {
            marketNFTPromises.push(
            (async () => {
                try {
                // Check if this token is for sale
                const [hairStyleData, saleData] = await Promise.all([
                    contracts.hairStyleNFT.hairStyles(tokenId),
                    contracts.marketplace.sales(tokenId)
                ]);

                // Check if listed in marketplace OR listed in NFT contract
                const isForSale = saleData.active || hairStyleData.isForSale;
                
                if (!isForSale) {
                    return null; // Skip NFTs not for sale
                }

                console.log(`🏷️ Found NFT ${tokenId} for sale`);

                // Get NFT data (try cache first)
                let nftData = getCachedNFT(tokenId);
                if (!nftData) {
                    nftData = await loadSingleNFT(tokenId);
                }

                if (!nftData) {
                    console.warn(`⚠️ Could not load NFT data for token ${tokenId}`);
                    return null;
                }

                // Determine price and seller
                let price = '0';
                let seller = nftData.owner;

                if (saleData.active && saleData.price) {
                    // Listed in marketplace
                    price = ethers.utils.formatEther(saleData.price);
                    seller = saleData.seller;
                } else if (hairStyleData.isForSale && hairStyleData.price) {
                    // Listed in NFT contract
                    price = ethers.utils.formatEther(hairStyleData.price);
                    seller = nftData.owner;
                }

                // Add marketplace specific data
                const marketplaceData = {
                    ...nftData,
                    marketplace: {
                    seller,
                    price,
                    isActive: isForSale,
                    listingId: tokenId
                    },
                    hairStyleData: {
                    ...nftData.hairStyleData,
                    isForSale: true,
                    price
                    }
                };

                console.log(`✅ Processed marketplace NFT ${tokenId} - Price: ${price} ETH`);
                return marketplaceData;

                } catch (error) {
                console.error(`❌ Error processing token ${tokenId}:`, error);
                return null;
                }
            })()
            );
        }

        // Wait for all promises to complete
        const results = await Promise.allSettled(marketNFTPromises);
        const validMarketNFTs = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
        
        console.log(`✅ Loaded ${validMarketNFTs.length} valid marketplace NFTs`);
        setMarketNFTs(validMarketNFTs);
        lastLoadTime.current.marketplace = now;

        } catch (error) {
        console.error('❌ Error loading marketplace NFTs:', error);
        setMarketNFTs([]);
        } finally {
        setLoading(prev => ({ ...prev, marketplace: false }));
        }
    }, 100); // 100ms debounce

    }, [contracts, getCachedNFT, loadSingleNFT]);

  // Update single NFT in cache and lists
  const updateNFTInLists = useCallback((tokenId, updates) => {
    console.log(`🔄 Updating NFT ${tokenId} in cache and lists`);
    
    // Update cache
    setNFTCache(prev => {
      const existing = prev[tokenId];
      if (existing) {
        return {
          ...prev,
          [tokenId]: {
            ...existing,
            ...updates,
            cached_at: Date.now()
          }
        };
      }
      return prev;
    });

    // Update myNFTs list
    setMyNFTs(prev => prev.map(nft => 
      nft.tokenId === parseInt(tokenId) 
        ? { ...nft, ...updates }
        : nft
    ));

    // Update marketNFTs list
    setMarketNFTs(prev => prev.map(nft => 
      nft.tokenId === parseInt(tokenId) 
        ? { ...nft, ...updates }
        : nft
    ));
  }, []);

  // Handle NFT sale status change
  const updateNFTSaleStatus = useCallback(async (tokenId, isForSale, price = '0') => {
    console.log(`🏷️ Updating sale status for NFT ${tokenId}: ${isForSale ? 'For Sale' : 'Not For Sale'}`);
    
    const updates = {
      hairStyleData: {
        isForSale,
        price: isForSale ? price : '0'
      }
    };

    // Get current NFT data
    const currentNFT = myNFTs.find(nft => nft.tokenId === parseInt(tokenId)) ||
                       marketNFTs.find(nft => nft.tokenId === parseInt(tokenId));
    
    if (currentNFT) {
      updates.hairStyleData = {
        ...currentNFT.hairStyleData,
        ...updates.hairStyleData
      };
    }

    updateNFTInLists(tokenId, updates);

    // Refresh marketplace if NFT is listed for sale
    if (isForSale) {
      setTimeout(() => {
        loadMarketplaceNFTs(true);
      }, 2000); // Wait for blockchain state to update
    } else {
      // Remove from marketplace list if delisted
      setMarketNFTs(prev => prev.filter(nft => nft.tokenId !== parseInt(tokenId)));
    }
  }, [myNFTs, marketNFTs, updateNFTInLists, loadMarketplaceNFTs]);

  // Handle NFT transfer/ownership change
  const updateNFTOwnership = useCallback((tokenId, newOwner) => {
    console.log(`👤 Updating ownership for NFT ${tokenId} to ${newOwner}`);
    
    updateNFTInLists(tokenId, { owner: newOwner });

    // Remove from myNFTs if no longer owned by current account
    if (newOwner.toLowerCase() !== account?.toLowerCase()) {
      setMyNFTs(prev => prev.filter(nft => nft.tokenId !== parseInt(tokenId)));
    }

    // Remove from marketplace if sold
    setMarketNFTs(prev => prev.filter(nft => nft.tokenId !== parseInt(tokenId)));
  }, [account, updateNFTInLists]);

  // Add new NFT (when minted)
  const addNewNFT = useCallback(async (tokenId) => {
    console.log(`🎨 Adding new NFT ${tokenId} to lists`);
    
    // Load the new NFT data
    const nftData = await loadSingleNFT(tokenId, true); // Force reload
    
    if (nftData && nftData.owner.toLowerCase() === account?.toLowerCase()) {
      setMyNFTs(prev => {
        // Check if already exists
        const exists = prev.find(nft => nft.tokenId === parseInt(tokenId));
        if (exists) {
          return prev.map(nft => 
            nft.tokenId === parseInt(tokenId) ? nftData : nft
          );
        }
        return [nftData, ...prev]; // Add to beginning
      });
    }
  }, [account, loadSingleNFT]);

  // Clear cache
  const clearCache = useCallback(() => {
    console.log('🧹 Clearing NFT cache');
    setNFTCache({});
    lastLoadTime.current = { myNFTs: 0, marketplace: 0 };
  }, []);

  // Force refresh all
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing all NFT data');
    clearCache();
    if (contracts.hairStyleNFT && account) {
      loadMyNFTs(true);
    }
    if (contracts.marketplace && contracts.hairStyleNFT) {
      loadMarketplaceNFTs(true);
    }
  }, [clearCache, loadMyNFTs, loadMarketplaceNFTs, contracts, account]);

  const value = {
    // State
    myNFTs,
    marketNFTs,
    loading,
    
    // Actions
    loadMyNFTs,
    loadMarketplaceNFTs,
    loadSingleNFT,
    updateNFTSaleStatus,
    updateNFTOwnership,
    addNewNFT,
    clearCache,
    forceRefresh,
    
    // Utils
    getCachedNFT,
    updateNFTInLists
  };

  return (
    <NFTContext.Provider value={value}>
      {children}
    </NFTContext.Provider>
  );
};