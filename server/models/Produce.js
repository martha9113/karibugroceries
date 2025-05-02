import mongoose from 'mongoose';

const produceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Produce name is required'],
      minlength: [2, 'Produce name must be at least 2 characters']
    },
    type: {
      type: String,
      required: [true, 'Produce type is required'],
      minlength: [2, 'Produce type must be at least 2 characters'],
      match: [/^[a-zA-Z\s]+$/, 'Type must contain only alphabets']
    },
    tonnage: {
      type: Number,
      required: [true, 'Tonnage is required'],
      min: [3, 'Tonnage must be at least 3 kg'],
      validate: {
        validator: Number.isInteger,
        message: 'Tonnage must be a whole number'
      }
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [10000, 'Cost must be at least 10,000 UGX'],
      validate: {
        validator: Number.isInteger,
        message: 'Cost must be a whole number'
      }
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [10000, 'Selling price must be at least 10,000 UGX'],
      validate: {
        validator: Number.isInteger,
        message: 'Selling price must be a whole number'
      }
    },
    dealer: {
      type: String,
      required: [true, 'Dealer name is required'],
      minlength: [2, 'Dealer name must be at least 2 characters']
    },
    dealerContact: {
      type: String,
      required: [true, 'Dealer contact is required'],
      match: [
        /^(\+256|0)[0-9]{9}$/,
        'Please enter a valid Ugandan phone number'
      ]
    },
    branch: {
      type: String,
      required: [true, 'Branch name is required'],
      enum: ['Maganjo', 'Matugga']
    },
    source: {
      type: String,
      enum: ['Individual', 'Company', 'Own Farm'],
      default: 'Individual'
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentStock: {
      type: Number,
      default: function() {
        return this.tonnage;
      }
    }
  },
  {
    timestamps: true
  }
);

const Produce = mongoose.model('Produce', produceSchema);

export default Produce;