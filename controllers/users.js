import mongoose from "mongoose";
import users from "../models/auth.js";
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
import loginInfo from "../models/loginInfo.js";


export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await users.find();
    const allUserDetails = [];
    allUsers.forEach((user) => {
      allUserDetails.push({
        _id: user._id,
        name: user.name,
        about: user.about,
        tags: user.tags,
        joinedOn: user.joinedOn,
      });
    });
    res.status(200).json(allUserDetails);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }

  try {
    const updatedProfile = await users.findByIdAndUpdate(
      _id,
      { $set: { name: name, about: about, tags: tags } },
      { new: true }
    );
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(405).json({ message: error.message });
  }
};

const transporter = nodemailer.createTransport({
  host:process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
})

const emailSender =  async (email) => {
  function base64urlEncode(input) {
    return Buffer.from(input).toString('base64')
      .replace(/\+/g, '-') // Replace '+' with '-'
      .replace(/\//g, '_') // Replace '/' with '_'
      .replace(/=+$/g, ''); // Remove trailing '='
  }
  const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:'5m'})
  const resetLink=`${process.env.FRONTEND_URL}/resetPassword/${encodeURIComponent(base64urlEncode(token))}`
  try {
    const info = await transporter.sendMail({
      from: `"Stackoverflow Clone" <${process.env.SMTP_EMAIL}>`, // sender address
      to: email, // list of receivers
      subject: 'Password Reset Link',
      html: `<p>Hello,</p><p>You have requested to reset your password.This Link Valid for 5 minutes Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`
    });  
    
    return info
  } catch (error) {
    return error
  }
}

export const fogetPassword = async (req, res) => {
  const {email}=req.body;
  try {
    const user=await users.findOne({email})
    if (!user) {
      return res.status(404).json({message:'User Account Not Found'})
    }
    emailSender(email)
    .then((info)=>{
      return res.status(200).json({message:'Password reset Email Sent'}) 
    })
    .catch((error)=>{
      console.log(error)
      return res.status(500).json({message:'Internal Server Error'})
    })
    
  } catch (error) {
    console.log(error)
    res.status(500).json({message:'Internal Server Error'});
  }
}

export const resetPassword=async(req, res) => {
  const {token,newPassword} = req.body;
  function base64urlDecode(input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) {
      input += '=';
    }
    return Buffer.from(input, 'base64').toString('utf-8');
  }
  const decodedToken = decodeURIComponent(base64urlDecode(token))
  jwt.verify(decodedToken, process.env.JWT_SECRET, async(err, decoded) => {
    if (err) {
      console.log(err.name);
     if (err.name === 'TokenExpiredError') {
      return res.status(401).json({message:'UnAuthorized session token'})
     }
     console.log(err)
     res.status(500).json({message:'Internal Server Error'})
    } else {
      const hashedPassword =await bcrypt.hash(newPassword, 12);
      await users.findOneAndUpdate({email:decoded.email},{
        $set:{password:hashedPassword}
      },{new:true})
      res.status(200).json({message:'Password updated successfully'})
    }
  });
}

export const userLoginInfo = async(req, res) => {
  const userId=req.params.id;
  try {
    const logininfo=await loginInfo.find({id: userId})
    if (!logininfo) {
      return res.status(404).json({message:'Login info not found'})
    }
    const userInfo=logininfo.map((info) => {
      return {deviceType:info.deviceType,os:info.os,ip:info.ip,browser:info.browser,loginAt:info.loginAt}
    })
    res.status(200).json({message:'login info found', loginInfo:userInfo})
  } catch (error) {
    console.log(error)
    res.status(500).json({message:'Internal server error'})
  }
}