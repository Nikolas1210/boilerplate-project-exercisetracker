const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require("body-parser");

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e)
}


//Connect DB
const uri = `mongodb+srv://nico12:nico12@exercisetracker.till4.mongodb.net/`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;
app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({ extended: false }));
//End connect DB


//User Schema
const userSchema = new Schema({
  username: { type: String, required: true },
})
let userModel = mongoose.model("user", userSchema)


//Exercises Schema
const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() }
})
let exerciseModel = mongoose.model("exercise", exerciseSchema)


//Requests
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//Post API
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = userModel({ username: username });
  newUser.save();
  res.json(newUser)
});

//Get to know users
app.get('/api/users', (req, res) => {
  userModel.find({}).then((users) => {
    res.json(users);
  })
});

//Post exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  let userId = req.params._id;
  let date = req.params.date || new Date().toDateString()
  let exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration,
    date
  }
  if (req.body.date != '') {
    exerciseObj.date = req.body.date
  }

  let newExercise = new exerciseModel(exerciseObj)


  userModel.findById(userId)
    .then((user) => {
      newExercise.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date.toDateString()
      })
    })
});

app.get('/api/users/:_id/logs', (req, res) => {
  let userId = req.params._id;


  let responseObj = {};

  let limitParam = req.query.limit;
  let toParam = req.query.to;
  let fromParam = req.query.from;

  limitParam = limitParam ? parseInt(limitParam): limitParam;

  let queryObj = {userId: userId}

  if(fromParam || toParam){
    queryObj.date = {};
    if(fromParam){
      queryObj.date['$gte'] = fromParam;
    }
    if(toParam){
      queryObj.date['$lte'] = toParam;
    }
  }

  userModel.findById(userId)
    .then((user) => {
      responseObj = {
        _id: user._id,
        username: user.username
      }
      return exerciseModel.find(queryObj).limit(limitParam).exec()

    }).then(result => {

      responseObj.log = result.map((x) => {
        return {
          description: x.description,
          duration: x.duration,
          date: x.date.toDateString()
        }


      });
      responseObj.count = result.length;

      // res.json(result)
    })
    .then((r) => {

      res.json(responseObj)
    })

});








const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})