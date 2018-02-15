var fs = require('fs')
/*
more /rootfs/proc/partitions
major minor  #blocks  name

   8        0   62499840 sda
   8        1   62498816 sda1
  11        0    1012112 sr0
  11        1        302 sr1
 */
function DiskFree (rootfs) {
  this.rootfs = rootfs
}

DiskFree.prototype.df = function (cb) {
  return cb(null, this.getPartitions(cb))
}

DiskFree.prototype.getPartitions = function (cb) {
  var rootfs = this.rootfs
  var partitionsTxt = fs.readFileSync(this.rootfs + '/proc/partitions')
  if (partitionsTxt) {
    partitionsTxt = partitionsTxt.toString()
    var lines = partitionsTxt.split('\n')
    var partitions = []
    for (i = 2; i < lines.length; i++) {
      var values = lines[i].split(' ')
      values = values.filter(function (v) { return v !== ''})
      if (values.length > 3) {
        partitions.push({
          major: values[0],
          minor: values[1],
          size: values[2] * 1024,
          filesystem: values[3]
        })
      }
    }
    var lastPart = partitions[0]
    partitions = partitions.map(function (p) {
      try {
        var path = '/sys/block/' + p.filesystem + '/size'
        if (/\d+$/.test(p.filesystem)) {
          var baseDev = p.filesystem.replace(/\d+/,'')
          path = '/sys/block/' + baseDev + '/' + p.filesystem + '/size'
        }    
        var size = fs.readFileSync(rootfs + path).toString() * 512  
        console.log(p.filesystem, size, path)
        p.available = p.size - size
        p.used = size
        p.usedPercent = (p.used / p.size) * 100
        return p
      } catch (err) {
        // console.log('error:' + p.filesystem, err)
        return p
      }
    })
    return cb(null, partitions)
  }
}
module.exports = DiskFree

function testDf() {
   var df = new DiskFree('/rootfs')
   df.df(console.log)
}
testDf()
