import "./App.css";
import { useState, useEffect } from "react";

import detectEthereumProvider from "@metamask/detect-provider";



var contractAddress = "0x426095667eC89BdeF8368876d9130fCF1876e8F6";


export const formatBalance = (rawBalance) => {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2);
  return balance;
};
export const formatChainAsNum = (chainIdHex) => {
  const chainIdNum = parseInt(chainIdHex);
  return chainIdNum;
};

const App = () => {
    //Method Selector

    const balanceOfSelector = "0x70a08231";  //keccak256 of balanceOf(address)
    const burnSelector =   "0x42966c68"; // keccak256 of burn(uint)
    const mintSelector = "0xa0712d68";


    const [hasProvider, setHasProvider] = useState(null);
    const initialState = {
        accounts: [],
        balance: "",
        chainId: "",
    }; /* Updated */
    const [wallet, setWallet] = useState(initialState);

    const [tokenBalance, setTokenBalance] = useState(0);

    var contract = "";

    useEffect(() => {
        const refreshAccounts = (accounts) => {
            if (accounts.length > 0) {
                updateWallet(accounts);
            } else {
                // if length 0, user is disconnected
                setWallet(initialState);
            }
        };

        const refreshChain = (chainId) => {               /* New */
            setWallet((wallet) => ({ ...wallet, chainId }));   /* New */
        };                                                     /* New */
//หาดูว่ามี Provider หรือไม่ถ้าเจอให้เปิด ปุ่ม Connect
        const getProvider = async () => {
            const provider = await detectEthereumProvider({ silent: true });
            setHasProvider(Boolean(provider));

            if (provider) {

                //contract = new window.ethereum.eth.Contract(contractABI, contractAddress);
                const accounts = await window.ethereum.request({
                    method: "eth_accounts",
                });
                refreshAccounts(accounts);
                window.ethereum.on("accountsChanged", refreshAccounts);
                window.ethereum.on("chainChanged", refreshChain); /* New */

                
            }
        };

        getProvider();

        return () => {
            window.ethereum?.removeListener("accountsChanged", refreshAccounts);
            window.ethereum?.removeListener(
                "chainChanged",
                refreshChain
            ); /* New */
        };
    }, []);

    const updateWallet = async (accounts) => {
        const balance = formatBalance(
            await window.ethereum.request({              /* New */
                method: "eth_getBalance",                 /* New */
                params: [accounts[0], "latest"],          /* New */
            })
        );                                                /* New */
        const chainId = await window.ethereum.request({  /* New */
            method: "eth_chainId",                        /* New */
        });                                               /* New */
        setWallet({ accounts, balance, chainId });        /* Updated */

        const data = balanceOfSelector + accounts[0].slice(2).padStart(64, "0"); // padStart ensures 64 hex characters
        const transactionObject = {
          to: contractAddress,
          data: data
        };
        window.ethereum.request({
          method: 'eth_call',
          params: [transactionObject, 'latest'], // 'latest' for the latest block
        })
        .then(function(result) {
          // Convert the result from hex to decimal
          var balance = parseInt(result, 16);
          balance = balance / (10**18);
          //console.log('User balance:', balance);
          setTokenBalance(Number(balance));
        })
        .catch(function(error) {
          console.error('Error getting balance:', error);
        });
    };

    const handleConnect = async () => {
        let accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        updateWallet(accounts);
    };



    const mintLucky = async() => {
       const uintValueHex = Number(10000000000000).toString(16);
       const paddedValueHex = uintValueHex.padStart(64, '0');

       const data = mintSelector+paddedValueHex;

       const transactionObject = {
        from:  wallet.accounts[0],
        to: contractAddress,
        data: data
      };
      window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionObject]
      })
      .then(function(result) {
        // Convert the result from hex to decimal
        alert("Free lucky mint request sent");
        //updateWallet();
        
      })
      .catch(function(error) {
        alert("Error sending burn");
      });
    }

    const luckyBurn = async() => {

          burn100();

          let chance = Math.random() * 100;

          if (chance < 80){
              alert("You win,  get 100000000 mint more soon");
              mintLucky();
          }

    }

    const burn100 = async() => {
      const uintValueHex = Number(10000000000000).toString(16);
    // Pad the hexadecimal string to 32 bytes (64 hex characters)
      const paddedValueHex = uintValueHex.padStart(64, '0');
      //Prepare BURN call
     
      const data = burnSelector + paddedValueHex; // padStart ensures 64 hex characters
     
      //setTokenBalance(data);
      // Prepare the transaction object for eth_call
        const transactionObject = {
          from:  wallet.accounts[0],
          to: contractAddress,
          data: data
        };
        window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionObject]
        })
        .then(function(result) {
          // Convert the result from hex to decimal
          alert("Burn 100 sent");
          //updateWallet();
          
        })
        .catch(function(error) {
          alert("Error sending burn");
        });

    }

    return (
        <div className="App">
            <div>
                Injected Provider {hasProvider ? "DOES" : "DOES NOT"} Exist
            </div>

            {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
                <button onClick={handleConnect}>Connect MetaMask</button>
            )}

            {wallet.accounts.length > 0 && (
                <>                                                    {/* New */}
                    <div>Wallet Accounts: {wallet.accounts[0]}</div>
                    <div>Wallet Balance: {wallet.balance}</div>       {/* New */}
                    <div>Hex ChainId: {wallet.chainId}</div>          {/* New */}
                    <div>
                        Numeric ChainId: {formatChainAsNum(wallet.chainId)}
                    </div>                                            {/* New */}

                    <div>
                        My ERC20 Token Balance : { tokenBalance }
                    </div>


                    <div>
                      <button onClick={luckyBurn}> SLOT BURN !! </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default App;