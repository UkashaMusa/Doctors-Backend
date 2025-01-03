import express from "express";
import { addDoctor, allDoctors, loginAdmin, appointmentsAdmin, appointmentCancel, adminDashboad } from "../controllers/adminController.js";
import upload from '../middelwares/multer.js'
import authAdmin from "../middelwares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const adminRouter = express.Router()

adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
adminRouter.post('/login', loginAdmin);
adminRouter.post('/all-doctors', authAdmin, allDoctors)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel)
adminRouter.get('/dashboad', authAdmin, adminDashboad)

export default adminRouter