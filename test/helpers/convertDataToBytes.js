const convertDataToBytes = (data) => {
  let concatenatedString = ''

  Object.values(data).forEach((value) => {
    concatenatedString += `${value}::`
  })

  const buffer = Buffer.from(concatenatedString.substring(0, concatenatedString.length - 3))
  return `0x${buffer.toString('hex')}`
}

export default convertDataToBytes
