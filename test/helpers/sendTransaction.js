import _ from 'lodash'
import ethjsAbi from 'ethjs-abi'

export function findMethod(abi, name, args) {
  for (let i = 0; i < abi.length; i++) {
    const methodArgs = _.map(abi[i].inputs, 'type').join(',')
    if ((abi[i].name === name) && (methodArgs === args)) {
      return abi[i]
    }
  }
  throw new Error(`could not find method ${name}`)
}

export default (target, name, argsTypes, argsValues, opts) => {
  const abiMethod = findMethod(target.abi, name, argsTypes)
  const encodedData = ethjsAbi.encodeMethod(abiMethod, argsValues)
  return target.sendTransaction(Object.assign({ data: encodedData }, opts))
}
