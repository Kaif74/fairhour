// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeBankLedger {

    struct Transaction {
        address provider;
        address receiver;
        uint256 hoursWorked; 
        uint256 credits;
        uint256 occupationCode;
        uint256 timestamp;
    }

    mapping(address => int256) public balances;
    Transaction[] public transactions;

    event TransactionRecorded(
        address indexed provider,
        address indexed receiver,
        uint256 credits,
        uint256 occupationCode,
        uint256 timestamp,
        string creditsDisplay,
        string occupationCodeDisplay
    );

    function recordTransaction(
        address provider,
        address receiver,
        uint256 hoursWorked,
        uint256 credits,
        uint256 occupationCode,
        string memory creditsDisplay,
        string memory occupationCodeDisplay
    ) public {

        balances[provider] += int256(credits);
        balances[receiver] -= int256(credits);

        transactions.push(
            Transaction({
                provider: provider,
                receiver: receiver,
                hoursWorked: hoursWorked,
                credits: credits,
                occupationCode: occupationCode,
                timestamp: block.timestamp
            })
        );

        emit TransactionRecorded(
            provider,
            receiver,
            credits,
            occupationCode,
            block.timestamp,
            creditsDisplay,
            occupationCodeDisplay
        );
    }

    function getTransaction(uint256 index)
        public
        view
        returns (Transaction memory)
    {
        return transactions[index];
    }

    function getTransactionCount()
        public
        view
        returns (uint256)
    {
        return transactions.length;
    }
}
