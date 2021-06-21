const Buffer = require('buffer').Buffer
const tape = require('tape')
const Bitfield = require('./')

tape('set and get', function (t) {
  const bits = new Bitfield()

  t.same(bits.get(0), false, 'first bit is false')
  bits.set(0, true)
  t.same(bits.get(0), true, 'first bit is true')
  t.same(bits.get(1), false, 'second bit is false')
  bits.set(0, false)
  t.same(bits.get(0), false, 'first bit is reset')
  t.end()
})

tape('set large and get', function (t) {
  const bits = new Bitfield()

  t.same(bits.get(9999999999999), false, 'large bit is false')
  bits.set(9999999999999, true)
  t.same(bits.get(9999999999999), true, 'large bit is true')
  t.same(bits.get(9999999999999 + 1), false, 'large bit + 1 is false')
  bits.set(9999999999999, false)
  t.same(bits.get(9999999999999), false, 'large bit is reset')
  t.end()
})

tape('get and set buffer', function (t) {
  const bits = new Bitfield({ trackUpdates: true })

  t.same(bits.pages.get(0, true), undefined)
  t.same(bits.pages.get(Math.floor(9999999999999 / 8 / 1024), true), undefined)
  bits.set(9999999999999, true)

  const bits2 = new Bitfield()
  const upd = bits.pages.lastUpdate()
  bits2.pages.set(Math.floor(upd.offset / 1024), upd.buffer)
  t.same(bits2.get(9999999999999), true, 'bit is set')
  t.end()
})

tape('toBuffer', function (t) {
  const bits = new Bitfield()

  t.same(bits.toBuffer(), Buffer.alloc(0))

  bits.set(0, true)

  t.same(bits.toBuffer(), bits.pages.get(0).buffer)

  bits.set(9000, true)

  t.same(bits.toBuffer(), Buffer.concat([bits.pages.get(0).buffer, bits.pages.get(1).buffer]))
  t.end()
})

tape('pass in buffer', function (t) {
  const bits = new Bitfield()

  bits.set(0, true)
  bits.set(9000, true)

  const clone = new Bitfield(bits.toBuffer())

  t.same(clone.get(0), true)
  t.same(clone.get(9000), true)
  t.end()
})

tape('set small buffer', function (t) {
  const buf = Buffer.alloc(1, 255)
  const bits = new Bitfield(buf)

  t.same(bits.get(0), true)
  t.same(bits.pages.get(0).buffer.length, bits.pageSize)
  t.end()
})
