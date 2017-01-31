var alloc = require('buffer-alloc')
var tape = require('tape')
var bitfield = require('./')

tape('set and get', function (t) {
  var bits = bitfield()

  t.same(bits.get(0), false, 'first bit is false')
  bits.set(0, true)
  t.same(bits.get(0), true, 'first bit is true')
  t.same(bits.get(1), false, 'second bit is false')
  bits.set(0, false)
  t.same(bits.get(0), false, 'first bit is reset')
  t.end()
})

tape('set large and get', function (t) {
  var bits = bitfield()

  t.same(bits.get(9999999999999), false, 'large bit is false')
  bits.set(9999999999999, true)
  t.same(bits.get(9999999999999), true, 'large bit is true')
  t.same(bits.get(9999999999999 + 1), false, 'large bit + 1 is false')
  bits.set(9999999999999, false)
  t.same(bits.get(9999999999999), false, 'large bit is reset')
  t.end()
})

tape('get and set buffer', function (t) {
  var bits = bitfield({trackUpdates: true})

  t.same(bits.getBuffer(0), null)
  t.same(bits.getBuffer(Math.floor(9999999999999 / 8)), null)
  bits.set(9999999999999, true)

  var bits2 = bitfield()
  var upd = bits.nextUpdate()
  bits2.setBuffer(upd.offset, upd.buffer)
  t.same(bits2.get(9999999999999), true, 'bit is set')
  t.end()
})

tape('toBuffer', function (t) {
  var bits = bitfield()

  t.same(bits.toBuffer(), alloc(0))

  bits.set(0, true)

  t.same(bits.toBuffer(), bits.getBuffer(0))

  bits.set(9000, true)

  t.same(bits.toBuffer(), Buffer.concat([bits.getBuffer(0), bits.getBuffer(1024)]))
  t.end()
})

tape('pass in buffer', function (t) {
  var bits = bitfield()

  bits.set(0, true)
  bits.set(9000, true)

  var clone = bitfield(bits.toBuffer())

  t.same(clone.get(0), true)
  t.same(clone.get(9000), true)
  t.end()
})

tape('set small buffer', function (t) {
  var buf = alloc(1)
  buf[0] = 255
  var bits = bitfield(buf)

  t.same(bits.get(0), true)
  t.same(bits.getBuffer(0).length, bits.pageSize)
  t.end()
})
