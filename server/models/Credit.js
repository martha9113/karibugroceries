import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema(
  {
    buyerName: {
      type: String,
      required: [true, 'Buyer name is required'],
      minlength: [2, 'Buyer name must be at least 2 characters']
    },
    nationalId: {
      type: String,
      required: [true, 'National ID is required'],
      match: [
        /^CM[A-Z0-9]{12}$/,
        'Please enter a valid National ID number'
      ]
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      minlength: [2, 'Location must be at least 2 characters']
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [
        /^(\+256|0)[0-9]{9}$/,
        'Please enter a valid Ugandan phone number'
      ]
    },
    amountDue: {
      type: Number,
      required: [true, 'Amount due is required'],
      min: [10000, 'Amount must be at least 10,000 UGX'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be a whole number'
      }
    },
    salesAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    produce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produce',
      required: true
    },
    tonnage: {
      type: Number,
      required: [true, 'Tonnage is required'],
      min: [1, 'Tonnage must be at least 1 kg'],
      validate: {
        validator: Number.isInteger,
        message: 'Tonnage must be a whole number'
      }
    },
    branch: {
      type: String,
      required: [true, 'Branch name is required'],
      enum: ['Maganjo', 'Matugga']
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid'],
      default: 'Pending'
    },
    amountPaid: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Credit = mongoose.model('Credit', creditSchema);

export default Credit;