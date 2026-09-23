var productPrices = {};
var productOptions = '<option value="">--Select--</option>';


// =====================================================
// LOAD PRODUCTS FROM API
// =====================================================

$(document).ready(function () {

    $.get(productListApiUrl, function (response) {

        productPrices = {};

        productOptions = '<option value="">--Select--</option>';

        if (response && response.length > 0) {

            $.each(response, function (index, product) {

                productOptions +=
                    '<option value="' +
                    product.product_id +
                    '">' +
                    product.name +
                    '</option>';

                productPrices[product.product_id] =
                    product.price_per_unit;

            });

        }

        // Add first product row automatically
        addProductRow();

    }).fail(function (xhr) {

        console.error("Unable to load products.");
        console.error(xhr.responseText);

    });

});


// =====================================================
// ADD PRODUCT ROW
// =====================================================

function addProductRow() {

    var productRow =
        $("#productTemplate").clone();

    // Remove template ID
    productRow.removeAttr("id");

    // Show the cloned row
    productRow.css("display", "block");

    // Put product options into this row
    productRow
        .find(".cart-product")
        .html(productOptions);

    // Reset values
    productRow
        .find(".product-price")
        .val("0.0");

    productRow
        .find(".product-qty")
        .val(1);

    productRow
        .find(".product-total")
        .val("0.0");

    // Add row ONLY inside itemsInOrder
    $("#itemsInOrder").append(productRow);

}


// =====================================================
// ADD MORE BUTTON
// =====================================================

$("#addMoreButton").on("click", function () {

    addProductRow();

});


// =====================================================
// REMOVE PRODUCT
// =====================================================

$(document).on("click", ".remove-row", function () {

    $(this)
        .closest(".order-product-row")
        .remove();

    calculateValue();

});


// =====================================================
// PRODUCT SELECT CHANGE
// =====================================================

$(document).on("change", ".cart-product", function () {

    var currentSelect = $(this);
    var productId = currentSelect.val();

    // Nothing selected
    if (!productId) {

        currentSelect
            .closest(".order-product-row")
            .find(".product-price")
            .val("0.0");

        calculateValue();

        return;
    }


    var currentRow =
        currentSelect.closest(".order-product-row");

    var existingRow = null;


    // =====================================================
    // CHECK WHETHER PRODUCT ALREADY EXISTS
    // =====================================================

    $("#itemsInOrder .order-product-row").each(function () {

        var row = $(this);

        // Don't compare the row with itself
        if (row[0] === currentRow[0]) {
            return;
        }

        var existingProductId =
            row.find(".cart-product").val();


        if (existingProductId == productId) {

            existingRow = row;

            return false;
        }

    });


    // =====================================================
    // SAME PRODUCT ALREADY EXISTS
    // =====================================================

    if (existingRow) {

        var existingQtyInput =
            existingRow.find(".product-qty");


        var currentQuantity =
            parseFloat(existingQtyInput.val()) || 0;


        // Increase quantity by 1
        existingQtyInput.val(currentQuantity + 1);


        // Remove the newly-created duplicate row
        currentRow.remove();


        // Recalculate totals
        calculateValue();


        return;
    }


    // =====================================================
    // NEW PRODUCT
    // =====================================================

    var price =
        productPrices[productId] || 0;


    currentRow
        .find(".product-price")
        .val(price);


    // Reset quantity to 1 for a new product
    currentRow
        .find(".product-qty")
        .val(1);


    calculateValue();

});


// =====================================================
// QUANTITY CHANGE
// =====================================================

$(document).on("input change", ".product-qty", function () {

    calculateValue();

});


// =====================================================
// SAVE ORDER
// =====================================================

$("#saveOrder").on("click", function () {

    // =====================================================
    // 1. GET CUSTOMER NAME
    // =====================================================

    var customerName = $("#customerName").val().trim();

    if (customerName === "") {

        alert("Please enter customer name.");

        $("#customerName").focus();

        return;
    }


    // =====================================================
    // 2. CHECK WHETHER AT LEAST ONE PRODUCT EXISTS
    // =====================================================

    var productRows = $("#itemsInOrder .order-product-row");

    if (productRows.length === 0) {

        alert("Please add at least one product.");

        return;
    }


    // =====================================================
    // 3. CREATE ORDER PAYLOAD
    // =====================================================

    var requestPayload = {

        customer_name: customerName,

        grand_total: 0,

        order_details: []

    };


    var isValid = true;


    // =====================================================
    // 4. VALIDATE EACH PRODUCT
    // =====================================================

    productRows.each(function () {

        var row = $(this);


        var productId =
            row.find(".cart-product").val();


        var quantity =
            parseFloat(
                row.find(".product-qty").val()
            );


        var price =
            parseFloat(
                row.find(".product-price").val()
            );


        var total =
            parseFloat(
                row.find(".product-total").val()
            );


        // -------------------------------------------------
        // Product validation
        // -------------------------------------------------

        if (!productId) {

            alert("Please select a product.");

            row.find(".cart-product").focus();

            isValid = false;

            return false;
        }


        // -------------------------------------------------
        // Quantity validation
        // -------------------------------------------------

        if (
            isNaN(quantity) ||
            quantity <= 0
        ) {

            alert("Please enter a valid quantity.");

            row.find(".product-qty").focus();

            isValid = false;

            return false;
        }


        // -------------------------------------------------
        // Price validation
        // -------------------------------------------------

        if (
            isNaN(price) ||
            price <= 0
        ) {

            alert("Please select a valid product with a price.");

            row.find(".cart-product").focus();

            isValid = false;

            return false;
        }


        // -------------------------------------------------
        // Total validation
        // -------------------------------------------------

        if (
            isNaN(total) ||
            total <= 0
        ) {

            alert("Product total is invalid.");

            isValid = false;

            return false;
        }


        // -------------------------------------------------
        // Add product to order details
        // -------------------------------------------------

        requestPayload.order_details.push({

            product_id: productId,

            quantity: quantity,

            total_price: total

        });


        // Add to grand total
        requestPayload.grand_total += total;

    });


    // =====================================================
    // 5. STOP IF ANY VALIDATION FAILED
    // =====================================================

    if (!isValid) {

        return;
    }


    // =====================================================
    // 6. MAKE SURE AT LEAST ONE VALID PRODUCT EXISTS
    // =====================================================

    if (requestPayload.order_details.length === 0) {

        alert("Please add at least one valid product.");

        return;
    }


    // =====================================================
    // 7. FORMAT GRAND TOTAL
    // =====================================================

    requestPayload.grand_total =
        requestPayload.grand_total.toFixed(2);


    // =====================================================
    // 8. DEBUG - CHECK PAYLOAD
    // =====================================================

    console.log("Final Order Payload:");

    console.log(requestPayload);


    // =====================================================
    // 9. SEND TO BACKEND
    // =====================================================

    callApi(
        "POST",
        orderSaveApiUrl,
        {
            data: JSON.stringify(requestPayload)
        }
    );

});

function calculateValue() {

    var grandTotal = 0;


    $("#itemsInOrder .order-product-row").each(function () {

        var row = $(this);

        var price =
            parseFloat(
                row.find(".product-price").val()
            ) || 0;


        var quantity =
            parseFloat(
                row.find(".product-qty").val()
            ) || 0;


        var total =
            price * quantity;


        row.find(".product-total")
            .val(total.toFixed(2));


        grandTotal += total;

    });


    $("#product_grand_total")
        .val(grandTotal.toFixed(2));

}