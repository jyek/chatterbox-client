var GetParams = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
      // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
    return query_string;
}();

// Create app object
var app = {};

// RESTful API
app.server = 'https://api.parse.com/1/classes/chatterbox';

// Current roomname
app.roomname = '';

// Object that contains roomnames
app.roomnames = {};
app.friends = {};

app.init = function(){
  // get and update username
  app.username = GetParams.username;
  $('.username').text(app.username);

  // gets new messages
  app.changeRoom('');
  app.fetch();
  setInterval(app.fetch, 5000);

  // return home
  $('.chat-home').on('click', function(){
    app.changeRoom('');
    app.fetch();
  });

  // handles posting new message
  $('.onclick-submit').on('click', function(){
    var msg = $('.my-message').val();
    var room = $('.my-roomname').val();
    app.send(msg, room);
  });
};

app.send = function(text, roomname){
  var message = {
    'username': app.username,
    'text': text,
    'roomname': roomname
  };

  $.ajax({
    // always use this url
    url: app.server,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent');
      app.fetch();
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  });
};

app.fetchRooms = function(){
  var roomnames = app.roomnames;
  $('.chatrooms').empty();
  for (var roomname in roomnames){
    $room = $('<span class="chatroom"></span>');
    $room.text(roomname);
    $('.chatrooms').append($room);
    $('span.chatroom').on('click', function(){
      app.changeRoom( $(this).text() );
      app.fetch();
    });
  }
};

app.updateFriends = function(){
  $('.friends').empty();
  _.each(app.friends, function(v, friendname){
    var $f = $('<span class="friend-name"></span>');
    $f.text(friendname);
    $('.friends').append($f);
  });
};

app.changeRoom = function(roomname){
  app.roomname = roomname;
  if (roomname === ''){
    $('.chat-roomname').text('All');
  } else {
    $('.chat-roomname').text(roomname);
  }
};

app.fetch = function(){
  var data = '';
  if (app.roomname !== ''){
    data = encodeURIComponent('where={"roomname":' + JSON.stringify(app.roomname) + '}');
  }
  $.ajax({
    // always use this url
    url: app.server + '?order=-createdAt',
    type: 'GET',
    data: data,
    contentType: 'application/json',
    success: function (data) {
      // console.log('chatterbox: Message received', data);
      $chat = $('.chat');
      $chat.empty();
      for (var i = 0; i < data.results.length; i++){
        var msg = data.results[i];
        // add room names
        if (!app.roomnames.hasOwnProperty(msg.roomname)){
          app.roomnames[msg.roomname] = true;
        }

        // append results
        $msgWrap = $('<div class="msg-wrap"></div>');

        $msgText = $('<div class="msg-text"></div>');
        if (app.friends.hasOwnProperty(msg.username)){
          $msgText.attr('class', 'bold');
        }
        $msgText.text(msg.text);

        $msgUsername = $('<div class="msg-username"></div>');
        $msgUsername.text(msg.username);
        $msgUsername.on('click', function(){
          var friend = $(this).text();
          app.friends[friend] = true;
          app.updateFriends();
          app.fetch();
        });

        $msgRoomname = $('<div class="msg-roomname"></div>');
        $msgRoomname.text('(' + msg.roomname + ')');

        $clearfix = $('<div class="clearfix"></div>');

        // create message
        $msgWrap.append($msgUsername);
        $msgWrap.append($msgRoomname);
        $msgWrap.append($msgText);
        $msgWrap.append($clearfix);

        // attach to document
        $chat.append($msgWrap);
      }
      app.fetchRooms();
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to get message');
    }
  });
};

$(document).ready(function(){
  app.init();
});