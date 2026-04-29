const VALID_TRANSITIONS = {
  diagnosed_only: ['pending', 'cancelled'],
  pending: ['accepted', 'cancelled'],
  accepted: ['arrived', 'cancelled'],
  arrived: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

class OrderStateMachine {
  /**
   * للتحقق مما إذا كان الانتقال من حالة إلى أخرى مسموحاً به
   * @param {string} currentState الحالة الحالية
   * @param {string} nextState الحالة المستهدفة
   * @returns {boolean}
   */
  canTransition(currentState, nextState) {
    const allowed = VALID_TRANSITIONS[currentState] || [];
    return allowed.includes(nextState);
  }

  /**
   * تطبيق الانتقال والتحقق من الشروط الأساسية
   * @param {Object} order كائن الطلب الحالي
   * @param {string} nextState الحالة المستهدفة
   */
  transition(order, nextState) {
    if (!this.canTransition(order.status, nextState)) {
      throw { 
        status: 400, 
        message: `لا يمكن تحويل الطلب من حالة '${order.status}' إلى '${nextState}'. الانتقال غير مسموح.` 
      };
    }

    // هنا يتم فقط تغيير الحالة في الكائن بالذاكرة
    // الـ Service هي المسؤولة عن الحفظ في قاعدة البيانات وبقية اللوجيك المالي
    order.status = nextState;
    return order;
  }
}

module.exports = new OrderStateMachine();
