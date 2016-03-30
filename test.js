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

tape('get buffer', function (t) {
  var bits = bitfield()

  t.same(bits.getBuffer(9999999999999), null, 'no buffer set')
  bits.set(9999999999999, true)
  t.ok(bits.getBuffer(9999999999999), 'a is buffer set')
  t.end()
})

tape('get and set buffer', function (t) {
  var bits = bitfield()

  t.same(bits.getBuffer(9999999999999), null, 'no buffer set')
  bits.set(9999999999999, true)

  var bits2 = bitfield()
  t.same(bits2.get(9999999999999), false, 'bit is not set')
  bits2.setBuffer(9999999999999, bits.getBuffer(9999999999999))
  t.ok(bits2.getBuffer(9999999999999), 'a is buffer set')
  t.same(bits2.get(9999999999999), true, 'bit is set')
  t.end()
})
