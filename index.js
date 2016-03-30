var BUCKETS = 256
var BITFIELD_BYTE_LENGTH = 1024
var BITFIELD_LENGTH = 8 * BITFIELD_BYTE_LENGTH

module.exports = SparseBitfield

function SparseBitfield () {
  if (!(this instanceof SparseBitfield)) return new SparseBitfield()

  this.length = BITFIELD_LENGTH
  this.bucketLength = 0
  this.buckets = null
  this.bitfield = null
}

SparseBitfield.BITFIELD_LENGTH = BITFIELD_LENGTH
SparseBitfield.BITFIELD_BYTE_LENGTH = BITFIELD_BYTE_LENGTH
SparseBitfield.BUCKETS = BUCKETS

SparseBitfield.prototype.setBuffer = function (index, buffer) {
  while (index >= this.length) this.grow()

  if (!this.buckets) {
    this.bitfield = buffer
    return
  }

  var bucket = Math.floor(index / this.bucketLength)
  var remainder = index - bucket * this.bucketLength

  if (!this.buckets[bucket]) this.buckets[bucket] = new SparseBitfield()
  this.buckets[bucket].setBuffer(remainder, buffer)
}

SparseBitfield.prototype.getBuffer = function (index) {
  if (index >= this.length) return null
  if (this.bitfield) return this.bitfield

  var bucket = Math.floor(index / this.bucketLength)
  var remainder = index - bucket * this.bucketLength

  if (!this.buckets[bucket]) return null
  return this.buckets[bucket].getBuffer(remainder)
}

SparseBitfield.prototype.get = function (index) {
  if (index >= this.length) return false
  if (this.bitfield) return get(this.bitfield, index)

  var bucket = Math.floor(index / this.bucketLength)
  var remainder = index - bucket * this.bucketLength

  if (!this.buckets || !this.buckets[bucket]) return false
  return this.buckets[bucket].get(remainder)
}

SparseBitfield.prototype.set = function (index, val) {
  while (index >= this.length) this.grow()

  if (!this.buckets) {
    if (!this.bitfield) {
      this.bitfield = Buffer(BITFIELD_BYTE_LENGTH)
      this.bitfield.fill(0)
    }
    return set(this.bitfield, index, val)
  }

  var bucket = Math.floor(index / this.bucketLength)
  var remainder = index - bucket * this.bucketLength

  if (!this.buckets[bucket]) this.buckets[bucket] = new SparseBitfield()
  return this.buckets[bucket].set(remainder, val)
}

SparseBitfield.prototype.grow = function () {
  var child = null

  if (this.bitfield || this.buckets) {
    child = new SparseBitfield()
    child.buckets = this.buckets
    child.bitfield = this.bitfield
    child.bucketLength = this.bucketLength
    child.length = this.length
  }

  this.bucketLength = this.length
  this.length *= BUCKETS
  this.buckets = new Array(BUCKETS)
  this.bitfield = null

  if (child) this.buckets[0] = child
}

function get (bitfield, index) {
  var byte = index >> 3
  var bit = index & 7
  return !!(bitfield[byte] & (128 >> bit))
}

function set (bitfield, index, val) {
  var byte = index >> 3
  var bit = index & 7
  var mask = 128 >> bit

  var b = bitfield[byte]
  var n = val ? b | mask : b & ~mask

  if (b === n) return false
  bitfield[byte] = n
  return true
}
