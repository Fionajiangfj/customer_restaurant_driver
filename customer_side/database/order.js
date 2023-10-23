const orderSchema = new Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
        deliveryAddress: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            reqquired: true,
        },
        itemsOrdered: {
            type: [{}],
            required: true,
        },
        status: {
            type: String,
            enum: ['PLACED', 'RECEIVED', 'READY FOR DELIVERY', 'IN TRANSIT', 'DELIVERED'],
            required: true,
        },
        driver: {
            type: {},
        },
        proofOfDelivery: {
            type: String, // photo URL
        },
    },
    { timestamps: true }
);
