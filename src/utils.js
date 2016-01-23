export function merge() {
  var mix = {};
  for (var i = 0, l = arguments.length; i < l; i++){
    var object = arguments[i];
    if (object.constructor.name != 'Object') continue;
    for (var key in object){
      var op = object[key], mp = mix[key];
      if (mp && op.constructor.name == 'Object' && mp.constructor.name == 'Object') {
        mix[key] = merge(mp, op);
      } else{
        mix[key] = detach(op);
      }
    }
  }
  return mix;
};

export function splat(a) {
  return Array.isArray(a) && a || [a];
};

export function empty() {}

var _uid = Date.now();
export function uid() {
  return _uid++;
}

function detach(elem) {
  var t = elem.constructor.name, ans;
  if (t == 'Object') {
    ans = {};
    for (var p in elem) {
      ans[p] = detach(elem[p]);
    }
    return ans;
  } else if (t == 'Array') {
    ans = [];
    for (var i = 0, l = elem.length; i < l; i++) {
      ans[i] = detach(elem[i]);
    }
    return ans;
  } else {
    return elem;
  }
}
