$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 1000; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  var notificationConstant = [
  "不要再点了，再点也点不出帅哥美女",
  "阿里巴巴又跌了",
  "再忙也要记得吃饭哦",
  "知道就好啦",
  "比黄昏更加昏暗者，比血流还要赤红者，埋没於时间之洪流，在汝伟大之名下，吾在此向黑暗立誓，对於阻挡在吾等面前所有愚蠢的事物，将以吾及汝之力，赐与其同等的毁灭，龙破斩",
  "真正重要的东西，总是没有的人比拥有的人清楚。",
  "关于自己的生活，我和你都不是读者，而是作者。至少结局，还是能自己说了算的。",
  "与其想着怎么美丽地牺牲,倒不如想着怎么漂亮地活到最后一刻。",
  "有阳光的地方就会有阴影，所以有阴影的地方也一定会有阳光。绝望的颜色越是浓厚，在哪里也一定会存在耀眼的希望之光。",
  "人就是要以自卑为跳板才能跳得更高。",
  "拥有和舍弃都很痛苦，既然无论怎样都会痛苦的话，我宁可选择守护它而痛苦。",
  "人生，就像肥皂泡一样。风一吹就呼呼的飞上了天，注意到的时候，却啪地一下消失了。就在即将破裂的瞬间，想要自己飞得更高。但回过神来的时候，却总是来不及。",
  "按照自己认为美丽的方式活下去。",
  "人生就像烟火一样 虽然漂亮却瞬间消失令人伤感，但是就算瞬间也好，我希望自己能够绽放，然后默默的凋谢。",
  "木刀轻划斩落那无法回归的年华 谁偏头轻笑眼神慵散如夏",
  "这个城市这么大，一不小心走散了，可能一辈子都见不到了。",
  "人类无法忍受太多的真实。",
  "阻止了我的脚步的，并不是我所看见的东西，而是我所无法看见的那些东西。你明白么？我看不见的那些。在那个无限蔓延的城市里，什么东西都有，可惟独没有尽头。",
  "我在未来等你",
  "我们读诗、写诗并不是因为它们好玩，而是因为我们是人类的一分子，而人类是充满激情的。没错，医学、法律、商业、工程，这些都是崇高的追求，足以支撑人的一生。但诗歌、美丽、浪漫、爱情，这些才是我们活着的意义。"
];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);

    addNotification(data, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  window.addEventListener("load", function(){
      if(Notification && Notification.permission !== "granted"){
          Notification.requestPermission(function(status){
              if(Notification.permission !== status){
                  Notification.permission = status;
              }
          });

      }
  });

  function addNotification (data, options){

        var t = new Date().toLocaleString();
        var options={
            dir: "ltr",
            lang: "utf-8",
            icon: "panda.jpg",
            body: data.message
        };
        if(Notification && Notification.permission === "granted"){
            var n = new Notification(data.username + ' ' + t, options);    
            n.onclick = function() {
              alert(notificationConstant[
                Math.floor(
                  Math.random() * notificationConstant.length)]);
            };       
            n.onerror = function() {
                console.log("An error accured");
            }            
        }else if(Notification && Notification.permission !== "denied") {
            Notification.requestPermission(function(status){
                if(Notification.permission !== status){
                    Notification.permission = status;
                }

                if(status === "granted"){
                    for(var i = 0; i < 3; i++){
                        var n = new Notification("Hi! " + i, {
                            tag: "ulysses",
                            icon: "panda.jpg",
                            body: "你好呀，我是第" + i +"条消息啦！"
                        });
                    }
                }
            });
        }else{
            alert("Hi!");
        }

  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "能猫聊天室：只有两个能知道的聊天室 – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });
});
