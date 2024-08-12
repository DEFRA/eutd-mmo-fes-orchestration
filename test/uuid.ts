function uuidv4() {
  return 'xxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8) ; // tslint:disable-line
    return v.toString(16);
  });
}

function run() {
  var cached = [];
  for(let i=0; i<500000; i++) {
    const val = uuidv4();
    if(cached.indexOf(val) >= 0) {
      console.log(i, val);
      break;
    } else {
      cached.push(val);
    }
  }
}

run();
