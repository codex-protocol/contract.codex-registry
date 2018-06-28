const convertDataToBytes = (data) => {
  const numColons = 2
  let concatenatedString = ''

  Object.values(data).forEach((value) => {
    concatenatedString += `${value}::`
  })

  const buffer = Buffer.from(concatenatedString.substring(0, concatenatedString.length - numColons))
  return `0x${buffer.toString('hex')}`
}

export default convertDataToBytes
