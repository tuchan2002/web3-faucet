import { Alert, Box, Button, Snackbar, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

const FaucetAbi = [
  {
    inputs: [],
    name: "addFunds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "funders",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllFunders",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getFundersIndex",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "lutFunders",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numOfFunders",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
const FaucetAddress = "0x3C2a47BF1A2D411C6F6432c348039437e32a3cA4";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null,
    contract: null,
  });
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [alertInfo, setAlertInfo] = useState({
    severity: "success",
    message: "",
    isOpen: false,
  });
  const [shouldReload, setShouldReload] = useState(false);

  const reloadEffect = () => {
    setShouldReload((prevState) => !prevState);
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setAlertInfo({ ...alertInfo, isOpen: false });
  };

  const setAccountListener = (provider) => {
    provider.on("accountsChanged", (accounts) => setAccount(accounts[0]));
  };

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      const web3 = new Web3(provider);
      const faucetContract = new web3.eth.Contract(FaucetAbi, FaucetAddress);

      if (provider) {
        setAccountListener(provider);
        setWeb3Api({
          provider,
          web3: web3,
          contract: faucetContract,
        });
      } else {
        setAlertInfo({
          severity: "error",
          message: "Please, Install Metamask",
          isOpen: true,
        });
        console.error("Please, Install Metamask");
      }
    };
    loadProvider();
  }, []);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  useEffect(() => {
    const loadBalance = async () => {
      const { web3 } = web3Api;
      const balance = await web3.eth.getBalance(FaucetAddress);
      setBalance(web3.utils.fromWei(balance, "ether"));
    };
    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  const addFunds = useCallback(async () => {
    if (!account) {
      connectWallets();
      return;
    }

    const { contract, web3 } = web3Api;

    try {
      await contract.methods.addFunds().send({
        from: account,
        value: web3.utils.toWei("0.02", "ether"),
      });

      setAlertInfo({
        severity: "success",
        message: "Donate successful",
        isOpen: true,
      });

      reloadEffect();
    } catch (error) {
      setAlertInfo({
        severity: "error",
        message: "User rejected the transaction",
        isOpen: true,
      });
      console.error("User rejected the transaction");
    }
  }, [web3Api, account]);

  const withdraw = useCallback(async () => {
    if (!account) {
      connectWallets();
      return;
    }

    const { contract, web3 } = web3Api;
    const withdrawAmount = web3.utils.toWei("0.02", "ether");

    try {
      await contract.methods.withdraw(withdrawAmount).send({
        from: account,
      });

      setAlertInfo({
        severity: "success",
        message: "Withdraw successful",
        isOpen: true,
      });

      reloadEffect();
    } catch (error) {
      setAlertInfo({
        severity: "error",
        message: "User rejected the transaction",
        isOpen: true,
      });
      console.error("User rejected the transaction");
    }
  }, [web3Api, account]);

  const connectWallets = () => {
    web3Api.provider.request({ method: "eth_requestAccounts" });
  };

  return (
    <Box
      sx={{
        mt: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Snackbar
        open={alertInfo.isOpen}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Typography variant="h2" component="h2">
        Current Balance: <strong>{balance} BNB</strong>
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 3,
        }}
      >
        <Button variant="contained" color="success" onClick={addFunds}>
          Donate
        </Button>
        <Button variant="contained" color="secondary" onClick={withdraw}>
          Withdraw
        </Button>
        <Button variant="contained" onClick={connectWallets}>
          Connect Wallets
        </Button>
      </Box>
      <Typography fontSize={18}>
        Accounts address:
        <strong>{account ? " " + account : " Accounts denied"}</strong>
      </Typography>
    </Box>
  );
}

export default App;
