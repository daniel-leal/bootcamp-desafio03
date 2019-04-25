const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const Queue = require('../services/Queue')
const PurchaseMail = require('../jobs/PurchaseMail')

class PurchaseController {
  async store (req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    const purchase = await Purchase.create({ ad, content, user: user._id })

    return res.json(purchase)
  }

  async approve (req, res) {
    const { ad } = await Purchase.findById(req.params.id).populate('ad')

    if (ad.purchasedBy) {
      return res.status(400).json({ error: 'Ad already been purchased' })
    }

    if (!ad.author._id.equals(req.userId)) {
      return res.status(401).json({ error: "You're not the ad author" })
    }

    ad.purchasedBy = req.params.id

    await ad.save()

    return res.json(ad)
  }
}

module.exports = new PurchaseController()
