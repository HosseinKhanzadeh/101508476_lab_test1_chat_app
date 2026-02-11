(function () {
    $('#signupForm').on('submit', function (e) {
        e.preventDefault();
        var $msg = $('#signupMessage');
        $msg.addClass('d-none');
        var data = {
            username: $('#username').val().trim(),
            firstname: $('#firstname').val().trim(),
            lastname: $('#lastname').val().trim(),
            password: $('#password').val()
        };
        $.ajax({
            url: '/api/auth/signup',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data)
        })
            .done(function (res) {
                if (res.success) {
                    $msg.removeClass('alert-danger').addClass('alert-success').text('Account created. You can now log in.').removeClass('d-none');
                    $('#signupForm')[0].reset();
                } else {
                    $msg.removeClass('alert-success').addClass('alert-danger').text(res.message || 'Signup failed.').removeClass('d-none');
                }
            })
            .fail(function (xhr) {
                var message = 'Signup failed.';
                if (xhr.status === 404) {
                    message = 'API not found (404). Open this page from http://localhost:' + (window.location.port || '3000') + ' so signup works.';
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
