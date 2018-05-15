import SolidityEvent from 'web3/lib/web3/event.js' // eslint-disable-line

export default (logs, contract, address) => {
  return logs.map((log) => {
    const event = new SolidityEvent(null, contract.events[log.topics[0]], address)
    return event.decode(log)
  })
}
