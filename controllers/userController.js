import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import axios from 'axios'

//API to register user 
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }
        if (!validator.isEmail) {
            return res.json({ success: false, message: 'enter a valid email' })

        }
        if (password.length < 8) {
            return res.json({ success: false, message: 'enter a strong password ' })

        }

        //hashing the user password 

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        //jwt
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}

//API for user login

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: 'User does not exist' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credencial' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}

//API to get user profile data 

const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API user to update user profile

const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file
        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: 'Data Missing' })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            //upload image to cloudinary 
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
//API to book appointment 
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

        // Fetch doctor data
        const docData = await doctorModel.findById(docId).select('-password');
        if (!docData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!docData.available) {
            return res.status(400).json({ success: false, message: 'Doctor not available' });
        }

        let slots_booked = docData.slots_booked || {}; // Ensure slots_booked is an object

        // Check if the slot is already booked
        if (slots_booked[slotDate]?.includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'Slot not available' });
        }

        // Update slots_booked
        if (!slots_booked[slotDate]) {
            slots_booked[slotDate] = []; // Initialize if not present
        }
        slots_booked[slotDate].push(slotTime);

        // Fetch user data
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prepare appointment data
        const appointmentData = {
            userId,
            docId,
            userData: {
                _id: userData._id,
                name: userData.name,
                email: userData.email,
                image: userData.image,
                address: userData.address,
                dob: userData.dob
            },
            docData: {
                _id: docData._id,
                name: docData.name,
                speciality: docData.speciality,
                fees: docData.fees,
                image: docData.image,
                address: docData.address,
            },
            amount: docData.fees,
            slotTime,
            slotDate,
            slotData: `${slotDate}`, // Add slotData field
            date: Date.now(), // Corrected typo
        };

        // Save the appointment
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Save updated slots_booked in doctor data
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.status(200).json({ success: true, message: 'Appointment booked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//API to get user Appointment for frontend my-appointment page

const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        const appointment = await appointmentModel.find({ userId })
        res.json({ success: true, appointment })

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

//API to cancel appointment 

const cancelAppointment = async (req, res) => {

    try {
        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        //verifing appointment user

        if (appointmentData.userId !== userId) {
            res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        //realezing doctor slots

        const { docId, slotData, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotData] = slots_booked[slotData].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })


        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

//API the Payment Online  Methods

const findingAppointment = async (req, res) => {
    try {
      // Destructure `appointmentId` from `req.body`
      const { appointmentId } = req.body;
  
      // Validate input
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Appointment ID is required.",
        });
      }
  
      // Fetch the appointment data
      const appointmentData = await appointmentModel.findById(appointmentId);
  
      // Check if the appointment exists
      if (!appointmentData) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }
  
      // Extract `userId` from `appointmentData` (assuming `userData` exists in the model)
      const userId = appointmentData.userData?._id;
  
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID not found in appointment data.",
        });
      }
  
      // Check if the user is authorized to access the appointment
      if (appointmentData.userId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized action.",
        });
      }
  
      // Respond with the appointment data
      res.status(200).json({
        success: true,
        message: "Appointment data found.",
        appointment: appointmentData,
      });
    } catch (error) {
      console.error("Error finding appointment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  //  

 

  // Ensure credentials are loaded from environment variables
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
  const PAYPAL_API = "https://sandbox.paypal.com";
  
  const auth = {
    username: PAYPAL_CLIENT_ID,
    password: PAYPAL_SECRET,
  };
  
  
  const completePayment = async (req, res) => {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Order ID and Appointment ID are required.",
        });
      }
  
      const appointmentData = await appointmentModel.findById(appointmentId);
      if (!appointmentData) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true})

      res.status(200).json({
        success: true,
        message: "Appointment payments was successful",
        appointment: appointmentData,
      });
   
  }catch (error){
    console.error("Error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
  
  

  



export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, findingAppointment ,completePayment  }