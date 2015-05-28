module.exports = function() {
  /**
   * available streams
   * the id value is considered unique (provided by socket.io)
   */
  var streamList = [];

  /**
   * Stream object
   */
  var Stream = function(id, name, user) {
    this.name = name;
    this.id = id;
    this.user = user;
  }

  return {
    addStream : function(id, name, user) {
      var stream = new Stream(id, name, user);
      streamList.push(stream);
    },

    removeStream : function(id) {
      var index = 0;
      while(index < streamList.length && streamList[index].id != id){
        index++;
      }
      streamList.splice(index, 1);
    },

    // update function
    update : function(id, name) {
      var stream = streamList.find(function(element, i, array) {
        return element.id == id;
      });
      stream.name = name;
    },

    getStreams : function() {
      return streamList;
    },

    getStream : function(id) {
      for(var i=0; i<streamList.length; i++) {
        if (streamList[i].id == id) return streamList[i];
      }
      return null;
    }



  }
};
