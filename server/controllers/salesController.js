import Sale from '../models/Sale.js';
import Produce from '../models/Produce.js';

// @desc    Add new sale
// @route   POST /api/sales
// @access  Private
export const addSale = async (req, res) => {
  try {
    const { 
      produceId, 
      tonnage, 
      amountPaid, 
      buyerName 
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

    // Create sale
    const sale = await Sale.create({
      produce: produceId,
      tonnage,
      amountPaid,
      buyerName,
      salesAgent: req.user._id,
      branch: req.user.branch
    });

    // Update produce stock
    produce.currentStock -= tonnage;
    await produce.save();

    // Populate sale with produce and agent details
    const populatedSale = await Sale.findById(sale._id)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role');

    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server error',
      errors: error.errors
    });
  }
};

// @desc    Get sales for current user's branch
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res) => {
  try {
    let query = {};
    
    // If user is not director, only show sales from their branch
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    }
    
    // Optional filters
    const { startDate, endDate, agent } = req.query;
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (agent) {
      query.salesAgent = agent;
    }

    const sales = await Sale.find(query)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get sales summary for director
// @route   GET /api/sales/summary
// @access  Private/Director
export const getSalesSummary = async (req, res) => {
  try {
    // Get summary by branch
    const branchSummary = await Sale.aggregate([
      {
        $group: {
          _id: '$branch',
          totalSales: { $sum: 1 },
          totalAmount: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' }
        }
      }
    ]);
    
    // Get summary by produce (joined with produce collection)
    const produceSummary = await Sale.aggregate([
      {
        $lookup: {
          from: 'produces',
          localField: 'produce',
          foreignField: '_id',
          as: 'produceDetails'
        }
      },
      {
        $unwind: '$produceDetails'
      },
      {
        $group: {
          _id: '$produceDetails.name',
          totalSales: { $sum: 1 },
          totalAmount: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' }
        }
      }
    ]);
    
    // Get overall summary
    const overallSummary = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalAmount: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' }
        }
      }
    ]);
    
    res.json({
      branchSummary,
      produceSummary,
      overallSummary: overallSummary[0] || { totalSales: 0, totalAmount: 0, totalTonnage: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get recent sales
// @route   GET /api/sales/recent
// @access  Private
export const getRecentSales = async (req, res) => {
  try {
    let query = {};
    
    // If user is not director, only show sales from their branch
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    }
    
    const recentSales = await Sale.find(query)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(recentSales);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};