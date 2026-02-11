(function () {
    var user = null;
    try {
        var stored = localStorage.getItem('user');
        if (!stored) {
            window.location.href = '/login';
            return;
        }
        user = JSON.parse(stored);
        if (!user || !user.username) {
            window.location.href = '/login';
            return;
        }
    } catch (e) {
        window.location.href = '/login';
        return;
    }

    var socket = io();
    socket.emit('register_user', user.username);

    var currentRoom = null;
    var dmTargetUser = null;
    var typingStopTimer = null;
    var lastTypingStart = 0;
    var TYPING_THROTTLE_MS = 400;
    var TYPING_STOP_MS = 1500;

    var $roomSelect = $('#roomSelect');
    var $joinRoomBtn = $('#joinRoomBtn');
    var $leaveRoomBtn = $('#leaveRoomBtn');
    var $messageList = $('#messageList');
    var $messageInput = $('#messageInput');
    var $sendBtn = $('#sendBtn');
    var $currentRoomLabel = $('#currentRoomLabel');
    var $toUserInput = $('#toUserInput');
    var $loadDmHistoryBtn = $('#loadDmHistoryBtn');
    var $dmLabel = $('#dmLabel');
    var $dmMessageList = $('#dmMessageList');
    var $dmTypingIndicator = $('#dmTypingIndicator');
    var $dmMessageInput = $('#dmMessageInput');
    var $sendDmBtn = $('#sendDmBtn');

    function setRoomUI(inRoom) {
        currentRoom = inRoom;
        if (currentRoom) {
            $currentRoomLabel.text('Room: ' + currentRoom).removeClass('bg-secondary').addClass('bg-primary');
            $messageInput.prop('disabled', false);
            $sendBtn.prop('disabled', false);
            $leaveRoomBtn.prop('disabled', false);
            $roomSelect.prop('disabled', true);
            $joinRoomBtn.prop('disabled', true);
        } else {
            $currentRoomLabel.text('No room selected').removeClass('bg-primary').addClass('bg-secondary');
            $messageInput.prop('disabled', true).val('');
            $sendBtn.prop('disabled', true);
            $leaveRoomBtn.prop('disabled', true);
            $roomSelect.prop('disabled', false);
            $joinRoomBtn.prop('disabled', false);
            $messageList.empty();
        }
    }

    function appendMessage(msg) {
        var from = $('<strong>').text((msg.from_user || '?') + ': ');
        var text = $('<span>').text(msg.message || '');
        var time = $('<small class="text-muted ms-1">').text(msg.date_sent || '');
        var line = $('<div class="mb-1">').append(from).append(text).append(time);
        $messageList.append(line);
        $messageList[0].scrollTop = $messageList[0].scrollHeight;
    }

    $joinRoomBtn.on('click', function () {
        var room = ($roomSelect.val() || '').trim();
        if (!room) return;
        socket.emit('join_room', { room: room, username: user.username });
        setRoomUI(room);

        $.get('/api/messages/group/' + encodeURIComponent(room))
            .done(function (messages) {
                $messageList.empty();
                if (Array.isArray(messages)) {
                    messages.forEach(function (m) {
                        appendMessage({ from_user: m.from_user, message: m.message, date_sent: m.date_sent });
                    });
                }
            })
            .fail(function () {
                $messageList.empty();
            });
    });

    $leaveRoomBtn.on('click', function () {
        if (currentRoom) {
            socket.emit('leave_room', { room: currentRoom, username: user.username });
            setRoomUI(null);
        }
    });

    $sendBtn.on('click', function () {
        var text = ($messageInput.val() || '').trim();
        if (!text || !currentRoom) return;
        socket.emit('room_message', {
            room: currentRoom,
            from_user: user.username,
            message: text
        });
        $messageInput.val('');
    });

    $messageInput.on('keydown', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            $sendBtn.click();
        }
    });

    socket.on('room_message', function (payload) {
        if (payload && payload.room === currentRoom) {
            appendMessage(payload);
        }
    });

    function setDmTarget(username) {
        dmTargetUser = (username && String(username).trim()) || null;
        if (dmTargetUser) {
            $dmLabel.text('DM with: ' + dmTargetUser).removeClass('text-muted');
        } else {
            $dmLabel.text('DM with: —').addClass('text-muted');
            $dmMessageList.empty();
            $dmTypingIndicator.text('');
        }
    }

    function appendDmMessage(msg) {
        var from = $('<strong>').text((msg.from_user || '?') + ': ');
        var text = $('<span>').text(msg.message || '');
        var time = $('<small class="text-muted ms-1">').text(msg.date_sent || '');
        var line = $('<div class="mb-1">').append(from).append(text).append(time);
        $dmMessageList.append(line);
        $dmMessageList[0].scrollTop = $dmMessageList[0].scrollHeight;
    }

    function loadDmHistory() {
        var other = ($toUserInput.val() || '').trim();
        if (!other) return;
        setDmTarget(other);
        $.get('/api/messages/private/' + encodeURIComponent(other) + '?me=' + encodeURIComponent(user.username))
            .done(function (messages) {
                $dmMessageList.empty();
                if (Array.isArray(messages)) {
                    messages.forEach(function (m) {
                        appendDmMessage({ from_user: m.from_user, message: m.message, date_sent: m.date_sent });
                    });
                }
            })
            .fail(function () {
                $dmMessageList.empty();
            });
    }

    $toUserInput.on('change blur', function () {
        var other = ($toUserInput.val() || '').trim();
        setDmTarget(other);
    });

    $loadDmHistoryBtn.on('click', loadDmHistory);

    $sendDmBtn.on('click', function () {
        var other = ($toUserInput.val() || '').trim();
        var text = ($dmMessageInput.val() || '').trim();
        if (!other || !text) return;
        if (!dmTargetUser) setDmTarget(other);
        socket.emit('private_message', {
            from_user: user.username,
            to_user: other,
            message: text
        });
        $dmMessageInput.val('');
    });

    $dmMessageInput.on('keydown', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            $sendDmBtn.click();
        }
    });

    socket.on('private_message', function (payload) {
        if (!payload) return;
        var other = payload.from_user === user.username ? (payload.to_user || '') : (payload.from_user || '');
        if (!other) return;
        if (dmTargetUser !== other) {
            dmTargetUser = other;
            $dmLabel.text('DM with: ' + other).removeClass('text-muted');
        }
        appendDmMessage(payload);
    });

    function emitTypingStart() {
        var other = ($toUserInput.val() || '').trim();
        if (!other) return;
        var now = Date.now();
        if (now - lastTypingStart >= TYPING_THROTTLE_MS) {
            socket.emit('typing_start', { from_user: user.username, to_user: other });
            lastTypingStart = now;
        }
        clearTimeout(typingStopTimer);
        typingStopTimer = setTimeout(function () {
            socket.emit('typing_stop', { from_user: user.username, to_user: other });
            typingStopTimer = null;
        }, TYPING_STOP_MS);
    }

    $dmMessageInput.on('input', function () {
        var other = ($toUserInput.val() || '').trim();
        if (!other) return;
        emitTypingStart();
    });

    socket.on('typing_start', function (payload) {
        if (payload && payload.from_user && payload.to_user === user.username) {
            $dmTypingIndicator.text(payload.from_user + ' is typing...');
        }
    });

    socket.on('typing_stop', function (payload) {
        if (payload && payload.from_user && payload.to_user === user.username) {
            $dmTypingIndicator.text('');
        }
    });

    $('#logoutBtn').on('click', function () {
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    setRoomUI(null);
    setDmTarget(null);
})();
