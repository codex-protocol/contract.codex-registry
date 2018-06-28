const convertDataToBytes = (data) => {
  let concatenatedString = ''

  Object.keys(data).forEach((key) => {
    concatenatedString += `${data[key]}:::`
  })

  const buffer = Buffer.from(concatenatedString.substring(0, concatenatedString.length - 3))
  return `0x${buffer.toString('hex')}`
}

export default convertDataToBytes
