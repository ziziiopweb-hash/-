import { Router, Request, Response, NextFunction } from 'express';
import { db, Order, OrderStatus, Product, ProductVariant } from './db.ts';
import { createToken, hashPassword, verifyPassword, verifyToken, TokenPayload } from './auth.ts';

export const apiRouter = Router();

// Extend Request interface to carry auth info
interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Authentication Middleware
function authenticateOptional(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = payload;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  });
}

// Simple IP-based / in-memory rate limiter for sensitive actions
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}_${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.expiresAt < now) {
      rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({ error: 'Too many requests, please try again shortly.' });
    }

    entry.count += 1;
    next();
  };
}

// -------------------------------------------------------------
// PUBLIC & SETTINGS ENDPOINTS
// -------------------------------------------------------------

apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    paymentNumber: settings.paymentNumber,
    whatsappNumber: settings.whatsappNumber,
    supportHoursAr: settings.supportHoursAr,
    supportHoursEn: settings.supportHoursEn,
    bankilyInstructionsAr: settings.bankilyInstructionsAr,
    bankilyInstructionsEn: settings.bankilyInstructionsEn,
    masriviInstructionsAr: settings.masriviInstructionsAr,
    masriviInstructionsEn: settings.masriviInstructionsEn,
    sedadInstructionsAr: settings.sedadInstructionsAr,
    sedadInstructionsEn: settings.sedadInstructionsEn,
    bannerNoticeAr: settings.bannerNoticeAr,
    bannerNoticeEn: settings.bannerNoticeEn,
    bannerActive: settings.bannerActive,
  });
});

apiRouter.get('/categories', (req: Request, res: Response) => {
  const categories = db.getCategories().sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(categories);
});

apiRouter.get('/products', (req: Request, res: Response) => {
  const products = db.getProducts()
    .filter(p => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const variants = db.getVariants().filter(v => v.active);

  // Group variants under products
  const result = products.map(p => ({
    ...p,
    variants: variants
      .filter(v => v.productId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  res.json(result);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const variants = db.getVariants()
    .filter(v => v.productId === product.id && v.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  res.json({ ...product, variants });
});

apiRouter.get('/announcements', (req: Request, res: Response) => {
  const announcements = db.getAnnouncements().filter(a => a.active);
  res.json(announcements);
});

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

apiRouter.post('/auth/register', rateLimit(10, 60000), (req: Request, res: Response) => {
  const { email, password, name, phone, language } = req.body;

  if (!email || !password || !name || !phone) {
    return res.status(400).json({ error: 'Email, password, name, and phone are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    email,
    passwordHash: hash,
    salt,
    name,
    phone,
    role: 'customer' as const,
    language: (language === 'en' ? 'en' : 'ar') as 'ar' | 'en',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);
  db.addAuditLog('USER_REGISTER', `New customer registered: ${email}`, newUser.id, email, req.ip);

  const token = createToken(newUser.id, newUser.email, newUser.role);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      language: newUser.language,
    },
  });
});

apiRouter.post('/auth/login', rateLimit(15, 60000), (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    db.addAuditLog('FAILED_LOGIN_ATTEMPT', `Failed login for email: ${email}`, undefined, email, req.ip);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user.lastLoginAt = new Date().toISOString();
  db.updateUser(user.id, { lastLoginAt: user.lastLoginAt });
  db.addAuditLog('USER_LOGIN', `User signed in: ${email}`, user.id, user.email, req.ip);

  const token = createToken(user.id, user.email, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      language: user.language,
    },
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    language: user.language,
  });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, phone, language } = req.body;
  const updated = db.updateUser(req.user!.userId, {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(language && { language: language === 'en' ? 'en' : 'ar' }),
  });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
    role: updated.role,
    language: updated.language,
  });
});

// -------------------------------------------------------------
// ORDERS & CHECKOUT FLOW
// -------------------------------------------------------------

