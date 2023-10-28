const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8081;
const path = require("path");

// import handlebars
const { engine } = require("express-handlebars");
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("views", "./views");
app.set("view engine", ".hbs");

app.use(express.static("assets"));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// connect to database
const mongoose = require("mongoose");
const { timeStamp, time, log } = require("console");
const CONNECTION_STRING =
    "mongodb+srv://jiang6073:TOvVYW5VBogiV1PL@cluster0.ctn43sl.mongodb.net/restaurant?retryWrites=true&w=majority";
mongoose.connect(CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to database: "));
db.once("open", () => {
    console.log("Mongo DB connected successfully.");
});

// schema
const { Schema } = mongoose;
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
// update order status
const findOrderList = async (status) => {
    try {
        const orderList = await Order.find({ status: status }).sort("-createdAt").lean()
        return orderList;
    } catch (err) {
        return res.redirect("/error")
    }
}

// -----------------------------------------
app.get("/", (req, res) => {
    return res.render("index", {
        layout: "layout.hbs",
    })
})

app.get("/to_be_received", async (req, res) => {
    try {
        const orderList = await findOrderList("PLACED");

        let hasOrders = false
        if (orderList.length > 0) {
            hasOrders = true
        }

        return res.render("to_be_received", {
            layout: "layout.hbs",
            orderList: orderList,
            hasOrders: hasOrders,
        })
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
    
})

app.get("/received", async (req, res) => {
    try {
        const orderList = await findOrderList("RECEIVED");

        let hasOrders = false
        if (orderList.length > 0) {
            hasOrders = true
        }

        return res.render("received", {
            layout: "layout.hbs",
            orderList: orderList,
            hasOrders: hasOrders,
        })
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }

})

app.get("/ready_for_delivery", async (req, res) => {
    try {
        const orderList = await findOrderList("READY FOR DELIVERY");

        let hasOrders = false
        if (orderList.length > 0) {
            hasOrders = true
        }

        return res.render("ready_for_delivery", {
            layout: "layout.hbs",
            orderList: orderList,
            hasOrders: hasOrders,
        })
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
})

app.get("/in_transit", async (req, res) => {
    try {
        const orderList = await findOrderList("IN TRANSIT");

        let hasOrders = false
        if (orderList.length > 0) {
            hasOrders = true
        }

        return res.render("in_transit", {
            layout: "layout.hbs",
            orderList: orderList,
            hasOrders: hasOrders,
        })
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
})

app.get("/delivered", async (req, res) => {
    try {
        const orderList = await findOrderList("DELIVERED");

        let hasOrders = false
        if (orderList.length > 0) {
            hasOrders = true
        }

        return res.render("delivered", {
            layout: "layout.hbs",
            orderList: orderList,
            hasOrders: hasOrders,
        })
    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
})

app.post("/update_status/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.newStatus;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
        if (!updatedOrder) {
            return res.status(404).send(`Order not found`);
        }
        if (newStatus === "RECEIVED") {
            return res.redirect("/received");
        } else if (newStatus === "READY FOR DELIVERY") {
            return res.redirect("/ready_for_delivery");
        }

    } catch (err) {
        return res.status(500).send(`Server error.`)
    }
})
// -----------------------------------------
// dummy routes
app.get("/error", (req, res) => {
    return res.render("error", {
        layout: "layout.hbs",
    })
})
// -----------------------------------------
const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);