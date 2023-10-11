const Express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const app = Express()
app.use(fileUpload())
app.use('/photos', Express.static(__dirname+'/photos'))
app.use(Express.json()) 
app.use(cors()) 

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})
mongoose.connect('mongodb://0.0.0.0:27017/EmployeeDB')

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  reference_value: { type: String, required: true },
  seq: { type: Number, default: 0 },
})

CounterSchema.index({ _id: 1, reference_value: 1 }, { unique: true })

const Counter = mongoose.model('Counter', CounterSchema)


async function getNextSequenceValue(sequenceName, referenceValue) {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName, reference_value: referenceValue },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return counter.seq
} 


const DepartmentSchema = new mongoose.Schema({
  DepartmentId: { type: Number, unique: true },
  DepartmentName: String,
})

DepartmentSchema.pre('save', async function (next) {
  if (!this.DepartmentId) {
    this.DepartmentId = await getNextSequenceValue('DepartmentId', 'department')
  }
  next()
})

const DepartmentModel = mongoose.model('Department', DepartmentSchema)

app.get('/api/department', async (req, res) => {
  try {
    const departments = await DepartmentModel.find({})
    res.json(departments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/api/department/:id', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id)
    const department = await DepartmentModel.findOne({
      DepartmentId: departmentId,
    })
    res.json(department)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/department', async (req, res) => {
  try {
    const { DepartmentName } = req.body
    console.log('Request Body:', req.body)

    // Validate request parameters
    if (!DepartmentName) {
      return res.status(400).json({ error: 'DepartmentName is required.' })
    }

    // Create a new department instance
    const newDepartment = new DepartmentModel({
      DepartmentName
    })

    // Save the new department to the database
    const department = await newDepartment.save()

    res.status(201).json(department)
  } catch (error) {
    console.error('Error in /api/department:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.put('/api/department/:id', async (req, res) => {
  try {
    const departmentId = req.params.id
    const { DepartmentName } = req.body

    // Validate request parameters
    if (!DepartmentName) {
      return res.status(400).json({ error: 'DepartmentName is required.' })
    }

    // Find the department by ID and update its properties
    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
      { DepartmentId: departmentId },
      { DepartmentName: DepartmentName },
      { new: true } // Return the updated document
    )

    if (!updatedDepartment) {
      return res.status(404).json({ error: 'Department not found.' })
    }

    res.json(updatedDepartment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


app.delete('/api/department/:id', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id)
    console.log(departmentId)
    console.log(typeof departmentId)

    // Find and remove the department by ID
    const deletedDepartment = await DepartmentModel.findOneAndRemove({
      DepartmentId: departmentId,
    })

    if (!deletedDepartment) {
      return res.status(404).json({ error: 'Department not found.' })
    }

    res.json(deletedDepartment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


const EmployeeSchema = new mongoose.Schema({
  EmployeeId: { type: Number, unique: true },
  EmployeeName: String,
  Department: String,
  DateOfJoining: String, 
  PhotoFileName: String,
})

EmployeeSchema.pre('save', async function (next) {
  if (!this.EmployeeId) {
    this.EmployeeId = await getNextSequenceValue('EmployeeId', 'employee')
  }
  next()
})
const EmployeeModel = mongoose.model('Employee', EmployeeSchema)

app.get('/api/employee', async (req, res) => {
  try {
    const employees = await EmployeeModel.find({})
    res.json(employees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/api/employee/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id)
    const employee = await EmployeeModel.findOne({ EmployeeId: employeeId })
    res.json(employee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/employee', async (req, res) => {
  try {
    const {EmployeeName,Department,DateOfJoining,PhotoFileName,} = req.body
    console.log('Request Body:', req.body)

    // Validate request parameters
    if (!EmployeeName ||!Department ||!DateOfJoining ||!PhotoFileName) {
      return res.status(400).json({ error: 'All fields are required.' })
    }

    // Create a new employee instance
    const newEmployee = new EmployeeModel({EmployeeName, Department, DateOfJoining, PhotoFileName})

    // Save the new employee to the database
    const employee = await newEmployee.save()

    res.status(201).json(employee)
  } catch (error) {
    console.error('Error in /api/employee:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.put('/api/employee/:id', async (req, res) => {
  try {
    const employeeId = req.params.id
    const { EmployeeName, Department, DateOfJoining, PhotoFileName } = req.body

    // Validate request parameters
    if (!EmployeeName||!Department||!DateOfJoining||!PhotoFileName) {
      return res.status(400).json({ error: 'All fields are required.' })
    }

    const updateObject = {}
    if (EmployeeName) updateObject.EmployeeName = EmployeeName
    if (Department) updateObject.Department = Department
    if (DateOfJoining) updateObject.DateOfJoining = DateOfJoining
    if (PhotoFileName) updateObject.PhotoFileName = PhotoFileName

    // Find the employee by ID and update its properties
    const updatedEmployee = await EmployeeModel.findOneAndUpdate(
      { EmployeeId: employeeId },
      updateObject,
      { new: true } // Return the updated employee
    )

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found.' })
    }

    res.json(updatedEmployee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.delete('/api/employee/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id)
    console.log(employeeId)
    console.log(typeof employeeId)

    // Find and remove the employee by ID
    const deletedEmployee = await EmployeeModel.findOneAndRemove({
      EmployeeId: employeeId,
    })

    if (!deletedEmployee) {
      return res.status(404).json({ error: 'Employee not found.' })
    }

    res.json(deletedEmployee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/employee/SaveFile', async (req, res) => {
  try {
    await fs.promises.writeFile('./photos/' + req.files.file.name, req.files.file.data);
    res.send(req.files.file.name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/GetAllDepartmentNames', async (req, res) => {
  try {
    const departmentNames = await DepartmentModel.distinct('DepartmentName')
    res.json(departmentNames)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})




app.listen(3001, () => {
  console.log('Server is running!')
})