apiRouter.post('/orders/create', rateLimit(20, 60000), authenticateOptional, (req: AuthRequest, res: Response) => {
  const {
    productId,
    variantId,
    customerName,
    customerPhone,
    customerEmail,
    deliveryMethod,
    playerId,
    playerZoneId,
    serverName,
    accountCredentials,
    paymentMethod,
    transactionReference,
    paymentProofUrl,
    customerNotes,
  } = req.body;

  if (!productId || !variantId || !customerName || !customerPhone || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required order fields (productId, variantId, name, phone, paymentMethod)' });
  }

  // Validate product and variant in database
  const product = db.findProductById(productId);
  if (!product || !product.active) {
    return res.status(400).json({ error: 'Product is unavailable or invalid' });
  }

  const variant = db.findVariantById(variantId);
  if (!variant || !variant.active || variant.productId !== productId) {
    return res.status(400).json({ error: 'Product variant is unavailable or invalid' });
  }

  // Server-side validation of delivery requirements
  if (product.requiresPlayerId && !playerId) {
    return res.status(400).json({ error: 'Player ID is required for this product' });
  }
  if (product.requiresAccountCredentials && !accountCredentials) {
    return res.status(400).json({ error: 'Account credentials are required for account-based recharge' });
  }

  // Recalculate price strictly on the server:
  const serverCalculatedAmountMRU = variant.priceMRU;

  // Generate unique order reference (e.g. SHD-2026-89104)
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const reference = `SHD-2026-${randomSuffix}`;

  const newOrder: Order = {
    id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    reference,
    customerId: req.user ? req.user.userId : null,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim().replace(/\s+/g, ''),
    customerEmail: customerEmail ? customerEmail.trim() : null,
    productId: product.id,
    variantId: variant.id,
    productName: product.nameAr,
    variantName: variant.nameAr,
    deliveryMethod: deliveryMethod || product.deliveryMethod,
    playerId: playerId ? playerId.trim() : undefined,
    playerZoneId: playerZoneId ? playerZoneId.trim() : undefined,
    serverName: serverName ? serverName.trim() : undefined,
    accountCredentialsEncrypted: accountCredentials ? `[ENCRYPTED_DATA] ${accountCredentials.trim()}` : undefined,
    amountMRU: serverCalculatedAmountMRU,
    paymentMethod: ['bankily', 'masrivi', 'sedad'].includes(paymentMethod) ? paymentMethod : 'bankily',
    paymentPhone: '31520844', // Strict constant payment number
    transactionReference: transactionReference ? transactionReference.trim() : undefined,
    paymentProofUrl: paymentProofUrl || undefined,
    status: 'awaiting_payment',
    customerNotes: customerNotes ? customerNotes.trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        id: 'h-' + Date.now(),
        status: 'awaiting_payment',
        note: 'تم استلام طلب الشحن بنجاح في انتظار تحويل المبلغ إلى الرقم 31520844',
        changedBy: 'System',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  db.addOrder(newOrder);
  db.addAuditLog('ORDER_CREATED', `Order ${reference} created for ${variant.nameAr} (${serverCalculatedAmountMRU} MRU) via ${paymentMethod}`, req.user?.userId, req.user?.email, req.ip);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: {
      id: newOrder.id,
      reference: newOrder.reference,
      productName: newOrder.productName,
      variantName: newOrder.variantName,
      amountMRU: newOrder.amountMRU,
      paymentMethod: newOrder.paymentMethod,
      paymentPhone: newOrder.paymentPhone,
      status: newOrder.status,
      customerPhone: newOrder.customerPhone,
      customerName: newOrder.customerName,
      createdAt: newOrder.createdAt,
    },
  });
});

