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
    })
);

//flash
const flash = require("connect-flash");
app.use(flash());

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
            enum: [
                "PLACED",
                "RECEIVED",
                "READY FOR DELIVERY",
                "IN TRANSIT",
                "DELIVERED",
            ],
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
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        vehicleModel: {
            type: String,
            required: true,
        },
        vehicleColor: {
            type: String,
            required: true,
        },
        licensePlate: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);
// model
const Order = mongoose.model("orders_collection", orderSchema);
const Driver = mongoose.model("driver_collection", driverSchema);
// -----------------------------------------
// middleware
const ensureLogin = (req, res, next) => {
    if (req.session.user){
        next()
    } else {
        req.flash("info", "Please login first.")
        return res.redirect('/login')
    }
}
// -----------------------------------------
app.get("/", ensureLogin, (req, res) => {
    return res.render("index", {
        layout: "layout.hbs",
    });
});

// login, register, logout
app.get("/login", (req, res) => {
    const msg = req.flash("info");
    return res.render("login", {
        layout: "layout.hbs",
        msg: msg,
    });
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        req.flash("info", "Both username and passoword have to be provide.");
        return res.redirect("/login");
    }

    try {
        const userFromDB = await Driver.findOne({
            username: username,
            password: password,
        }).lean();

        if (userFromDB) {
            req.session.user = {
                username: username,
                password: password,
                isLoggedIn: true,
            };
            return res.redirect("/");
        } else {
            req.flash("info", "Can not find the user, please try again.");
            return res.redirect("/login");
        }
    } catch (error) {
        return res.render("login", {
            layout: "layout.hbs",
            msg: "Can not find the user.",
        });
    }
});

app.get("/register", (req, res) => {
    const msg = req.flash("info");
    return res.render("register", {
        layout: "layout.hbs",
        msg: msg,
    });
});

app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const confirmation = req.body.confirmation;
    const fullName = req.body.fullName;
    const vehicleModel = req.body.vehicleModel;
    const vehicleColor = req.body.vehicleColor;
    const licensePlate = req.body.licensePlate;

    if (
        !username ||
        !password ||
        !confirmation ||
        !fullName ||
        !vehicleModel ||
        !vehicleColor ||
        !licensePlate
    ) {
        req.flash("info", "Please fill out all the fields.");
        return res.redirect("/register");
    }

    if (password !== confirmation) {
        req.flash(
            "info",
            "Password doesn't match confirmation password, please try again."
        );
        return res.redirect("/register");
    }

    const driverToInsert = new Driver({
        username: username,
        password: password,
        fullName: fullName,
        vehicleModel: vehicleModel,
        vehicleColor: vehicleColor,
        licensePlate: licensePlate,
    });

    try {
        await driverToInsert.save();
    } catch (err) {
        return res.render("error", {
            layout: "layout.hbs",
            msg: "Sorry, there seems to be something wrong...",
        });
    }

    req.session.user = {
        username: username,
        password: password,
        isLoggedIn: true,
    };

    return res.redirect("/");
});

app.get("/logout", (req, res) => {
    if (req.session.user){
        req.session.destroy()
        return res.redirect("/")
    } else {
        req.flash("info", "No user is login in.")
        return res.redirect("/login")
    }
})

// -----------------------------------------
const onHttpStart = () => {
    console.log(`The web server has started at http://localhost:${HTTP_PORT}`);
    console.log("Press CTRL+C to stop the server.");
};
app.listen(HTTP_PORT, onHttpStart);
