// web3 is injected by truffle at runtime for tests
// eslint-disable-next-line import/no-extraneous-dependencies
const SolidityEvent = require('web3/lib/web3/event.js')

export default function decodeLogs(logs, contract, address) {
  return logs.map((log) => {
    const event = new SolidityEvent(null, contract.events[log.topics[0]], address)
    return event.decode(log)
  })
}
