export const printInvoice = (order, productsList = []) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.orderId}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; background: #ffffff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
        .logo h1 { margin: 0; color: #0f172a; font-size: 28px; font-weight: 800; }
        .logo p { margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 600; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { margin: 0; color: #ea580c; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-details p { margin: 6px 0 0; color: #475569; font-size: 14px; }
        .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .address-box { width: 48%; }
        .address-box h3 { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.5px; }
        .address-box p { margin: 4px 0; font-size: 14px; line-height: 1.5; color: #1e293b; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f1f5f9; padding: 14px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
        .items-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; vertical-align: top; }
        .totals { width: 45%; float: right; margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 12px 16px; font-size: 14px; color: #475569; }
        .totals tr:not(:last-child) td { border-bottom: 1px solid #e2e8f0; }
        .totals .final { font-weight: bold; font-size: 18px; color: #ea580c; background: #fff7ed; }
        .clearfix { clear: both; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 24px; font-size: 12px; color: #94a3b8; text-align: center; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 50px; font-size: 12px; font-weight: bold; background: #f1f5f9; color: #64748b; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <h1>Fine Bearing & Oil Seal Store</h1>
          <p>Order Receipt / Tax Invoice</p>
        </div>
        <div class="invoice-details">
          <h2>INVOICE</h2>
          <p><strong>Order #:</strong> ${order.orderId}</p>
          <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
          <div class="status-badge" style="${order.paymentDetails?.status === 'SUCCESS' ? 'background: #dcfce7; color: #166534;' : ''}">
            Payment: ${order.paymentDetails?.status || 'PENDING'}
          </div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-box">
          <h3>Billed To</h3>
          <p><strong>${order.shippingAddress?.fullName || 'Customer'}</strong></p>
          <p>${order.shippingAddress?.street || ''}</p>
          <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || ''}</p>
          <p>${order.shippingAddress?.phone || ''}</p>
          <p>${order.shippingAddress?.email || ''}</p>
          ${order.shippingAddress?.gstNumber ? `<p style="margin-top: 8px; font-weight: bold; color: #ea580c;">GSTIN: ${order.shippingAddress.gstNumber}</p>` : ''}
        </div>
        <div class="address-box">
          <h3>Shipped To</h3>
          <p><strong>${order.porterDeliveryDetails?.fullName || order.shippingAddress?.fullName || 'Customer'}</strong></p>
          <p>${order.porterDeliveryDetails?.fullAddress || order.shippingAddress?.street || ''}</p>
          <p style="margin-top: 10px;">Method: <strong>${order.deliveryMethod === 'PORTER' ? 'Porter Fast Delivery' : 'Standard Delivery'}</strong></p>
          ${order.trackingId ? `<p>Tracking: ${order.trackingId}</p>` : ''}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map(item => `
            <tr>
              <td>
                <strong style="color: #0f172a;">${item.name}</strong>
                ${item.size ? `<br><span style="color: #ea580c; font-size: 12px; font-weight: 600;">${item.size}</span>` : ''}
              </td>
              <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
              <td style="text-align: right;">₹${item.price?.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 600;">₹${item.totalPrice?.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-weight: bold;">₹${order.subtotal?.toFixed(2) || '0.00'}</td>
          </tr>
          ${order.discountAmount > 0 ? `
          <tr>
            <td style="color: #dc2626;">Discount (-):</td>
            <td style="text-align: right; color: #dc2626; font-weight: bold;">-₹${order.discountAmount.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td>GST / Taxes (18%):</td>
            <td style="text-align: right; font-weight: bold;">₹${order.gstAmount?.toFixed(2) || '0.00'}</td>
          </tr>
          <tr>
            <td>Shipping:</td>
            <td style="text-align: right; font-weight: bold;">₹${order.shippingCharge?.toFixed(2) || '0.00'}</td>
          </tr>
          <tr class="final">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${order.total?.toFixed(2) || '0.00'}</td>
          </tr>
        </table>
      </div>
      
      <div class="clearfix"></div>

      <div class="footer">
        <p>Thank you for doing business with <strong>Fine Bearing & Oil Seal Store</strong>.</p>
        <p>This is a computer generated invoice and does not require a physical signature.</p>
      </div>
    </body>
    </html>
  `;

  // Always use a new window for printing to isolate CSS/styles from main app
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();

    // Slight delay to allow CSS rules to apply before popping dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    alert("Please allow popups to generate the professional PDF receipt.");
  }
};
