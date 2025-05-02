import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
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
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [10000, 'Amount must be at least 10,000 UGX'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be a whole number'
      }
    },
    buyerName: {
      type: String,
      required: [true, 'Buyer name is required'],
      minlength: [2, 'Buyer name must be at least 2 characters']
    },
    salesAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    branch: {
      type: String,
      required: [true, 'Branch name is required'],
      enum: ['Maganjo', 'Matugga']
    }
  },
  {
    timestamps: true
  }
);

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;