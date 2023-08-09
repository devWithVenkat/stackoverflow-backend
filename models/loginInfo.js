import mongoose from "mongoose";

const loginInfo=mongoose.Schema({
    deviceType: {type:String,required:true},
    os: {type:String,required:true},
    ip: {type:String,required:true},
    browser: {type:String,required:true},
    id:{type:String,required:true},
    loginAt:{type:Date,default:Date.now}
})
export default mongoose.model('loginInfo', loginInfo)