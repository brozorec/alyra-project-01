import React, { useState, useEffect } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Snackbar from '@material-ui/core/Snackbar';
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

function Admin({ account }) {
  const steps = [
    "Enregistrement des votants",
    "Début d'enregistrement des propositions",
    "Fin d'enregistrement des propositions",
    "Début du vote",
    "Fin du vote",
    "Votes comptés"
  ];
  const [addr, setAddr] = useState();
  const [msg, setMsg] = useState();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const getStep = async () => {
      const contract = await getContract(Voting);
      const web3 = await getWeb3();
      const response = await contract.methods.status().call();
      setActiveStep(Number(response));
    }

    getStep();
  }, []);

  const whitelistAddr = async () => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    await contract.methods.whitelist(addr).send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            setAddr(null);
            setMsg('success');
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
            setActiveStep(activeStep + 1);
            setMsg('success');
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
        <Grid item>
          <Button variant="contained" color="primary" onClick={() => nextStep()}>
            Étape suivante
          </Button>
        </Grid>
      </Grid>
      <Snackbar autoHideDuration={6000} open={!!msg} onClose={() => setMsg(null)} message={
        msg === 'error'
          ? "Une erreur est survenue !"
          : msg === 'success' 
            ? "C'est bon !"
            : ""
        }/>
    </div>
  );
}

export default Admin;
