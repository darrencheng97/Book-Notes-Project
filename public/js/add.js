$(document).ready(function(){
    $('#myForm').on('submit', function(e) {
        // 1. Prevent default page reload
        e.preventDefault();

        // 2. Select the form element
        var $form = $(this);

        // 3. Serialize your text fields into a query string
        var formData = $form.serialize();

        // 4. Call AJAX send the form data to the API
        $.ajax({
            url: '/insertBook',
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon:"success",
                        title: response.success
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.replace("/");
                        }
                    });
                } else if (response.error) {
                    Swal.fire({
                        icon:"error",
                        title:"Oops..",
                        text: response.error,
                    });
                }
            },
            error: function(xhr, status, error) {
                console.log('Error:', error);
            }
        });
    });
});