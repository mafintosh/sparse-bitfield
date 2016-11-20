# sparse-bitfield

Bitfield implementation that allocates a series of 1kb buffers to support sparse bitfields
without allocating a massive buffer. If you want to simple implementation of a flat bitfield
see the [bitfield](https://github.com/fb55/bitfield) module.

This module is mostly useful if you need a big bitfield where you won't nessecarily set every bit.

```
npm install sparse-bitfield
```

[![build status](http://img.shields.io/travis/mafintosh/sparse-bitfield.svg?style=flat)](http://travis-ci.org/mafintosh/sparse-bitfield)

## Usage

``` js
var bitfield = require('sparse-bitfield')
var bits = bitfield()

bits.set(0, true) // set first bit
bits.set(1, true) // set second bit
bits.set(1000000000000, true) // set the 1.000.000.000.000th bit
```

Running the above example will allocate two 1kb buffers internally.
Each 1kb buffer can hold information about 8192 bits so the first one will be used to store information about the first two bits and the second will be used to store the 1.000.000.000.000th bit.

## API

#### `var bits = bitfield([options])`

Create a new bitfield. Options include

``` js
{
  pageSize: 1024, // how big should the partial buffers be
  trackUpdates: false // track when partial bitfields are updated
}
```

#### `bits.set(index, value)`

Set a bit to true or false.

#### `bits.get(index)`

Get the value of a bit.

#### `var buffer = bits.getBuffer(offset)`

Get a partial buffer at a byte offset.
Returns `null` if offset is not currently in use.

#### `bits.setBuffer(offset, buffer)`

Set a partial buffer corresponding to the byte offset.
Mostly useful if you reload a serialized bitfield.

#### `var buffer = bits.toBuffer()`

Get a single buffer representing the entire bitfield.

#### `var update = bits.nextUpdate()`

Returns the next updated bitfield if the `trackUpdates` option was set.
The update contains the following properties

``` js
{
  offset: byteOffset,
  buffer: partialBitfield
}
```

If nothing was updated since the last time this was called `null` is returned.
Mostly useful if you want to serialize the bitfield.

## License

MIT
