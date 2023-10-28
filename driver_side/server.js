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

//photo storage
const multer = require("multer")
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, "./assets/photos/")
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({storage: storage})

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
app.get("/", ensureLogin, async (req, res) => {
    const msg = req.flash("info")
    try {
        const driver = await Driver.findOne(req.session.user)
        const inTransitList = await Order.find({driver: driver, status: "IN TRANSIT"}).lean()
        
        let hasOrders = false
        if (inTransitList.length > 0) {
            hasOrders = true
        }

        return res.render("index", {
            layout: "layout.hbs",
            inTransitList: inTransitList,
            hasOrders: hasOrders,
            msg: msg
        });
    }catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
});

app.get("/open_for_delivery", ensureLogin, async (req, res) => {
    
    try {
        const openOrderList = await Order.find({status: "READY FOR DELIVERY"}).lean()
        
        let hasOrders = false
        if (openOrderList.length > 0) {
            hasOrders = true
        }

        return res.render("open_for_delivery", {
            layout: "layout.hbs",
            openOrderList: openOrderList,
            hasOrders: hasOrders,
        });
    }catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
});

app.get("/history", ensureLogin, async(req, res) => {
    try {
        const driver = await Driver.findOne(req.session.user)
        const deliveredList = await Order.find({driver: driver, status: "DELIVERED"}).lean()
        
        let hasOrders = false
        if (deliveredList.length > 0) {
            hasOrders = true
        }

        return res.render("history", {
            layout: "layout.hbs",
            deliveredList: deliveredList,
            hasOrders: hasOrders,
        });
    }catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
})

app.get("/profile", ensureLogin, async (req, res) => {
    try {
        const driverObjectFromDB = await Driver.findOne(req.session.user).lean()
        return res.render("profile", {
            layout: "layout.hbs",
            driver: driverObjectFromDB,
        })
    } catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
})

app.post("/upload_proof/:id", ensureLogin, upload.single("photo"), async (req, res) => {
    try {
        const orderID = req.params.id
        const order = await Order.findById(orderID)

        const file = req.file

        console.log(file);
        if (!file){
            req.flash("info", "Please upload a picture before submitting.")
            return res.redirect('/')
        }
        const photoURL = `/photos/${file.filename}`
        order.proofOfDelivery = photoURL
        order.status = "DELIVERED"

        await order.save()

        return res.redirect('/history')
    } catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
})


app.post("/update_status/:id", ensureLogin, async(req, res) => {
    const orderID = req.params.id
    const driverUsername = req.session.user.username
    const newStatus = req.body.newStatus

    try {
        const dirverObject = await Driver.findOne({username: driverUsername}).lean()
        const order = await Order.findById(orderID)
        order.driver = dirverObject
        order.status = newStatus
        order.save()

        return res.redirect(`/`)
    } catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
})


// login, register, logout
app.get("/login", (req, res) => {
    const msg = req.flash("info");
    return res.render("login", {
        layout: "layoutLogin.hbs",
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
            req.session.user = userFromDB;
            return res.redirect("/");
        } else {
            req.flash("info", "Can not find the user, please try again.");
            return res.redirect("/login");
        }
    } catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }
});

app.get("/register", (req, res) => {
    const msg = req.flash("info");
    return res.render("register", {
        layout: "layoutLogin.hbs",
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
    } catch(err){
        req.flash("info", "There seems to be something wrong, please try again later.")
        return res.redirect('/')
    }

    req.session.user = driverToInsert;

    return res.redirect("/");
});

app.get("/logout", (req, res) => {
    if (req.session.user){
        req.session.destroy()
        return res.redirect("/login")
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
