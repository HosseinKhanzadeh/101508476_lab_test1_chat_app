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
    var currentRoom = null;

    var $roomSelect = $('#roomSelect');
    var $joinRoomBtn = $('#joinRoomBtn');
    var $leaveRoomBtn = $('#leaveRoomBtn');
    var $messageList = $('#messageList');
    var $messageInput = $('#messageInput');
    var $sendBtn = $('#sendBtn');
    var $currentRoomLabel = $('#currentRoomLabel');

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

    $('#logoutBtn').on('click', function () {
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    setRoomUI(null);
})();
