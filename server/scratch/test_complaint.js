const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables if any
dotenv.config();

console.log("🔄 Starting sanity verification check on backend Complaint updates...");

try {
  // Try importing models
  console.log("➡️ Loading User model...");
  const User = require('../src/models/User.model');
  
  console.log("➡️ Loading Report model...");
  const Report = require('../src/models/Report.model');
  
  console.log("➡️ Loading ReportService...");
  const reportService = require('../src/services/reportService');
  
  console.log("➡️ Loading reportController...");
  const reportController = require('../src/controllers/report.controller');

  console.log("✨ ALL IMPORTS SUCCESSFUL! No syntax or resolution errors found.");
  process.exit(0);
} catch (error) {
  console.error("❌ Sanity Check Failed:", error);
  process.exit(1);
}
