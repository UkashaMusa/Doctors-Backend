import express from 'express'
import { bookAppointment, cancelAppointment, getProfile, listAppointment, loginUser, registerUser, updateProfile, findingAppointment,completePayment } from '../controllers/userController.js'
import authUser from '../middelwares/authUser.js'
import upload from '../middelwares/multer.js'
const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)

userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.get('/appointments',authUser,listAppointment)
userRouter.post('/cancel-appointment',authUser,cancelAppointment)
userRouter.post('/finding-appointment',findingAppointment)
userRouter.post('/complete-payment',completePayment)


export default userRouter