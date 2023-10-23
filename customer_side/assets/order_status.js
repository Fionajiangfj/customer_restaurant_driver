const formInOrderStatus = document.getElementById("form-order-status");

const checkErrOrderStatus = (event) => {
    const OCN = document.getElementsByName("OCN")[0].value;

    if (!OCN) {
        alert("Please type in a valid Order Confirmation Number.");
        event.preventDefault();
    }
};

document.getElementById("form-order-status").addEventListener("submit", checkErrOrderStatus);