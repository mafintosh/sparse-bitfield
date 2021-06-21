const pager = require('memory-pager')
const Buffer = require('buffer').Buffer

class Bitfield {
  constructor (opts) {
    if (!opts) opts = {}
    if (Buffer.isBuffer(opts)) opts = { buffer: opts }

    this.pageOffset = opts.pageOffset || 0
    this.pageSize = opts.pageSize || 1024
    this.pages = opts.pages || pager(this.pageSize)

    this.byteLength = this.pages.length * this.pageSize
    this.length = 8 * this.byteLength

    if (!powerOfTwo(this.pageSize)) throw new Error('The page size should be a power of two')

    this._trackUpdates = !!opts.trackUpdates
    this._pageMask = this.pageSize - 1

    if (opts.buffer) {
      for (let i = 0; i < opts.buffer.length; i += this.pageSize) {
        this.pages.set(i / this.pageSize, opts.buffer.slice(i, i + this.pageSize))
      }
      this.byteLength = opts.buffer.length
      this.length = 8 * this.byteLength
    }
  }

  get (i) {
    const o = i & 7
    const j = (i - o) / 8

    return !!(this.getByte(j) & (128 >> o))
  }

  getByte (i) {
    const o = i & this._pageMask
    const j = (i - o) / this.pageSize
    const page = this.pages.get(j, true)

    return page ? page.buffer[o + this.pageOffset] : 0
  }

  set (i, v) {
    const o = i & 7
    const j = (i - o) / 8
    const b = this.getByte(j)

    return this.setByte(j, v ? b | (128 >> o) : b & (255 ^ (128 >> o)))
  }

  toBuffer () {
    const all = Buffer.alloc(this.pages.length * this.pageSize)

    for (let i = 0; i < this.pages.length; i++) {
      const next = this.pages.get(i, true)
      const allOffset = i * this.pageSize
      if (next) next.buffer.copy(all, allOffset, this.pageOffset, this.pageOffset + this.pageSize)
    }

    return all
  }

  setByte (i, b) {
    let o = i & this._pageMask
    const j = (i - o) / this.pageSize
    const page = this.pages.get(j, false)

    o += this.pageOffset

    if (page.buffer[o] === b) return false
    page.buffer[o] = b

    if (i >= this.byteLength) {
      this.byteLength = i + 1
      this.length = this.byteLength * 8
    }

    if (this._trackUpdates) this.pages.updated(page)

    return true
  }
}

function powerOfTwo (x) {
  return !(x & (x - 1))
}

module.exports = Bitfield
