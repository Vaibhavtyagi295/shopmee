require('dotenv').config()
const express = require("express");
const app = express();
const ejs = require("ejs");
const path = require("path");
const expresslayout = require("express-ejs-layouts");
const port = process.env.port || 3000 ;
const mongoose = require("mongoose");
const session = require("express-session");;
const passport = require('passport');
 const flash = require("express-flash");
const dotenv = require('dotenv')
 const MongoDbStore = require('connect-mongo')(session)
 const Emitter =require('events');
 const Razorpay = require("razorpay");
 const nodemailer = require("./nodemailer")
 const crypto = require('crypto');
 const Product = require('./app/models/menu')
 const multer = require('multer');



 app.use('/uploads', express.static('uploads'));

 const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'uploads');
    },
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}_${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 1024 * 1024 * 12 // 12MB
  },
  fileFilter: (req, file, callback) => {
    callback(null, true);
  }
});

 
/*
 var instance = new Razorpay({
  key_id: '',
  key_secret:'',
});*/

//database connect

mongoose.set('strictQuery',true);
mongoose.connect("mongodb+srv://vaibhav:aman@cluster0.il74hmr.mongodb.net/Pizza-menu?retryWrites=true&w=majority")
.then(function(){
  console.log("connected")
});
//


// season store 
 let mongoStore = new MongoDbStore({
 mongooseConnection:mongoose.connection,
 collection:'sessions'
 })


 
 const eventEmitter = new Emitter()
 app.set('eventEmitter', eventEmitter)

//sesion
app.use(session({
   secret:"password",
   resave:false,
   store:mongoStore,
   saveUninitialized:false,
   cookie:{maxAge:1000*60*60*24}
}))
//
const passportinit = require("./app/config/passport");

const userModel = require('./app/models/user');
passportinit(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use(flash())
//
app.use(express.static('public'))
app.use(express.urlencoded({extended:false}))

app.use(express.json())

// gboble middleware 
app.use((req,res,next)=>{
     res.locals.session = req.session
     res.locals.user = req.user
     
     next()
    })


//set template 
app.use(expresslayout)
app.set('views',path.join(__dirname,'/resources/views'))
app.set('view engine','ejs');


require('./routes/web')(app)
require('./routes/api')(app)

app.get("/createproduct",(req,res)=>{
  res.render('customer/createproduct')
}) 

app.post('/ordermaker', upload.single('image'), async (req, res) => {
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  const { name, description, price, categories, deliveryTime } = req.body;
  const image = req.file.filename;

  try {
    const product = await Product.create({ name, image, description, price, categories, deliveryTime });
    res.redirect(`/`);
  } catch (err) {
    console.error(err);
    res.render('/');
  }
});

app.get("/forgot",(req,res)=>{
    res.render('customer/forgotpas')
}) 

app.get('/forgot/:id/otp/:otp', async function (req, res, next) {
  let user = await userModel.findOne({_id:req.params.id})
  if(user.otp === req.params.otp){
res.render('customer/reset', {id:req.params.id})
  }
  else{
    res.send("wrong or expired link");
  }
});

app.post('/reset/:id', async function (req, res, next){
 let newpasswordd = await userModel.findOne({_id:req.params.id});
  newpasswordd.setPassword(req.body.newpassword , async function(){
    await newpasswordd.save();
    res.send('password new bn gya broh')
  })
});

app.post('/send', function (req, res) {
  //sabse phele user dundo jiska email likha tha forgot password pr 
  userModel.findOne({ email: req.body.email })
  .then(function (user) {
    if (user) {
        // agr vo mil jaye toh fir crypto ke through ek 17 character ki link banaye
        crypto.randomBytes(17, async function (err, buff) {
          const otpstr = buff.toString("hex");
          // wo string ke save karade database main otp ke andar
          user.otp = otpstr;
          await user.save();
          // ab ek mail bejo us bande ko jisne mail diya tha  
          nodemailer(req.body.email, otpstr, user._id)
        
        });
      }
      else {
        res.send("yeah email registered nahi hai");
      }


    })
});

function isloggin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect("/")
  }
}/*
app.post("/create/orderId",function(req,res){
  var options = {
    amount:30*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: ""
  };
  instance.orders.create(options, function(err, order) {
    res.send(order);
   
    
  });
})
*/
app.get('/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Find the product in the database by its ID
    const product = await Product.findById(productId);

    // Render the product page with the product's details
    res.render('product', { product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }

});


app.use((req,res)=>{
  res.status(404).send('<h1>404, Page not found </h1>')
})


const server = app.listen(port,()=>{
    console.log(`sever started ${port}`)
})


const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})


eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})

