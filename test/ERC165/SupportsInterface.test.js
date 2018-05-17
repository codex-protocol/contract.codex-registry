const SupportsInterface = artifacts.require('SupportsInterface.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('SupportsInterface', async function (accounts) {

  let supportsInterface

  beforeEach(async function () {
    supportsInterface = await SupportsInterface.new()
  })

  describe('SupportsInterface', function () {
    it('correctly checks all the supported interfaces', async () => {
      const erc165 = await supportsInterface.supportsInterface('0x01ffc9a7')
      erc165.should.be.equal(true)
    })

    it('checks if 0xffffffff is false', async () => {
      const element = await supportsInterface.supportsInterface('0xffffffff')
      element.should.be.equal(false)
    })
  })
})
