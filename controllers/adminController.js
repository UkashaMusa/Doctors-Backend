import validator from 'validator'
import bcript from 'bcrypt'
import { v2 as cloudenary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'


//API for adding New Doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address_line1, address_line2 } = req.body
        const imageFile = req.file

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address_line1 || !address_line2) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        //validating email format 

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' })
        }
        //validating the password

        if (password.length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password' })
        }

        //hashing doctor password
        const salt = await bcript.genSalt(10)
        const hashedPassword = await bcript.hash(password, salt)

        //upload image to cloudenary 
        const imageUpload = await cloudenary.uploader.upload(imageFile.path, { resource_type: 'image' })
        const imageUrl = imageUpload.secure_url

        const address = {
            line1: address_line1,
            line2: address_line2
        };

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            about,
            fees,
            experience,
            address,
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({ success: true, message: 'Doctor Added' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//API for the admin login

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })

        } else {
            res.json({ success: false, message: 'Invalid credencials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

//API to get all the doctors on admin panel

const allDoctors = async (req, res) => {

    try {
        const doctor = await doctorModel.find({}).select('-password')

        res.json({ success: true, doctor })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }


}

//api to get all appointments list

const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//api to cancel appointment 

const appointmentCancel = async (req, res) => {

    try {
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)


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

//api to get dashboad data for the addmin 

const adminDashboad = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            letestAppointment: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboad }