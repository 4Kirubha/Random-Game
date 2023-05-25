import { BigNumber,providers,utils,Contract,ethers } from "ethers";
import Head from "next/head";
import React,{useEffect,useRef,useState} from "react";
import Web3Modal from "web3modal";
import {
  ABI,
  RANDOM_GAME_CONTRACT_ADDRESS
}from "../constants/index";
import{subgraphQuery} from "../utils";
import{FETCH_CREATED_GAME} from "../queries";
import styles from "../styles/Home.module.css";

export default function Home(){
  const zero = BigNumber.from("0");
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [entryFees, setEntryFees] = useState(zero);
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState();
  const [logs, setLogs] = useState([]);
  const web3ModalRef = useRef();
  const forceUpdate = React.useReducer(() => ({}),{})[1];

  async function getProviderOrSigner(needSigner=false){
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 80001){
      window.alert("Change the network to Mumbai")
      throw new Error("Change the network to Mumbai");
    }

    if(needSigner==true){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  async function connectWallet(){
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err)
    }
  }

  async function startGame(){
    try{
      const signer = await getProviderOrSigner(true);
      const randomGameContract = new Contract(RANDOM_GAME_CONTRACT_ADDRESS,ABI,signer);
      setLoading(true);
      const tx = await randomGameContract.startGame(maxPlayers,entryFees);
      await tx.wait();
      setLoading(false);
    }catch(err){
      console.error(err)
    }
  }

  async function joinGame(){
    try{
      const signer = await getProviderOrSigner(true);
      const randomGameContract= new Contract(RANDOM_GAME_CONTRACT_ADDRESS,ABI,signer);
      setLoading(true);
      const tx = await randomGameContract.joinGame({value: entryFees})
      await tx.wait();
      setLoading(false);
    }catch(err){
      console.error(err)
    }
  }

  async function checkIfGameStarted(){
    try{
      const provider = await getProviderOrSigner();
      const randomGameContract = new Contract(RANDOM_GAME_CONTRACT_ADDRESS,ABI,provider);
      const _gameStarted = await randomGameContract.gameStarted();
      const _gamesArray = await subgraphQuery(FETCH_CREATED_GAME());
      const _game = _gamesArray.games[0];
      let _logs = [];
      if(_gameStarted){
        _logs = [`Game has started with ID: ${_game.id}`];
        if(_game.players && _game.players.length > 0){
          _logs.push(`${_game.players.length}/${_game.maxPlayers} already joined`)
          _game.players.forEach((player) =>{
          _logs.push(`${player} joined`)
          })
        }
        setEntryFees(BigNumber.from(_game.entryFees));
        setMaxPlayers(_game.maxPlayers);
      }else if(!gameStarted && _game.winner){
        _logs = [
          `Last game has ended with ID: ${_game.id}`,
          `Winner is :${_game.winner}`,
          `Waiting for host to start new game...`
        ]
        setWinner(_game.winner);
      }
      setLogs(_logs);
      setPlayers(_game.players);
      setGameStarted(_gameStarted);
      forceUpdate();
    }catch(error){
      console.error(error)
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const randomGameContract = new Contract(
        RANDOM_GAME_CONTRACT_ADDRESS,
        ABI,
        provider
      );
      const _owner = await randomGameContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal ({
        network:"mumbai",
        providerOptions:{},
        disableInjectedProvider: false
      })
      connectWallet();
      getOwner();
      checkIfGameStarted();
      setInterval(()=>{
        checkIfGameStarted()
      },2000)
    }
  },[walletConnected])

  function renderButton(){
    if(!walletConnected){
      return (
        <button className={styles.button} onClick={connectWallet}>Connect your Wallet</button>
      )
    }
    if(loading){
      return(
        <button className={styles.button}>Loading</button>
      )
    }
    if(gameStarted){
      if(players.length === maxPlayers){
        return(
          <button className={styles.button}>Choosing winner...</button>
        )
      }
      return(
        <div>
          <button className={styles.button} onClick={joinGame}>Join Game</button>
        </div>
      )
    }

    if(isOwner && !gameStarted){
      return(
        <div>
          <input 
            type="number"
            className={styles.input}
            onChange={(e)=>{
              setEntryFees(e.target.value >= 0? utils.parseEther(e.target.value.toString()):zero)
            }}
            placeholder="Entry Fee (ETH)">
          </input>
          <input
            type="number"
            className={styles.input}
            onChange={(e) => {
              setMaxPlayers(e.target.value??0)
            }}
            placeholder="Max Players">
          </input>
          <button className={styles.button} onClick={startGame}>Start Game</button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>KKPunks</title>
        <meta name="description" content="KKPunks-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Random Winner Game!</h1>
          <div className={styles.description}>
            It's a lottery game where a winner is chosen at random &
            wins the entire lottery pool
          </div>
          {renderButton()}
          {logs &&
            logs.map((log, index) => (
              <div className={styles.log} key={index}>
                {log}
              </div>
            ))}
        </div>
        <div>
          <img className={styles.image} src="./randomWinner.png" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by KK</footer>
    </div>
  );
}
