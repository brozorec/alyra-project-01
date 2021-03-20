import React, { useState } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";

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

function Public() {
  return (
    <div>Public part</div>
  );
}

export default Public;
