(function () {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        var $msg = $('#loginMessage');
        $msg.addClass('d-none');
        var data = {
            username: $('#username').val().trim(),
            password: $('#password').val()
        };
        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data)
        })
            .done(function (res) {
                if (res.success && res.user) {
                    localStorage.setItem('user', JSON.stringify({
                        username: res.user.username,
                        firstname: res.user.firstname,
                        lastname: res.user.lastname
                    }));
                    window.location.href = '/chat';
                } else {
                    $msg.removeClass('alert-success').addClass('alert-danger').text(res.message || 'Login failed.').removeClass('d-none');
                }
            })
            .fail(function (xhr) {
                var message = 'Login failed.';
                if (xhr.status === 404) {
                    message = 'API not found (404). Open this page from http://localhost:' + (window.location.port || '3000') + ' so login works.';
                } else {
                    try {
                        var r = JSON.parse(xhr.responseText);
                        if (r.message) message = r.message;
                    } catch (_) {}
                }
                $msg.removeClass('alert-success').addClass('alert-danger').text(message).removeClass('d-none');
            });
    });
})();
