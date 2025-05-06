import Produce from '../models/Produce.js';

// @desc    Add new produce
// @route   POST /api/produce
// @access  Private/Manager
export const addProduce = async (req, res) => {
  try {
    const { 
      name, 
      type, 
      tonnage, 
      cost, 
      sellingPrice, 
      dealer, 
      dealerContact, 
      branch, 
      source 
    } = req.body;

    const produce = await Produce.create({
      name,
      type,
      tonnage,
      cost,
      sellingPrice,
      dealer,
      dealerContact,
      branch,
      source,
      manager: req.user._id,
      currentStock: tonnage
    });

    res.status(201).json(produce);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server error',
      errors: error.errors
    });
  }
};

// @desc    Get all produce
// @route   GET /api/produce
// @access  Private
export const getAllProduce = async (req, res) => {
  try {
    const { branch } = req.query;
    let query = {};
    
    // If user is not director, filter by branch
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    } else if (branch) {
      query.branch = branch;
    }

    const produce = await Produce.find(query)
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(produce);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get produce by ID
// @route   GET /api/produce/:id
// @access  Private
export const getProduceById = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id)
      .populate('manager', 'name email');
    
    if (produce) {
      // If user is not director and not from the produce's branch
      if (req.user.role !== 'director' && produce.branch !== req.user.branch) {
        return res.status(403).json({ 
          message: 'Not authorized to access produce from other branches' 
        });
      }
      
      res.json(produce);
    } else {
      res.status(404).json({ message: 'Produce not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update produce stock
// @route   PUT /api/produce/:id/stock
// @access  Private/Manager
export const updateProduceStock = async (req, res) => {
  try {
    const { additionalStock } = req.body;
    
    const produce = await Produce.findById(req.params.id);
    
    if (!produce) {
      return res.status(404).json({ message: 'Produce not found' });
    }
    
    // Check if manager is from the same branch as the produce
    if (produce.branch !== req.user.branch) {
      return res.status(403).json({ 
        message: 'Not authorized to update produce from other branches' 
      });
    }

    produce.tonnage += Number(additionalStock);
    produce.currentStock += Number(additionalStock);
    
    await produce.save();
    
    res.json(produce);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update produce price
// @route   PUT /api/produce/:id/price
// @access  Private/Manager
export const updateProducePrice = async (req, res) => {
  try {
    const { sellingPrice } = req.body;
    
    const produce = await Produce.findById(req.params.id);
    
    if (!produce) {
      return res.status(404).json({ message: 'Produce not found' });
    }
    
    // Check if manager is from the same branch as the produce
    if (produce.branch !== req.user.branch) {
      return res.status(403).json({ 
        message: 'Not authorized to update produce from other branches' 
      });
    }

    produce.sellingPrice = sellingPrice;
    
    await produce.save();
    
    res.json(produce);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/produce/alerts/low-stock
// @access  Private/Manager
export const getLowStockAlerts = async (req, res) => {
  try {
    // Define low stock threshold (20% of original tonnage)
    const query = {
      branch: req.user.branch,
      $expr: { $lt: ["$currentStock", { $multiply: ["$tonnage", 0.2] }] }
    };
    
    const lowStockProduce = await Produce.find(query)
      .populate('manager', 'name email')
      .sort({ currentStock: 1 });
    
    res.json(lowStockProduce);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete produce
// @route   DELETE /api/produce/:id
// @access  Private/Manager
export const deleteProduce = async (req, res) => {
  try {
    const produce = await Produce.findById(req.params.id);
    
    if (!produce) {
      return res.status(404).json({ message: 'Produce not found' });
    }
    
    // Check if manager is from the same branch as the produce
    if (produce.branch !== req.user.branch) {
      return res.status(403).json({ 
        message: 'Not authorized to delete produce from other branches' 
      });
    }

    await produce.deleteOne();
    
    res.json({ message: 'Produce removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};