// SECURE ORDER TRACKING (Order reference + phone verification factor)
apiRouter.post('/orders/track', rateLimit(30, 60000), authenticateOptional, (req: AuthRequest, res: Response) => {
  const { reference, phone } = req.body;

  if (!reference) {
    return res.status(400).json({ error: 'Order reference is required' });
  }

  const order = db.findOrderByReference(reference.trim());
  if (!order) {
    return res.status(404).json({ error: 'Order not found. Please check your reference code.' });
  }

  // Security Verification Factor:
  // Access is permitted ONLY IF:
  // 1. Customer provides matching phone number, OR
  // 2. Customer is authenticated and owns this order, OR
  // 3. User is an admin
  const normalizedInputPhone = phone ? phone.trim().replace(/\D/g, '') : '';
  const normalizedOrderPhone = order.customerPhone.trim().replace(/\D/g, '');
  const isPhoneMatch = normalizedInputPhone.length >= 6 && normalizedOrderPhone.endsWith(normalizedInputPhone.slice(-6));
  const isOwner = req.user && order.customerId === req.user.userId;
  const isAdmin = req.user?.role === 'admin';

  if (!isPhoneMatch && !isOwner && !isAdmin) {
    return res.status(403).json({
      error: 'Verification failed. For privacy and security, please enter the phone number associated with this order.',
    });
  }

  // Return order details (hide sensitive passwords)
  res.json({
    id: order.id,
    reference: order.reference,
    productName: order.productName,
    variantName: order.variantName,
    amountMRU: order.amountMRU,
    deliveryMethod: order.deliveryMethod,
    playerId: order.playerId,
    paymentMethod: order.paymentMethod,
    paymentPhone: order.paymentPhone,
    transactionReference: order.transactionReference,
    paymentProofUrl: order.paymentProofUrl,
    status: order.status,
    customerNotes: order.customerNotes,
    adminNotes: order.adminNotes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    history: order.history,
  });
});

// Update payment proof / transaction reference for an order
apiRouter.post('/orders/update-payment-proof', rateLimit(10, 60000), (req: Request, res: Response) => {
  const { reference, phone, transactionReference, paymentProofUrl } = req.body;

  if (!reference || !phone) {
    return res.status(400).json({ error: 'Order reference and phone verification are required' });
  }

  const order = db.findOrderByReference(reference.trim());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const normalizedInputPhone = phone.trim().replace(/\D/g, '');
  const normalizedOrderPhone = order.customerPhone.trim().replace(/\D/g, '');
  if (!normalizedOrderPhone.endsWith(normalizedInputPhone.slice(-6))) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  const updates: Partial<Order> = {};
  if (transactionReference) updates.transactionReference = transactionReference.trim();
  if (paymentProofUrl) updates.paymentProofUrl = paymentProofUrl;

  // Never treat submitted proof as confirmed payment automatically:
  // keep as awaiting_payment or needs_review so admin can review manual bank statement
  if (order.status === 'awaiting_payment') {
    updates.status = 'needs_review';
  }

  db.updateOrder(order.id, updates);
  db.addOrderStatusHistory(order.id, updates.status || order.status, 'قام العميل بإرفاق معلومات إثبات التحويل للمراجعة اليدوية', 'Customer');
  db.addAuditLog('ORDER_PROOF_ATTACHED', `Customer attached payment proof for ${order.reference}`, undefined, undefined, req.ip);

  res.json({
    success: true,
    message: 'Payment proof attached. Our team will verify the transfer to 31520844 shortly.',
    status: updates.status || order.status,
  });
});

// Authenticated user's order history
apiRouter.get('/orders/my-orders', requireAuth, (req: AuthRequest, res: Response) => {
  const userOrders = db.getOrders()
    .filter(o => o.customerId === req.user!.userId || (req.user?.email && o.customerEmail === req.user.email))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(userOrders.map(o => ({
    id: o.id,
    reference: o.reference,
    productName: o.productName,
    variantName: o.variantName,
    amountMRU: o.amountMRU,
    paymentMethod: o.paymentMethod,
    status: o.status,
    playerId: o.playerId,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  })));
});

// -------------------------------------------------------------
// SUPPORT TICKETS
// -------------------------------------------------------------

