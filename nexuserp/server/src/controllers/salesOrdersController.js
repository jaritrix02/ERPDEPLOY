const { prisma } = require('../db');

const ACTIVE_STATUSES = ['OPEN', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_DISPATCH', 'ON_HOLD'];

const normalizeText = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildPayload = (body) => {
  const quantity = normalizeNumber(body.quantity, 0);
  const unitPrice = normalizeNumber(body.unitPrice, 0);
  const totalAmount = normalizeNumber(body.totalAmount, quantity * unitPrice);

  return {
    customerName: String(body.customerName ?? '').trim(),
    customerCode: normalizeText(body.customerCode),
    productName: String(body.productName ?? '').trim(),
    quantity,
    unitPrice,
    totalAmount,
    orderDate: normalizeDate(body.orderDate) || new Date(),
    dueDate: normalizeDate(body.dueDate),
    status: String(body.status || 'OPEN').toUpperCase(),
    priority: String(body.priority || 'MEDIUM').toUpperCase(),
    channel: normalizeText(body.channel)?.toUpperCase() || 'DIRECT',
    assignedTo: normalizeText(body.assignedTo),
    remarks: normalizeText(body.remarks),
  };
};

const validatePayload = (payload) => {
  if (!payload.customerName) return 'Customer name is required';
  if (!payload.productName) return 'Product name is required';
  if (payload.quantity <= 0) return 'Quantity must be greater than zero';
  if (payload.unitPrice < 0) return 'Unit price cannot be negative';
  if (!payload.orderDate) return 'Order date is required';
  return null;
};

const generateOrderNo = async () => {
  const lastOrder = await prisma.salesOrder.findFirst({
    where: { orderNo: { startsWith: 'SO' } },
    orderBy: { createdAt: 'desc' },
    select: { orderNo: true }
  });

  const lastNumber = lastOrder?.orderNo ? Number(lastOrder.orderNo.replace(/\D/g, '')) : 0;
  return `SO${String(lastNumber + 1).padStart(5, '0')}`;
};

const emitUpdate = (req, payload) => {
  req.app.get('io')?.emit('sales:updated', payload);
};

const getSalesOrders = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim().toUpperCase();
    const and = [];

    if (search) {
      and.push({
        OR: [
          { orderNo: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { assignedTo: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (status && status !== 'ALL') {
      and.push({ status });
    }

    const orders = await prisma.salesOrder.findMany({
      where: and.length ? { AND: and } : {},
      orderBy: [{ createdAt: 'desc' }]
    });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSalesOrder = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const orderNo = await generateOrderNo();
    const order = await prisma.salesOrder.create({
      data: {
        ...payload,
        orderNo
      }
    });

    emitUpdate(req, { type: 'created', orderNo: order.orderNo });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateSalesOrder = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const order = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data: payload
    });

    emitUpdate(req, { type: 'updated', orderNo: order.orderNo });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSalesOrder = async (req, res) => {
  try {
    const order = await prisma.salesOrder.delete({
      where: { id: req.params.id }
    });

    emitUpdate(req, { type: 'deleted', orderNo: order.orderNo });
    res.json({ success: true, message: 'Sales order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSalesDashboard = async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBookings = monthNames.map((month) => ({ month, orders: 0, value: 0 }));
    const statusMap = new Map([
      ['OPEN', 0],
      ['CONFIRMED', 0],
      ['IN_PRODUCTION', 0],
      ['READY_TO_DISPATCH', 0],
      ['DISPATCHED', 0],
      ['CLOSED', 0],
      ['ON_HOLD', 0]
    ]);
    const customerMap = new Map();

    let bookedValue = 0;
    let currentMonthValue = 0;
    let openOrders = 0;
    let readyToDispatch = 0;
    let overdueOrders = 0;
    let fulfilledOrders = 0;

    orders.forEach((order) => {
      const status = order.status || 'OPEN';
      const amount = Number(order.totalAmount || 0);
      const orderDate = new Date(order.orderDate);
      const dueDate = order.dueDate ? new Date(order.dueDate) : null;

      bookedValue += amount;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
      customerMap.set(order.customerName, (customerMap.get(order.customerName) || 0) + amount);

      if (orderDate.getFullYear() === now.getFullYear()) {
        monthlyBookings[orderDate.getMonth()].orders += 1;
        monthlyBookings[orderDate.getMonth()].value += amount;
      }

      if (orderDate >= startOfMonth) {
        currentMonthValue += amount;
      }

      if (ACTIVE_STATUSES.includes(status)) {
        openOrders += 1;
      }

      if (status === 'READY_TO_DISPATCH') {
        readyToDispatch += 1;
      }

      if (dueDate && dueDate < today && ACTIVE_STATUSES.includes(status)) {
        overdueOrders += 1;
      }

      if (status === 'DISPATCHED' || status === 'CLOSED') {
        fulfilledOrders += 1;
      }
    });

    const statusMix = Array.from(statusMap.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    const topCustomers = Array.from(customerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const upcomingDispatches = orders
      .filter((order) => order.dueDate && ACTIVE_STATUSES.includes(order.status || 'OPEN'))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders: orders.length,
          openOrders,
          readyToDispatch,
          overdueOrders,
          bookedValue,
          currentMonthValue,
          averageOrderValue: orders.length ? bookedValue / orders.length : 0,
          fulfillmentRate: orders.length ? Math.round((fulfilledOrders / orders.length) * 100) : 0
        },
        charts: {
          monthlyBookings,
          statusMix,
          topCustomers
        },
        lists: {
          upcomingDispatches,
          recentOrders: orders.slice(0, 6)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSalesOrders,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesDashboard
};
