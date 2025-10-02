// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SocialFiProfile is ERC721, Ownable {

    IERC20 public u2uToken;

    constructor(address _u2uToken) ERC721("SocialFiPost", "SFP") Ownable(msg.sender) {
        require(_u2uToken != address(0), "Invalid token address");
        u2uToken = IERC20(_u2uToken);
    }

    // ---------------- Events ----------------
    event ProfileCreated(uint256 indexed profileId, address owner);
    event PostCreated(uint256 indexed postId, uint256 profileId);
    event PostLiked(uint256 indexed postId, address liker);
    event PostTipped(uint256 indexed postId, address tipper, uint256 amount);
    event PostForSale(uint256 indexed postId, uint256 price);
    event PostBought(uint256 indexed postId, address buyer, uint256 price);
    event CommentAdded(uint256 indexed postId, uint256 commentId, address author);
    event PlayerHired(uint256 indexed hireId, uint256 profileId, address hirer, uint256 amount);
    event HireCompleted(uint256 indexed hireId, uint256 profileId);

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

    function createProfile(string memory _name, string memory _avatarCID, string memory _bioCID) external {
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
    }

    uint256 public postCount;
    mapping(uint256 => Post) public posts;

    function createPost(uint256 _profileId, string memory _contentCID) external {
        require(profiles[_profileId].owner == msg.sender, "Not profile owner");
        postCount++;
        posts[postCount] = Post({
            id: postCount,
            profileId: _profileId,
            contentCID: _contentCID,
            timestamp: block.timestamp,
            likeCount: 0,
            commentCount: 0,
            tipAmount: 0,
            isForSale: false,
            price: 0,
            isDeleted: false
        });
        _mint(msg.sender, postCount);
        emit PostCreated(postCount, _profileId);
    }

    function likePost(uint256 _postId) external {
        Post storage p = posts[_postId];
        require(!p.isDeleted, "Post deleted");
        p.likeCount++;
        emit PostLiked(_postId, msg.sender);
    }

    function tipPost(uint256 _postId, uint256 _amount) external {
        Post storage p = posts[_postId];
        require(!p.isDeleted, "Post deleted");
        require(u2uToken.transferFrom(msg.sender, address(this), _amount), "Tip transfer failed");
        p.tipAmount += _amount;
        profiles[p.profileId].socialTokenBalance += _amount;
        emit PostTipped(_postId, msg.sender, _amount);
    }

    function sellPost(uint256 _postId, uint256 _price) external {
        require(ownerOf(_postId) == msg.sender, "Not NFT owner");
        Post storage p = posts[_postId];
        p.isForSale = true;
        p.price = _price;
        emit PostForSale(_postId, _price);
    }

    function buyPost(uint256 _postId) external {
        Post storage p = posts[_postId];
        require(p.isForSale, "Post not for sale");
        address postOwner = ownerOf(_postId);
        require(u2uToken.transferFrom(msg.sender, postOwner, p.price), "Payment failed");

        _transfer(postOwner, msg.sender, _postId);

        p.isForSale = false;
        uint256 pricePaid = p.price;
        p.price = 0;
        emit PostBought(_postId, msg.sender, pricePaid);
    }

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

    function hirePlayer(uint256 _profileId, uint256 _duration, uint256 _ratePerHour) external {
        Profile storage p = profiles[_profileId];
        require(p.owner != msg.sender, "Cannot hire yourself");
        uint256 totalAmount = _duration * _ratePerHour;
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

    function completeHire(uint256 _hireId) external {
        Hire storage h = hires[_hireId];
        Profile storage p = profiles[h.profileId];
        require(msg.sender == p.owner, "Only profile owner can complete");
        require(!h.completed, "Hire already completed");

        h.completed = true;
        p.totalEarned += h.amount;
        p.totalHires += 1;
        require(u2uToken.transfer(p.owner, h.amount), "Transfer failed");
        emit HireCompleted(_hireId, h.profileId);
    }

    // ---------------- Leaderboard ----------------
    function getTopPlayers(uint256 _topN) external view returns (Profile[] memory) {
        uint256 len = profileCount < _topN ? profileCount : _topN;
        Profile[] memory topPlayers = new Profile[](len);
        for(uint256 i=1; i<=len; i++){
            topPlayers[i-1] = profiles[i];
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
}

