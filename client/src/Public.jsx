import React, { useState, useEffect } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Grid from '@material-ui/core/Grid';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

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

function Public({ account, setMsg }) {
  const steps = [
    "Enregistrement des votants",
    "Début d'enregistrement des propositions",
    "Fin d'enregistrement des propositions",
    "Début du vote",
    "Fin du vote",
    "Votes comptés"
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [newProposal, setNewProposal] = useState();
  const [winningProposal, setWinningProposal] = useState();
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const getStep = async () => {
      const contract = await getContract(Voting);
      const response = await contract.methods.status().call();
      setActiveStep(Number(response));
    }

    getStep();
  }, []);

  useEffect(() => {
    const getWinner = async () => {
      const contract = await getContract(Voting);
      const id = await contract.methods.winningProposalId().call();
      const response = await contract.methods.proposals(id - 1).call();
      setWinningProposal(response);
    }

    console.log(activeStep);
    if (activeStep === 5)
      getWinner();
  }, [activeStep]);

  useEffect(() => {
    const getProposals = async () => {
      const contract = await getContract(Voting);
      const proposalsArray = [];
      const proposalsCount = await contract.methods.proposalsCount().call();
      for (let i = 0; i < proposalsCount; i++) {
        const response = await contract.methods.proposals(i).call();
        proposalsArray.push(response)
      }
      setProposals(proposalsArray);
    }

    getProposals();
  }, []);

  const registerProposal = async () => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    await contract.methods.registerProposal(newProposal).send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            setNewProposal('');
            setProposals([...proposals, { description: newProposal, voteCount: 0 }])
            setMsg('Votre proposition a été enregistrée !');
          }
        })
      }
      else if (err) {
        console.log(err);
        setMsg('error');
      }
    });
  }

  const vote = async (i) => {
    const contract = await getContract(Voting);
    const web3 = await getWeb3();

    await contract.methods.vote(i + 1).send({ from: account }, async function(err, tx) {
      if (tx) {
        console.log(tx);
        await web3.eth.getTransactionReceipt(tx, async function(err, receipt) {
          console.log(receipt);

          if(receipt.status){
            setMsg('Votre vote a été enregistré !');
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
    <Grid direction="column" container spacing={3} style={{ padding: "100px" }}>
      <Grid item>
        <a href="/admin">Jump_To_Admin</a>
      </Grid>
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
        <form noValidate autoComplete="off">
          <Grid direction="column" container spacing={3} style={{ paddingTop: "100px" }}>
            <Grid item>
              <h4>Enregistrement d'une proposition</h4>
              <h5 style={{ color: "red" }}>
                {activeStep === 0
                  ? "Enregistrement des propositions n'est pas encore ouvert !"
                  : activeStep !== 1
                    ? "Enregistrement des propositions est fermé !"
                    : ""
                }
              </h5>
            </Grid>
            <Grid item>
              <TextareaAutosize rowsMin={6} id="standard-basic" label="Adresse" onChange={({ target }) => setNewProposal(target.value)}/>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" onClick={() => registerProposal()} disabled={activeStep !== 1}>
                Enregistrer
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>

      <Grid item style={{ marginTop: 100 }}>
        <h4>Propositions</h4>
        <h5 style={{ color: "red" }}>
          {activeStep < 3
            ? "Le vote n'a pas encore ouvert !"
            : activeStep > 4
              ? "Le vote a déjà terminé !"
              : ""
          }
        </h5>
      </Grid>
      <Grid item>
        <Grid container spacing={2}>
          {proposals && proposals.map((proposal, i) => (
            <Grid item key={i} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Proposition {i + 1}
                  </Typography>
                  <Typography variant="body2" component="p">
                    {proposal.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => vote(i)} disabled={activeStep !== 3}>Voter</Button>
                </CardActions>
              </Card>
            </Grid>
          ))
          }</Grid>
      </Grid>

      <Grid item style={{ marginTop: 50 }}>
        <h4>Proposition gagnante</h4>
        <h5 style={{ color: "red" }}>
          {activeStep < 5
            ? "La proposition gagnante n'est pas encore annoncée !"
            : ""
          }
        </h5>
      </Grid>
      {winningProposal && (
        <Grid item>
          <Card>
            <CardContent>
              <Typography variant="body2" component="p">
                {winningProposal.description}
              </Typography>
              <Typography variant="body1" component="p">
                Votes : <b>{winningProposal.voteCount}</b>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}

export default Public;
