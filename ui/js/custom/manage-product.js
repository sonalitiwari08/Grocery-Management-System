var productModal = $("#productModal");

$(function () {

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    $.get(productListApiUrl, function (response) {

        if (response) {

            var table = '';

            $.each(response, function (index, product) {

                table +=
                    '<tr data-id="' + product.product_id +
                    '" data-name="' + product.name +
                    '" data-unit="' + product.uom_id +
                    '" data-price="' + product.price_per_unit + '">' +

                    '<td>' + product.name + '</td>' +

                    '<td>' + product.uom_name + '</td>' +

                    '<td>₹ ' + product.price_per_unit + '</td>' +

                    '<td>' +
                        '<span class="btn btn-xs btn-danger delete-product">' +
                            'Delete' +
                        '</span>' +
                    '</td>' +

                    '</tr>';
            });

            $("table").find("tbody").empty().html(table);

            // Show/hide empty state
            if (response.length === 0) {
                $(".empty-state").show();
                $(".table-container table").hide();
            } else {
                $(".empty-state").hide();
                $(".table-container table").show();
            }
        }
    });

});


// =====================================================
// SAVE PRODUCT
// =====================================================

$("#saveProduct").on("click", function () {

    // -----------------------------------------
    // Get form values
    // -----------------------------------------

    var productName = $("#name").val().trim();
    var uom = $("#uoms").val();
    var price = $("#price").val().trim();


    // =================================================
    // VALIDATION
    // =================================================

    // Product Name
    if (productName === "") {

        alert("Please enter product name.");

        $("#name").focus();

        return;
    }


    // Product name should not contain only spaces
    if (productName.length < 2) {

        alert("Product name must contain at least 2 characters.");

        $("#name").focus();

        return;
    }


    // Unit
    if (uom === "" || uom === null) {

        alert("Please select a unit.");

        $("#uoms").focus();

        return;
    }


    // Price
    if (price === "") {

        alert("Please enter price per unit.");

        $("#price").focus();

        return;
    }


    // Price must be a valid number
    if (isNaN(price)) {

        alert("Please enter a valid price.");

        $("#price").focus();

        return;
    }


    // Convert price to number
    var priceNumber = parseFloat(price);


    // Price should be greater than 0
    if (priceNumber <= 0) {

        alert("Price must be greater than 0.");

        $("#price").focus();

        return;
    }


    // Optional: maximum 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {

        alert("Please enter a valid price. Example: 25 or 25.50");

        $("#price").focus();

        return;
    }


    // =================================================
    // CREATE REQUEST PAYLOAD
    // =================================================

    var requestPayload = {

        product_name: productName,

        uom_id: uom,

        price_per_unit: priceNumber
    };


    // =================================================
    // SEND DATA TO API
    // =================================================

    callApi("POST", productSaveApiUrl, {

        data: JSON.stringify(requestPayload)

    });

});


// =====================================================
// DELETE PRODUCT
// =====================================================

$(document).on("click", ".delete-product", function () {

    var tr = $(this).closest("tr");

    var productId = tr.data("id");

    var productName = tr.data("name");


    var isDelete = confirm(
        "Are you sure you want to delete \"" +
        productName +
        "\"?"
    );


    if (isDelete) {

        callApi(
            "POST",
            productDeleteApiUrl,
            {
                product_id: productId
            }
        );
    }

});


// =====================================================
// RESET MODAL WHEN CLOSED
// =====================================================

productModal.on("hide.bs.modal", function () {

    // Reset form
    $("#productForm")[0].reset();

    // Reset hidden ID
    $("#id").val("0");

    // Reset title
    productModal
        .find(".modal-title")
        .text("Add New Product");

});


// =====================================================
// LOAD UNITS WHEN MODAL OPENS
// =====================================================

productModal.on("show.bs.modal", function () {

    $.get(uomListApiUrl, function (response) {

        if (response) {

            var options =
                '<option value="">-- Select Unit --</option>';


            $.each(response, function (index, uom) {

                options +=
                    '<option value="' +
                    uom.uom_id +
                    '">' +
                    uom.uom_name +
                    '</option>';
            });


            $("#uoms")
                .empty()
                .html(options);
        }

    });

});