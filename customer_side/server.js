const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");

// import handlebars
const { engine } = require("express-handlebars");
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("views", "./views");
app.set("view engine", ".hbs");

app.use(express.static("assets"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// connect to database
const mongoose = require("mongoose");
const { timeStamp, time, log } = require("console");
const { match } = require("assert");
const CONNECTION_STRING =
    "mongodb+srv://jiang6073:TOvVYW5VBogiV1PL@cluster0.ctn43sl.mongodb.net/restaurant?retryWrites=true&w=majority";
mongoose.connect(CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
    console.log("Mongo DB connected successfully.");
});

// schema
const Schema = mongoose.Schema;
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

// model
const Menu = mongoose.model("menu_collection", menuSchema);
const Order = mongoose.model("orders_collection", orderSchema);

// -----------------------------------------
app.get("/", async (req, res) => {
    try {
        const menu = await Menu.find().lean().exec();
        const feature = await Menu.findOne({ isFeatured: true }).lean();
        return res.render("index", {
            layout: "layout.hbs",
            menu: menu,
            feature: feature,
        });
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
});

app.get("/place_order", async (req, res) => {
    try {
        const menu = await Menu.find().lean().exec();
        return res.render("place_order", {
            layout: "layout.hbs",
            isPlaceOrderPage: true,
            menu: menu,
        });
    } catch (err) {
        return res.redirect('/error')
    }
});

app.post("/place_order", async (req, res) => {
    const orderItemsIDs = req.body.orderItem;
    const username = req.body.username;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber

    // Validate form data
    if (!orderItemsIDs || !username || !address || !phoneNumber) {
        // if invalid
        return res.render("error", {
            layout: "layout.hbs",
            message: "All fields must be filled out.",
        });
    } else {
        // if valid
        let orderList = [];
        // if ordered mutiple items
        if (Array.isArray(orderItemsIDs)) {
            for (itemID of orderItemsIDs ) {
                try {
                    // get item object
                    const item = await Menu.findOne({ _id: itemID }).lean()
                    orderList.push(item)
                } catch(err) {
                    return res.redirect('/error')
                }
            }
        } else {

            // if ordered one item
            const item = await Menu.findOne({ _id: orderItemsIDs }).lean()
            orderList.push(item)
        }
        
        const orderToInsert = new Order({
            customerName: username,
            deliveryAddress: address,
            phoneNumber: phoneNumber,
            itemsOrdered: orderList,
            status: "PLACED",
        });


        try {
            await orderToInsert.save();
            return res.render("successful", {
                layout: "layout.hbs",
                OCN: `${orderToInsert._id}`,
            });
        } catch (err) {
            return res.redirect('/error')
        }
    }
});

app.get("/order_status", (req, res) => {
    return res.render("order_status", {
        layout: "layout.hbs",
        isOrderStatusPage: true,
    });
});

app.get("/order_status/:id", (req, res) => {
    const id = req.params.id;
    return res.render("order_status", {
        layout: "layout.hbs",
        isOrderStatusPage: true,
        id: id,
    });
});

app.post("/order_status", async (req, res) => {
    const orderID = req.body.OCN;

    if (!orderID) {
        return res.render("error", {
            layout: "layout.hbs",
            message: "Please type in a valid Order Confirmation Number.",
        });
    }

    try {
        const order = await Order.findOne({ _id: orderID });

        if (!order) {
            return res.render('error', {
                layout: 'layout.hbs',
                message: "The Order Confirmation Number cannot be found."
            });
        }

        const orderStatus = order.status;
        return res.render("order_status_result", {
            layout: "layout.hbs",
            orderStatus: orderStatus.toUpperCase(),
        });
    } catch (err) {
        return res.redirect('/error')
    }
});

// -----------------------------------------
// dummy routes
app.get("/successful", (req, res) => {
    return res.render("successful", {
        layout: "layout.hbs",
    });
});

app.get("/error", (req, res) => {
    return res.render("error", {
        layout: "layout.hbs",
    });
});

// -----------------------------------------
const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);