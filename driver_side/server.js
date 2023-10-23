const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8082;
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

//session
const session = require("express-session");
app.use(
    session({
        secret: "terrace cat",
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true },
    })
);

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

const driverSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        }
    },
    {
        password: {
            type: String,
            required: true,
        }
    },
    {
        fullName: {
            type: String,
            required: true,
        }
    },
    {
        vehicleModel: {
            type: String,
            required: true,
        }
    },
    {
        color: {
            type: String,
            required: true,
        }
    },
    {
        licensePlate: {
            type: String,
            required: true,
        }
    }
)
// model
const Order = mongoose.model("orders_collection", orderSchema);
const Driver = mongoose.model("driver_collection", driverSchema)
// -----------------------------------------
app.get("/", (req, res) => {
    return res.render("index", {
        layout: "layout.hbs",
    })
})

app.get("/login", (req, res) => {
    return res.render("login", {
        layout: "layout.hbs",
    })
})

app.post("/login", (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if (!username || !password) {
        return res.render("login", {
            layout: "layout.hbs",
            msg: "Both username and passoword have to be provide."
        })
    }

    try {
        const userFromDB = Driver.findOne({username: username, password: password}).lean()
    } catch(error) {
        return res.render("error", {
            layout:"layout.hbs",
            msg: "Can not find the user."
        })
    }

    session.user = {
        username: username,
        password: password,
        
    }
    
    

})
// -----------------------------------------
const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);