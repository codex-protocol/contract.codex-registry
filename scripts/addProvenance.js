/* eslint-disable no-await-in-loop */

const CodexRecord = artifacts.require('./CodexRecord.sol')
const CodexRecordProxy = artifacts.require('./CodexRecordProxy.sol')

// NOTE: This should be run after 'npm run mint'

const getTokenIds = async (contract, account, balance) => {
  const tokenIds = []

  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(account, i)
    console.log(`Owner ${account} has token ${tokenId} at index ${i}`)
    tokenIds.push(tokenId)
  }

  return tokenIds
}

const transferTokens = async (contract, from, to, tokenIds) => {
  console.log(`Transferring ${tokenIds.length} tokens from ${from} to ${to}`)

  for (let i = 0; i < tokenIds.length; i++) {
    await contract.transferFrom(from, to, tokenIds[i], { from })
  }
}

module.exports = async (callback) => {

  const codexRecordProxy = await CodexRecordProxy.deployed()
  const codexRecord = CodexRecord.at(codexRecordProxy.address)

  const [firstAccount, secondAccount, thirdAccount] = web3.eth.accounts

  // since we've already run the mint script, we know that the first 2 accounts have tokens, so let's
  // use that fact to create a bunch of transfer events
  const firstAccountBalance = await codexRecord.balanceOf(firstAccount)
  console.log(`Account ${firstAccount} owns ${firstAccountBalance} tokens`)

  const secondAccountBalance = await codexRecord.balanceOf(secondAccount)
  console.log(`Account ${secondAccount} owns ${secondAccountBalance} tokens`)

  // Transfer all the tokens from the first account to the third account
  let tokenIds = await getTokenIds(codexRecord, firstAccount, firstAccountBalance)
  await transferTokens(codexRecord, firstAccount, thirdAccount, tokenIds)

  // Transfer all the tokens from the second account to the first account
  tokenIds = await getTokenIds(codexRecord, secondAccount, secondAccountBalance)
  await transferTokens(codexRecord, secondAccount, firstAccount, tokenIds)

  // Transfer all the tokens from the third account to the second account
  tokenIds = await getTokenIds(codexRecord, thirdAccount, firstAccountBalance)
  await transferTokens(codexRecord, thirdAccount, secondAccount, tokenIds)

  callback()

}
