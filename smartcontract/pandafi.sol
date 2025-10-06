// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SocialFiProfile
 * @dev SocialFi contract with ERC721 for posts, ERC20 for U2U, and per-post ERC20 tokens using OpenZeppelin ERC20.
 * NOTE: Added support to sell/buy NFT posts using the post's own ERC20 token.
 */
contract SocialFiProfile is ERC721, Ownable {
    IERC20 public u2uToken;

    // ---------------- Events ----------------
    event ProfileCreated(uint256 indexed profileId, address owner);
    event PostCreated(uint256 indexed postId, uint256 profileId, address postToken);
    event PostLiked(uint256 indexed postId, address liker);
    event PostTipped(uint256 indexed postId, address tipper, uint256 amount);
    event PostForSale(uint256 indexed postId, uint256 price);
    event PostBought(uint256 indexed postId, address buyer, uint256 price);
    event CommentAdded(uint256 indexed postId, uint256 commentId, address author);
    event PlayerHired(uint256 indexed hireId, uint256 profileId, address hirer, uint256 amount);
    event HireCompleted(uint256 indexed hireId, uint256 profileId);
    event PostTokenForSale(uint256 indexed postId, uint256 tokenPrice, uint256 amount);
    event PostTokenBought(uint256 indexed postId, address buyer, uint256 amount, uint256 totalCost);

    // NEW events for NFT trade using post ERC20 token
    event PostForSaleWithPostToken(uint256 indexed postId, address indexed postToken, uint256 priceInPostToken);
    event PostBoughtWithPostToken(uint256 indexed postId, address buyer, uint256 priceInPostToken);

    // ---------------- Profile ----------------
    struct Profile {
        uint256 id;
        address owner;
        string name;
        string avatarCID;
        string bioCID;
        uint256 createdAt;
        uint256 socialTokenBalance;
        uint256 totalEarned;
        uint256 totalHires;
    }

    uint256 public profileCount;
    mapping(uint256 => Profile) public profiles;

    // ---------------- Post ----------------
    struct Post {
        uint256 id;
        uint256 profileId;
        string contentCID;
        uint256 timestamp;
        uint256 likeCount;
        uint256 commentCount;
        uint256 tipAmount;
        bool isForSale;
        uint256 price;
        bool isDeleted;
        address postToken; // Address of the post ERC20 token
        uint256 tokenPrice; // Price per token (in u2uToken)
        uint256 tokensForSale; // Amount of tokens up for sale

        // ---------- NEW: NFT sale using post's own token ----------
        bool isForSaleInPostToken;
        uint256 priceInPostToken; // amount of postToken required to buy the NFT (18-decimals)
    }

    uint256 public postCount;
    mapping(uint256 => Post) public posts;

    // ---------------- Comment ----------------
    struct Comment {
        uint256 id;
        uint256 postId;
        address author;
        string contentCID;
        uint256 timestamp;
    }

    uint256 public commentCount;
    mapping(uint256 => Comment) public comments;

    // ---------------- Hire ----------------
    struct Hire {
        uint256 id;
        uint256 profileId;
        address hirer;
        uint256 duration;
        uint256 amount;
        uint256 createdAt;
        bool completed;
    }

    uint256 public hireCount;
    mapping(uint256 => Hire) public hires;

    constructor(address _u2uToken) ERC721("SocialFiPost", "SFP") Ownable(msg.sender) {
        require(_u2uToken != address(0), "Invalid token address");
        u2uToken = IERC20(_u2uToken);
        // Ownable constructor sets msg.sender as owner automatically (we forwarded above)
    }

    // ---------------- Profiles ----------------
    function createProfile(
        string memory _name,
        string memory _avatarCID,
        string memory _bioCID
    ) external {
        profileCount++;
        profiles[profileCount] = Profile({
            id: profileCount,
            owner: msg.sender,
            name: _name,
            avatarCID: _avatarCID,
            bioCID: _bioCID,
            createdAt: block.timestamp,
            socialTokenBalance: 0,
            totalEarned: 0,
            totalHires: 0
        });
        emit ProfileCreated(profileCount, msg.sender);
    }

    // ---------------- Post creation helpers ----------------
    /// @dev Deploys the ERC20 token for a post and returns its address
    function _deployPostToken(
        string memory _tokenName,
        string memory _tokenSymbol,
        address creator,
        uint256 supply
    ) internal returns (address) {
        OpenZeppelinPostToken tok = new OpenZeppelinPostToken(_tokenName, _tokenSymbol, creator, supply);
        return address(tok);
    }

    /// @dev Initializes post storage for a given id
    function _initPost(
        uint256 _postId,
        uint256 _profileId,
        string memory _contentCID,
        address _postTokenAddr
    ) internal {
        Post storage p = posts[_postId];
        p.id = _postId;
        p.profileId = _profileId;
        p.contentCID = _contentCID;
        p.timestamp = block.timestamp;
        p.likeCount = 0;
        p.commentCount = 0;
        p.tipAmount = 0;
        p.isForSale = false;
        p.price = 0;
        p.isDeleted = false;
        p.postToken = _postTokenAddr;
        p.tokenPrice = 0;
        p.tokensForSale = 0;

        // initialize new fields
        p.isForSaleInPostToken = false;
        p.priceInPostToken = 0;
    }

    /**
     * @notice Create a new post and deploy a per-post ERC20 token.
     */
    function createPost(
        uint256 _profileId,
        string memory _contentCID,
        string memory _tokenName,
        string memory _tokenSymbol
    ) external {
        require(profiles[_profileId].owner == msg.sender, "Not profile owner");

        postCount++;
        uint256 currentPostId = postCount;

        // Deploy token directly and store address
        posts[currentPostId].postToken = address(new OpenZeppelinPostToken(_tokenName, _tokenSymbol, msg.sender, 10_000_000 ether));

        // Initialize post struct fields directly
        posts[currentPostId].id = currentPostId;
        posts[currentPostId].profileId = _profileId;
        posts[currentPostId].contentCID = _contentCID;
        posts[currentPostId].timestamp = block.timestamp;
        // Other fields default to 0/false

        _mint(msg.sender, currentPostId);

        emit PostCreated(currentPostId, _profileId, posts[currentPostId].postToken);
    }

    // ---------------- Interactions ----------------
    function likePost(uint256 _postId) external {
        Post storage p = posts[_postId];
        require(!p.isDeleted, "Post deleted");
        p.likeCount++;
        emit PostLiked(_postId, msg.sender);
    }

    function tipPost(uint256 _postId, uint256 _amount) external {
        Post storage p = posts[_postId];
        require(!p.isDeleted, "Post deleted");
        require(_amount > 0, "Zero tip");
        require(u2uToken.transferFrom(msg.sender, address(this), _amount), "Tip transfer failed");
        p.tipAmount += _amount;
        profiles[p.profileId].socialTokenBalance += _amount;
        emit PostTipped(_postId, msg.sender, _amount);
    }

    // NFT sale using U2U token (existing logic)
    function sellPost(uint256 _postId, uint256 _price) external {
        require(ownerOf(_postId) == msg.sender, "Not NFT owner");
        Post storage p = posts[_postId];
        p.isForSale = true;
        p.price = _price;
        emit PostForSale(_postId, _price);
    }

    function buyPost(uint256 _postId) external nonReentrant {
        Post storage p = posts[_postId];
        require(p.isForSale, "Post not for sale");
        address postOwner = ownerOf(_postId);
        uint256 pricePaid = p.price;

        // transfer payment
        require(u2uToken.transferFrom(msg.sender, postOwner, pricePaid), "Payment failed");

        // transfer NFT
        _transfer(postOwner, msg.sender, _postId);

        // update storage
        p.isForSale = false;
        p.price = 0;

        emit PostBought(_postId, msg.sender, pricePaid);
    }

    // ---------------- NEW: NFT sale using the post's ERC20 token ----------------
    /**
     * @notice Owner lists the NFT post for sale priced in the post's own ERC20 tokens.
     * @param _postId NFT post id
     * @param _priceInPostToken Amount of postToken (18-decimals) required to buy the NFT
     */
    function sellPostWithPostToken(uint256 _postId, uint256 _priceInPostToken) external {
        require(ownerOf(_postId) == msg.sender, "Not NFT owner");
        require(_priceInPostToken > 0, "Price must be > 0");
        Post storage p = posts[_postId];
        require(p.postToken != address(0), "Post token not set");

        p.isForSaleInPostToken = true;
        p.priceInPostToken = _priceInPostToken;

        emit PostForSaleWithPostToken(_postId, p.postToken, _priceInPostToken);
    }

    /**
     * @notice Buy an NFT post by paying with the post's ERC20 token.
     * Buyer must have approved this contract to spend the required postToken amount from buyer.
     */
    function buyPostWithPostToken(uint256 _postId) external nonReentrant {
        Post storage p = posts[_postId];
        require(p.isForSaleInPostToken, "Not for sale in post token");
        address postOwner = ownerOf(_postId);
        uint256 price = p.priceInPostToken;
        require(price > 0, "Invalid price");
        IERC20 postToken = IERC20(p.postToken);

        // Transfer postToken payment from buyer to NFT owner
        require(postToken.transferFrom(msg.sender, postOwner, price), "PostToken payment failed");

        // Transfer NFT to buyer
        _transfer(postOwner, msg.sender, _postId);

        // Clear sale state
        p.isForSaleInPostToken = false;
        p.priceInPostToken = 0;

        emit PostBoughtWithPostToken(_postId, msg.sender, price);
    }

    // PostToken sale logic (existing)
    function setPostTokenForSale(
        uint256 _postId,
        uint256 _tokenPrice, // price per token (in u2uToken, 18 decimals)
        uint256 _amount // amount (with decimals)
    ) external {
        require(ownerOf(_postId) == msg.sender, "Not NFT owner");
        require(_amount > 0, "Nothing to sell");
        Post storage p = posts[_postId];
        IERC20 postToken = IERC20(p.postToken);
        require(postToken.balanceOf(msg.sender) >= _amount, "Not enough tokens");

        p.tokenPrice = _tokenPrice;
        p.tokensForSale = _amount;
        emit PostTokenForSale(_postId, _tokenPrice, _amount);
    }

    function buyPostTokens(uint256 _postId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount zero");
        Post storage p = posts[_postId];
        require(p.tokenPrice > 0 && p.tokensForSale >= _amount, "Not for sale or insufficient tokens");

        address postOwner = ownerOf(_postId);
        // compute cost; tokenPrice and _amount are 18-decimal scaled
        uint256 totalCost = (p.tokenPrice * _amount) / 1 ether;

        // transfer payment from buyer to owner
        require(u2uToken.transferFrom(msg.sender, postOwner, totalCost), "Payment failed");

        // transfer post tokens from owner to buyer (owner must approve this contract)
        IERC20 postToken = IERC20(p.postToken);
        require(postToken.transferFrom(postOwner, msg.sender, _amount), "Token transfer failed");

        p.tokensForSale -= _amount;
        emit PostTokenBought(_postId, msg.sender, _amount, totalCost);
    }

    // ---------------- Comments ----------------
    function addComment(uint256 _postId, string memory _contentCID) external {
        commentCount++;
        comments[commentCount] = Comment({
            id: commentCount,
            postId: _postId,
            author: msg.sender,
            contentCID: _contentCID,
            timestamp: block.timestamp
        });
        posts[_postId].commentCount++;
        emit CommentAdded(_postId, commentCount, msg.sender);
    }

    // ---------------- Hire System ----------------
    function hirePlayer(uint256 _profileId, uint256 _duration, uint256 _ratePerHour) external {
        Profile storage p = profiles[_profileId];
        require(p.owner != msg.sender, "Cannot hire yourself");
        uint256 totalAmount = _duration * _ratePerHour;
        require(totalAmount > 0, "Invalid payment");
        require(u2uToken.transferFrom(msg.sender, address(this), totalAmount), "Payment failed");

        hireCount++;
        hires[hireCount] = Hire({
            id: hireCount,
            profileId: _profileId,
            hirer: msg.sender,
            duration: _duration,
            amount: totalAmount,
            createdAt: block.timestamp,
            completed: false
        });
        emit PlayerHired(hireCount, _profileId, msg.sender, totalAmount);
    }

    function completeHire(uint256 _hireId, address _streamer) external {
        Hire storage h = hires[_hireId];
        Profile storage p = profiles[h.profileId];
        require(msg.sender == p.owner, "Only profile owner can complete");
        require(!h.completed, "Hire already completed");

        h.completed = true;
        p.totalEarned += h.amount;
        p.totalHires += 1;
        require(u2uToken.transferFrom(msg.sender, _streamer, h.amount), "Transfer failed");
        emit HireCompleted(_hireId, h.profileId);
    }

    // ---------------- Leaderboard ----------------
    // (This is a simple placeholder, not ranked by any metric)
    function getTopPlayers(uint256 _topN) external view returns (Profile[] memory) {
        uint256 len = profileCount < _topN ? profileCount : _topN;
        Profile[] memory topPlayers = new Profile[](len);
        for (uint256 i = 1; i <= len; i++) {
            topPlayers[i - 1] = profiles[i];
        }
        return topPlayers;
    }

    // ---------------- Getter Helpers ----------------
    function getPost(uint256 _postId) external view returns (Post memory) {
        return posts[_postId];
    }

    function getComment(uint256 _commentId) external view returns (Comment memory) {
        return comments[_commentId];     
    }

    function getHire(uint256 _hireId) external view returns (Hire memory) {
        return hires[_hireId];
    }

    function getProfile(uint256 _profileId) external view returns (Profile memory) {
        return profiles[_profileId];
    }

     // Add simple reentrancy protection since ReentrancyGuard is commented out
    bool private _reentrancyLock = false;
    
    modifier nonReentrant() {
        require(!_reentrancyLock, "ReentrancyGuard: reentrant call");
        _reentrancyLock = true;
        _;
        _reentrancyLock = false;
    }
}

/**
 * @dev OpenZeppelin-based ERC20 token for posts.
 *      The constructor mints the full supply to the creator.
 */
contract OpenZeppelinPostToken is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        address creator,
        uint256 supply
    ) ERC20(name_, symbol_) {
        _mint(creator, supply);
    }
}
