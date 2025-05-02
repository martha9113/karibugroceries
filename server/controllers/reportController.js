import Sale from '../models/Sale.js';
import Credit from '../models/Credit.js';
import Produce from '../models/Produce.js';

// @desc    Get director dashboard aggregated data
// @route   GET /api/reports/dashboard
// @access  Private/Director
export const getDashboardData = async (req, res) => {
  try {
    // Total sales by branch
    const salesByBranch = await Sale.aggregate([
      {
        $group: {
          _id: '$branch',
          totalSales: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total sales by produce type
    const salesByProduce = await Sale.aggregate([
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
          totalSales: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Outstanding credit amount
    const outstandingCredit = await Credit.aggregate([
      {
        $match: {
          status: { $ne: 'Paid' }
        }
      },
      {
        $group: {
          _id: '$branch',
          totalOutstanding: { 
            $sum: { $subtract: ['$amountDue', '$amountPaid'] } 
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Current stock levels by branch
    const stockByBranch = await Produce.aggregate([
      {
        $group: {
          _id: '$branch',
          totalStock: { $sum: '$currentStock' },
          produceCount: { $sum: 1 }
        }
      }
    ]);

    // Monthly sales trend
    const monthlySalesTrend = await Sale.aggregate([
      {
        $project: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          amountPaid: 1
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalSales: { $sum: '$amountPaid' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      salesByBranch,
      salesByProduce,
      outstandingCredit,
      stockByBranch,
      monthlySalesTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get branch manager dashboard data
// @route   GET /api/reports/branch
// @access  Private/Manager
export const getBranchReport = async (req, res) => {
  try {
    const branch = req.user.branch;

    // Daily sales for current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const dailySales = await Sale.aggregate([
      {
        $match: {
          branch,
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $project: {
          day: { $dayOfWeek: '$createdAt' },
          amountPaid: 1
        }
      },
      {
        $group: {
          _id: '$day',
          totalSales: { $sum: '$amountPaid' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: { branch }
      },
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
          totalSales: { $sum: '$amountPaid' },
          totalTonnage: { $sum: '$tonnage' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Stock levels
    const stockLevels = await Produce.find({ branch })
      .select('name type currentStock tonnage')
      .sort({ currentStock: 1 });

    // Upcoming credit due dates
    const upcomingDueDates = await Credit.find({
      branch,
      status: { $ne: 'Paid' },
      dueDate: { $gte: new Date() }
    })
      .select('buyerName amountDue amountPaid dueDate')
      .sort({ dueDate: 1 })
      .limit(5);

    // Sales agent performance
    const agentPerformance = await Sale.aggregate([
      {
        $match: { branch }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'salesAgent',
          foreignField: '_id',
          as: 'agentDetails'
        }
      },
      {
        $unwind: '$agentDetails'
      },
      {
        $group: {
          _id: '$salesAgent',
          name: { $first: '$agentDetails.name' },
          totalSales: { $sum: '$amountPaid' },
          saleCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);

    res.json({
      dailySales,
      topProducts,
      stockLevels,
      upcomingDueDates,
      agentPerformance
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Generate sales report by date range
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    // Add date range to query if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add branch to query if not director
    if (req.user.role !== 'director') {
      query.branch = req.user.branch;
    } else if (req.query.branch) {
      query.branch = req.query.branch;
    }

    // Get sales data
    const sales = await Sale.find(query)
      .populate('produce', 'name type sellingPrice')
      .populate('salesAgent', 'name')
      .sort({ createdAt: -1 });
    
    // Calculate summary
    const summary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.amountPaid, 0),
      totalTonnage: sales.reduce((sum, sale) => sum + sale.tonnage, 0),
      saleCount: sales.length
    };
    
    res.json({
      sales,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};