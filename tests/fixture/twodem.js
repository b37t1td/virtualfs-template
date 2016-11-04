module.exports = [
  {
    type : 'file',
    name : 'hello.txt',
    content : 'hello world'
  },
  {
    type : 'file',
    name : 'top-mop.txt',
    content : 'something inside'
  },
  {
    type : 'dir',
    name : 'amadir',
    content : [
      {
        type : 'file',
        name : 'fileinside.txt',
        content : 'test123'
      },
      {
        type : 'file',
        name : 'anotherfile.txt',
        content : 'ppppp'
      },
      {
        type : 'dir',
        name : 'subdir',
        content : []
      }
    ]
  },
  {
    type : 'dir',
    name : 'empty-directory',
    content : []
  }
];

