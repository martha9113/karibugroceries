import Credit from '../models/Credit.js';
import Produce from '../models/Produce.js';

// @desc    Add new credit sale
// @route   POST /api/credit
// @access  Private
export const addCreditSale = async (req, res) => {
  try {
    const { 
      buyerName, 
      nationalId, 
      location, 
      contact,
      amountDue, 
      dueDate, 
      produceId, 
      tonnage 
    } = req.body;

    // Find produce and check stock
    const produce = await Produce.findById(produceId);
    
    if (!produce) {
      return res.status(404).json({ message: 'Produce not found' });
    }
    
    // Check if from same branch
    if (produce.branch !== req.user.branch) {
      return res.status(403).json({ 
        message: 'Not authorized to sell produce from other branches' 
      });
    }
    
    // Check if enough stock
    if (produce.currentStock < tonnage) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${produce.currentStock}kg` 
      });
    }

    // Create credit sale
    const creditSale = await Credit.create({
      buyerName,
      nationalId,
      location,
      contact,
      amountDue,
      salesAgent: req.user._id,
      dueDate,
      produce: produceId,
      tonnage,
      branch: req.user.branch
    });

    // Update produce stock
    produce.currentStock -= tonnage;
    await produce.save();

    // Populate credit sale with produce and agent details
    const populatedCreditSale = await Credit.findById(creditSale._id)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role');

    res.status(201).json(populatedCreditSale);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server error',
      errors: error.errors
    });
  }
};

// @desc    Get all credit sales
// @route   GET /api/credit
// @access  Private
export const getCreditSales = async (req, res) => {
  try {
    let query = {};
    
    // If user is not director, only show credit sales from their branch
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    }
    
    // Optional filters
    const { status, startDate, endDate } = req.query;
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const creditSales = await Credit.find(query)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role')
      .sort({ dueDate: 1 });
    
    res.json(creditSales);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update credit payment status
// @route   PUT /api/credit/:id/payment
// @access  Private
export const updateCreditPayment = async (req, res) => {
  try {
    const { amountPaid } = req.body;
    
    // Find credit sale
    const creditSale = await Credit.findById(req.params.id);
    
    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }
    
    // Ensure user is from same branch
    if (creditSale.branch !== req.user.branch) {
      return res.status(403).json({ 
        message: 'Not authorized to update credit sales from other branches' 
      });
    }
    
    // Update payment information
    creditSale.amountPaid += Number(amountPaid);
    
    // Update status
    if (creditSale.amountPaid >= creditSale.amountDue) {
      creditSale.status = 'Paid';
    } else if (creditSale.amountPaid > 0) {
      creditSale.status = 'Partial';
    }
    
    await creditSale.save();
    
    const updatedCreditSale = await Credit.findById(creditSale._id)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role');
    
    res.json(updatedCreditSale);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get overdue credit sales
// @route   GET /api/credit/overdue
// @access  Private
export const getOverdueCreditSales = async (req, res) => {
  try {
    let query = {
      dueDate: { $lt: new Date() },
      status: { $ne: 'Paid' }
    };
    
    // If user is not director, only show credit sales from their branch
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    }
    
    const overdueCreditSales = await Credit.find(query)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role')
      .sort({ dueDate: 1 });
    
    res.json(overdueCreditSales);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};