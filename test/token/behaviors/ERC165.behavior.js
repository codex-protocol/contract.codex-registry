require('chai')
  .use(require('chai-as-promised'))
  .should()

export default function shouldBehaveLikeERC165() {
  const interfaceERC165 = '0x01ffc9a7'
  const interfaceERC721 = '0x80ac58cd'

  describe('like ERC165', function () {
    describe('supportsInterface', function () {
      it('should return true for the ERC165 interface', async function () {
        const nftokenInterface = await this.token.supportsInterface(interfaceERC165)
        nftokenInterface.should.be.equal(true)
      })

      it('should return true for the ERC721 interface', async function () {
        const nftokenInterface = await this.token.supportsInterface(interfaceERC721)
        nftokenInterface.should.be.equal(true)
      })

      it('should return false for a non existing interface', async function () {
        const nftokenNonExistingInterface = await this.token.supportsInterface('0x00000000')
        nftokenNonExistingInterface.should.be.equal(false)
      })
    })
  })
}
