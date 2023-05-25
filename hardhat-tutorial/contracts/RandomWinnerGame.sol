// SPDX-License-Identifier:MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract RandomWinnerGame is VRFConsumerBase,Ownable{
    uint public fee;
    bytes32 public keyHash;
    address[] public players;
    uint entryFees;
    uint8 public maxPlayers;
    bool public gameStarted;
    uint public gameId;

    event GameStarted(uint gameId,uint8 maxPlayers,uint entryFees);
    event PlayerJoined(uint gameId,address player);
    event GameEnded (uint gameId,address winner,bytes32 requestId);

    constructor (address vrfCoordinator,address linkToken,
    bytes32 vrfKeyHash,uint vrfFee) VRFConsumerBase(vrfCoordinator,linkToken){
        keyHash = vrfKeyHash;
        fee = vrfFee;
        gameStarted = false;
    }

    function startGame(uint8 _maxPlayers, uint _entryFees) public onlyOwner{
        require(!gameStarted,"Game is currently running");
        delete players;
        maxPlayers = _maxPlayers;
        entryFees = _entryFees;
        gameStarted = true;
        gameId += 1;
        emit GameStarted(gameId,maxPlayers,entryFees);
    }

    function joinGame() public payable{
        require(gameStarted,"Game not yet started");
        require(players.length < maxPlayers,"Maximum players reached");
        require(msg.value == entryFees,"Insufficient entry fees");
        players.push(msg.sender);
        emit PlayerJoined(gameId,msg.sender);
        if(players.length == maxPlayers){
            getRandomWinner();
        }
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal virtual override{
        uint winnerIndex = randomness % players.length;
        address winner = players[winnerIndex];
        (bool sent,) = winner.call{value:address(this).balance}("");
        require(sent,"Failed to send Ether");
        emit GameEnded(gameId,winner,requestId);
        gameStarted = false;
    }

    function getRandomWinner() private returns(bytes32 requestId){
        require((LINK.balanceOf(address(this)) >= fee),"Not enough LINK");
        return requestRandomness(keyHash,fee);
    }

    receive () external payable{}
    fallback() external payable{}
}