apiRouter.post('/support/tickets', rateLimit(10, 60000), (req: Request, res: Response) => {
  const { customerName, customerPhone, orderReference, subject, message } = req.body;

  if (!customerName || !customerPhone || !subject || !message) {
    return res.status(400).json({ error: 'Name, phone, subject, and message are required' });
  }

  const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticket = {
    id: 'tkt-' + Date.now(),
    ticketNumber,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    orderReference: orderReference ? orderReference.trim() : undefined,
    subject: subject.trim(),
    message: message.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addSupportTicket(ticket);
  db.addAuditLog('SUPPORT_TICKET_CREATED', `Ticket ${ticketNumber} opened by ${customerName}`, undefined, undefined, req.ip);

  res.status(201).json({
    success: true,
    ticketNumber,
    message: 'Support ticket submitted successfully',
  });
});

apiRouter.get('/support/tickets/:number', (req: Request, res: Response) => {
  const ticketNumber = req.params.number.toUpperCase();
  const phone = (req.query.phone as string) || '';

  const ticket = db.getSupportTickets().find(t => t.ticketNumber === ticketNumber);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (phone) {
    const inputDigits = phone.replace(/\D/g, '');
    const ticketDigits = ticket.customerPhone.replace(/\D/g, '');
    if (!ticketDigits.endsWith(inputDigits.slice(-6))) {
      return res.status(403).json({ error: 'Verification factor mismatch' });
    }
  }

  res.json(ticket);
});

// -------------------------------------------------------------
// ADMIN PROTECTED DASHBOARD ENDPOINTS
// -------------------------------------------------------------

apiRouter.get('/admin/overview', requireAdmin, (req: AuthRequest, res: Response) => {
  const orders = db.getOrders();
  const tickets = db.getSupportTickets();
  const users = db.getUsers();

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amountMRU, 0);

  const awaitingPaymentCount = orders.filter(o => o.status === 'awaiting_payment').length;
  const needsReviewCount = orders.filter(o => o.status === 'needs_review').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  // Calculate real game popularity distribution
  const gameStats: Record<string, number> = {};
  orders.forEach(o => {
    gameStats[o.productName] = (gameStats[o.productName] || 0) + 1;
  });

  res.json({
    totalRevenue,
    totalOrders: orders.length,
    awaitingPaymentCount,
    needsReviewCount,
    inProgressCount,
    completedCount,
    openTicketsCount,
    totalUsers: users.length,
    recentOrders: orders.slice(0, 8),
    gameStats,
  });
});

apiRouter.get('/admin/orders', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, search } = req.query;
  let orders = db.getOrders();

  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    orders = orders.filter(o =>
      o.reference.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerPhone.includes(s) ||
      (o.playerId && o.playerId.includes(s))
    );
  }

  res.json(orders);
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, note, customerNotes, adminNotes } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses: OrderStatus[] = [
    'awaiting_payment',
    'in_progress',
    'completed',
    'rejected',
    'cancelled',
    'needs_review',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const order = db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const prevStatus = order.status;
  const updates: Partial<Order> = {
    status,
    ...(customerNotes !== undefined && { customerNotes }),
    ...(adminNotes !== undefined && { adminNotes }),
  };

  db.updateOrder(order.id, updates);
  db.addOrderStatusHistory(
    order.id,
    status,
    note || `تم تغيير الحالة من ${prevStatus} إلى ${status}`,
    req.user!.email
  );

  db.addAuditLog(
    'ORDER_STATUS_CHANGED',
    `Order ${order.reference} status changed from ${prevStatus} to ${status} by ${req.user!.email}`,
    req.user!.userId,
    req.user!.email,
    req.ip
  );

  res.json({ success: true, order: db.findOrderById(order.id) });
});

apiRouter.get('/admin/products', requireAdmin, (req: AuthRequest, res: Response) => {
  const products = db.getProducts();
  const variants = db.getVariants();
  const result = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.productId === p.id),
  }));
  res.json(result);
});

