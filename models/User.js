const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
         type:String,
         enum:[
            "pending",
            "active"
         ]
    },
    confirmationCode:{
        type:String,
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
})

userSchema.pre('save', function(next){
    const user = this;
    bcrypt.genSalt(10,  (err, salt)=>{
        if(err){
            return next();
        }
        bcrypt.hash(user.password , salt , (err , code)=>{
            if(err){

                return next();
            }
            user.password=code;
            next();
        })
    })
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    const  isMatch = await  bcrypt.compare(candidatePassword, this.password);
    if(!isMatch){
     throw "Password does not match"
    }
    return true;
  };

module.exports=  mongoose.model('User',userSchema);