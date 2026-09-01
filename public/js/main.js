$(document).ready(function(){
    $('.delete-btn').click(function(){
        const bookId = $(this).attr('id');
        Swal.fire({
            title:"Are you sure you want to delete?",
            text:"You won't be able to revert this!",
            icon:"warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                $.post("/delete", {
                    bookId: bookId
                }, function(data, status){ 
                    if (data['message'] == "SUCCESS") {
                        Swal.fire({
                            icon: "success",
                            title: "Deleted!",
                            text: "The book has been deleted."
                        }).then((result) => {
                            if (result.isConfirmed) {
                                location.reload();
                            }
                        });
                    }
                });
            }
        });
    });
});