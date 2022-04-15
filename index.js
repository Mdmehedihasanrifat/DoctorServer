const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aaumw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("doctors"));
app.use(fileUpload());

const port = 5000;

app.get("/", (req, res) => {
  res.send("Welcome to Doctors Portal Server");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  //Appointment collection
  const appointmentCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("appointment");
  //Doctors collection
  const doctorCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("doctors");

  //Add New Appointment
  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    appointmentCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get All appointments
  app.get("/appointments", (req, res) => {
    appointmentCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    console.log(date)
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: new Date(date.date).toLocaleDateString() };
      if (doctors.length === 0) {
        filter.email = email;
      }
      appointmentCollection.find(filter).toArray((err, documents) => {
        console.log(email, new Date(date.date).toLocaleDateString());
        res.send(documents);
      });
    });
  });

  // Add a Doctor
  app.post("/addADoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
   console.log(file,name,email)
    const filePath=`${__dirname}/doctors/${file.name}`
    file.mv(filePath)

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    doctorCollection.insertOne({ name, email, image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get Doctors
  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //Is Doctor
  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      res.send(doctors.length > 0);
    });
  });
});

//Port List
app.listen(process.env.PORT || port, () => {
  console.log("Server Running Perfectly");
});
