module.exports = function() {
  /**
   * available streams
   * the id value is considered unique (provided by socket.io)
   */
  var streamList = [];

  /**
   * Stream object
   */
  var Stream = function(id, name, idUser, idGroup) {
    this.name = name;
    this.id = id;
    this.userId = idUser;
    this.groupId = idGroup;
  }

  return {
    addStream : function(id, name, idUser, idGroup) {
      for(var i = 0; i < streamList.length; i++){
        if (streamList[i].userId == idUser){
          streamList[i].id = id;
          return;
        }
      }
      var stream = new Stream(id, name, idUser, idGroup);
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
    update : function(id, name, idUser, idGroup) {
      var stream = streamList.find(function(element, i, array) {
        return element.userId == idUser;
      });
      stream.name = name;
    },

    getStreams : function() {
      return streamList;
    },

    getByUserId : function(userId){
      for(var i = 0; i < streamList.length; i++){
        if (streamList[i].userId == userId){
          return streamList[i]
        } else {
          return null;
        }
      }
    }
  }
};
