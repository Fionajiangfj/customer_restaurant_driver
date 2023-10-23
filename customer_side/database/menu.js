const menuSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: mongoose.Decimal128,
            required: true,
            min: 0,  // Optional: Ensures the price is non-negative
        },
        image: {
            type: String,
            required: true,
        },
        isFeatured: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);