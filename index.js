var bits = require('bit-encode')
var Buffer = require('safe-buffer').Buffer

var BRANCHES = 256

module.exports = SparseBitfield

function SparseBitfield (opts) {
  if (!(this instanceof SparseBitfield)) return new SparseBitfield(opts)
  if (!opts) opts = {}

  this.pageSize = opts.pageSize || 1024
  this.length = 8 * this.pageSize
  this.updates = opts.trackUpdates ? [] : null
  this.tree = new BitTree()
}

SparseBitfield.prototype.nextUpdate = function () {
  if (!this.updates || !this.updates.length) return null
  var next = this.updates.shift()
  next.updated = false
  return next
}

SparseBitfield.prototype.toBuffer = function () {
  var blank = Buffer.alloc(this.pageSize)
  var bufs = []

  for (var i = 0; i < this.length / 8; i += this.pageSize) {
    bufs.push(this.getBuffer(i))
  }

  while (bufs.length && !bufs[bufs.length - 1]) bufs.pop()
  for (var j = 0; j < bufs.length; j++) {
    if (!bufs[j]) bufs[j] = blank
  }

  return bufs.length === 1 ? bufs[0] : Buffer.concat(bufs, bufs.length * this.pageSize)
}

SparseBitfield.prototype.getBuffer = function (offset, buffer) {
  var tree = this._find(offset * 8, false)
  if (!tree || !tree.bitfield) return null
  return tree.bitfield.buffer
}

SparseBitfield.prototype.setBuffer = function (offset, buffer) {
  while (buffer.length > this.pageSize) {
    this._setBuffer(offset, buffer.slice(0, this.pageSize))
    buffer = buffer.slice(this.pageSize)
    offset += this.pageSize
  }

  if (buffer.length !== this.pageSize) throw new Error('Buffer should be a factor of ' + this.pageSize)
  this._setBuffer(offset, buffer)
}

SparseBitfield.prototype._setBuffer = function (offset, buffer) {
  var tree = this._find(offset * 8, true)
  if (tree.bitfield) tree.bitfield.buffer = buffer
  else tree.bitfield = new Bitfield(offset, buffer)
}

SparseBitfield.prototype.set = function (n, val) {
  var tree = this._find(n, val)

  if (!tree.bitfield) {
    var buf = Buffer.alloc(this.pageSize)
    var offset = (n - n % (this.pageSize * 8)) / 8
    tree.bitfield = new Bitfield(offset, buf)
  }

  if (bits.set(tree.bitfield.buffer, n - 8 * tree.bitfield.offset, val)) {
    if (this.updates && !tree.bitfield.updated) {
      tree.bitfield.updated = true
      this.updates.push(tree.bitfield)
    }
    return true
  }

  return false
}

SparseBitfield.prototype.get = function (n) {
  var tree = this._find(n, false)
  if (!tree || !tree.bitfield) return false
  return bits.get(tree.bitfield.buffer, n - 8 * tree.bitfield.offset)
}

SparseBitfield.prototype._find = function (n, grow) {
  while (n >= this.length) this._grow()

  var tree = this.tree
  var treeLength = this.length
  var bitfieldLength = this.pageSize * 8

  while (true) {
    if (tree.children) {
      treeLength /= BRANCHES
      var child = Math.floor(n / treeLength)
      n -= child * treeLength
      if (!tree.children[child]) {
        if (!grow) return null
        tree.children[child] = new BitTree()
      }
      tree = tree.children[child]
      continue
    }

    if (tree.bitfield || treeLength === bitfieldLength) return tree
    if (!grow) return null
    tree.children = new Array(BRANCHES)
  }
}

SparseBitfield.prototype._grow = function () {
  this.length *= BRANCHES

  if (!this.tree.children && !this.tree.bitfield) return

  var tree = new BitTree()
  tree.children = new Array(BRANCHES)
  tree.children[0] = this.tree
  this.tree = tree
}

function BitTree () {
  this.children = null
  this.bitfield = null
}

function Bitfield (offset, buffer) {
  this.offset = offset
  this.buffer = buffer
  this.updated = false
}
