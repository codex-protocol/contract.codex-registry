const CodexTitle = artifacts.require('./CodexTitle.sol');
const TokenProxy = artifacts.require('./TokenProxy.sol');

// NOTE: This should be run after 'npm run mint'
module.exports = async function (callback) {
  const tokenProxy = await TokenProxy.deployed();
  const codexTitle = CodexTitle.at(tokenProxy.address);

  const firstAccount = web3.eth.accounts[0];
  const secondAccount = web3.eth.accounts[1];
  const thirdAccount = web3.eth.accounts[2];

  // since we've already run the mint script, we know that the first 2 accounts have tokens, so let's
  // use that fact to create a bunch of transfer events
  const firstAccountBalance = await codexTitle.balanceOf(firstAccount);
  console.log(`Account ${firstAccount} owns ${firstAccountBalance} tokens`);

  const secondAccountBalance = await codexTitle.balanceOf(secondAccount);
  console.log(`Account ${secondAccount} owns ${secondAccountBalance} tokens`);

  // Transfer all the tokens from the first account to the third account
  let tokenIds = await getTokenIds(codexTitle, firstAccount, firstAccountBalance);
  await transferTokens(codexTitle, firstAccount, thirdAccount, tokenIds);

  // Transfer all the tokens from the second account to the first account
  tokenIds = await getTokenIds(codexTitle, secondAccount, secondAccountBalance);
  await transferTokens(codexTitle, secondAccount, firstAccount, tokenIds);

  // Transfer all the tokens from the third account to the second account
  tokenIds = await getTokenIds(codexTitle, thirdAccount, firstAccountBalance);
  await transferTokens(codexTitle, thirdAccount, secondAccount, tokenIds);

  callback();
};

async function getTokenIds (contract, account, balance) {
  const tokenIds = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(account, i);

    console.log(`Owner ${account} has token ${tokenId} at index ${i}`);

    tokenIds.push(tokenId);
  }

  return tokenIds;
}

async function transferTokens (contract, from, to, tokenIds) {
  console.log(`Transferring ${tokenIds.length} tokens from ${from} to ${to}`);

  for (let i = 0; i < tokenIds.length; i++) {
    await contract.transferFrom(from, to, tokenIds[i], { from });
  }
}
