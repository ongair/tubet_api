var matchers = {

  inList: function(list,needle) {
    list.find(function(hay) {
      return hay.toLowerCase() == needle.toLowerCase();
    })
  }

}

module.exports = matchers;
