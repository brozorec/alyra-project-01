import React, { useState, useEffect } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import Admin from "./Admin";
import Public from "./Public";

const getContract = async (contract) => {
  const web3 = await getWeb3();

  // Get the contract instance.
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = contract.networks[networkId];
  const instance = new web3.eth.Contract(
    contract.abi,
    deployedNetwork && deployedNetwork.address,
  );

  return instance;
}

function App() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const getAccounts = async () => {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0])
    };

    getAccounts();
  }, []);

  return (
    <div className="App">
      <Admin account={account} />
    </div>
  );
}

export default App;
