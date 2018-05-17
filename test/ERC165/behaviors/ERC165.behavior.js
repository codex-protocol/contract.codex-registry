require('chai')
  .use(require('chai-as-promised'))
  .should()

export default function shouldBehaveLikeERC165(name, symbol, creator, accounts) {
  const firstTokenId = 100
  const secondTokenId = 200

  describe('like ERC165', function () {
    beforeEach(async function () {
      await this.token.mint(creator, firstTokenId, { from: creator })
      await this.token.mint(creator, secondTokenId, { from: creator })
    })

    describe('checks supported interfaces', function () {
      it('checks existing interface', async function () {
        const nftokenInterface = await this.token.supportsInterface('0x80ac58cd')
        nftokenInterface.should.be.equal(true)
      })

      it('checks non-existing interface', async function () {
        const nftokenNonExistingInterface = await this.token.supportsInterface('0x5b5e139f')
        nftokenNonExistingInterface.should.be.equal(false)
      })
    })
  })
}
