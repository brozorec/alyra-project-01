pragma solidity 0.6.11;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Voting is Ownable {
    using SafeMath for uint;
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }
    
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }
    
    event VoterRegistered(address voterAddress);
    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    
    uint public winningProposalId;
    
    WorkflowStatus public status;
    
    mapping(address => Voter) public voters;
    
    Proposal[] public proposals;
    
    function whitelist(address _addr) external onlyOwner {
        require(status == WorkflowStatus.RegisteringVoters, "Registering voters terminated");
        require(voters[_addr].isRegistered != true, "You are already whitelisted");
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);  
    }
    
    function registerProposal(string memory _description) external {
        require(status == WorkflowStatus.ProposalsRegistrationStarted, "Not allowed");
        require(voters[msg.sender].isRegistered,"You are not whitelisted"); 

        Proposal memory propositionR = Proposal(_description, 0); 
        proposals.push(propositionR); 
        
        uint proposalId = proposals.length;
        
        emit ProposalRegistered(proposalId); 
    }

    function vote(uint _proposalId) external {
        require(status == WorkflowStatus.VotingSessionStarted, "Not allowed");
        Voter storage votant = voters[msg.sender];
    
        require(votant.isRegistered,"You are not whitelisted"); 
        require(!votant.hasVoted, "You are not whitelisted"); 
    
        votant.hasVoted = true; 
        votant.votedProposalId = _proposalId;
    
        emit Voted(msg.sender, _proposalId);
        Proposal storage propositionV = proposals[_proposalId - 1];
        
        propositionV.voteCount = (propositionV.voteCount).add(1);
    }
    
    function setWinner() external onlyOwner {
        require(status == WorkflowStatus.VotingSessionEnded, "Not allowed");
        uint count;
        uint winner;
        
        for(uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > count) {
                count = proposals[i].voteCount;
                winner = i;
            }
        }
        
        winningProposalId = winner + 1;
        
        emit VotesTallied();
        status = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, status);
    }
    
    function changeToNextStatus() external onlyOwner {
        WorkflowStatus previousStatus = status;
        
        if (status == WorkflowStatus.RegisteringVoters) {
            status = WorkflowStatus.ProposalsRegistrationStarted;
        }
        else if (status == WorkflowStatus.ProposalsRegistrationStarted) {
            status = WorkflowStatus.ProposalsRegistrationEnded;
        }
        else if (status == WorkflowStatus.ProposalsRegistrationEnded) {
            status = WorkflowStatus.VotingSessionStarted;
        }
        else if (status == WorkflowStatus.VotingSessionStarted) {
            status = WorkflowStatus.VotingSessionEnded;
        }
        
        emit WorkflowStatusChange(previousStatus, status);
    }

    function proposalsCount() external returns(uint) {
      return proposals.length;
    }
}
