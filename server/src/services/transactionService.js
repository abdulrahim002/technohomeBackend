const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const notificationService = require('./notificationService');

class TransactionService {
  /**
   * تسجيل حركة مالية (خصم، شحن، إرجاع)
   */
  async processTransaction({ userId, type, amount, description, referenceId, referenceModel }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('المستخدم غير موجود');

    // 1. Update Balance
    if (type === 'debit') {
      if (user.walletBalance < amount) {
        throw { status: 400, message: 'الرصيد غير كافٍ في المحفظة' };
      }
      user.walletBalance -= amount;
    } else if (type === 'credit' || type === 'refund') {
      user.walletBalance += amount;
    }

    await user.save();

    // 2. Log Transaction
    const transaction = await Transaction.create({
      user: userId,
      type,
      amount,
      balanceAfter: user.walletBalance,
      description,
      referenceId,
      referenceModel
    });

    return { user, transaction };
  }

  /**
   * شحن محفظة بواسطة الأدمن
   */
  async chargeWallet(adminId, techId, amount) {
    const { user, transaction } = await this.processTransaction({
      userId: techId,
      type: 'credit',
      amount,
      description: 'شحن رصيد المحفظة عن طريق الإدارة',
      referenceId: adminId,
      referenceModel: 'User'
    });

    await notificationService.createNotification({
      recipientId: techId,
      title: 'تم شحن المحفظة',
      message: `تم إضافة ${amount} دينار إلى محفظتك بنجاح. رصيدك الحالي: ${user.walletBalance} دينار.`,
      type: 'system'
    });

    return transaction;
  }

  /**
   * خصم عمولة الطلب
   */
  async deductCommission(techId, requestId, amount) {
    return this.processTransaction({
      userId: techId,
      type: 'debit',
      amount,
      description: 'خصم عمولة قبول طلب صيانة',
      referenceId: requestId,
      referenceModel: 'ServiceRequest'
    });
  }

  /**
   * إرجاع عمولة الطلب
   */
  async refundCommission(techId, reportId, amount) {
    return this.processTransaction({
      userId: techId,
      type: 'refund',
      amount,
      description: 'إرجاع عمولة بناءً على بلاغ',
      referenceId: reportId,
      referenceModel: 'Report'
    });
  }

  /**
   * جلب سجل المعاملات لفني معين
   */
  async getUserHistory(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Transaction.countDocuments({ user: userId });
    
    return {
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    };
  }
}

module.exports = new TransactionService();
