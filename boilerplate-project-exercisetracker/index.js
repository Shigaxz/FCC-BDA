const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// Conexion con MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB conectado"))
  .catch(err => console.log(err));
// Definicion del esquema de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
// Defincion del esquema de ejercicio
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});
// Creacion de los modelos
let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);
// Metodo post para los usuarios
app.post('/api/users', async (req, res) => {
  try {
  const user = new User({ username: req.body.username });
  const savedUser = await user.save();
  res.json({username: savedUser.username, _id: savedUser._id});
  } catch (error) {
    return res.status(400).json({ error: 'Error creating user' });
  }
});
// Metodo get para los usuarios
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
})
// Metodo post para los ejercicios
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exercise = new Exercise({
      userId: user._id,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : new Date()
    });
    const savedExercise = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date.toDateString()
    });
  } catch (error) {
    return res.status(400).json({ error: 'Error creating exercise' });
  }
})
// Metodo get para los logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const query = {userId};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    };
    const exercises = Exercise.find(query, 'description duration date');
    if (limit) {
      exercises.limit(parseInt(limit));
    };

    const logs = await exercises;

    res.json({
      username: user.username,
      count: logs.length,
      _id: user._id,
      log: logs.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString()
      }))
    });
  } catch (error) {
    return res.status(400).json({ error: 'Error fetching logs' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
