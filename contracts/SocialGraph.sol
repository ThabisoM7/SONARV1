// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SocialGraph
 * @dev A simple decentralized registry for user connections.
 *      Allows users to "follow" and "unfollow" other addresses.
 */
contract SocialGraph {
    // Mapping: User => List of people they follow
    mapping(address => address[]) public following;
    
    // Mapping: User => List of people following them
    mapping(address => address[]) public followers;
    
    // Quick lookup to check connection status (avoid looping)
    // Mapping: Follower => Target => IsFollowing
    mapping(address => mapping(address => bool)) public isFollowing;

    event Followed(address indexed follower, address indexed target);
    event Unfollowed(address indexed follower, address indexed target);

    /**
     * @dev Follow a user.
     * @param target The address to follow.
     */
    function follow(address target) external {
        require(target != address(0), "Invalid address");
        require(target != msg.sender, "Cannot self-follow");
        require(!isFollowing[msg.sender][target], "Already following");

        following[msg.sender].push(target);
        followers[target].push(msg.sender);
        isFollowing[msg.sender][target] = true;

        emit Followed(msg.sender, target);
    }

    /**
     * @dev Unfollow a user.
     * @param target The address to unfollow.
     */
    function unfollow(address target) external {
        require(isFollowing[msg.sender][target], "Not following");

        // Remove from 'following' list of msg.sender
        _removeFromList(following[msg.sender], target);
        
        // Remove from 'followers' list of target
        _removeFromList(followers[target], msg.sender);
        
        isFollowing[msg.sender][target] = false;
        emit Unfollowed(msg.sender, target);
    }

    /**
     * @dev Internal helper to remove an address from an array.
     *      Swaps with the last element and pops to save gas.
     *      Note: Does not preserve order.
     */
    function _removeFromList(address[] storage list, address item) private {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == item) {
                list[i] = list[list.length - 1]; // Swap with last
                list.pop(); // Remove last
                break;
            }
        }
    }

    // View functions for fetching lists
    function getFollowing(address user) external view returns (address[] memory) {
        return following[user];
    }

    function getFollowers(address user) external view returns (address[] memory) {
        return followers[user];
    }
}
