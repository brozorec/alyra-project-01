import React, { useState, useEffect } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

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

function Admin({ account, setMsg }) {
  const steps = [
    "Enregistrement des votants",
    "Début d'enregistrement des propositions",
    "Fin d'enregistrement des propositions",
    "Début du vote",
    "Fin du vote",
    "Votes comptés"
  ];
  const [addr, setAddr] = useState();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const getStep = async () => {
      const contract = await getContract(Voting);
      const response = await contract.methods.status().call();
      setActiveStep(Number(response));
    }

    getStep();
  }, []);

  const whitelistAddr = async () => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    console.log(addr);
    await contract.methods.whitelist(addr).send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            setAddr(null);
            setMsg(`L'adresse ${addr} a été enregistrée !`);
          }
        })
      }
      else if (err) {
        console.log(err);
        setMsg('error');
      }
    });
  }

  const nextStep = async() => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    await contract.methods.changeToNextStatus().send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            if (activeStep < 4)
              setActiveStep(activeStep + 1);
            setMsg('Le statut du vote a été changé !');
          }
        })
      }
      else if (err) {
        console.log(err);
        setMsg('error');
      }
    });
  }

  const setWinner = async() => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    await contract.methods.setWinner().send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            setActiveStep(5);
            setMsg('Les votes ont été comptés et la proposition gagnante a été declarée !');
          }
        })
      }
      else if (err) {
        console.log(err);
        setMsg('error');
      }
    });
  }

  return (
    <div>
      <h2>Administration</h2>
      <form noValidate autoComplete="off">
        <Grid direction="column" container spacing={3} style={{ paddingTop: "100px" }}>
          <Grid item>
            <h4>Enregistrement d'un votant</h4>
          </Grid>
          <Grid item>
            <TextField id="standard-basic" label="Adresse" onChange={({ target }) => setAddr(target.value)}/>
          </Grid>
          <Grid item>
            <h5 style={{ color: "red" }}>
              {activeStep !== 0 ? "Enregistrement des votants fermé !" : ""}
            </h5>
            <Button variant="contained" color="primary" onClick={() => whitelistAddr()} disabled={activeStep !== 0}>
              Whitelist
            </Button>
          </Grid>
        </Grid>
      </form>
      <Grid direction="column" container spacing={3} style={{ paddingTop: "100px" }}>
        <Grid item>
          <h4>Étapes du vote</h4>
        </Grid>
        <Grid item>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>
        <Grid item>{
          activeStep === 4
            ? <Button variant="contained" color="secondary" onClick={() => setWinner()}>
              Compter les votes
            </Button>
            : <Button variant="contained" color="primary" onClick={() => nextStep()} disabled={activeStep === 5}>
              Étape suivante
            </Button>
          }
        </Grid>
      </Grid>
    </div>
  );
}

export default Admin;
