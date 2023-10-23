document.querySelectorAll('.update-status-form').forEach(orderForm => {
    orderForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        const form = event.target;
        const orderId = form.elements['orderId'].value;
        const status = form.elements['newStatus'].value;

        console.log(orderId)
        console.log(status)

        try {
            const response = await fetch(`/update_status/${orderId}`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            console.log(response)

            if (response.ok) {
                const updatedOrder = await response.json()
                console.log('Order updated:', updatedOrder);
            } else {
                console.error(`Failed to update the order status: `, await response.text());
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    })

})