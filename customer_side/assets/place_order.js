const formInPlaceOrder = document.getElementById("form-place-order");
const totalElem = document.getElementById("span-total-price-place-order");

const updateTotal = () => {
    let total = 0;
    const checkboxes = document.querySelectorAll(
        "input[type=checkbox]:checked"
    );

    checkboxes.forEach((checkbox) => {
        const checkboxID = checkbox.getAttribute("id");
        const price = parseFloat(
            document.getElementById(`span-price-${checkboxID}`).textContent
        );
        total += price;
    });

    totalElem.textContent = total.toFixed(2);
};


const checkErr = (event) => {
    const orderList = document.getElementsByName("orderItem");
    const username = document.getElementById("username").value;
    const address = document.getElementById("address").value;

    let isChecked = false;
    for (let i = 0; i < orderList.length; i++) {
        if (orderList[i].checked) {
            isChecked = true;
            break;
        }
    }

    if (!isChecked || !username || !address) {
        alert("All fields must be filled out");
        event.preventDefault();
    }
};

document.getElementById("form-place-order").addEventListener("change", updateTotal);

document.getElementById("form-place-order").addEventListener("submit", checkErr);