apiRouter.put('/admin/variants/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { priceMRU, active } = req.body;
  const variant = db.findVariantById(req.params.id);
  if (!variant) {
    return res.status(404).json({ error: 'Variant not found' });
  }

  const updates: Partial<ProductVariant> = {};
  if (priceMRU !== undefined) updates.priceMRU = Number(priceMRU);
  if (active !== undefined) updates.active = Boolean(active);

  const updated = db.updateVariant(variant.id, updates);
  db.addAuditLog(
    'VARIANT_UPDATED',
    `Updated variant ${variant.nameAr}: price=${updates.priceMRU ?? variant.priceMRU}, active=${updates.active ?? variant.active}`,
    req.user!.userId,
    req.user!.email,
    req.ip
  );

  res.json(updated);
});

apiRouter.put('/admin/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { active, descriptionAr, descriptionEn } = req.body;
  const product = db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updates: Partial<Product> = {};
  if (active !== undefined) updates.active = Boolean(active);
  if (descriptionAr !== undefined) updates.descriptionAr = descriptionAr;
  if (descriptionEn !== undefined) updates.descriptionEn = descriptionEn;

  const updated = db.updateProduct(product.id, updates);
  db.addAuditLog('PRODUCT_UPDATED', `Updated product ${product.nameAr}`, req.user!.userId, req.user!.email, req.ip);

  res.json(updated);
});

// DEDICATED GAME ARTWORK MANAGEMENT
apiRouter.put('/admin/products/:id/artwork', requireAdmin, (req: AuthRequest, res: Response) => {
  const { image, artworkThumbnail, artworkBanner, genre, badgeTagAr, badgeTagEn } = req.body;
  const product = db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updates: Partial<Product> = {};
  if (image !== undefined && image.trim().length > 0) updates.image = image.trim();
  if (artworkThumbnail !== undefined) updates.artworkThumbnail = artworkThumbnail;
  if (artworkBanner !== undefined) updates.artworkBanner = artworkBanner;
  if (genre !== undefined) updates.genre = genre.trim();
  if (badgeTagAr !== undefined) updates.badgeTagAr = badgeTagAr.trim();
  if (badgeTagEn !== undefined) updates.badgeTagEn = badgeTagEn.trim();

  const updated = db.updateProduct(product.id, updates);
  db.addAuditLog(
    'PRODUCT_ARTWORK_UPDATED',
    `Updated promotional artwork for ${product.nameAr} (${product.game}) to: ${updates.image || product.image}`,
    req.user!.userId,
    req.user!.email,
    req.ip
  );

  res.json(updated);
});

apiRouter.post('/admin/artwork/upload', requireAdmin, (req: AuthRequest, res: Response) => {
  const { dataUrl, filename, productId } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  // If a valid base64 or hosted path is passed, return it ready for preview & saving
  res.json({
    success: true,
    url: dataUrl,
    message: 'Artwork uploaded successfully',
  });
});

apiRouter.get('/admin/support', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getSupportTickets());
});

apiRouter.put('/admin/support/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, adminReply } = req.body;
  const ticket = db.updateSupportTicket(req.params.id, {
    ...(status && { status }),
    ...(adminReply && { adminReply }),
  });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  db.addAuditLog('SUPPORT_TICKET_REPLIED', `Replied to ticket ${ticket.ticketNumber}`, req.user!.userId, req.user!.email, req.ip);
  res.json(ticket);
});

apiRouter.get('/admin/announcements', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getAnnouncements());
});

apiRouter.post('/admin/announcements', requireAdmin, (req: AuthRequest, res: Response) => {
  const { titleAr, titleEn, contentAr, contentEn, type } = req.body;
  if (!titleAr || !contentAr) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  const ann = {
    id: 'ann-' + Date.now(),
    titleAr,
    titleEn: titleEn || titleAr,
    contentAr,
    contentEn: contentEn || contentAr,
    type: type || 'info',
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.addAnnouncement(ann);
  res.status(201).json(ann);
});

apiRouter.delete('/admin/announcements/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const success = db.deleteAnnouncement(req.params.id);
  res.json({ success });
});

apiRouter.get('/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.put('/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.addAuditLog('SETTINGS_UPDATED', 'Updated store configuration and instructions', req.user!.userId, req.user!.email, req.ip);
  res.json(updated);
});

apiRouter.get('/admin/audit-logs', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getAuditLogs());
});
