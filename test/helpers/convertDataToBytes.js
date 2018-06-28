const convertDataToBytes = (data) => {
  const buffer = Buffer.from(Object.values(data).join('::'))
  return `0x${buffer.toString('hex')}`
}

export default convertDataToBytes
